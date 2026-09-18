import { getServerData } from "https://esm.sh/@spotware-web-team/sdk";
import { take } from "https://esm.sh/rxjs/operators";

function once(observable, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    let done = false;
    let subscription;

    const timer = setTimeout(() => {
      if (done) return;

      done = true;
      subscription?.unsubscribe?.();

      reject(
        new Error(
          `Request timed out after ${timeoutMs / 1000} seconds`
        )
      );
    }, timeoutMs);

    subscription = observable
      .pipe(take(1))
      .subscribe({
        next: value => {
          if (done) return;

          done = true;
          clearTimeout(timer);
          resolve(value);
        },

        error: error => {
          if (done) return;

          done = true;
          clearTimeout(timer);
          reject(error);
        },

        complete: () => {
          if (done) return;

          done = true;
          clearTimeout(timer);

          reject(
            new Error("Completed without a response")
          );
        }
      });
  });
}

const mask =
  /token|secret|password|credential|email|login|traderid|groupid|clientmsgid|uuid|name/i;

export function sanitizeProbe(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeProbe);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        mask.test(key)
          ? "[REDACTED]"
          : sanitizeProbe(item)
      ])
    );
  }

  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);
      return JSON.stringify(sanitizeProbe(parsedValue));
    } catch {
      return value;
    }
  }

  return value;
}

export const probePresets = Object.freeze([
  {
    label: "Empty object",
    data: "{}"
  },
  {
    label: "Positions",
    data: JSON.stringify({
      resource: "positions"
    })
  },
  {
    label: "Orders",
    data: JSON.stringify({
      resource: "orders"
    })
  },
  {
    label: "Account snapshot",
    data: JSON.stringify({
      resource: "accountSnapshot"
    })
  },
  {
    label: "Reconcile",
    data: JSON.stringify({
      resource: "reconcile"
    })
  }
]);

export async function runServerDataProbe(adapter, data) {
  const startedAt = new Date().toISOString();

  try {
    const response = await once(
      getServerData(adapter, { data }),
      12000
    );

    return {
      startedAt,
      request: data,
      ok: true,
      response: sanitizeProbe(response)
    };
  } catch (error) {
    return {
      startedAt,
      request: data,
      ok: false,
      error: String(error?.message || error)
    };
  }
}
