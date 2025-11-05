"use client";

import type { ReactNode } from 'react';

interface LoadingIndicatorProps {
  label?: string;
  children?: ReactNode;
}

export function LoadingIndicator({ label = 'Loading...', children }: LoadingIndicatorProps) {
  return <span className="loading-state">{children ?? label}</span>;
}
