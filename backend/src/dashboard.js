export function buildDashboard({ studies, trainings }) {
  const attentionItems = []

  for (const training of trainings) {
    const study = studies.find((candidate) => candidate.id === training.studyId)

    for (const member of training.staff) {
      const needsReminder =
        member.status === 'overdue' ||
        ((member.status === 'reminded' || member.status === 'sent') && member.daysAgo >= training.cadenceDays)

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
          nextAction: member.status === 'overdue' ? 'Escalate to PI' : 'Send reminder',
        })
      }
    }
  }

  attentionItems.sort((a, b) => {
    const order = { overdue: 0, reminded: 1, sent: 2 }
    return (order[a.status] ?? 3) - (order[b.status] ?? 3)
  })

  const allStaff = trainings.flatMap((training) => training.staff)

  return {
    stats: {
      overdueCount: allStaff.filter((member) => member.status === 'overdue').length,
      awaitingCount: allStaff.filter((member) => ['sent', 'reminded'].includes(member.status)).length,
      completedCount: allStaff.filter((member) => member.status === 'complete').length,
      activeStudies: studies.filter((study) => study.status === 'active').length,
    },
    attentionItems,
    studySummary: studies.map((study) => ({
      id: study.id,
      studyNumber: study.studyNumber,
      title: study.title,
      activeTrainings: study.activeTrainings,
      completedTrainings: study.completedTrainings,
      coordinator: study.coordinator,
    })),
  }
}
