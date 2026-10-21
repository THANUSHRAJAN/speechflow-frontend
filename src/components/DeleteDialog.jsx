import { useEffect, useRef, useState } from 'react';

/** Native <dialog>: focus is trapped, Escape closes it, and it is announced to screen readers. */
export default function DeleteDialog({ transcript, onCancel, onConfirm }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (transcript && dialog && !dialog.open) dialog.showModal();
    if (!transcript && dialog?.open) dialog.close();
    setError('');
  }, [transcript]);

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm(transcript);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="delete-title" onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }}>
      {transcript && (
        <>
          <h2 id="delete-title">Delete this transcript?</h2>
          <p>“{transcript.title}” will be permanently removed. This cannot be undone.</p>
          {error && <p className="notice notice-error" role="alert">{error}</p>}
          <div className="actions end">
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel} autoFocus>Keep transcript</button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={confirm}>{busy ? 'Deleting…' : 'Delete'}</button>
          </div>
        </>
      )}
    </dialog>
  );
}
