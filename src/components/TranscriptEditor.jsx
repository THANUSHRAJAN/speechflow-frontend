import { useState } from 'react';
import { LANGUAGES } from '../languages';
import { copyText, formatDate, wordCount } from '../utils';

export default function TranscriptEditor({ transcript, onSave, onDelete, onBack, onCopied }) {
  const [title, setTitle] = useState(transcript.title);
  const [content, setContent] = useState(transcript.content);
  const [language, setLanguage] = useState(transcript.language);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dirty = title !== transcript.title || content !== transcript.content || language !== transcript.language;
  const options = LANGUAGES.some((l) => l.code === language)
    ? LANGUAGES
    : [...LANGUAGES, { code: language, label: language.toUpperCase() }];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(transcript.id, { title, content, language });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyText(content);
      onCopied(true);
    } catch {
      onCopied(false);
    }
  };

  return (
    <section className="card editor" aria-labelledby="editor-title">
      <div className="card-head">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>← Back to history</button>
        <span className="muted small">Saved {formatDate(transcript.createdAt)}{transcript.updatedAt !== transcript.createdAt ? ` · edited ${formatDate(transcript.updatedAt)}` : ''}</span>
      </div>
      <h2 id="editor-title" className="sr-only">Edit transcript</h2>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      <div className="editor-grid">
        <div className="field grow">
          <label htmlFor="edit-title">Title</label>
          <input id="edit-title" type="text" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="edit-language">Language</label>
          <select id="edit-language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {options.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="edit-content">Transcript <span className="muted small">({wordCount(content)} words)</span></label>
        <textarea id="edit-content" className="editor-area tall" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <div className="actions end">
        <button type="button" className="btn btn-danger-ghost" onClick={() => onDelete(transcript)}>Delete</button>
        <button type="button" className="btn btn-ghost" onClick={handleCopy}>Copy text</button>
        <button type="button" className="btn btn-primary" disabled={!dirty || saving || !content.trim()} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}
