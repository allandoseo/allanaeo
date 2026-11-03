'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className="flex h-12 w-full items-center justify-center rounded bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark disabled:opacity-70">
      {pending ? pendingText : children}
    </button>
  );
}
