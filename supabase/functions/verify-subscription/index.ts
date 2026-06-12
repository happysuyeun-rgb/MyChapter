import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PRODUCT_ID = 'mychapter_pro_monthly'

async function verifyWithGooglePlay(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string,
  serviceAccountJson: string,
): Promise<{ valid: boolean; expiryTimeMillis?: string }> {
  const credentials = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)

  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const encoder = new TextEncoder()
  const toBase64Url = (value: string) =>
    btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const importKey = async (pem: string) => {
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')
    const binary = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))
    return crypto.subtle.importKey(
      'pkcs8',
      binary,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )
  }

  const key = await importKey(credentials.private_key)
  const unsigned = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(claim))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsigned),
  )
  const jwt = `${unsigned}.${toBase64Url(String.fromCharCode(...new Uint8Array(signature)))}`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Google OAuth token request failed')
  }

  const { access_token: accessToken } = await tokenResponse.json()

  const verifyUrl =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`

  const verifyResponse = await fetch(verifyUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!verifyResponse.ok) {
    return { valid: false }
  }

  const data = await verifyResponse.json()
  const paymentState = data.paymentState
  const valid = paymentState === 1 || paymentState === 2

  return { valid, expiryTimeMillis: data.expiryTimeMillis }
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

    const { purchase_token, product_id, order_id } = await req.json()

    if (!purchase_token || !product_id) {
      return new Response(JSON.stringify({ error: 'Missing purchase data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (product_id !== PRODUCT_ID) {
      return new Response(JSON.stringify({ error: 'Invalid product' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!

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

    const devBypass = Deno.env.get('BILLING_DEV_BYPASS') === 'true'
    const isDevToken = purchase_token.startsWith('dev_')

    let expiresAt: string | null = null

    if (isDevToken) {
      if (!devBypass) {
        return new Response(JSON.stringify({ error: 'Dev billing not enabled' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const expiry = new Date()
      expiry.setMonth(expiry.getMonth() + 1)
      expiresAt = expiry.toISOString()
    } else {
      const serviceAccountJson = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')
      const packageName = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') ?? 'com.mychapter.app'

      if (!serviceAccountJson) {
        return new Response(JSON.stringify({ error: 'Billing not configured' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const result = await verifyWithGooglePlay(
        packageName,
        product_id,
        purchase_token,
        serviceAccountJson,
      )

      if (!result.valid) {
        return new Response(JSON.stringify({ error: 'Invalid purchase', code: 'INVALID_PURCHASE' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (result.expiryTimeMillis) {
        expiresAt = new Date(Number(result.expiryTimeMillis)).toISOString()
      }
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await admin
      .from('subscriptions')
      .update({
        plan: 'pro',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        play_purchase_token: purchase_token,
        play_order_id: order_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) throw error

    return new Response(JSON.stringify({ plan: 'pro', expires_at: expiresAt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
