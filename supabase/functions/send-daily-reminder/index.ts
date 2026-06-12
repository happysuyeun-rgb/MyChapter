import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendFcmMessage } from '../_shared/fcm.ts'

function getKstTimeString(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}:00`
}

function getKstDayStartIso(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const date = formatter.format(new Date())
  return new Date(`${date}T00:00:00+09:00`).toISOString()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET')
    const authHeader = req.headers.get('Authorization')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const firebaseJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const currentTime = getKstTimeString()
    const todayStart = getKstDayStartIso()

    const { data: users, error: usersError } = await admin
      .from('users')
      .select('id, notification_time')
      .eq('notification_enabled', true)

    if (usersError) throw usersError

    const targetUsers = (users ?? []).filter((user) => {
      const time = user.notification_time?.slice(0, 8) ?? '21:00:00'
      return time.slice(0, 5) === currentTime.slice(0, 5)
    })

    let sent = 0
    let skipped = 0

    for (const user of targetUsers) {
      const { data: projects } = await admin
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)

      const project = projects?.[0]
      if (!project) {
        skipped++
        continue
      }

      const { count } = await admin
        .from('records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('project_id', project.id)
        .eq('is_draft', false)
        .gte('created_at', todayStart)

      if ((count ?? 0) > 0) {
        skipped++
        continue
      }

      const { data: tokens } = await admin
        .from('device_tokens')
        .select('fcm_token')
        .eq('user_id', user.id)

      const title = '오늘의 질문이 도착했어요 ✍️'
      const body = '잠깐, 오늘 하루를 기록해볼까요?'
      const link = '/record/mode'

      if (firebaseJson && firebaseProjectId && tokens?.length) {
        for (const { fcm_token } of tokens) {
          const ok = await sendFcmMessage(
            firebaseJson,
            firebaseProjectId,
            fcm_token,
            title,
            body,
            link,
          )
          if (ok) sent++
        }
      }

      await admin.from('notifications').insert({
        user_id: user.id,
        type: 'daily_question',
        title,
        body,
        link,
      })
    }

    return new Response(
      JSON.stringify({
        target_users: targetUsers.length,
        push_sent: sent,
        skipped,
        checked_at: currentTime,
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
