// REST client for the Spring Boot backend (transcript persistence).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(`Cannot reach the backend at ${API_BASE_URL}. Check that the Spring Boot app is running.`);
  }

  if (response.status === 204) return null;

  let body = null;
  try {
    body = await response.json();
  } catch {
    /* body is not JSON */
  }

  if (!response.ok) {
    let message = body?.message || `Request failed (${response.status})`;
    if (body?.details) {
      message += `: ${Object.entries(body.details).map(([field, problem]) => `${field} ${problem}`).join('; ')}`;
    }
    throw new ApiError(message, { status: response.status, details: body?.details });
  }
  return body;
}

export const listTranscriptions = () => request('/transcriptions');
export const getTranscription = (id) => request(`/transcriptions/${id}`);
export const createTranscription = (payload) => request('/transcriptions', { method: 'POST', body: JSON.stringify(payload) });
export const updateTranscription = (id, payload) => request(`/transcriptions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteTranscription = (id) => request(`/transcriptions/${id}`, { method: 'DELETE' });

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
