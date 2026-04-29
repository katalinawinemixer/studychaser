import { useState } from 'react'
import { studies, trainings, people } from '../data/mockData'

const EMAIL_TYPES = [
  { value: 'first',    label: 'First Reminder' },
  { value: 'second',   label: 'Second Reminder' },
  { value: 'overdue',  label: 'Overdue / Escalation' },
  { value: 'confirm',  label: 'Completion Confirmation' },
  { value: 'pi',       label: 'PI Escalation' },
]

function generateEmail({ study, training, person, type, senderName }) {
  if (!study || !training || !person) return null

  const sig = `Best regards,\n${senderName}\nRegulatory Coordinator`

  const subjects = {
    first:   `[${study.studyNumber}] ${training.title} — Training Follow-Up`,
    second:  `[${study.studyNumber}] ${training.title} — Second Follow-Up Reminder`,
    overdue: `[${study.studyNumber}] ${training.title} — Overdue Acknowledgment Required`,
    confirm: `[${study.studyNumber}] ${training.title} — Acknowledgment Received`,
    pi:      `[${study.studyNumber}] ${training.title} — Escalation: Pending Training Acknowledgment`,
  }

  const bodies = {
    first: `Hi ${person.name.split(' ')[0]},

I hope you're doing well. I'm following up on the ${training.title} (${training.version}) for Study ${study.studyNumber} — ${study.title}.

Training documentation was distributed on ${training.sentDate}. Per protocol requirements, we ask that all study staff acknowledge receipt and completion of this training.

If you have already completed this training, please reply to this email to confirm so we may update our records.

Thank you for your time and continued involvement in this study.

${sig}`,

    second: `Hi ${person.name.split(' ')[0]},

This is a second follow-up regarding the ${training.title} (${training.version}) for Study ${study.studyNumber}.

Our records indicate we have not yet received your acknowledgment. This training acknowledgment is required for regulatory compliance and must be documented in the study binder.

Please respond at your earliest convenience, or let me know if you have any questions about the training materials.

${sig}`,

    overdue: `Hi ${person.name.split(' ')[0]},

I'm reaching out again regarding the outstanding ${training.title} (${training.version}) acknowledgment for Study ${study.studyNumber}.

This acknowledgment is now overdue. Per our site SOPs, all protocol training must be documented prior to participation in study-related activities.

Please respond to this email with your acknowledgment as soon as possible. If there is an issue preventing completion, please let me know so we can address it promptly.

${sig}`,

    confirm: `Hi ${person.name.split(' ')[0]},

Thank you — we have received your acknowledgment for the ${training.title} (${training.version}) for Study ${study.studyNumber}.

Your training record has been updated and documentation will be filed in the study binder under:
${study.studyNumber} > Training > ${training.title}

No further action is needed on your end. Thank you for your prompt response.

${sig}`,

    pi: `Hi Dr. ${study.pi.split(' ').slice(-1)[0]},

I'm writing to bring to your attention that ${person.name} has not yet acknowledged the ${training.title} (${training.version}) for Study ${study.studyNumber} — ${study.title}.

Training was distributed on ${training.sentDate}, and multiple follow-up reminders have been sent without response. Per our site SOPs and regulatory requirements, this training must be documented before study activities can continue.

Could you please assist in facilitating acknowledgment at your earliest convenience?

Thank you for your support.

${sig}`,
  }

  return { subject: subjects[type], body: bodies[type] }
}

export default function EmailGenerator() {
  const [studyId,    setStudyId]    = useState('')
  const [trainingId, setTrainingId] = useState('')
  const [personId,   setPersonId]   = useState('')
  const [emailType,  setEmailType]  = useState('first')
  const [copied,     setCopied]     = useState(false)

  const study    = studies.find(s => s.id === Number(studyId))
  const training = trainings.find(t => t.id === Number(trainingId))
  const person   = people.find(p => p.id === Number(personId))

  const studyTrainings = studyId
    ? trainings.filter(t => t.studyId === Number(studyId))
    : []

  const trainingPeople = trainingId
    ? (trainings.find(t => t.id === Number(trainingId))?.staff ?? [])
    : []

  const email = generateEmail({
    study, training, person, type: emailType, senderName: 'Katalina M.',
  })

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
          Generate a ready-to-send follow-up email. Copy it directly into Outlook.
        </p>
      </div>

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
                disabled={!studyId}
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
                disabled={!trainingId}
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
              disabled={!email}
            >
              <CopyIcon />
              {copied ? 'Copied!' : 'Copy to Clipboard'}
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

          {email ? (
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
