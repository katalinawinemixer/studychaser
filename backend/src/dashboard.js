import { completionStatus, filingStatus, needsFollowUp } from '../../shared/trainingRecords.js'
import { workspaceView } from '../../shared/workspace.js'
import { recommendedEmailType } from '../../shared/emailRules.js'

export function buildDashboard(input) {
  const { studies, trainings, people, snapshotDate } = workspaceView(input)
  const attentionItems = []
  const filingItems = []

  for (const training of trainings) {
    const study = studies.find((candidate) => candidate.id === training.studyId)

    for (const member of training.staff) {
      const needsReminder = needsFollowUp(member, training.cadenceDays)

      if (needsReminder) {
        attentionItems.push({
          person: member.name,
          personId: member.personId,
          training: training.title,
          trainingId: training.id,
          study: study?.studyNumber ?? 'Unknown study',
          studyId: study?.id,
          status: member.status,
          daysAgo: member.daysAgo,
          emailType: recommendedEmailType({ study, member, people }),
        })
      }
      if (filingStatus(member) === 'awaiting-filing') filingItems.push({
        person: member.name, personId: member.personId, training: training.title,
        trainingId: training.id, study: study?.studyNumber ?? 'Unknown study', studyId: study?.id,
      })
    }
  }

  attentionItems.sort((a, b) => {
    const order = { overdue: 0, reminded: 1, sent: 2 }
    return (order[a.status] ?? 3) - (order[b.status] ?? 3)
  })

  const allStaff = trainings.flatMap((training) => training.staff)

  return {
    snapshotDate,
    stats: {
      overdueCount: allStaff.filter((member) => completionStatus(member) !== 'complete' && member.status === 'overdue').length,
      awaitingCount: allStaff.filter((member) => completionStatus(member) !== 'complete' && ['sent', 'reminded'].includes(member.status)).length,
      completedCount: allStaff.filter((member) => completionStatus(member) === 'complete').length,
      assignmentCount: allStaff.length,
      pendingCount: allStaff.filter((member) => completionStatus(member) !== 'complete').length,
      filedCount: allStaff.filter((member) => filingStatus(member) === 'filed').length,
      awaitingFilingCount: allStaff.filter((member) => filingStatus(member) === 'awaiting-filing').length,
      activeStudies: studies.filter((study) => study.status === 'active').length,
    },
    attentionItems,
    filingItems,
    studySummary: studies.map((study) => ({
      id: study.id,
      studyNumber: study.studyNumber,
      title: study.title,
      activeTrainings: study.activeTrainings,
      completedTrainings: study.completedTrainings,
      missingTrainings: study.missingTrainings,
      trainingCount: study.trainingCount,
      assignmentCount: study.assignmentCount,
      awaitingFilingCount: study.awaitingFilingCount,
      coordinator: study.coordinator,
    })),
  }
}
