export interface CoverTemplate {
  id: string
  name: string
  proOnly: boolean
  bgClass: string
  textClass: string
  accentClass: string
  motif: 'line' | 'leaf' | 'sun' | 'moon'
}

export const COVER_TEMPLATES: CoverTemplate[] = [
  { id: 'cover_01', name: '잉크 클래식', proOnly: false, bgClass: 'bg-ink', textClass: 'text-surface', accentClass: 'bg-sage', motif: 'line' },
  { id: 'cover_02', name: '세이지 페이퍼', proOnly: false, bgClass: 'bg-[#E9E4D8]', textClass: 'text-ink', accentClass: 'bg-sage', motif: 'leaf' },
  { id: 'cover_03', name: '테라코타 에디션', proOnly: true, bgClass: 'bg-[#F2E4D6]', textClass: 'text-[#7A4635]', accentClass: 'bg-terracotta', motif: 'sun' },
  { id: 'cover_04', name: '나이트 에디션', proOnly: true, bgClass: 'bg-[#343A35]', textClass: 'text-[#F7F2E8]', accentClass: 'bg-[#A9B49D]', motif: 'moon' },
]
