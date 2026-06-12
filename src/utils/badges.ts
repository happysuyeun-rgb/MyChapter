export interface BadgeEvent {
  key: string
  title: string
  body: string
}

export function checkBadgeEvents(
  streak: number,
  recordCount: number,
): BadgeEvent[] {
  const events: BadgeEvent[] = []

  if (streak === 7) {
    events.push({
      key: 'streak_7',
      title: '7일 연속 기록 달성! 🔥',
      body: '1주 완주 배지를 획득했어요',
    })
  }
  if (streak === 14) {
    events.push({
      key: 'streak_14',
      title: '14일 연속 기록 달성!',
      body: '2주 완주 배지를 획득했어요',
    })
  }
  if (streak === 30) {
    events.push({
      key: 'streak_30',
      title: '30일 연속 기록! 🏆',
      body: '한 달 연속 기록을 달성했어요',
    })
  }
  if (recordCount === 10) {
    events.push({
      key: 'records_10',
      title: '10번째 기록 달성!',
      body: '챕터 1 초안 생성이 곧 시작돼요',
    })
  }
  if (recordCount === 25) {
    events.push({
      key: 'records_25',
      title: '25번째 기록 달성!',
      body: '절반 이상 완주했어요',
    })
  }
  if (recordCount === 50) {
    events.push({
      key: 'records_50',
      title: '50번째 기록 달성!',
      body: '대단해요, 절반을 넘었어요',
    })
  }

  return events
}
