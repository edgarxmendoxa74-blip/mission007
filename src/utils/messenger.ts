// Accepts a Facebook Page username, numeric Page ID, or a pasted
// facebook.com / m.me URL, and returns just the page identifier.
export const normalizeMessengerPageId = (input: string): string => {
  let value = (input || '').trim();
  if (!value) return '';

  value = value.replace(/^https?:\/\//i, '').replace(/^(www\.|m\.|web\.)/i, '');

  const profileIdMatch = value.match(/profile\.php\?id=(\d+)/i);
  if (profileIdMatch) return profileIdMatch[1];

  value = value
    .replace(/^(facebook\.com|fb\.com|me|messenger\.com\/t)\//i, '')
    .replace(/^@/, '');

  return value.split(/[/?#]/)[0];
};

export const buildMessengerUrl = (pageId: string, message?: string): string | null => {
  const id = normalizeMessengerPageId(pageId);
  if (!id) return null;
  const base = `https://m.me/${encodeURIComponent(id)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
