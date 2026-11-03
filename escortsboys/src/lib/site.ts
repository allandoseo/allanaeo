export const SITE_NAME = 'EscortsBoys';
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
