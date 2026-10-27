import { Activity, AlertOctagon, LayoutGrid, Mail, ShieldCheck, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Overview", hint: "Health at a glance", icon: LayoutGrid },
  { href: "/pipelines", label: "Pipelines", hint: "Every run, every status", icon: Activity },
  { href: "/incidents", label: "Incidents", hint: "Investigate and remediate", icon: AlertOctagon },
  { href: "/notifications", label: "Notifications", hint: "Emails and escalations", icon: Mail },
  { href: "/data-validation", label: "Data Validation", hint: "Quality checks per table", icon: ShieldCheck },
];
