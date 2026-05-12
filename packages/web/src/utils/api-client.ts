import axios, { AxiosError, AxiosInstance } from 'axios';

import { config } from './config';

/**
 * Represents an API error with status code and optional response data.
 * Allows typed error handling in components and hooks.
 */
export interface APIError {
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * Type guard to check if an error is an API error.
 */
export const isAPIError = (error: unknown): error is APIError => {
  return typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error;
};

/**
 * Maps Axios errors to typed APIError objects.
 * Extracts status code and error message from response or exception.
 */
const mapAxiosError = (error: AxiosError): APIError => {
  const statusCode = error.response?.status ?? 500;
  const message =
    typeof error.response?.data === 'object' && error.response?.data !== null && 'message' in error.response.data
      ? String((error.response.data as Record<string, unknown>).message)
      : error.message || 'An unknown error occurred';

  return {
    message,
    statusCode,
    details: error.response?.data,
  };
};

/**
 * Creates and configures an Axios instance for API communication.
 * - baseURL configured from environment variables
 * - Response interceptor maps errors to typed APIError objects
 * - Content-Type header defaults to application/json
 */
const createAPIClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Response interceptor to map errors to typed APIError
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError | Error) => {
      if (axios.isAxiosError(error)) {
        return Promise.reject(mapAxiosError(error));
      }
      // Non-Axios errors (network, etc.)
      return Promise.reject({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        statusCode: 0,
      } satisfies APIError);
    },
  );

  return client;
};

/**
 * Configured Axios instance for making API requests.
 * Singleton instance shared across the application.
 */
export const apiClient = createAPIClient();
