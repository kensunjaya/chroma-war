'use client';
import { Breakpoint } from '@/interfaces/Types';
import { useState, useEffect } from 'react';

export const  getTailwindBreakpoint = () : Breakpoint => {
  const width = window.innerWidth;
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  return 'xl';
}


export function useTailwindBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs'); // Safe default

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getTailwindBreakpoint());
    };

    updateBreakpoint();

    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}