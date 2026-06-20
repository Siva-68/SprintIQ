export default function CommitCard({ author, repo, message, time }) {
  return (
    <div className="commit-card">
      <strong>{author}</strong> committed to <span>{repo}</span>
      <p>{message}</p>
      <small>{time}</small>
    </div>
  );
}