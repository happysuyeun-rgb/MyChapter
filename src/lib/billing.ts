import { Capacitor, registerPlugin } from '@capacitor/core'
import { PRO_PRODUCT_ID } from '@/constants/billing'

export interface PurchaseResult {
  purchaseToken: string
  productId: string
  orderId: string
}

export class BillingError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/** Implemented by `android/.../MyChapterBillingPlugin.java`. */
interface MyChapterBillingPlugin {
  purchase(options: { productId: string; accountId?: string }): Promise<PurchaseResult>
  restore(): Promise<{ purchases: PurchaseResult[] }>
}

const MyChapterBilling = registerPlugin<MyChapterBillingPlugin>('MyChapterBilling')

function isWebDevBilling(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_BILLING_DEV_MODE === 'true'
}

function toBillingError(error: unknown, fallback: string): BillingError {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown }
  return new BillingError(
    typeof code === 'string' ? code : 'BILLING_FAILED',
    typeof message === 'string' && message ? message : fallback,
  )
}

export function isBillingAvailable(): boolean {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.isPluginAvailable('MyChapterBilling')
  }
  return isWebDevBilling()
}

export async function purchasePro(accountId?: string): Promise<PurchaseResult> {
  if (Capacitor.isNativePlatform()) {
    if (!Capacitor.isPluginAvailable('MyChapterBilling')) {
      throw new BillingError(
        'NATIVE_UNAVAILABLE',
        '결제 모듈을 불러올 수 없어요. 앱을 업데이트해주세요.',
      )
    }
    try {
      return await MyChapterBilling.purchase({ productId: PRO_PRODUCT_ID, accountId })
    } catch (error) {
      throw toBillingError(error, '결제에 실패했어요. 다시 시도해주세요.')
    }
  }

  if (isWebDevBilling()) {
    return {
      purchaseToken: `dev_${crypto.randomUUID()}`,
      productId: PRO_PRODUCT_ID,
      orderId: `dev_order_${Date.now()}`,
    }
  }

  throw new BillingError('WEB_UNAVAILABLE', '모바일 앱에서 결제해주세요.')
}

/** Active Pro subscriptions owned by the device's Google account. */
export async function restoreProPurchases(): Promise<PurchaseResult[]> {
  if (!Capacitor.isNativePlatform()) {
    throw new BillingError('WEB_UNAVAILABLE', '구독 복원은 모바일 앱에서 이용할 수 있어요.')
  }
  if (!Capacitor.isPluginAvailable('MyChapterBilling')) {
    throw new BillingError('NATIVE_UNAVAILABLE', '결제 모듈을 불러올 수 없어요. 앱을 업데이트해주세요.')
  }
  try {
    const { purchases } = await MyChapterBilling.restore()
    return purchases.filter((purchase) => purchase.productId === PRO_PRODUCT_ID)
  } catch (error) {
    throw toBillingError(error, '구매 내역을 불러오지 못했어요.')
  }
}
