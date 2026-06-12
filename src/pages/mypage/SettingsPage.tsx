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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="설정" leftLabel="‹ 뒤로" />

      <div className="flex-1 overflow-y-auto">
        <Section title="알림">
          <Row
            label="기록 알림"
            value={profile?.notification_enabled ? 'ON' : 'OFF'}
            onClick={() => void handleNotificationToggle()}
          />
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="text-sm">알림 시간</span>
            <select
              className="rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-sm text-ink-muted"
              value={notificationTime}
              onChange={(e) => void handleTimeChange(e.target.value)}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="계정">
          <Row
            label="닉네임"
            value={profile?.nickname ?? '-'}
            onClick={() => {
              setNickname(profile?.nickname ?? '')
              setNicknameOpen(true)
            }}
          />
          <Row
            label="프로필 이모지"
            value={profile?.profile_emoji ?? '🌿'}
            onClick={() => setEmojiOpen(true)}
          />
        </Section>

        <Section title="구독">
          <Row
            label="현재 플랜"
            value={isPro ? 'Pro' : 'Free'}
            onClick={() => navigate('/mypage/subscription')}
          />
          {!isPro && (
            <button
              type="button"
              className="w-full border-b border-border px-5 py-4 text-left text-sm text-accent"
              onClick={() => showPaywall()}
            >
              Pro 업그레이드 ({PRO_PRICE_LABEL})
            </button>
          )}
        </Section>

        <Section title="앱 정보">
          <Row label="이용약관" value="›" onClick={() => navigate('/mypage/terms-of-service')} />
          <Row
            label="개인정보처리방침"
            value="›"
            onClick={() => navigate('/mypage/privacy-policy')}
          />
          <Row label="버전" value="1.0.0" />
        </Section>
      </div>

      <div className="space-y-2 p-5">
        <button
          type="button"
          className="w-full py-3 text-sm text-ink-muted"
          onClick={() => void signOut()}
        >
          로그아웃
        </button>
        <button
          type="button"
          className="w-full py-3 text-sm text-danger"
          onClick={() => navigate('/mypage/delete-account')}
        >
          계정 삭제
        </button>
      </div>

      <Modal open={nicknameOpen} onClose={() => setNicknameOpen(false)} title="닉네임 변경">
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={10}
          placeholder="2~10자"
        />
        <Button className="mt-4" disabled={saving} onClick={() => void handleNicknameSave()}>
          저장
        </Button>
      </Modal>

      <Modal open={emojiOpen} onClose={() => setEmojiOpen(false)} title="이모지 선택">
        <div className="grid grid-cols-4 gap-3">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-12 items-center justify-center rounded-xl bg-surface-alt text-2xl"
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-5 pb-2 pt-4 text-xs font-semibold text-ink-muted">{title}</p>
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  onClick,
}: {
  label: string
  value: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between border-b border-border px-5 py-4 text-left"
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="text-sm">{label}</span>
      <span className="text-sm text-ink-muted">{value}</span>
    </button>
  )
}
