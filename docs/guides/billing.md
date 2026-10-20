> Live version: https://triport.io/docs/guides/billing

# Billing

> The Billing tab is the financial control center for your Triport infrastructure — flat-rate subscriptions, dual-rail (fiat + crypto) payments, and auto-recharge to keep your API endpoints funded with zero downtime.

| | |
|---|---|
| **Method / Endpoint** | `n/a — dashboard guide` |
| **Payment networks** | Solana \| Ethereum \| Polygon \| BSC \| Tron _(crypto payment rails — not the RPC chain set)_ |
| **Required scope** | — |
| **Tier / rate limit** | All tiers |

The **Billing** tab operates as the financial control center for your Triport infrastructure. Designed for both traditional enterprise accounting and Web3-native treasury management, this interface provides transparent subscription tracking, flexible dual-rail payment options, and automated funding mechanisms to ensure zero downtime for your API endpoints.

## 1. Account Balance & Subscription Management

Triport utilizes a predictable, flat-rate subscription model. The upper section of the Billing tab provides immediate visibility into your current financial standing and active tier limits.

* **Quick Plan Selection:** The dashboard displays your available billing tiers (e.g., Basic, Pro, Business) as selectable cards. Clicking a tier automatically populates the invoice details with the correct monthly or quarterly fiat amount (e.g., $249.00/mo for Pro).
* **Current Balance:** Located in the top right, this widget displays your exact prepaid balance available in USD equivalent. This balance is drawn down at the start of your billing cycle based on your active Plan. You can manually add funds to this balance at any time using the "+" button.
* **Auto-Recharge:** A critical operational safeguard for production environments. By enabling the "Auto-recharge is on" toggle, Triport will automatically initiate a payment from your designated default payment method before your subscription expires or your balance depletes. This prevents automated system suspensions and ensures your applications never experience API HTTP 401/402 rejections due to missed invoices.

## 2. Dual-Rail Payment Methods

To accommodate diverse corporate structures, Triport bridges traditional SaaS billing with decentralized finance. The left-hand menu under the "Pay Invoice" sub-tab allows you to seamlessly switch between fiat and cryptographic payment rails:

* **Card Payment (Stripe):** Secure, traditional credit and debit card processing. This rail is ideal for enterprise clients requiring predictable monthly auto-billing, standard corporate expense tracking, and immediate transaction settlement.
* **Crypto Wallet (Popular):** A strictly on-chain payment flow. This allows decentralized protocols, DAOs, and crypto-native developers to fund their infrastructure directly from their operational treasuries using a browser extension wallet.
* **Crypto Transfer:** For payments originating from centralized exchanges (e.g., Binance, Coinbase) or hardware wallets. This generates a deterministic receiving address tied to your account for manual transfers, with an estimated settlement time of 1–30 minutes.
* **Balance:** Allows you to deduct the invoice amount directly from your existing prepaid Triport balance (e.g., deducting from $248.75 available).

## 3. Cryptocurrency Integration & Settlement

The center panel acts as the checkout configuration interface. The crypto payment gateway is highly versatile, supporting major assets routed across highly liquid networks.

* **Currency & Network Selection:** You can specify the exact asset you wish to spend (USDC, USDT, or SOL) and select the underlying transport network (Solana, Ethereum, Polygon, BSC, or Tron).
* **Direct Wallet Execution:** When using the "Crypto Wallet" method, the interface displays your connected Web3 wallet address. The system automatically calculates the required token amount to match the USD invoice value (e.g., $249.00 USD ≈ 249.00 USDC).
* **Settlement Tracking:** The checkout summary provides an estimated execution time (e.g., ~10–30 sec for Solana). Clicking the "Pay with Wallet" button triggers a signature request in your browser wallet. Settlement and balance updates occur automatically once the transaction is confirmed on-chain.

## 4. Security, History & Accounting Compliance

The interface is built to satisfy strict enterprise compliance and security standards.

* **Bank-Level Security:** The bottom-left panel confirms that all fiat transactions are processed via Stripe with 256-bit SSL encryption and are fully PCI DSS compliant. Triport never stores your raw credit card data.
* **Invoice History:** The **History** sub-tab acts as your immutable financial ledger. You can monitor the real-time status of all account funding attempts, clearly distinguishing between pending network confirmations, successful settlements, and failed card charges.
* **Downloadable Receipts:** From the History tab, you can generate and download standardized, itemized receipts for every payment. These documents include all necessary corporate data (date, amount, payment rail, and applied services) required by your accounting department to reconcile infrastructure expenses.

## Frequently Asked Questions

**Q: How does the "Auto-recharge" feature work exactly?**
**A:** When enabled, Auto-recharge monitors your Current Balance. If your balance drops below the amount required to renew your active Plan at the end of the billing cycle, the system automatically initiates a charge to your default saved fiat card (via Stripe) to prevent your API keys from being rate-limited or suspended.

**Q: I sent a manual Crypto Transfer. Why isn't my balance updated yet?**
**A:** Manual crypto transfers require a specific number of block confirmations on their respective networks before they are considered fully settled. For example, Solana transfers typically settle in 10–30 seconds, while Ethereum or Tron transfers may take several minutes depending on current network congestion. Once the transaction is finalized on-chain, your Triport balance will update automatically.

**Q: Can I pay with a cryptocurrency other than USDC, USDT, or SOL?**
**A:** Yes. While USDC, USDT, and SOL are highlighted for multi-chain efficiency, the Triport crypto checkout gateway supports over 100 cryptocurrencies. When you initiate a payment, the system will automatically calculate the current USD-equivalent exchange rate for your selected asset.

**Q: Are my credit card details secure?**
**A:** Yes. Triport does not store, process, or transmit your raw credit card data. All fiat transactions are handled directly by Stripe, a fully PCI DSS compliant, bank-level secure payment processor. Triport only receives a secure cryptographic token to authorize the billing.

**Q: Where can I find invoices for my accounting department?**
**A:** Navigate to the **History** sub-tab within the Billing page. Here, you can view the status of all past transactions and download standardized, itemized PDF receipts that include the payment rail, date, and applied service tier for your corporate accounting records.
