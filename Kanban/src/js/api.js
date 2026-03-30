import { API_BASE_URL } from './config.js';

const requestCache = new Map();

/**
 * Builds a request URL with query parameters.
 *
 * @param {string} endpoint - API endpoint such as '/tasks'.
 * @param {Record<string, string | number | boolean | undefined>} [queryParams={}] - Query parameters appended to the URL.
 * @returns {string} Fully qualified request URL.
 */
export function buildApiUrl(endpoint, queryParams = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Performs a GET request with simple in-memory caching.
 *
 * @template T
 * @param {string} endpoint - API endpoint.
 * @param {Record<string, string | number | boolean | undefined>} [queryParams={}] - Query parameters.
 * @param {boolean} [forceRefresh=false] - When true, bypasses cache.
 * @returns {Promise<T>} Parsed JSON response.
 */
export async function getJson(endpoint, queryParams = {}, forceRefresh = false) {
  const requestUrl = buildApiUrl(endpoint, queryParams);

  if (!forceRefresh && requestCache.has(requestUrl)) {
    return requestCache.get(requestUrl);
  }

  const response = await fetch(requestUrl);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GET ${endpoint} failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  requestCache.set(requestUrl, data);
  return data;
}

/**
 * Performs a POST request and clears cache.
 *
 * @template T
 * @param {string} endpoint - API endpoint.
 * @param {Record<string, unknown>} payload - Request body payload.
 * @returns {Promise<T>} Parsed JSON response.
 */
export async function postJson(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`POST ${endpoint} failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  requestCache.clear();
  return data;
}

/**
 * Performs a PATCH request and clears cache.
 *
 * @template T
 * @param {string} endpoint - API endpoint such as '/tasks/1'.
 * @param {Record<string, unknown>} payload - Partial update payload.
 * @returns {Promise<T>} Parsed JSON response.
 */
export async function patchJson(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PATCH ${endpoint} failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  requestCache.clear();
  return data;
}

/**
 * Performs a DELETE request and clears cache.
 *
 * @param {string} endpoint - API endpoint such as '/tasks/1'.
 * @returns {Promise<void>}
 */
export async function deleteJson(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DELETE ${endpoint} failed: ${response.status} ${errorText}`);
  }

  requestCache.clear();
}