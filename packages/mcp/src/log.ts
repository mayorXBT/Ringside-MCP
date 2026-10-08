export function redact(value: string) {
  let safe = value.replace(/api-key=[^&\s]+/gi, 'api-key=[redacted]');
  for (const secret of [process.env.HELIUS_API_KEY, process.env.API_KEY, process.env.RINGSIDE_PAIRING_TOKEN]) {
    if (secret && secret.length >= 4) safe = safe.split(secret).join('[redacted]');
  }
  return safe;
}

export function logError(message: string, error?: unknown) {
  const detail = error instanceof Error ? error.message : error === undefined ? '' : String(error);
  process.stderr.write(`[ringside] ${redact(message + (detail ? `: ${detail}` : ''))}\n`);
}
