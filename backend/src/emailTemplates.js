import { allowedEmailTypes, escalationRecipient, isStudyPi, EMAIL_TYPES } from '../../shared/emailRules.js'

export function generateEmail({ study, training, person, people = [], type = 'first', senderName = 'Alex Demo' }) {
  if (!study || !training || !person) {
    throw Object.assign(new Error('study, training, and person are required'), { statusCode: 400 })
  }

  if (!EMAIL_TYPES.some(option => option.value === type)) {
    throw Object.assign(new Error(`Unsupported email type: ${type}`), { statusCode: 400 })
  }

  const member = training.staff?.find(candidate => candidate.personId === person.id)
  if (training.studyId !== study.id || !member) {
    throw Object.assign(new Error('Choose a staff member assigned to this training and study.'), { statusCode: 400 })
  }
  if (!allowedEmailTypes({ study, member, people }).includes(type)) {
    const message = type === 'pi'
      ? (isStudyPi(study, member) ? 'This staff member is the PI. Use a direct reminder instead of self-escalation.' : 'PI escalation needs an overdue assignment and a recorded PI email address.')
      : type === 'confirm' ? 'Record completion before preparing a completion confirmation.'
        : member.completionStatus === 'complete' || member.status === 'complete'
          ? 'Training is already complete. Use a completion confirmation instead of a reminder.'
          : 'An overdue reminder requires an overdue assignment.'
    throw Object.assign(new Error(message), { statusCode: 409 })
  }
  const recipient = type === 'pi' ? escalationRecipient(study, people) : person

  const firstName = /^Dr\.?\s/i.test(person.name) ? `Dr. ${person.name.split(' ').at(-1)}` : person.name.split(' ')[0]
  const piLastName = recipient.name.split(' ').at(-1)
  const sig = `Best regards,\n${senderName}\nRegulatory Coordinator`

  const subjects = {
    first: `[${study.studyNumber}] ${training.title} - Training Follow-Up`,
    second: `[${study.studyNumber}] ${training.title} - Second Follow-Up Reminder`,
    overdue: `[${study.studyNumber}] ${training.title} - Overdue Acknowledgment Required`,
    confirm: `[${study.studyNumber}] ${training.title} - Acknowledgment Received`,
    pi: `[${study.studyNumber}] ${training.title} - Escalation: Pending Training Acknowledgment`,
  }

  const bodies = {
    first: `Hi ${firstName},

I hope you're doing well. I'm following up on the ${training.title} (${training.version}) for Study ${study.studyNumber} - ${study.title}.

Training documentation was distributed on ${training.sentDate}. This synthetic preview asks study staff to acknowledge receipt and completion so the demo record can be updated.

If you have already completed this training, please reply to this email to confirm so we may update our records.

Thank you for your time and continued involvement in this study.

${sig}`,

    second: `Hi ${firstName},

This is a second follow-up regarding the ${training.title} (${training.version}) for Study ${study.studyNumber}.

This preview shows how a coordinator might follow up when an acknowledgment has not yet been received. Please confirm completion so the demo record can be updated.

Please respond at your earliest convenience, or let me know if you have any questions about the training materials.

${sig}`,

    overdue: `Hi ${firstName},

I'm reaching out again regarding the outstanding ${training.title} (${training.version}) acknowledgment for Study ${study.studyNumber}.

This acknowledgment is now overdue in the synthetic demo workflow. Please respond with your acknowledgment so the training record can be marked complete.

Please respond to this email with your acknowledgment as soon as possible. If there is an issue preventing completion, please let me know so we can address it promptly.

${sig}`,

    confirm: `Hi ${firstName},

Thank you - we have received your acknowledgment for the ${training.title} (${training.version}) for Study ${study.studyNumber}.

This preview confirms training completion only. Filing of the completion evidence is tracked separately in StudyChaser.

No further action is needed on your end. Thank you for your prompt response.

${sig}`,

    pi: `Hi Dr. ${piLastName},

I'm writing to bring to your attention that ${person.name} has not yet acknowledged the ${training.title} (${training.version}) for Study ${study.studyNumber} - ${study.title}.

Training was distributed on ${training.sentDate}, and multiple follow-up reminders have been sent without response in this synthetic example. Could you please assist in facilitating acknowledgment at your earliest convenience?

Thank you for your support.

${sig}`,
  }

  return {
    to: `${recipient.name} <${recipient.email}>`,
    recipient: { id: recipient.id, name: recipient.name, email: recipient.email },
    staffMember: { id: person.id, name: person.name },
    version: training.version,
    subject: subjects[type],
    body: bodies[type],
  }
}
