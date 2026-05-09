/**
 * API Gateway response builder utilities.
 * Constructs properly formatted Lambda/API Gateway responses with status codes,
 * JSON bodies, and CORS headers.
 */

interface APIGatewayResponse<_T = unknown> {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * CORS headers for API responses.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Build a standardized API Gateway response.
 */
const buildResponse = <T>(statusCode: number, body: T): APIGatewayResponse => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(body),
  };
};

/**
 * Return a 200 OK response with the provided body.
 */
export const ok = <T>(body: T): APIGatewayResponse => {
  return buildResponse(200, body);
};

/**
 * Return a 201 Created response with the provided body.
 */
export const created = <T>(body: T): APIGatewayResponse => {
  return buildResponse(201, body);
};

/**
 * Return a 400 Bad Request response with error details.
 */
export const badRequest = (error: string, details?: unknown): APIGatewayResponse => {
  return buildResponse(400, { error, details });
};

/**
 * Return a 404 Not Found response.
 */
export const notFound = (message: string = 'Not found'): APIGatewayResponse => {
  return buildResponse(404, { error: message });
};

/**
 * Return a 500 Internal Server Error response without leaking internal details.
 */
export const internalServerError = (): APIGatewayResponse => {
  return buildResponse(500, { error: 'Internal server error' });
};
