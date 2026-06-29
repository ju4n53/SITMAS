export default function Field({ label, className = 'col-md-4', children }) {
  return (
    <div className={className}>
      <label className="form-label fw-bold">{label}</label>
      {children}
    </div>
  );
}
