import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { completionStatus, filingReference, filingStatus, trainingCounts } from '../../../shared/trainingRecords'
import { apiPatch, IS_READ_ONLY_DEMO } from '../lib/api'
import { usePreviewActivity } from '../lib/previewActivity'
import FilingBadge from './FilingBadge'
import './TrainingDetails.css'

function formatDate(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

function RecordEditor({ training, member, onSaved, onCancel }) {
  const [completion, setCompletion] = useState(completionStatus(member))
  const [filing, setFiling] = useState(filingStatus(member) === 'filed' ? 'filed' : 'pending')
  const [reference, setReference] = useState(filingReference(member))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await apiPatch(`/trainings/${training.id}/staff/${member.personId}`, {
        completionStatus: completion, filingStatus: filing, filingReference: reference,
      })
      onSaved()
    } catch (err) { setError(err.message || 'Could not save this record.') }
    finally { setBusy(false) }
  }
  return (
    <form className="record-editor form-stack" onSubmit={submit} aria-label={`Update record for ${member.name}`}>
      <label className="form-group">Training completion
        <select autoFocus className="form-select" value={completion} disabled={busy} onChange={event => {
          setCompletion(event.target.value)
          if (event.target.value === 'pending') setFiling('pending')
        }}><option value="pending">Pending</option><option value="complete">Complete</option></select>
      </label>
      <label className="form-group">Evidence filing
        <select className="form-select" value={filing} disabled={busy || completion !== 'complete'} onChange={event => setFiling(event.target.value)}>
          <option value="pending">Not filed</option><option value="filed">Filed</option>
        </select>
      </label>
      <label className="form-group">Filing reference
        <input className="form-input" value={reference} maxLength={1000} required={filing === 'filed'} disabled={busy} onChange={event => setReference(event.target.value)} />
      </label>
      <p className="record-help">Use the binder location or document reference. This records a reference; it does not upload a document.</p>
      {error && <p className="api-message api-error" role="alert">{error}</p>}
      <div className="record-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save record'}</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={onCancel}>Cancel</button></div>
    </form>
  )
}

function HistoryList({ events, empty }) {
  if (!events.length) return <p className="detail-empty">{empty}</p>
  return <ol className="activity-list">{[...events].sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0)).map(event => (
    <li key={event.id}>
      <div className="activity-line"><strong>{event.title}</strong><time dateTime={event.at}>{formatDate(event.at)}</time></div>
      <p>{[event.personName, event.actor && `Recorded by ${event.actor}`, event.version].filter(Boolean).join(' · ')}</p>
      {event.detail && <p className="activity-detail">{event.detail}</p>}
      <span className="activity-source">{event.source === 'synthetic' ? 'Synthetic example' : event.source === 'browser' ? 'This browser session' : 'Local record update'}</span>
    </li>
  ))}</ol>
}

export default function TrainingDetails({ training, study, personId, initialSection, onClose, onSaved }) {
  const dialog = useRef(null)
  const body = useRef(null)
  const [section, setSection] = useState(['overview', 'records', 'history'].includes(initialSection) ? initialSection : personId ? 'history' : 'overview')
  const [person, setPerson] = useState(personId ?? '')
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const previews = usePreviewActivity(training.id)
  const counts = trainingCounts(training)
  const activity = (training.activity ?? []).filter(event => !person || event.personId === Number(person))
  const sessionEvents = previews.filter(event => !person || event.personId === Number(person))
  useEffect(() => { body.current?.scrollTo(0, 0) }, [section])
  useEffect(() => {
    const opener = document.activeElement
    const element = dialog.current
    element.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  return createPortal(
    <dialog className="training-detail-panel" ref={dialog} aria-labelledby="training-detail-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="training-detail-content">
        <header className="training-detail-header">
          <div><p className="eyebrow">TRAINING RECORD</p><h2 id="training-detail-title">{training.title}</h2><p>{study?.studyNumber ?? 'Unknown study'} · {training.version || 'Version not recorded'}</p></div>
          <button className="btn btn-secondary" onClick={onClose} autoFocus aria-label="Close training details">Close</button>
        </header>
        <nav className="detail-nav" aria-label="Training details sections">{[['overview', 'Overview'], ['records', 'Staff records'], ['history', 'Activity history']].map(([key, label]) => (
          <button key={key} aria-pressed={section === key} onClick={() => { setSection(key); setNotice('') }}>{label}</button>
        ))}</nav>
        <div className="training-detail-body" ref={body}>
          {notice && <p className="api-message" role="status">{notice}</p>}
          {section === 'overview' && <>
            <h3>Completion and filing</h3>
            <div className="record-summary"><div><strong>{counts.completed}<small> / {counts.total}</small></strong><span>Training complete</span></div><div><strong>{counts.filed}</strong><span>Evidence filed</span></div><div><strong>{counts.awaitingFiling}</strong><span>Awaiting filing</span></div></div>
            <p className="record-help">Training completion and filing are tracked separately. A completed training can still need its evidence filed.</p>
            <dl className="training-metadata"><div><dt>Study</dt><dd>{study?.title ?? 'Not recorded'}</dd></div><div><dt>Version</dt><dd>{training.version || 'Not recorded'}</dd></div><div><dt>Distributed</dt><dd>{training.sentDate || 'Not recorded'}</dd></div><div><dt>Coordinator</dt><dd>{study?.coordinator || 'Not recorded'}</dd></div><div><dt>Follow-up cadence</dt><dd>Every {training.cadenceDays} days</dd></div></dl>
            <button className="btn btn-primary" onClick={() => setSection('records')}>Review staff records</button>
          </>}
          {section === 'records' && <>
            <h3>Staff records</h3>
            <label className="history-filter">Show staff records for<select className="form-select" value={person} onChange={event => { setPerson(event.target.value); setEditing(null) }}><option value="">All staff</option>{training.staff.map(member => <option key={member.personId} value={member.personId}>{member.name}</option>)}</select></label>
            {IS_READ_ONLY_DEMO && <p className="record-help">Read-only demo. Filing references are synthetic examples; no documents are stored here.</p>}
            {!training.staff.length && <p className="detail-empty">No staff are assigned to this training.</p>}
            <ul className="detail-record-list">{training.staff.filter(member => !person || member.personId === Number(person)).map(member => <li key={member.personId}>
              <h4>{member.name}</h4>
              <dl className="member-record-status"><div><dt>Training completion</dt><dd><span className={`badge ${completionStatus(member) === 'complete' ? 'complete' : 'completion-count'}`}>{completionStatus(member) === 'complete' ? 'Complete' : 'Pending'}</span></dd></div><div><dt>Evidence filing</dt><dd><FilingBadge member={member} /></dd></div></dl>
              <dl className="record-evidence"><div><dt>Completion recorded</dt><dd>{formatDate(member.completedAt)}</dd></div><div><dt>Filing recorded</dt><dd>{formatDate(member.filingRecordedAt)}</dd></div><div><dt>Filing reference</dt><dd>{filingReference(member) || 'No filing reference recorded.'}</dd></div></dl>
              <div className="record-actions"><button className="btn btn-secondary" onClick={() => { setPerson(String(member.personId)); setSection('history') }}>View history<span className="sr-only"> for {member.name}</span></button>{!IS_READ_ONLY_DEMO && editing !== member.personId && <button className="btn btn-secondary" onClick={() => setEditing(member.personId)}>Update record<span className="sr-only"> for {member.name}</span></button>}</div>
              {editing === member.personId && <RecordEditor key={member.personId} training={training} member={member} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('Record saved. Activity history is up to date.'); onSaved() }} />}
            </li>)}</ul>
          </>}
          {section === 'history' && <>
            <h3>Activity history</h3>
            <label className="history-filter">Show activity for<select className="form-select" value={person} onChange={event => setPerson(event.target.value)}><option value="">All staff and training events</option>{training.staff.map(member => <option key={member.personId} value={member.personId}>{member.name}</option>)}</select></label>
            <h4 className="history-section-title">Recorded history</h4>
            <p className="record-help">Synthetic example events and local record changes. Older records may not include event dates or a complete history. Times use your browser’s local time.</p>
            <HistoryList events={activity} empty="No dated history is recorded for this selection. Current statuses are available under Staff records." />
            <h4 className="history-section-title">Preview activity in this browser</h4>
            <p className="record-help">Previews are kept for this browser session only. They do not send email or change completion and filing records.</p>
            <HistoryList events={sessionEvents} empty="No email previews have been prepared for this selection in this browser session." />
          </>}
        </div>
      </div>
    </dialog>, document.body,
  )
}
