package com.mychapter.app;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Collections;
import java.util.List;

/**
 * Google Play subscription bridge for `src/lib/billing.ts`.
 * Server-side verification stays in the `verify-subscription` Edge Function.
 */
@CapacitorPlugin(name = "MyChapterBilling")
public class MyChapterBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private String pendingProductId;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build();
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null && billingClient.isReady()) {
            billingClient.endConnection();
        }
    }

    private interface ReadyCallback {
        void onReady();
    }

    private void withConnection(PluginCall call, ReadyCallback onReady) {
        if (billingClient.isReady()) {
            onReady.onReady();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    onReady.onReady();
                } else {
                    call.reject("결제 서비스에 연결하지 못했어요.", "BILLING_UNAVAILABLE");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Next call reconnects through withConnection.
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        String accountId = call.getString("accountId");
        if (productId == null || productId.isEmpty()) {
            call.reject("상품 정보가 없어요.", "INVALID_PRODUCT");
            return;
        }
        if (pendingPurchaseCall != null) {
            call.reject("이미 결제가 진행 중이에요.", "PURCHASE_IN_PROGRESS");
            return;
        }

        withConnection(call, () -> {
            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()))
                .build();

            billingClient.queryProductDetailsAsync(params, (result, detailsList) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK
                    || detailsList == null || detailsList.isEmpty()) {
                    call.reject("구독 상품을 찾을 수 없어요.", "PRODUCT_NOT_FOUND");
                    return;
                }

                ProductDetails details = detailsList.get(0);
                List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                if (offers == null || offers.isEmpty()) {
                    call.reject("구독 요금제를 찾을 수 없어요.", "OFFER_NOT_FOUND");
                    return;
                }

                BillingFlowParams.Builder flow = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details)
                            .setOfferToken(offers.get(0).getOfferToken())
                            .build()));
                if (accountId != null && !accountId.isEmpty()) {
                    flow.setObfuscatedAccountId(accountId);
                }

                pendingPurchaseCall = call;
                pendingProductId = productId;
                getActivity().runOnUiThread(() -> {
                    BillingResult launch = billingClient.launchBillingFlow(getActivity(), flow.build());
                    if (launch.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        rejectPending("결제 화면을 열지 못했어요.", "LAUNCH_FAILED");
                    }
                });
            });
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) return;

        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            rejectPending("결제를 취소했어요.", "USER_CANCELED");
            return;
        }
        if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            rejectPending("이미 구독 중이에요. 구매 복원하기를 눌러주세요.", "ALREADY_OWNED");
            return;
        }
        if (code != BillingClient.BillingResponseCode.OK || purchases == null) {
            rejectPending("결제에 실패했어요. 다시 시도해주세요.", "PURCHASE_FAILED");
            return;
        }

        for (Purchase purchase : purchases) {
            if (!purchase.getProducts().contains(pendingProductId)) continue;

            if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                rejectPending("결제가 승인 대기 중이에요. 완료되면 구매 복원하기를 눌러주세요.", "PURCHASE_PENDING");
                return;
            }
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                acknowledgeIfNeeded(purchase);
                PluginCall call = pendingPurchaseCall;
                String productId = pendingProductId;
                clearPending();
                call.resolve(toJs(purchase, productId));
                return;
            }
        }
        rejectPending("결제 결과를 확인하지 못했어요.", "PURCHASE_FAILED");
    }

    @PluginMethod
    public void restore(PluginCall call) {
        withConnection(call, () -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
            billingClient.queryPurchasesAsync(params, (result, purchases) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("구매 내역을 불러오지 못했어요.", "RESTORE_FAILED");
                    return;
                }
                JSArray items = new JSArray();
                for (Purchase purchase : purchases) {
                    if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
                    acknowledgeIfNeeded(purchase);
                    for (String productId : purchase.getProducts()) {
                        items.put(toJs(purchase, productId));
                    }
                }
                JSObject response = new JSObject();
                response.put("purchases", items);
                call.resolve(response);
            });
        });
    }

    /** Unacknowledged subscriptions are refunded by Google after 3 days. */
    private void acknowledgeIfNeeded(Purchase purchase) {
        if (purchase.isAcknowledged()) return;
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.getPurchaseToken())
            .build();
        billingClient.acknowledgePurchase(params, ack -> { });
    }

    private JSObject toJs(Purchase purchase, String productId) {
        JSObject item = new JSObject();
        item.put("purchaseToken", purchase.getPurchaseToken());
        item.put("productId", productId);
        item.put("orderId", purchase.getOrderId() == null ? "" : purchase.getOrderId());
        return item;
    }

    private void rejectPending(String message, String code) {
        PluginCall call = pendingPurchaseCall;
        clearPending();
        if (call != null) call.reject(message, code);
    }

    private void clearPending() {
        pendingPurchaseCall = null;
        pendingProductId = null;
    }
}
