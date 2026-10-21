import { useEffect, useState } from 'react';
import { checkBackendHealth } from '../api/transcriptionApi';
import { checkSpeechHealth } from '../api/speechApi';

/** Polls both services so the header can show whether they are reachable. */
export function useServiceHealth(paused = false, intervalMs = 8000) {
  const [speech, setSpeech] = useState({ state: 'checking', info: null });
  const [backend, setBackend] = useState('checking');

  useEffect(() => {
    if (paused) return undefined;
    let cancelled = false;

    const poll = async () => {
      const [speechInfo, backendOk] = await Promise.all([checkSpeechHealth(), checkBackendHealth()]);
      if (cancelled) return;
      setSpeech(speechInfo ? { state: 'online', info: speechInfo } : { state: 'offline', info: null });
      setBackend(backendOk ? 'online' : 'offline');
    };

    poll();
    const id = setInterval(poll, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [paused, intervalMs]);

  return { speech, backend };
}
