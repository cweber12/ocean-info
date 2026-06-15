import type { LucideIcon } from "lucide-react";

export interface ReportEmptyValue {
  icon: LucideIcon;
  kind: "empty";
  text: string;
}

export interface ReportFilledValue {
  kind: "value";
  text: string;
}

export type ReportValue = ReportEmptyValue | ReportFilledValue;

export function filledValue(text: string): ReportFilledValue {
  return {
    kind: "value",
    text,
  };
}

export function emptyValue(icon: LucideIcon, text: string): ReportEmptyValue {
  return {
    icon,
    kind: "empty",
    text,
  };
}

export function ReportValueText({
  as = "strong",
  className,
  value,
}: {
  as?: "span" | "strong";
  className?: string;
  value: ReportValue;
}) {
  const Component = as;

  if (value.kind === "value") {
    return <Component className={className}>{value.text}</Component>;
  }

  const Icon = value.icon;
  const componentClassName = className
    ? `${className} report-value report-value--empty`
    : "report-value report-value--empty";

  return (
    <Component className={componentClassName}>
      <span className="report-value-empty-chip">
        <Icon aria-hidden="true" size={15} strokeWidth={2} />
        <span>{value.text}</span>
      </span>
    </Component>
  );
}

export function ReportState({
  className,
  detail,
  icon: Icon,
  title,
  variant = "panel",
}: {
  className?: string;
  detail?: string;
  icon: LucideIcon;
  title: string;
  variant?: "compact" | "panel";
}) {
  const componentClassName = className
    ? `${className} report-state report-state--${variant}`
    : `report-state report-state--${variant}`;

  return (
    <div className={componentClassName}>
      <span className="report-state-icon" aria-hidden="true">
        <Icon size={variant === "compact" ? 16 : 18} strokeWidth={2.1} />
      </span>
      <div className="report-state-copy">
        <strong>{title}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </div>
  );
}
