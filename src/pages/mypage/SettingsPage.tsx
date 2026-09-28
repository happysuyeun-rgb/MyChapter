import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Button, Input, Modal } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { updateNotificationSettings, updateNickname, updateProfileEmoji } from '@/lib/api/users'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'

const EMOJI_OPTIONS = ['🌿', '📖', '✨', '🌸', '🌙', '🔥', '💫', '🍀']
const TIME_OPTIONS = ['07:00', '12:00', '18:00', '21:00', '22:00']

export function SettingsPage() {
  const navigate = useNavigate()
  const { profile, signOut, setProfile, user } = useAuthStore()
  const { isPro } = useSubscription()
  const { showPaywall } = usePaywallStore()

  const [nicknameOpen, setNicknameOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [saving, setSaving] = useState(false)

  const notificationTime = profile?.notification_time?.slice(0, 5) ?? '21:00'

  const handleNotificationToggle = async () => {
    if (!user || !profile) return
    const updated = await updateNotificationSettings(user.id, {
      notification_enabled: !profile.notification_enabled,
    })
    setProfile(updated)
  }

  const handleTimeChange = async (time: string) => {
    if (!user) return
    const updated = await updateNotificationSettings(user.id, {
      notification_time: `${time}:00`,
    })
    setProfile(updated)
  }

  const handleNicknameSave = async () => {
    if (!user || !/^[a-zA-Z0-9가-힣]{2,10}$/.test(nickname)) return
    setSaving(true)
    try {
      const updated = await updateNickname(user.id, nickname)
      setProfile(updated)
      setNicknameOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleEmojiSelect = async (emoji: string) => {
    if (!user) return
    const updated = await updateProfileEmoji(user.id, emoji)
    setProfile(updated)
    setEmojiOpen(false)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="설정" leftLabel="←" />

      <main className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
        <header className="border-b border-ink pb-5">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">ACCOUNT & APP</p>
          <h1 className="mt-2 font-serif text-[26px] font-bold tracking-[-0.03em]">설정</h1>
          <p className="mt-2 text-xs leading-5 text-ink-muted">기록 리듬과 계정 정보를 조용히 관리해요.</p>
        </header>

        <Section index="01" title="알림">
          <Row
            label="기록 알림"
            value={profile?.notification_enabled ? 'ON' : 'OFF'}
            onClick={() => void handleNotificationToggle()}
          />
          <div className="flex min-h-[58px] items-center justify-between border-b border-border py-3">
            <span className="text-sm">알림 시간</span>
            <select
              className="border-0 border-b border-border bg-transparent px-1 py-2 text-sm text-ink outline-none"
              value={notificationTime}
              onChange={(e) => void handleTimeChange(e.target.value)}
            >
              {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>
        </Section>

        <Section index="02" title="작가 정보">
          <Row
            label="닉네임"
            value={profile?.nickname ?? '-'}
            onClick={() => {
              setNickname(profile?.nickname ?? '')
              setNicknameOpen(true)
            }}
          />
          <Row
            label="프로필 표시"
            value={profile?.profile_emoji ?? '선택 안 함'}
            onClick={() => setEmojiOpen(true)}
          />
        </Section>

        <Section index="03" title="구독">
          <Row label="현재 플랜" value={isPro ? 'Pro' : 'Free'} onClick={() => navigate('/mypage/subscription')} />
          {!isPro && (
            <button
              type="button"
              className="flex min-h-[58px] w-full items-center justify-between border-b border-border py-3 text-left text-sm font-semibold"
              onClick={() => showPaywall()}
            >
              <span>Pro 업그레이드</span><span className="text-terracotta">{PRO_PRICE_LABEL} →</span>
            </button>
          )}
        </Section>

        <Section index="04" title="앱 정보">
          <Row label="이용약관" value="열기 →" onClick={() => navigate('/mypage/terms-of-service')} />
          <Row label="개인정보처리방침" value="열기 →" onClick={() => navigate('/mypage/privacy-policy')} />
          <Row label="버전" value="1.0.0" />
        </Section>

        <section className="mt-10 border-t border-border pt-5">
          <button type="button" className="min-h-11 text-sm text-ink-muted" onClick={() => void signOut()}>
            로그아웃
          </button>
          <button type="button" className="ml-6 min-h-11 text-sm text-danger" onClick={() => navigate('/mypage/delete-account')}>
            계정 삭제
          </button>
        </section>
      </main>

      <Modal open={nicknameOpen} onClose={() => setNicknameOpen(false)} title="닉네임 변경">
        <Input
          active
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={10}
          placeholder="2~10자"
        />
        <Button className="mt-5" disabled={saving} onClick={() => void handleNicknameSave()}>저장</Button>
      </Modal>

      <Modal open={emojiOpen} onClose={() => setEmojiOpen(false)} title="프로필 표시 선택">
        <div className="grid grid-cols-4 border-l border-t border-border">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-14 items-center justify-center border-b border-r border-border text-xl"
              onClick={() => void handleEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between border-b border-ink pb-2">
        <h2 className="font-serif text-base font-bold">{title}</h2>
        <span className="font-serif text-xs text-ink-faint">{index}</span>
      </div>
      {children}
    </section>
  )
}

function Row({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="flex min-h-[58px] w-full items-center justify-between border-b border-border py-3 text-left"
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="text-sm">{label}</span>
      <span className="max-w-[190px] truncate text-xs text-ink-muted">{value}</span>
    </button>
  )
}
