const SECRET_PATTERNS = [/sk-[A-Za-z0-9_\-*.]{8,}/g, /fal[_-]sk[_-][A-Za-z0-9_:\-*.]{8,}/gi];

/** Strips API-key-looking strings so provider errors can be stored and returned safely. */
export function redactSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((out, pattern) => out.replace(pattern, '[redacted]'), text);
}
