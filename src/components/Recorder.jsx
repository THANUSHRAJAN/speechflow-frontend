import { useEffect, useRef } from 'react';
import { LANGUAGES } from '../languages';
import { formatDuration } from '../utils';

const STATUS_TEXT = {
  idle: 'Ready to record',
  requesting: 'Waiting for microphone permission…',
  connecting: 'Connecting to the speech service…',
  recording: 'Recording',
  processing: 'Finishing the last words…',
};

/** Draws the real microphone level history (RMS values coming from the audio worklet). */
function LevelMeter({ levelsRef, active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue('--blue').trim() || '#2f5bff';
    const faint = styles.getPropertyValue('--line').trim() || '#e3e6f0';
    let frame;

    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const { clientWidth: w, clientHeight: h } = canvas;
      if (canvas.width !== w * ratio || canvas.height !== h * ratio) {
        canvas.width = w * ratio;
        canvas.height = h * ratio;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const bars = 64;
      const gap = 3;
      const barW = Math.max(2, (w - gap * (bars - 1)) / bars);
      const levels = levelsRef.current;
      for (let i = 0; i < bars; i++) {
        const idx = levels.length - bars + i;
        const level = active && idx >= 0 ? levels[idx] : 0;
        const height = Math.max(4, Math.min(h, Math.sqrt(level) * h * 1.6));
        ctx.fillStyle = level > 0.002 ? blue : faint;
        const x = i * (barW + gap);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, (h - height) / 2, barW, height, barW / 2);
        else ctx.rect(x, (h - height) / 2, barW, height);
        ctx.fill();
      }
      if (active) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active, levelsRef]);

  return <canvas ref={canvasRef} className="meter" role="img" aria-label="Live microphone level" />;
}

export default function Recorder({
  status, language, onLanguageChange, elapsed, levelsRef, detectedLanguage,
  hasText, onStart, onStop, onReset, speechOnline,
}) {
  const recording = status === 'recording';
  const busy = status !== 'idle';

  return (
    <section className="card recorder" aria-labelledby="recorder-title">
      <div className="card-head">
        <h2 id="recorder-title">Record</h2>
        <span className={`state state-${status}`} role="status">
          {recording && <span className="rec-dot" aria-hidden="true" />}
          {STATUS_TEXT[status]}
        </span>
      </div>

      <LevelMeter levelsRef={levelsRef} active={recording} />

      <div className="timer" aria-label="Recording time">{formatDuration(elapsed)}</div>

      <div className="field">
        <label htmlFor="language">Spoken language</label>
        <select id="language" value={language} disabled={busy} onChange={(e) => onLanguageChange(e.target.value)}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        {language === 'auto' && detectedLanguage && (
          <span className="hint">Detected: {LANGUAGES.find((l) => l.code === detectedLanguage)?.label.split(' (')[0] || detectedLanguage}</span>
        )}
      </div>

      <div className="actions">
        {!recording && status !== 'processing' ? (
          <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={onStart}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12h-2Z" /></svg>
            Start recording
          </button>
        ) : (
          <button type="button" className="btn btn-stop btn-lg" disabled={status === 'processing'} onClick={onStop}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
            {status === 'processing' ? 'Finishing…' : 'Stop recording'}
          </button>
        )}
        <button type="button" className="btn btn-ghost" disabled={busy || !hasText} onClick={onReset}>Reset</button>
      </div>

      {!speechOnline && (
        <p className="notice notice-warn" role="note">
          The speech service is not reachable. Start it with <code>python run.py</code> in the
          <code> speech-service</code> folder (the first start downloads the model), then try again.
        </p>
      )}
    </section>
  );
}
