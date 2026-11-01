const CONFIG = {
  complete:  { label: 'Complete',  dot: '#32734A' },
  sent:      { label: 'Sent',      dot: '#466E8A' },
  reminded:  { label: 'Reminded',  dot: '#95651D' },
  overdue:   { label: 'Overdue',   dot: '#BC5148' },
  'not-sent':{ label: 'Not Sent',  dot: '#737B73' },
  na:        { label: 'N/A',       dot: '#737B73' },
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
