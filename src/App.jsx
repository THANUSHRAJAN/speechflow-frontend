import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Recorder from './components/Recorder';
import LiveTranscript from './components/LiveTranscript';
import HistoryTable from './components/HistoryTable';
import TranscriptEditor from './components/TranscriptEditor';
import DeleteDialog from './components/DeleteDialog';
import { useTranscription } from './hooks/useTranscription';
import { useTranscripts } from './hooks/useTranscripts';
import { useServiceHealth } from './hooks/useServiceHealth';
import { copyText, formatDate, wordCount } from './utils';
import { languageLabel } from './languages';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [language, setLanguage] = useState('auto');
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const transcription = useTranscription();
  const transcripts = useTranscripts();
  const recordingActive = transcription.status !== 'idle';
  const health = useServiceHealth(recordingActive);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const navigate = useCallback((next) => {
    setView(next);
    if (next !== 'detail') setSelectedId(null);
  }, []);

  const openTranscript = (id) => { setSelectedId(id); setView('detail'); };
  const selected = transcripts.items.find((item) => item.id === selectedId) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transcripts.items;
    return transcripts.items.filter((item) =>
      `${item.title} ${item.content} ${languageLabel(item.language)}`.toLowerCase().includes(q));
  }, [transcripts.items, query]);

  // Statistics are computed from the saved data only.
  const stats = useMemo(() => {
    const items = transcripts.items;
    return {
      count: items.length,
      words: items.reduce((sum, item) => sum + wordCount(item.content), 0),
      languages: new Set(items.map((item) => item.language).filter((l) => l && l !== 'auto')).size,
      last: items[0]?.createdAt || null,
    };
  }, [transcripts.items]);

  const handleStart = () => transcription.start(language);

  const handleSave = async (title) => {
    setSaving(true);
    setSaveError('');
    try {
      const spoken = language === 'auto' ? (transcription.detectedLanguage || 'auto') : language;
      await transcripts.create({ title: title || undefined, content: transcription.finalText, language: spoken });
      transcription.reset();
      setToast('Transcript saved');
      return true;
    } catch (err) {
      setSaveError(`${err.message} Your transcript text is still here.`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCopied = (ok) => setToast(ok ? 'Copied to clipboard' : 'Copy failed. Select the text and copy it manually.');
  const handleCopyItem = async (item) => {
    try { await copyText(item.content); handleCopied(true); } catch { handleCopied(false); }
  };

  const handleUpdate = async (id, payload) => {
    await transcripts.update(id, payload);
    setToast('Changes saved');
  };

  const confirmDelete = async (item) => {
    await transcripts.remove(item.id);
    setDeleteTarget(null);
    if (selectedId === item.id) navigate('history');
    setToast('Transcript deleted');
  };

  const combinedError = transcription.error || saveError;
  const dismissError = () => { transcription.dismissError(); setSaveError(''); };

  return (
    <div className="app">
      <Sidebar view={view} onNavigate={navigate} historyCount={transcripts.items.length} />

      <div className="main">
        <Header view={view} speech={health.speech} backend={health.backend} />

        <main className="content">
          {view === 'dashboard' && (
            <>
              <div className="grid-two">
                <Recorder
                  status={transcription.status}
                  language={language}
                  onLanguageChange={setLanguage}
                  elapsed={transcription.elapsed}
                  levelsRef={transcription.levelsRef}
                  detectedLanguage={transcription.detectedLanguage}
                  hasText={Boolean(transcription.finalText)}
                  speechOnline={health.speech.state !== 'offline'}
                  onStart={handleStart}
                  onStop={transcription.stop}
                  onReset={transcription.reset}
                />
                <LiveTranscript
                  status={transcription.status}
                  finalText={transcription.finalText}
                  interimText={transcription.interimText}
                  onTextChange={transcription.setFinalText}
                  onSave={handleSave}
                  saving={saving}
                  error={combinedError}
                  onDismissError={dismissError}
                  onCopied={handleCopied}
                />
              </div>

              <dl className="stats" aria-label="Summary of saved transcripts">
                <div><dt>Saved transcripts</dt><dd>{stats.count}</dd></div>
                <div><dt>Words saved</dt><dd>{stats.words.toLocaleString()}</dd></div>
                <div><dt>Languages used</dt><dd>{stats.languages}</dd></div>
                <div><dt>Last saved</dt><dd className="small-dd">{stats.last ? formatDate(stats.last) : 'Nothing yet'}</dd></div>
              </dl>

              <section className="card" aria-labelledby="recent-title">
                <div className="card-head">
                  <h2 id="recent-title">Recent transcripts</h2>
                  {transcripts.items.length > 5 && (
                    <button type="button" className="link" onClick={() => navigate('history')}>View all {transcripts.items.length}</button>
                  )}
                </div>
                <HistoryTable
                  items={transcripts.items.slice(0, 5)}
                  loading={transcripts.loading}
                  error={transcripts.error}
                  onRetry={transcripts.reload}
                  onOpen={openTranscript}
                  onDelete={setDeleteTarget}
                  onCopy={handleCopyItem}
                />
              </section>
            </>
          )}

          {view === 'history' && (
            <section className="card" aria-labelledby="history-title">
              <div className="card-head">
                <h2 id="history-title">All transcripts</h2>
                <div className="search">
                  <label htmlFor="search" className="sr-only">Search transcripts</label>
                  <input id="search" type="search" value={query} placeholder="Search title, text or language"
                         onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
              <HistoryTable
                items={filtered}
                filtered={Boolean(query.trim())}
                loading={transcripts.loading}
                error={transcripts.error}
                onRetry={transcripts.reload}
                onOpen={openTranscript}
                onDelete={setDeleteTarget}
                onCopy={handleCopyItem}
                onGoRecord={() => navigate('dashboard')}
              />
            </section>
          )}

          {view === 'detail' && (selected ? (
            <TranscriptEditor
              key={`${selected.id}-${selected.updatedAt}`}
              transcript={selected}
              onSave={handleUpdate}
              onDelete={setDeleteTarget}
              onBack={() => navigate('history')}
              onCopied={handleCopied}
            />
          ) : (
            <section className="card empty">
              <p><strong>This transcript is not available.</strong></p>
              <p className="muted">It may have been deleted, or the list is still loading.</p>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('history')}>Back to history</button>
            </section>
          ))}
        </main>
      </div>

      <DeleteDialog transcript={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
