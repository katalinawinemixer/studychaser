import { useEffect, useRef, useState } from 'react'
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
  const [copyError, setCopyError] = useState('')
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const copiedTimer = useRef(null)

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
    clearTimeout(copiedTimer.current)
    setCopied(false)
    setCopyError('')
    setEmail(null)
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
      senderName: 'Alex Demo',
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
      clearTimeout(copiedTimer.current)
    }
  }, [studyId, trainingId, personId, emailType, previewAttempt])

  const handleCopy = async () => {
    if (!email || emailLoading) return
    const text = `Subject: ${email.subject}\n\n${email.body}`
    setCopyError('')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError('Could not copy the email. Select the subject and message below to copy them manually.')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Email preview</h1>
        <p className="page-subtitle">
          Preview a synthetic follow-up email, then copy the text for review.
        </p>
      </div>

      {error && <div className="api-message api-error">{error}</div>}
      {loading && <div className="api-message" role="status">Loading email options...</div>}
      {emailError && <div className="api-message api-error" role="alert">{emailError}</div>}

      <div className="email-layout">
        {/* Form panel */}
        <div className="card card-pad">
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '18px', color: 'var(--text)' }}>
            Configure preview
          </div>
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label" htmlFor="email-study">Study</label>
              <select id="email-study"
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
              <label className="form-label" htmlFor="email-training">Training Item</label>
              <select id="email-training"
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
              <label className="form-label" htmlFor="email-recipient">Recipient</label>
              <select id="email-recipient"
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
              <label className="form-label" htmlFor="email-type">Email Type</label>
              <select id="email-type"
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

          </div>
        </div>

        {/* Preview panel */}
        <section className="email-preview" aria-labelledby="email-preview-title" aria-busy={emailLoading}>
          <div className="email-preview-header">
            <h2 id="email-preview-title">Email preview</h2>
            <button className="btn btn-primary" onClick={handleCopy} disabled={!email || emailLoading}>
              <CopyIcon /> {copied ? 'Copied' : 'Copy email'}
            </button>
          </div>
          <div className="copy-feedback" role="status">{copied ? 'Email copied.' : ''}</div>
          {copyError && <div className="api-message api-error" role="alert">{copyError}</div>}

          {emailLoading ? (
            <div className="empty-state" role="status" style={{ padding: '80px 20px' }}>
              <MailIcon />
              <h3 style={{ marginTop: '14px' }}>Preparing email preview...</h3>
              <p>Your selected follow-up template will appear here.</p>
            </div>
          ) : email ? (
            <>
              <div className="email-meta">
                <div className="email-meta-row">
                  <span className="meta-label">Study:</span>
                  <span className="meta-val">{study?.studyNumber} — {study?.title}</span>
                </div>
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
          ) : emailError ? (
            <div className="empty-state">
              <h3>Preview unavailable</h3>
              <p>Check your selections or try preparing this preview again.</p>
              <button className="btn btn-secondary" onClick={() => setPreviewAttempt(value => value + 1)}>Try again</button>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <MailIcon />
              <h3 style={{ marginTop: '14px' }}>Choose an email to preview</h3>
              <p>Select a study, training, and recipient to preview a follow-up email.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const CopyIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>

const MailIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#536451" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
