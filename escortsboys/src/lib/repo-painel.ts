import 'server-only';
import { read } from '@/lib/db/store';

/** Exportação dos dados do titular (LGPD, art. 18). Nunca inclui hash de senha nem sessões. */
export const exportUserData = (userId: string) =>
  read((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...user } = u;
    return {
      exportedAt: new Date().toISOString(),
      user,
      profile: db.profiles.find((p) => p.userId === userId) ?? null,
      ads: db.ads.filter((a) => a.ownerId === userId && a.status !== 'removed'),
      favorites: db.favorites.filter((f) => f.userId === userId),
      reportsSent: db.reports.filter((r) => r.reporterUserId === userId).map((r) => ({ id: r.id, adId: r.adId, reason: r.reason, status: r.status, createdAt: r.createdAt })),
    };
  });
