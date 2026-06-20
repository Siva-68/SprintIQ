export default function AlertCard({ type, title, description, time }) {
  const colors = {
    high: "alert-high",
    medium: "alert-medium",
    low: "alert-low",
  };
  return (
    <div className={`alert-card ${colors[type]}`}>
      <strong>{title}</strong>
      <p>{description}</p>
      <span>{time}</span>
    </div>
  );
}