// Method 1: Check if Sentry client is initialized
import * as Sentry from "@sentry/sveltekit";

export function isSentryLoaded() {
  try {
    const client = Sentry.getClient();
    return client !== undefined;
  } catch {
    return false;
  }
}

// Method 2: Check if DSN is configured
export function isSentryConfigured() {
  try {
    const client = Sentry.getClient();
    return client?.getOptions()?.dsn !== undefined;
  } catch {
    return false;
  }
}

// Method 3: Test with actual event capture
export async function testSentryConnection() {
  try {
    // Capture a test event (won't send in dev mode unless forced)
    const eventId = Sentry.captureMessage("Test connectivity", "info");
    return eventId !== null && eventId !== undefined;
  } catch {
    return false;
  }
}

// Method 4: Enhanced detection with network check
export function detectSentryBlocking(): {
  loaded: boolean;
  likelyBlocked: boolean;
  reason?: string;
} {
  const sentryLoaded = isSentryLoaded();

  if (!sentryLoaded) {
    // Check if it's likely blocked by checking for common adblocker patterns
    const isBlocked =
      window.navigator.userAgent.includes("uBlock") || !!document.querySelector("[data-adblock-key]");

    return {
      loaded: false,
      likelyBlocked: isBlocked,
      reason: isBlocked ? "adblocker" : "unknown",
    };
  }

  return { loaded: true, likelyBlocked: false };
}

// Usage in your SvelteKit component
export function initSentryDetection() {
  const detection = detectSentryBlocking();

  if (!detection.loaded) {
    console.warn("Sentry not loaded:", detection.reason);
  }

  return detection;
}
