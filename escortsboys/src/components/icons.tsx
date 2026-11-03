import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export const IconHeart = (p: P & { filled?: boolean }) => (
  <Base {...p} fill={p.filled ? 'currentColor' : 'none'}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Base>
);
export const IconSearch = (p: P) => <Base {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Base>;
export const IconPin = (p: P) => <Base {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" /><circle cx="12" cy="10" r="2.3" /></Base>;
export const IconClock = (p: P) => <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Base>;
export const IconCheckBadge = (p: P) => <Base {...p}><path d="M12 3l2.4 1.7 2.9-.2.9 2.8 2.3 1.8-1 2.8 1 2.8-2.3 1.8-.9 2.8-2.9-.2L12 21l-2.4-1.7-2.9.2-.9-2.8-2.3-1.8 1-2.8-1-2.8 2.3-1.8.9-2.8 2.9.2z" /><path d="m8.8 12.2 2.2 2.2 4.2-4.4" /></Base>;
export const IconCamera = (p: P) => <Base {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><circle cx="12" cy="12.5" r="3.5" /><path d="M8.5 6 10 4h4l1.5 2" /></Base>;
export const IconShare = (p: P) => <Base {...p}><path d="M12 15V3M8 7l4-4 4 4" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></Base>;
export const IconWhatsapp = (p: P) => <Base {...p}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c.3 1.8 1.7 3.6 3.5 4.5l1.2-1.1 1.8.8-.4 1.6c-3.4.2-6.6-3-6.6-6.6l1.6-.4.8 1.8z" /></Base>;
export const IconPhone = (p: P) => <Base {...p}><path d="M5 4h3.5l1.5 4-2 1.3a11 11 0 0 0 6.7 6.7L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" /></Base>;
export const IconSend = (p: P) => <Base {...p}><path d="M21 3 3 10.5l7 2.5 2.5 7z" /><path d="m10 13 4.5-4.5" /></Base>;
export const IconFlag = (p: P) => <Base {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Base>;
export const IconFilter = (p: P) => <Base {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Base>;
export const IconMenu = (p: P) => <Base {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Base>;
export const IconClose = (p: P) => <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>;
export const IconChevronLeft = (p: P) => <Base {...p}><path d="m15 5-7 7 7 7" /></Base>;
export const IconChevronRight = (p: P) => <Base {...p}><path d="m9 5 7 7-7 7" /></Base>;
export const IconExpand = (p: P) => <Base {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Base>;
export const IconUser = (p: P) => <Base {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></Base>;
export const IconShield = (p: P) => <Base {...p}><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z" /></Base>;
export const IconEye = (p: P) => <Base {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></Base>;
export const IconUpload = (p: P) => <Base {...p}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></Base>;
export const IconTrash = (p: P) => <Base {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Base>;
export const IconLogout = (p: P) => <Base {...p}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></Base>;
