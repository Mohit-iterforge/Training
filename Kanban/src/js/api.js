import { API_BASE_URL } from './config.js';

const requestCache = new Map();

/**
 * Builds a request URL with query parameters.
 *
 * @param {string} endpoint - API endpoint such as '/users'.
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
 * Performs a GET request with simple in-memory caching to reduce duplicate API calls.
 *
 * @template T
 * @param {string} endpoint - API endpoint such as '/users'.
 * @param {Record<string, string | number | boolean | undefined>} [queryParams={}] - Query parameters used for filtering.
 * @param {boolean} [forceRefresh=false] - When true, bypasses the cache.
 * @returns {Promise<T>} Parsed JSON response.
 */
export async function getJson(endpoint, queryParams = {}, forceRefresh = false) {
  const requestUrl = buildApiUrl(endpoint, queryParams);

  if (!forceRefresh && requestCache.has(requestUrl)) {
    return requestCache.get(requestUrl);
  }

  const response = await fetch(requestUrl);

  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed with status ${response.status}`);
  }

  const data = await response.json();
  requestCache.set(requestUrl, data);
  return data;
}

/**
 * Performs a POST request and clears the request cache so later reads stay fresh.
 *
 * @template T
 * @param {string} endpoint - API endpoint such as '/users'.
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
    throw new Error(`POST ${endpoint} failed with status ${response.status}`);
  }

  requestCache.clear();
  return response.json();
}