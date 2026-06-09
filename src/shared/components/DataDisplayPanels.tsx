import type { ReactNode } from "react";

interface DataDisplayPanelProps {
  children: ReactNode;
  className?: string;
}

function getPanelClassName(baseClassName: string, className?: string) {
  return className ? `${baseClassName} ${className}` : baseClassName;
}

export function ChartPanel({ children, className }: DataDisplayPanelProps) {
  return <div className={getPanelClassName("chart-panel", className)}>{children}</div>;
}

export function DataPanel({ children, className }: DataDisplayPanelProps) {
  return <div className={getPanelClassName("data-panel", className)}>{children}</div>;
}
