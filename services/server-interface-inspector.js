import { ServerInterfaces } from "https://esm.sh/@spotware-web-team/sdk";

const sensitive = /token|secret|password|credential|email|login|traderid|groupid|clientmsgid|uuid|name/i;
const relevant = /position|order|reconcil|account|trader|execution|payload|server|data/i;

function safeValue(value, depth = 0, seen = new WeakSet()) {
  if (depth > 8) return "[MAX_DEPTH]";
  if (value === null || value === undefined) return value;
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 100).map(item => safeValue(item, depth + 1, seen));
  const output = {};
  for (const key of Object.keys(value).sort()) {
    output[key] = sensitive.test(key) ? "[REDACTED]" : safeValue(value[key], depth + 1, seen);
  }
  return output;
}

export function inspectServerInterfaces() {
  const rootKeys = Object.keys(ServerInterfaces || {}).sort();
  const relevantRootKeys = rootKeys.filter(key => relevant.test(key));
  const relevantInterfaces = {};
  for (const key of relevantRootKeys) {
    relevantInterfaces[key] = safeValue(ServerInterfaces[key]);
  }
  return {
    generatedAt: new Date().toISOString(),
    totalRootKeys: rootKeys.length,
    relevantRootKeys,
    relevantInterfaces
  };
}
