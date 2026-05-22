import { describe, expect, it } from 'vitest';
import {
  ApiError,
  NetworkOfflineError,
  apiErrorFromResponse,
  classifyFetchError,
  isNetworkError,
} from '../../src/lib/fetch-error.js';

describe('isNetworkError helper', () => {
  it('returns true for "Failed to fetch" TypeError (Chrome)', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('returns true for "Network Error" TypeError (axios-style)', () => {
    expect(isNetworkError(new TypeError('Network Error'))).toBe(true);
  });

  it('returns true for "Load failed" TypeError (Safari)', () => {
    expect(isNetworkError(new TypeError('Load failed'))).toBe(true);
  });

  it('returns true for "NetworkError when attempting to fetch resource" TypeError (Firefox)', () => {
    expect(
      isNetworkError(
        new TypeError('NetworkError when attempting to fetch resource.'),
      ),
    ).toBe(true);
  });

  it('returns true for "The network connection was lost" TypeError (WebKit)', () => {
    expect(
      isNetworkError(new TypeError('The network connection was lost.')),
    ).toBe(true);
  });

  it('returns true for AbortError DOMException (aborted fetch)', () => {
    expect(isNetworkError(new DOMException('Aborted', 'AbortError'))).toBe(
      true,
    );
  });

  it('returns false for a TypeError with an unrelated message', () => {
    expect(
      isNetworkError(new TypeError('Cannot read properties of null')),
    ).toBe(false);
  });

  it('returns false for a plain Error', () => {
    expect(isNetworkError(new Error('something went wrong'))).toBe(false);
  });

  it('returns false for an ApiError', () => {
    expect(isNetworkError(new ApiError(500, 'Internal Server Error'))).toBe(
      false,
    );
  });

  it('returns false for a non-AbortError DOMException', () => {
    expect(
      isNetworkError(new DOMException('Not allowed', 'NotAllowedError')),
    ).toBe(false);
  });

  it('returns false for null / undefined / primitives', () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
    expect(isNetworkError('Failed to fetch')).toBe(false);
    expect(isNetworkError(42)).toBe(false);
  });
});

describe('classifyFetchError helper', () => {
  it('classifies a "Failed to fetch" TypeError as offline', () => {
    const result = classifyFetchError(new TypeError('Failed to fetch'));
    expect(result).toMatchObject({ kind: 'offline' });
    expect(result.error).toBeInstanceOf(NetworkOfflineError);
  });

  it('classifies an AbortError as offline', () => {
    const result = classifyFetchError(
      new DOMException('Aborted', 'AbortError'),
    );
    expect(result).toMatchObject({ kind: 'offline' });
  });

  it('passes through an existing NetworkOfflineError as offline', () => {
    const original = new NetworkOfflineError();
    const result = classifyFetchError(original);
    expect(result).toMatchObject({ kind: 'offline' });
    expect(result.error).toBe(original);
  });

  it('passes through an existing ApiError as api', () => {
    const original = new ApiError(401, 'Unauthorized');
    const result = classifyFetchError(original);
    expect(result).toMatchObject({ kind: 'api' });
    expect(result.error).toBe(original);
  });

  it('classifies an unknown Error as api with status 0', () => {
    const result = classifyFetchError(new Error('Something exploded'));
    expect(result).toMatchObject({
      kind: 'api',
      error: expect.objectContaining({
        status: 0,
        message: 'Something exploded',
      }),
    });
  });

  it('classifies a non-Error thrown value as api with status 0', () => {
    const result = classifyFetchError('string error');
    expect(result).toMatchObject({
      kind: 'api',
      error: expect.objectContaining({ status: 0 }),
    });
  });
});

describe('NetworkOfflineError class', () => {
  it('has kind "offline"', () => {
    const error = new NetworkOfflineError();
    expect(error.kind).toBe('offline');
    expect(error.name).toBe('NetworkOfflineError');
    expect(error).toBeInstanceOf(Error);
  });

  it('preserves the original cause', () => {
    const cause = new TypeError('Failed to fetch');
    const error = new NetworkOfflineError(cause);
    expect(error.cause).toBe(cause);
  });
});

describe('ApiError class', () => {
  it('has kind "api" and exposes status', () => {
    const error = new ApiError(500, 'Internal Server Error');
    expect(error.kind).toBe('api');
    expect(error.status).toBe(500);
    expect(error.message).toBe('Internal Server Error');
    expect(error.name).toBe('ApiError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('apiErrorFromResponse helper', () => {
  it('creates an ApiError with the response status', () => {
    const response = new Response(null, { status: 401 });
    const error = apiErrorFromResponse(response);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toContain('401');
  });

  it('creates an ApiError for 500', () => {
    const response = new Response(null, { status: 500 });
    const error = apiErrorFromResponse(response);
    expect(error.status).toBe(500);
  });
});
