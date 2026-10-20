> Live version: https://triport.io/docs/guides/referral

# Referral

> A transparent, automated interface for your affiliate revenue share — track referred users from first click to finalized payout, generate custom routing links, and earn a recurring 10% on every payment.

| | |
|---|---|
| **Method / Endpoint** | `n/a — dashboard guide` |
| **Network** | — |
| **Required scope** | — |
| **Tier / rate limit** | All tiers |

The **Referral** tab provides a transparent, automated interface for managing your affiliate revenue share. Designed for developers, infrastructure partners, and content creators, this dashboard tracks the complete lifecycle of your referred users—from initial click to finalized payout—without requiring manual accounting or external tracking software.

## 1. Dashboard Navigation

The interface is structurally divided into three primary sub-tabs to separate real-time metrics from historical logs:

* **Overview:** The main control panel displaying current financial metrics, link generation tools, the workflow breakdown, and your invitee ledger.
* **History:** An immutable ledger detailing the specific sign-up timestamps and individual payment events attributed to your referral link.
* **Payouts:** A complete, auditable record of your past withdrawal requests and completed settlements routed to your connected Web3 wallet.

## 2. Financial Overview Metrics

The top panel delivers a real-time snapshot of your affiliate performance, categorizing your revenue into distinct settlement stages to ensure financial predictability:

* **Available:** The exact USD-equivalent amount of funds that have cleared the settlement period and are immediately ready to withdraw. You can initiate a transfer using the adjacent "Withdraw" button.
* **Pending:** Revenue that has been successfully tracked from referred user payments but is currently undergoing processing. This standard clearing window exists to verify fiat transactions and prevent chargeback fraud before funds are released.
* **Lifetime Earned:** An aggregate counter of the total revenue generated through your account since registration, providing a macroscopic view of your historical affiliate performance.
* **Total Invitees:** The absolute number of unique users (e.g., 3 Users invited) who have successfully registered an active Triport account using your specific routing link.

## 3. Link Distribution and Custom Routing

Triport replaces complex tracking UUIDs with customizable routing parameters to improve conversion rates and trust when embedding links in documentation or repositories.

* **Your Referral Link:** The system automatically generates a secure, hash-based URL (e.g., `https://triport.io/?ref=48931...`) tied directly to your account. The interface confirms your active status, displaying your current Tier ("regular") and your guaranteed Reward rate (10%).
* **Custom Slug:** To improve link readability, you can override the default tracking hash with a unique, human-readable identifier (e.g., `alice` or `your-protocol`). Entering this into the input field and clicking "Save" instantly updates your core routing URL.

## 4. Reward Mechanics Workflow

The Triport referral engine operates deterministically through an automated three-step lifecycle, as visualized in the "How it works" section:

1. **Share your link:** Distribute your unique URL to friends and colleagues. Triport uses secure tracking parameters to attribute clicks to your account.
2. **They sign up:** Users who navigate through your link and register are permanently mapped to your affiliate profile.
3. **You earn:** You receive a flat **10% revenue share** on every payment the referred user makes. This is a recurring reward applied to their initial purchase and all subsequent renewals.

## 5. Invitee Tracking & Attribution

The lower section of the Overview tab provides granular visibility into your acquisition funnel:

* **Invitees Table:** A real-time ledger displaying the masked User ID or name (e.g., `3JVvYs...ipQ9`), the exact Date they Signed Up, the Total Paid volume associated with their account, and their current Status (e.g., "Signed up").
* **Your Inviter:** A transparent record indicating the specific entity or user whose referral link you originally used to register your own Triport account.

## Frequently Asked Questions

**Q: What is the difference between "Pending" and "Available" funds?**
**A:** When a referred user successfully makes a payment, your 10% revenue share is immediately tracked and placed into the "Pending" ledger. This represents a standard security clearing window required to verify fiat transactions and prevent chargeback fraud. Once the clearing period concludes, the funds automatically transition to your "Available" balance, indicating they are fully liquid and ready for withdrawal.

**Q: Is the 10% referral reward a one-time payout?**
**A:** No. The Triport referral architecture provides a recurring revenue share. You receive 10% of *every* payment the referred user makes. This applies to their initial subscription purchase and all subsequent monthly or annual renewals for as long as their account remains on a paid tier.

**Q: If I change my "Custom slug", what happens to my previous referral links?**
**A:** When you save a new custom slug, your core routing URL is instantly updated in the database. Any previous custom slugs will be invalidated and will no longer attribute clicks to your account. You must update your documentation, GitHub repositories, and social channels with the newly generated link to ensure uninterrupted tracking. Your underlying hash-based URL, however, remains permanently active.

**Q: How are withdrawals processed?**
**A:** Once your revenue clears into the "Available" balance, you can initiate a transfer by clicking the "Withdraw" button in the Overview panel. Payouts are executed on-chain and settled directly to your connected Web3 wallet. You can audit the history of these settlements in the **Payouts** sub-tab.

**Q: Can a referral link be applied retroactively if a user forgot to use it during registration?**
**A:** No. To ensure deterministic tracking and prevent attribution disputes, the referral link must be utilized at the exact time of account creation. The system permanently maps the invitee to your affiliate profile exclusively during the initial sign-up event.
