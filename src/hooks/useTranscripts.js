import { useCallback, useEffect, useState } from 'react';
import {
  createTranscription, deleteTranscription, listTranscriptions, updateTranscription,
} from '../api/transcriptionApi';

/** Loads saved transcripts and keeps the list in sync after create / update / delete. */
export function useTranscripts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listTranscriptions());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (payload) => {
    const created = await createTranscription(payload);
    setItems((current) => [created, ...current]);
    return created;
  }, []);

  const update = useCallback(async (id, payload) => {
    const updated = await updateTranscription(id, payload);
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (id) => {
    await deleteTranscription(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return { items, loading, error, reload, create, update, remove };
}
