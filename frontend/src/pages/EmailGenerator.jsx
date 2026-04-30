import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet, apiPost, useApiData } from '../lib/api'

const EMAIL_TYPES = [
  { value: 'first',    label: 'First Reminder' },
  { value: 'second',   label: 'Second Reminder' },
  { value: 'overdue',  label: 'Overdue / Escalation' },
  { value: 'confirm',  label: 'Completion Confirmation' },
  { value: 'pi',       label: 'PI Escalation' },
]

export default function EmailGenerator() {
  const [searchParams] = useSearchParams()
  const [studyId,    setStudyId]    = useState(() => searchParams.get('studyId')    ?? '')
  const [trainingId, setTrainingId] = useState(() => searchParams.get('trainingId') ?? '')
  const [personId,   setPersonId]   = useState(() => searchParams.get('personId')   ?? '')
  const [emailType,  setEmailType]  = useState(() => searchParams.get('type')       ?? 'first')
  const [copied,     setCopied]     = useState(false)
  const [email,      setEmail]      = useState(null)
  const [emailError, setEmailError] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  const { data, loading, error } = useApiData(
    async () => {
      const [studies, trainings, people] = await Promise.all([
        apiGet('/studies'),
        apiGet('/trainings'),
        apiGet('/people'),
      ])
      return { studies, trainings, people }
    },
    { studies: [], trainings: [], people: [] }
  )
  const { studies, trainings, people } = data

  const study    = studies.find(s => s.id === Number(studyId))
  const training = trainings.find(t => t.id === Number(trainingId))
  const person   = people.find(p => p.id === Number(personId))

  const studyTrainings = studyId
    ? trainings.filter(t => t.studyId === Number(studyId))
    : []

  const trainingPeople = trainingId
    ? (trainings.find(t => t.id === Number(trainingId))?.staff ?? [])
    : []

  useEffect(() => {
    if (!studyId || !trainingId || !personId) {
      setEmail(null)
      setEmailError('')
      setEmailLoading(false)
      return
    }

    let active = true
    setEmailLoading(true)
    setEmailError('')

    apiPost('/email/generate', {
      studyId: Number(studyId),
      trainingId: Number(trainingId),
      personId: Number(personId),
      type: emailType,
      senderName: 'Katalina M.',
    })
      .then(result => {
        if (active) setEmail(result)
      })
      .catch(err => {
        if (active) {
          setEmail(null)
          setEmailError(err.message || 'Unable to generate email')
        }
      })
      .finally(() => {
        if (active) setEmailLoading(false)
      })

    return () => {
      active = false
    }
  }, [studyId, trainingId, personId, emailType])

  const handleCopy = () => {
    if (!email) return
    const text = `Subject: ${email.subject}\n\n${email.body}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Email Generator</h1>
        <p className="page-subtitle">
          Generate a ready-to-send follow-up email from the backend. Copy it directly into Outlook.
        </p>
      </div>

      {error && <div className="api-message api-error">{error}</div>}
      {loading && <div className="api-message">Loading email options...</div>}
      {emailError && <div className="api-message api-error">{emailError}</div>}

      <div className="email-layout">
        {/* Form panel */}
        <div className="card card-pad">
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '18px', color: 'var(--text)' }}>
            Configure Email
          </div>
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Study</label>
              <select
                className="form-select"
                value={studyId}
                onChange={e => { setStudyId(e.target.value); setTrainingId(''); setPersonId('') }}
                disabled={loading}
              >
                <option value="">Select a study…</option>
                {studies.map(s => (
                  <option key={s.id} value={s.id}>{s.studyNumber} — {s.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Training Item</label>
              <select
                className="form-select"
                value={trainingId}
                onChange={e => { setTrainingId(e.target.value); setPersonId('') }}
                disabled={!studyId || loading}
              >
                <option value="">Select a training…</option>
                {studyTrainings.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.version})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient</label>
              <select
                className="form-select"
                value={personId}
                onChange={e => setPersonId(e.target.value)}
                disabled={!trainingId || loading}
              >
                <option value="">Select a person…</option>
                {trainingPeople.map(m => {
                  const p = people.find(x => x.id === m.personId)
                  return p ? (
                    <option key={p.id} value={p.id}>
                      {p.name} — {m.status}
                    </option>
                  ) : null
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email Type</label>
              <select
                className="form-select"
                value={emailType}
                onChange={e => setEmailType(e.target.value)}
                disabled={loading}
              >
                {EMAIL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: '4px', justifyContent: 'center' }}
              onClick={handleCopy}
              disabled={!email || emailLoading}
            >
              <CopyIcon />
              {emailLoading ? 'Generating...' : copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div className="email-preview">
          <div className="email-preview-header">
            <span>Email Preview</span>
            {email && (
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                <CopyIcon /> {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          {emailLoading ? (
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <MailIcon />
              <h3 style={{ marginTop: '14px' }}>Generating email...</h3>
              <p>The backend is preparing the selected follow-up template.</p>
            </div>
          ) : email ? (
            <>
              <div className="email-meta">
                <div className="email-meta-row">
                  <span className="meta-label">To:</span>
                  <span className="meta-val">{person?.name} &lt;{person?.email}&gt;</span>
                </div>
                <div className="email-meta-row">
                  <span className="meta-label">Subject:</span>
                  <span className="meta-val" style={{ fontWeight: 500 }}>{email.subject}</span>
                </div>
              </div>
              <div className="email-body">{email.body}</div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <MailIcon />
              <h3 style={{ marginTop: '14px' }}>No email generated yet</h3>
              <p>Select a study, training, and recipient to generate a follow-up email.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CopyIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>

const MailIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C8D6E5" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
