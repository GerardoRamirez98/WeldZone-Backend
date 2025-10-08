// src/supabase/storage.utils.ts
export function parseSupabasePublicUrl(
  publicUrl?: string,
): { bucket: string; path: string } | null {
  if (!publicUrl) return null;

  try {
    const u = new URL(publicUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const publicIdx = parts.findIndex((p) => p === 'public');
    if (publicIdx === -1 || !parts[publicIdx + 1]) return null;

    const bucket = parts[publicIdx + 1];
    const pathParts = parts.slice(publicIdx + 2);
    const path = pathParts.join('/');
    return { bucket, path };
  } catch {
    return null;
  }
}
