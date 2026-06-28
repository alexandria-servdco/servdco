import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? "");

  try {
    switch (action) {
      case "waitlist": {
        const { handleWaitlistSubmit } = await import("../_lib/handlers/waitlistSubmit.js");
        return handleWaitlistSubmit(req, res);
      }
      case "enforce": {
        const { handleSecurityEnforce } = await import("../_lib/handlers/securityEnforce.js");
        return handleSecurityEnforce(req, res);
      }
      case "announcements": {
        const { handlePlatformAnnouncements } = await import(
          "../_lib/handlers/platformAnnouncements.js"
        );
        return handlePlatformAnnouncements(req, res);
      }
      case "careers-application-notify": {
        const { handleCareersApplicationNotify } = await import(
          "../_lib/handlers/careersApplicationNotify.js"
        );
        return handleCareersApplicationNotify(req, res);
      }
      case "launch-resolve": {
        const { handleLaunchResolve } = await import("../_lib/handlers/launchResolve.js");
        return handleLaunchResolve(req, res);
      }
      case "launch-sync-user": {
        const { handleLaunchSyncUser } = await import("../_lib/handlers/launchResolve.js");
        return handleLaunchSyncUser(req, res);
      }
      case "launch-lifecycle": {
        const { handleLaunchLifecycle } = await import("../_lib/handlers/launchLifecycle.js");
        return handleLaunchLifecycle(req, res);
      }
      case "launch-auto-check": {
        const { handleLaunchAutoCheck } = await import("../_lib/handlers/launchLifecycle.js");
        return handleLaunchAutoCheck(req, res);
      }
      case "location-reverse": {
        const { handleLocationReverse } = await import(
          "../_lib/handlers/locationReverse.js"
        );
        return handleLocationReverse(req, res);
      }
      case "location-update": {
        const { handleLocationUpdate } = await import(
          "../_lib/handlers/locationUpdate.js"
        );
        return handleLocationUpdate(req, res);
      }
      case "contact-submit": {
        const { handleContactSubmit } = await import(
          "../_lib/handlers/contactSubmit.js"
        );
        return handleContactSubmit(req, res);
      }
      case "document-submit-notify": {
        const { handleDocumentSubmitNotify } = await import(
          "../_lib/handlers/documentSubmitNotify.js"
        );
        return handleDocumentSubmitNotify(req, res);
      }
      case "booking-event": {
        const { handleBookingEventEmail } = await import(
          "../_lib/handlers/bookingEventEmail.js"
        );
        return handleBookingEventEmail(req, res);
      }
      default:
        return res.status(404).json({ error: "Unknown platform action." });
    }
  } catch (err) {
    console.error(
      `[platform.${action}]`,
      err instanceof Error ? err.stack ?? err.message : err,
    );
    return res.status(500).json({ error: "Platform action failed." });
  }
}
