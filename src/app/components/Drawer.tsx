'use client';

import { useEffect } from 'react';

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  widthClass?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
};

export default function Drawer({ open, onClose, side = 'right', widthClass = 'w-[420px]', children, ariaLabel = 'Panel' }: DrawerProps) {
  useEffect(() => {
    // lock body scroll when open
    document.body.style.overflow = open ? 'hidden' : 'unset';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const isRight = side === 'right';

  return (
    <>
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        aria-label={ariaLabel}
        className={`fixed top-0 bottom-0 z-50 bg-white shadow-2xl ${widthClass} flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : isRight ? 'translate-x-full' : '-translate-x-full'
        } ${isRight ? 'right-0 left-auto' : 'left-0 right-auto'}`}
      >
        {children}
      </aside>
    </>
  );
}
