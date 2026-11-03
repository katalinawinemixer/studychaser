const CONFIG = {
  complete:  { label: 'Complete' },
  pending:   { label: 'Pending' },
  sent:      { label: 'Sent' },
  reminded:  { label: 'Reminded' },
  overdue:   { label: 'Overdue' },
  'not-sent':{ label: 'Not sent' },
  na:        { label: 'N/A' },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? CONFIG['not-sent']
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" />
      {cfg.label}
    </span>
  )
}
