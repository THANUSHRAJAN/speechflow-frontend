export function wordCount(text) {
  const trimmed = (text || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Copies text; uses the async Clipboard API where available and a textarea fallback otherwise. */
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  if (!ok) throw new Error('Copy is not available in this browser');
}

/** Joins an existing transcript and newly recognised text without losing either. */
export function appendText(base, addition) {
  const a = (base || '').trimEnd();
  const b = (addition || '').trim();
  if (!a) return b;
  if (!b) return a;
  return `${a}\n${b}`;
}
