import Link from "next/link";
import { Mail } from "lucide-react";
import type { Notification } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { NOTIFICATION_STATUS_STYLES } from "@/lib/constants";

export function NotificationLinkCard({ notification }: { notification: Notification }) {
  return (
    <Card>
      <CardHeader title="Notification" description={notification.subject} icon={<Mail className="size-4" />} action={<StatusBadge style={NOTIFICATION_STATUS_STYLES[notification.status]} />} />
      <CardBody className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">To: {notification.recipient}</p>
        <Link href={`/notifications/${notification.id}`} className="text-xs font-medium text-accent-600 hover:text-accent-700">
          View notification →
        </Link>
      </CardBody>
    </Card>
  );
}
