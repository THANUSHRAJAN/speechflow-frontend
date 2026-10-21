import { useCallback, useEffect, useRef, useState } from 'react';
import { openTranscriptionSocket } from '../api/speechApi';
import { appendText } from '../utils';

const LEVEL_HISTORY = 64;
const STOP_TIMEOUT_MS = 120000;

function describeMicError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Microphone access was blocked. Allow the microphone for this site in the browser address bar, then try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No microphone was found. Connect one and try again.';
    case 'NotReadableError':
      return 'The microphone is in use by another application. Close it and try again.';
    default:
      return `Could not start the microphone: ${error?.message || 'unknown error'}`;
  }
}

/**
 * Owns the whole recording pipeline:
 *   microphone -> AudioWorklet (16 kHz PCM) -> WebSocket -> local speech service -> text events.
 *
 * status: 'idle' | 'requesting' (mic permission) | 'connecting' | 'recording' | 'processing' (finalising)
 */
export function useTranscription() {
  const [status, setStatus] = useState('idle');
  const [finalText, setFinalTextState] = useState('');
  const [interimText, setInterimText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const statusRef = useRef('idle');
  const finalTextRef = useRef('');
  const interimRef = useRef('');
  const baseTextRef = useRef('');
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const nodeRef = useRef(null);
  const timerRef = useRef(null);
  const stopTimeoutRef = useRef(null);
  const flushResolverRef = useRef(null);
  const levelsRef = useRef([]);
  const mountedRef = useRef(true);

  const changeStatus = useCallback((next) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const setFinalText = useCallback((text) => {
    finalTextRef.current = text;
    if (mountedRef.current) setFinalTextState(text);
  }, []);

  const setInterim = useCallback((text) => {
    interimRef.current = text;
    if (mountedRef.current) setInterimText(text);
  }, []);

  /** Stops microphone tracks, the audio graph and the elapsed-time timer. */
  const releaseAudio = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (nodeRef.current) {
      nodeRef.current.port.onmessage = null;
      try { nodeRef.current.disconnect(); } catch { /* already disconnected */ }
      nodeRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  const closeSocket = useCallback(() => {
    clearTimeout(stopTimeoutRef.current);
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onmessage = null;
      ws.onclose = null;
      try { ws.close(1000); } catch { /* ignore */ }
    }
  }, []);

  /** Ends the session after a failure without losing text that was already recognised. */
  const abort = useCallback((message) => {
    if (interimRef.current) {
      const current = finalTextRef.current;
      setFinalText(current ? `${current} ${interimRef.current}` : interimRef.current);
      setInterim('');
    }
    releaseAudio();
    closeSocket();
    changeStatus('idle');
    if (mountedRef.current) setError(message);
  }, [changeStatus, closeSocket, releaseAudio, setFinalText, setInterim]);

  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case 'partial':
        setInterim(message.text || '');
        if (message.language && message.language !== 'auto' && mountedRef.current) setDetectedLanguage(message.language);
        break;
      case 'final':
        setFinalText(appendText(baseTextRef.current, message.fullText));
        if (message.language && message.language !== 'auto' && mountedRef.current) setDetectedLanguage(message.language);
        break;
      case 'done':
        setFinalText(appendText(baseTextRef.current, message.fullText));
        setInterim('');
        if (message.language && message.language !== 'auto' && mountedRef.current) setDetectedLanguage(message.language);
        releaseAudio();
        closeSocket();
        changeStatus('idle');
        break;
      case 'error':
        if (message.fatal) abort(message.message || 'The speech service reported an error.');
        else if (mountedRef.current) setError(message.message || 'The speech service reported an error.');
        break;
      default:
        break;
    }
  }, [abort, changeStatus, closeSocket, releaseAudio, setFinalText, setInterim]);

  const start = useCallback(async (language) => {
    if (statusRef.current !== 'idle') return; // prevents accidental double starts
    setError('');
    changeStatus('requesting');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      changeStatus('idle');
      if (mountedRef.current) setError(navigator.mediaDevices ? describeMicError(err) : 'This browser cannot access the microphone. Use a recent Chrome, Edge or Firefox on http://localhost.');
      return;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;

    changeStatus('connecting');
    let ws;
    try {
      ws = await openTranscriptionSocket({
        language,
        onMessage: handleMessage,
        onClose: () => {
          if (statusRef.current === 'recording' || statusRef.current === 'processing') {
            abort('The connection to the speech service was lost. The text recognised so far is kept.');
          }
        },
      });
    } catch (err) {
      releaseAudio();
      changeStatus('idle');
      if (mountedRef.current) setError(err.message);
      return;
    }
    wsRef.current = ws;

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      await ctx.audioWorklet.addModule(`${import.meta.env.BASE_URL}pcm-worklet.js`);
      const source = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, 'pcm-capture');
      const mute = ctx.createGain(); // keeps the graph running without playing the mic through the speakers
      mute.gain.value = 0;
      source.connect(node);
      node.connect(mute);
      mute.connect(ctx.destination);
      nodeRef.current = node;

      node.port.onmessage = (event) => {
        const data = event.data;
        if (data.pcm) {
          if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(data.pcm);
        } else if (typeof data.level === 'number') {
          const levels = levelsRef.current;
          levels.push(data.level);
          if (levels.length > LEVEL_HISTORY) levels.shift();
        } else if (data.flushed) {
          flushResolverRef.current?.();
        }
      };
      if (ctx.state === 'suspended') await ctx.resume();
    } catch (err) {
      releaseAudio();
      closeSocket();
      changeStatus('idle');
      if (mountedRef.current) setError(`Could not start audio capture: ${err.message || err}`);
      return;
    }

    baseTextRef.current = finalTextRef.current;
    levelsRef.current = [];
    setInterim('');
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    changeStatus('recording');
  }, [abort, changeStatus, closeSocket, handleMessage, releaseAudio, setInterim]);

  const stop = useCallback(async () => {
    if (statusRef.current !== 'recording') return;
    changeStatus('processing');
    clearInterval(timerRef.current);

    // Stop capturing, then push out the last few samples still inside the worklet.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (nodeRef.current) {
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 600);
        flushResolverRef.current = () => { clearTimeout(timeout); resolve(); };
        nodeRef.current.port.postMessage('flush');
      });
      flushResolverRef.current = null;
    }

    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop' }));
      stopTimeoutRef.current = setTimeout(
        () => abort('The speech service took too long to finish. The text recognised so far is kept.'),
        STOP_TIMEOUT_MS,
      );
    } else {
      abort('The connection to the speech service was lost. The text recognised so far is kept.');
    }
  }, [abort, changeStatus]);

  const reset = useCallback(() => {
    if (statusRef.current !== 'idle') return;
    setFinalText('');
    baseTextRef.current = '';
    setInterim('');
    setDetectedLanguage('');
    setError('');
    setElapsed(0);
    levelsRef.current = [];
  }, [setFinalText, setInterim]);

  const dismissError = useCallback(() => setError(''), []);

  // Release everything when the app unmounts (also runs between React StrictMode double-mounts).
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      releaseAudio();
      closeSocket();
    };
  }, [closeSocket, releaseAudio]);

  return {
    status, finalText, interimText, detectedLanguage, error, elapsed, levelsRef,
    setFinalText, start, stop, reset, dismissError,
  };
}
