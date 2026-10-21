import { useState } from 'react';
import { copyText, wordCount } from '../utils';

export default function LiveTranscript({
  status, finalText, interimText, onTextChange, onSave, saving, error, onDismissError, onCopied,
}) {
  const [title, setTitle] = useState('');
  const live = status === 'recording' || status === 'processing';
  const empty = !finalText.trim() && !interimText.trim();

  const handleSave = async () => {
    const saved = await onSave(title.trim());
    if (saved) setTitle('');
  };

  const handleCopy = async () => {
    try {
      await copyText(finalText);
      onCopied(true);
    } catch {
      onCopied(false);
    }
  };

  return (
    <section className="card transcript" aria-labelledby="transcript-title">
      <div className="card-head">
        <h2 id="transcript-title">Live transcript</h2>
        <span className="muted small">{wordCount(finalText)} words</span>
      </div>

      {error && (
        <div className="notice notice-error" role="alert">
          <span>{error}</span>
          <button type="button" className="link" onClick={onDismissError}>Dismiss</button>
        </div>
      )}

      {live || (!finalText && interimText) ? (
        <div className="live-text" aria-live="polite" aria-label="Transcript being recognised">
          {empty && <span className="muted">Listening… start speaking.</span>}
          <span className="final">{finalText}</span>
          {interimText && <span className="interim">{finalText ? ' ' : ''}{interimText}</span>}
          {status === 'recording' && <span className="caret" aria-hidden="true" />}
        </div>
      ) : (
        <>
          <label htmlFor="transcript-text" className="sr-only">Transcript text</label>
          <textarea
            id="transcript-text"
            className="editor-area"
            value={finalText}
            placeholder="Your transcript appears here while you speak. When you stop, you can edit it before saving."
            onChange={(e) => onTextChange(e.target.value)}
          />
        </>
      )}

      {live && <p className="hint">Dark text is final. Lighter text is still being refined and may change.</p>}

      <div className="save-row">
        <div className="field grow">
          <label htmlFor="title">Title (optional)</label>
          <input id="title" type="text" value={title} maxLength={200} disabled={live}
                 placeholder="Defaults to the first words of the transcript"
                 onChange={(e) => setTitle(e.target.value)} />
        </div>
        <button type="button" className="btn btn-ghost" disabled={!finalText.trim()} onClick={handleCopy}>Copy</button>
        <button type="button" className="btn btn-primary" disabled={live || saving || !finalText.trim()} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save transcript'}
        </button>
      </div>
    </section>
  );
}
