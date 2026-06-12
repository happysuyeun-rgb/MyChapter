import { Capacitor } from '@capacitor/core'
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

interface NativeBillingBridge {
  purchase: (productId: string) => Promise<PurchaseResult>
}

function getNativeBilling(): NativeBillingBridge | null {
  const bridge = (window as Window & { MyChapterBilling?: NativeBillingBridge }).MyChapterBilling
  return bridge ?? null
}

export function isBillingAvailable(): boolean {
  if (Capacitor.isNativePlatform()) {
    return getNativeBilling() !== null
  }
  return import.meta.env.DEV || import.meta.env.VITE_BILLING_DEV_MODE === 'true'
}

export async function purchasePro(): Promise<PurchaseResult> {
  if (Capacitor.isNativePlatform()) {
    const billing = getNativeBilling()
    if (!billing) {
      throw new BillingError(
        'NATIVE_UNAVAILABLE',
        '결제 모듈을 불러올 수 없어요. 앱을 업데이트해주세요.',
      )
    }
    return billing.purchase(PRO_PRODUCT_ID)
  }

  if (import.meta.env.DEV || import.meta.env.VITE_BILLING_DEV_MODE === 'true') {
    return {
      purchaseToken: `dev_${crypto.randomUUID()}`,
      productId: PRO_PRODUCT_ID,
      orderId: `dev_order_${Date.now()}`,
    }
  }

  throw new BillingError('WEB_UNAVAILABLE', '모바일 앱에서 결제해주세요.')
}
