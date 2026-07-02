import type { VercelRequest, VercelResponse } from "@vercel/node";
import { validateStripeEnvOnStartup } from "../_lib/stripe/env.js";

/**
 * Unified Stripe dispatcher (single Vercel Serverless Function).
 *
 * External URLs are preserved via rewrites in `vercel.json` that map each
 * public path to `/api/stripe/[action]?action=<key>`. This keeps the project
 * under the Vercel Hobby 12-function limit while leaving every public API
 * contract, Stripe webhook URL, and frontend fetch path unchanged.
 *
 * NOTE: `/api/stripe/webhook` is intentionally NOT routed here — it remains a
 * standalone function because it needs the raw request body for signature
 * verification and its URL is registered in the Stripe dashboard.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  validateStripeEnvOnStartup();

  const action = String(req.query.action ?? "");

  try {
    switch (action) {
      // Checkout
      case "create-checkout-session": {
        const { handleCreateCheckoutSession } = await import(
          "../_lib/handlers/stripe/createCheckoutSession.js"
        );
        return handleCreateCheckoutSession(req, res);
      }
      case "refund": {
        const { handleRefund } = await import("../_lib/handlers/stripe/refund.js");
        return handleRefund(req, res);
      }

      // Payments reconciliation
      case "payments-reconcile": {
        const { handlePaymentsReconcile } = await import(
          "../_lib/handlers/stripe/paymentsReconcile.js"
        );
        return handlePaymentsReconcile(req, res);
      }
      case "payments-reconcile-batch": {
        const { handlePaymentsReconcileBatch } = await import(
          "../_lib/handlers/stripe/paymentsReconcile.js"
        );
        return handlePaymentsReconcileBatch(req, res);
      }

      // Subscription
      case "subscription-checkout-session": {
        const { handleSubscriptionCheckoutSession } = await import(
          "../_lib/handlers/stripe/subscription.js"
        );
        return handleSubscriptionCheckoutSession(req, res);
      }
      case "subscription-reconcile": {
        const { handleSubscriptionReconcile } = await import(
          "../_lib/handlers/stripe/subscription.js"
        );
        return handleSubscriptionReconcile(req, res);
      }
      case "subscription-reconcile-batch": {
        const { handleSubscriptionReconcileBatch } = await import(
          "../_lib/handlers/stripe/subscription.js"
        );
        return handleSubscriptionReconcileBatch(req, res);
      }

      // Tips
      case "tips-create-checkout-session": {
        const { handleTipsCreateCheckoutSession } = await import(
          "../_lib/handlers/stripe/tips.js"
        );
        return handleTipsCreateCheckoutSession(req, res);
      }

      // Transfers
      case "transfers-process": {
        const { handleTransfersProcess } = await import(
          "../_lib/handlers/stripe/transfersProcess.js"
        );
        return await handleTransfersProcess(req, res);
      }

      // Connect
      case "connect-onboarding": {
        const { handleConnectOnboarding } = await import(
          "../_lib/handlers/stripe/connect.js"
        );
        return handleConnectOnboarding(req, res);
      }
      case "connect-dashboard-link": {
        const { handleConnectDashboardLink } = await import(
          "../_lib/handlers/stripe/connect.js"
        );
        return handleConnectDashboardLink(req, res);
      }
      case "connect-sync": {
        const { handleConnectSync } = await import(
          "../_lib/handlers/stripe/connect.js"
        );
        return handleConnectSync(req, res);
      }

      default:
        return res.status(404).json({ error: "Unknown stripe action." });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe action failed.";
    console.error(
      `[stripe.${action}]`,
      err instanceof Error ? err.stack ?? err.message : err,
    );
    return res.status(500).json({
      error: "Stripe action failed.",
      action,
      message,
      ...(process.env.NODE_ENV === "development" &&
      err instanceof Error &&
      err.stack
        ? { stack: err.stack }
        : {}),
    });
  }
}
