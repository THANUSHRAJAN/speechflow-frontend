function Pill({ label, state, title }) {
  const text = state === 'online' ? 'Ready' : state === 'offline' ? 'Offline' : 'Checking';
  return (
    <span className={`pill pill-${state}`} title={title}>
      <span className="dot" aria-hidden="true" />
      {label}: {text}
    </span>
  );
}

const TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Record speech and turn it into text, privately on your computer.' },
  history: { title: 'Transcription history', subtitle: 'Search, open, edit or delete your saved transcripts.' },
  detail: { title: 'Transcript', subtitle: 'Review and edit this saved transcript.' },
};

export default function Header({ view, speech, backend }) {
  const { title, subtitle } = TITLES[view];
  const model = speech.info?.model ? `Model: ${speech.info.model}` : 'Speech service not reachable';
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      <div className="status-pills" role="status" aria-live="polite">
        <Pill label="Speech service" state={speech.state} title={model} />
        <Pill label="Database API" state={backend} title="Spring Boot backend" />
      </div>
    </header>
  );
}
