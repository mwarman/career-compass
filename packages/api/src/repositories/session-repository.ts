import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SessionState, SessionStateSchema } from '@career-compass/shared';

import { config } from '../utils/config';
import { Logger } from '../utils/logger';

import { RepositoryError } from './repository-error';

/**
 * Calculate TTL (time-to-live) for DynamoDB.
 * Returns epoch seconds for 24 hours from now.
 */
const calculateTTL = (): number => {
  const nowMs = Date.now();
  const ttlMs = nowMs + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return Math.floor(ttlMs / 1000); // Convert to epoch seconds
};

/**
 * Initialize and return the DynamoDB DocumentClient for session operations.
 */
const initializeClient = (): DynamoDBDocumentClient => {
  const dbClient = new DynamoDBClient({ region: 'us-east-1' });
  return DynamoDBDocumentClient.from(dbClient);
};

// Single client instance for connection reuse across Lambda invocations
const docClient = initializeClient();
const tableName = config.SESSION_TABLE_NAME;

/**
 * Retrieve a session by ID.
 * Returns null if the session does not exist (not throws).
 * Caller is responsible for handling not-found scenarios.
 */
const getSession = async (sessionId: string): Promise<SessionState | null> => {
  try {
    Logger.debug('SessionRepository.getSession - sending GetCommand', {
      sessionId,
      tableName,
    });

    const command = new GetCommand({
      TableName: tableName,
      Key: { sessionId },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      Logger.debug('SessionRepository.getSession - session not found', {
        sessionId,
      });
      return null;
    }

    // Validate the retrieved item against the SessionState schema
    const validationResult = SessionStateSchema.safeParse(result.Item);
    if (!validationResult.success) {
      throw new Error(`Invalid session state from DynamoDB: ${validationResult.error.message}`);
    }

    Logger.debug('SessionRepository.getSession - session retrieved', {
      sessionId,
      phase: validationResult.data.phase,
      turnCount: validationResult.data.turnCount,
    });

    return validationResult.data;
  } catch (error) {
    throw new RepositoryError(`Failed to get session ${sessionId}`, 'getSession', error);
  }
};

/**
 * Create a new session with initial state.
 * Sets TTL to 24 hours from now.
 * Returns the created session.
 */
const createSession = async (seed: Partial<SessionState>): Promise<SessionState> => {
  try {
    const ttl = calculateTTL();
    const now = Date.now();

    const session: SessionState = {
      sessionId: seed.sessionId || crypto.randomUUID(),
      phase: seed.phase || 'discovery',
      turnCount: seed.turnCount ?? 0,
      history: seed.history || [],
      createdAt: seed.createdAt ?? now,
      ttl,
    };

    // Validate the session before writing
    const validationResult = SessionStateSchema.safeParse(session);
    if (!validationResult.success) {
      throw new Error(`Invalid session state: ${validationResult.error.message}`);
    }

    Logger.debug('SessionRepository.createSession - sending PutCommand', {
      sessionId: session.sessionId,
      phase: session.phase,
      tableName,
    });

    const command = new PutCommand({
      TableName: tableName,
      Item: validationResult.data,
    });

    await docClient.send(command);

    Logger.debug('SessionRepository.createSession - session created', {
      sessionId: session.sessionId,
      phase: session.phase,
    });

    return validationResult.data;
  } catch (error) {
    throw new RepositoryError('Failed to create session', 'createSession', error);
  }
};

/**
 * Update an existing session with partial updates.
 * Appends to history array if provided.
 * Refreshes TTL to 24 hours from now.
 * Returns the updated session.
 */
const updateSession = async (sessionId: string, updates: Partial<SessionState>): Promise<SessionState> => {
  try {
    const ttl = calculateTTL();

    // Build update expression and attribute values
    const updateExpressions: string[] = [];
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, unknown> = {};

    if (updates.phase !== undefined) {
      updateExpressions.push('#phase = :phase');
      attributeNames['#phase'] = 'phase';
      attributeValues[':phase'] = updates.phase;
    }

    if (updates.turnCount !== undefined) {
      updateExpressions.push('#turnCount = :turnCount');
      attributeNames['#turnCount'] = 'turnCount';
      attributeValues[':turnCount'] = updates.turnCount;
    }

    if (updates.history !== undefined && updates.history.length > 0) {
      // Append to history array
      updateExpressions.push('#history = list_append(history, :history)');
      attributeNames['#history'] = 'history';
      attributeValues[':history'] = updates.history;
    }

    // Always update TTL
    updateExpressions.push('#ttl = :ttl');
    attributeNames['#ttl'] = 'ttl';
    attributeValues[':ttl'] = ttl;

    if (updateExpressions.length === 1 && updateExpressions[0] === '#ttl = :ttl') {
      // Only TTL is being updated, fetch current session to return
      const session = await getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      session.ttl = ttl;

      Logger.debug('SessionRepository.updateSession - only TTL refreshed', {
        sessionId,
      });

      return session;
    }

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { sessionId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
      ReturnValues: 'ALL_NEW',
    });

    Logger.debug('SessionRepository.updateSession - sending UpdateCommand', {
      sessionId,
      updateCommandInput: command.input,
    });

    const result = await docClient.send(command);

    Logger.debug('SessionRepository.updateSession - UpdateCommand result received', {
      sessionId,
      updateCommandOutput: result,
    });

    if (!result.Attributes) {
      throw new Error(`Failed to retrieve updated session ${sessionId}`);
    }

    // Validate the updated session
    const validationResult = SessionStateSchema.safeParse(result.Attributes);
    if (!validationResult.success) {
      throw new Error(`Invalid updated session state: ${validationResult.error.message}`);
    }

    Logger.debug('SessionRepository.updateSession - session updated', {
      sessionId,
      phase: validationResult.data.phase,
      turnCount: validationResult.data.turnCount,
    });

    return validationResult.data;
  } catch (error) {
    Logger.error('SessionRepository.updateSession - error updating session', {
      sessionId,
      error,
    });
    throw new RepositoryError(`Failed to update session ${sessionId}`, 'updateSession', error);
  }
};

/**
 * Session repository object encapsulating all DynamoDB operations.
 * Exports methods for session state persistence: get, create, update with TTL management.
 */
export const SessionRepository = {
  getSession,
  createSession,
  updateSession,
};
