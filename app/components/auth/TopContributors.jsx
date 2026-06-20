export default function TopContributors({ contributors }) {
  return (
    <div className="top-contributors">
      <h4>Top Contributors</h4>
      <ul>
        {contributors.map((c, idx) => (
          <li key={idx}>
            <span>{c.name}</span> ({c.commits} commits)
          </li>
        ))}
      </ul>
    </div>
  );
}