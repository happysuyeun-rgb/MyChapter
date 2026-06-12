import { useState } from 'react'
import { Chip, Input } from '@/components/common'
import { EMOTION_TAGS } from '@/constants/emotionTags'

interface EmotionTagPickerProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function EmotionTagPicker({ selected, onChange }: EmotionTagPickerProps) {
  const [customMode, setCustomMode] = useState(false)
  const [customTag, setCustomTag] = useState('')

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  const addCustom = () => {
    const trimmed = customTag.trim()
    if (!trimmed || selected.includes(trimmed)) return
    onChange([...selected, trimmed])
    setCustomTag('')
    setCustomMode(false)
  }

  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold text-ink-muted">오늘의 감정</p>
      <div className="flex flex-wrap">
        {EMOTION_TAGS.map((tag) => (
          <Chip
            key={tag}
            active={selected.includes(tag)}
            onClick={() => toggle(tag)}
          >
            {tag}
          </Chip>
        ))}
        {customMode ? (
          <div className="m-1 flex w-full gap-2">
            <Input
              active
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="감정 입력"
              className="flex-1"
            />
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-accent"
              onClick={addCustom}
            >
              추가
            </button>
          </div>
        ) : (
          <Chip onClick={() => setCustomMode(true)}>+ 직접 입력</Chip>
        )}
      </div>
    </div>
  )
}
