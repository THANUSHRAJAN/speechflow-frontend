import { languageLabel } from '../languages';
import { formatDate, wordCount } from '../utils';

export default function HistoryTable({
  items, loading, error, onRetry, onOpen, onDelete, onCopy, filtered = false, onGoRecord,
}) {
  if (loading && items.length === 0) {
    return <div className="empty" role="status">Loading transcripts…</div>;
  }
  if (error && items.length === 0) {
    return (
      <div className="empty" role="alert">
        <p><strong>Could not load transcripts.</strong></p>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn-ghost" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="empty">
        <p><strong>{filtered ? 'No transcripts match your search.' : 'No saved transcripts yet.'}</strong></p>
        {!filtered && (
          <>
            <p className="muted">Record something, review the text, then choose Save transcript.</p>
            {onGoRecord && <button type="button" className="btn btn-primary" onClick={onGoRecord}>Start a recording</button>}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Language</th>
            <th scope="col">Words</th>
            <th scope="col">Created</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <button type="button" className="row-title" onClick={() => onOpen(item.id)}>{item.title}</button>
                <div className="muted small clamp">{item.content}</div>
              </td>
              <td>{languageLabel(item.language)}</td>
              <td>{wordCount(item.content)}</td>
              <td className="nowrap">{formatDate(item.createdAt)}</td>
              <td className="row-actions">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => onOpen(item.id)}>Edit</button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => onCopy(item)}>Copy</button>
                <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => onDelete(item)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
