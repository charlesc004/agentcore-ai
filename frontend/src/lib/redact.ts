const privateKey =
  /password|secret|authorization|api.?key|access.?token|refresh.?token/i;
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        privateKey.test(key) ? "[REDACTED]" : redact(item),
      ]),
    );
  return value;
}
