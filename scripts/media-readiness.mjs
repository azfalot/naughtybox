export async function readMediaManifest(url, { timeoutMs = 4000 } = {}) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return '';
    return await response.text();
  } catch (error) {
    if (error?.name === 'TimeoutError') return '';
    throw error;
  }
}
