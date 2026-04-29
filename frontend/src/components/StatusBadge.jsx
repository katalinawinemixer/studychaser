const CONFIG = {
  complete:  { label: 'Complete',  dot: '#2EAA6A' },
  sent:      { label: 'Sent',      dot: '#3B82F6' },
  reminded:  { label: 'Reminded',  dot: '#D97706' },
  overdue:   { label: 'Overdue',   dot: '#EF4444' },
  'not-sent':{ label: 'Not Sent',  dot: '#9CA3AF' },
  na:        { label: 'N/A',       dot: '#9CA3AF' },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? CONFIG['not-sent']
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}
