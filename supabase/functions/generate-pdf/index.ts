import { createClient } from 'jsr:@supabase/supabase-js@2'
import { PDFDocument, rgb, type PDFFont, type RGB } from 'npm:pdf-lib@1.17.1'
import { corsHeaders } from '../_shared/cors.ts'

const FONT_URL =
  'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansKR-Regular.otf'

const COVER_STYLES: Record<string, { bg: RGB; text: RGB }> = {
  cover_01: { bg: rgb(26 / 255, 26 / 255, 24 / 255), text: rgb(1, 1, 1) },
  cover_02: { bg: rgb(232 / 255, 244 / 255, 232 / 255), text: rgb(45 / 255, 90 / 255, 27 / 255) },
  cover_03: { bg: rgb(255 / 255, 248 / 255, 240 / 255), text: rgb(196 / 255, 90 / 255, 0) },
  cover_04: { bg: rgb(245 / 255, 240 / 255, 1), text: rgb(90 / 255, 59 / 255, 138 / 255) },
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 56
const BODY_SIZE = 11
const LINE_HEIGHT = 18

function getDisplayContent(chapter: {
  user_content: string | null
  ai_content: string | null
}): string {
  return chapter.user_content ?? chapter.ai_content ?? ''
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []

  for (const paragraph of text.split('\n\n')) {
    const trimmed = paragraph.replace(/\n/g, ' ').trim()
    if (!trimmed) continue

    let line = ''
    for (const char of trimmed) {
      const candidate = line + char
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line)
        line = char
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
  }

  return lines
}

async function loadKoreanFont(): Promise<ArrayBuffer> {
  const response = await fetch(FONT_URL)
  if (!response.ok) {
    throw new Error('Failed to load Korean font')
  }
  return response.arrayBuffer()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { project_id, cover_template_id } = await req.json()
    if (!project_id || !cover_template_id) {
      return new Response(JSON.stringify({ error: 'Missing project_id or cover_template_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: subscription } = await admin
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscription?.plan !== 'pro') {
      return new Response(JSON.stringify({ code: 'PDF_PRO_ONLY', error: 'PDF 출판은 Pro 플랜이 필요해요.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: project } = await admin
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: chapters } = await admin
      .from('chapters')
      .select('*')
      .eq('project_id', project_id)
      .order('sort_order', { ascending: true })

    if (!chapters?.length) {
      return new Response(JSON.stringify({ error: 'No chapters to publish' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await admin
      .from('users')
      .select('nickname')
      .eq('id', user.id)
      .single()

    const authorName = profile?.nickname ?? '작가'
    const coverStyle = COVER_STYLES[cover_template_id] ?? COVER_STYLES.cover_01

    const fontBytes = await loadKoreanFont()
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(fontBytes)

    const coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: coverStyle.bg,
    })

    const titleSize = 24
    const titleWidth = font.widthOfTextAtSize(project.title, titleSize)
    coverPage.drawText(project.title, {
      x: (PAGE_WIDTH - titleWidth) / 2,
      y: PAGE_HEIGHT * 0.55,
      size: titleSize,
      font,
      color: coverStyle.text,
    })

    const authorSize = 13
    const authorWidth = font.widthOfTextAtSize(authorName, authorSize)
    coverPage.drawText(authorName, {
      x: (PAGE_WIDTH - authorWidth) / 2,
      y: PAGE_HEIGHT * 0.55 - 40,
      size: authorSize,
      font,
      color: coverStyle.text,
    })

    let pageCount = 1
    const maxWidth = PAGE_WIDTH - MARGIN * 2

    for (const chapter of chapters) {
      let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      pageCount++

      let y = PAGE_HEIGHT - MARGIN

      const drawLine = (text: string, size: number, color: RGB, extraGap = 0) => {
        if (y < MARGIN + LINE_HEIGHT) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
          pageCount++
          y = PAGE_HEIGHT - MARGIN
        }
        page.drawText(text, { x: MARGIN, y, size, font, color })
        y -= LINE_HEIGHT + extraGap
      }

      drawLine(`Chapter ${chapter.chapter_number}`, 10, rgb(0.69, 0.69, 0.67), 4)
      drawLine(chapter.title, 18, rgb(0.1, 0.1, 0.09), 8)

      const content = getDisplayContent(chapter)
      const lines = wrapText(content, font, BODY_SIZE, maxWidth)

      for (const line of lines) {
        drawLine(line, BODY_SIZE, rgb(0.15, 0.15, 0.14))
      }
    }

    const pdfBytes = await pdfDoc.save()
    const storagePath = `${user.id}/${project_id}.pdf`

    const { error: uploadError } = await admin.storage
      .from('published-pdfs')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: signedUrlData, error: signedError } = await admin.storage
      .from('published-pdfs')
      .createSignedUrl(storagePath, 3600)

    if (signedError) throw signedError

    await admin.from('published_books').upsert({
      project_id,
      user_id: user.id,
      pdf_url: storagePath,
      cover_template_id,
      page_count: pageCount,
    })

    await admin
      .from('projects')
      .update({ cover_template_id, is_completed: true })
      .eq('id', project_id)

    return new Response(
      JSON.stringify({
        pdf_url: signedUrlData.signedUrl,
        storage_path: storagePath,
        page_count: pageCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
