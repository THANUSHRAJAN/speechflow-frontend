const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z' },
  { id: 'history', label: 'Transcription History', icon: 'M12 8v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v5h-5' },
];

export default function Sidebar({ view, onNavigate, historyCount }) {
  const active = view === 'detail' ? 'history' : view;
  return (
    <aside className="sidebar">
      <div className="brand">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="9" fill="var(--blue)" />
          <path d="M8 13v6M12 9v14M16 6v20M20 11v10M24 14v4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span>SpeechFlow</span>
      </div>
      <nav aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item${active === item.id ? ' is-active' : ''}`}
            aria-current={active === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
            {item.id === 'history' && historyCount > 0 && <span className="nav-count">{historyCount}</span>}
          </button>
        ))}
      </nav>
      <p className="sidebar-note">Audio is transcribed on this computer. Nothing is sent to an AI cloud service.</p>
    </aside>
  );
}
