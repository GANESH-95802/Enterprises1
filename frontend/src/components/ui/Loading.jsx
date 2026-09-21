export default function Loading({ text = 'Loading...', fullPage = false }) {
  return (
    <div className={`loading-spinner ${fullPage ? 'full-page' : ''}`} role="status" aria-label={text}>
      <div className="spinner" />
      <span className="loading-text">{text}</span>
    </div>
  );
}