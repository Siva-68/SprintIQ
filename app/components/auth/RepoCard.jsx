export default function RepoCard({ name, language, lastCommit }) {
  return (
    <div className="repo-card">
      <h4>{name}</h4>
      <p>{language} • Last commit: {lastCommit}</p>
      <button>View Details</button>
    </div>
  );
}