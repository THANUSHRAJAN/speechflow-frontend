// Client for the local Python speech service (health check + live transcription WebSocket).
export const SPEECH_SERVICE_URL = (import.meta.env.VITE_SPEECH_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
const WS_URL = `${SPEECH_SERVICE_URL.replace(/^http/, 'ws')}/ws/transcribe`;
const CONNECT_TIMEOUT_MS = 8000;

/** Resolves with model info when the service is ready, or null when it is not reachable. */
export async function checkSpeechHealth() {
  try {
    const response = await fetch(`${SPEECH_SERVICE_URL}/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Opens the transcription socket and sends the config message.
 * Resolves once the server answers "ready"; rejects with a readable Error otherwise.
 * After that, every server message goes to onMessage and a later close goes to onClose.
 */
export function openTranscriptionSocket({ language, onMessage, onClose }) {
  return new Promise((resolve, reject) => {
    let ready = false;
    let settled = false;
    let ws;

    const notRunning = `Cannot reach the speech service at ${SPEECH_SERVICE_URL}. Start it (see the README) and try again.`;
    const fail = (message) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws?.close(); } catch { /* ignore */ }
      reject(new Error(message));
    };

    const timer = setTimeout(() => fail('The speech service did not respond in time. It may still be loading the model.'), CONNECT_TIMEOUT_MS);

    try {
      ws = new WebSocket(WS_URL);
    } catch {
      fail(notRunning);
      return;
    }
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => ws.send(JSON.stringify({ type: 'config', language }));
    ws.onerror = () => { if (!ready) fail(notRunning); };
    ws.onclose = (event) => {
      if (!ready) fail(notRunning);
      else onClose?.(event);
    };
    ws.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!ready) {
        if (message.type === 'ready') {
          ready = true;
          settled = true;
          clearTimeout(timer);
          resolve(ws);
        } else if (message.type === 'error') {
          fail(message.message || 'The speech service rejected the request.');
        }
        return;
      }
      onMessage(message);
    };
  });
}
