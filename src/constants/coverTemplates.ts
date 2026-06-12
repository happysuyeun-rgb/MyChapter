export interface CoverTemplate {
  id: string
  name: string
  proOnly: boolean
  bgClass: string
  textClass: string
  accentClass: string
  emoji?: string
}

export const COVER_TEMPLATES: CoverTemplate[] = [
  {
    id: 'cover_01',
    name: '클래식 다크',
    proOnly: false,
    bgClass: 'bg-ink',
    textClass: 'text-white',
    accentClass: 'bg-accent-mid',
    emoji: '📖',
  },
  {
    id: 'cover_02',
    name: '포레스트 그린',
    proOnly: false,
    bgClass: 'bg-[#e8f4e8]',
    textClass: 'text-[#2d5a1b]',
    accentClass: 'bg-accent-mid',
    emoji: '🌿',
  },
  {
    id: 'cover_03',
    name: '웜 오렌지',
    proOnly: true,
    bgClass: 'bg-[#fff8f0]',
    textClass: 'text-[#c45a00]',
    accentClass: 'bg-[#c45a00]',
  },
  {
    id: 'cover_04',
    name: '미드나잇 퍼플',
    proOnly: true,
    bgClass: 'bg-[#f5f0ff]',
    textClass: 'text-[#5a3b8a]',
    accentClass: 'bg-[#9b6db5]',
    emoji: '🌙',
  },
]
