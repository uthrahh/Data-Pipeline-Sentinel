"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, PlayCircle } from "lucide-react";
import type { Incident } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { runDataQualityRemediation } from "@/lib/incidentStore";
import { createNotificationFromIncident } from "@/lib/notificationStore";

/**
 * The Data Quality Breach's own two-button decision (spec section 7): run
 * anyway (always lands on SUCCESS - PARTIAL, never a clean RESOLVED, since
 * the DQ issue is recorded rather than silently dropped) or draft a
 * notification instead. Only rendered while WAITING_APPROVAL and no
 * notification has been drafted yet — once one exists, the incident page
 * just links to it (NotificationLinkCard) and the Notification tab is where
 * the actual send/reject decision happens.
 */
export function DataQualityDecisionPanel({ incident }: { incident: Incident }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);

  return (
    <Card>
      <CardHeader
        title="Data Quality Breach — decision required"
        description="Run despite the known DQ issue, or notify the data owner instead."
        icon={<Mail className="size-4" />}
      />
      <CardBody className="flex flex-wrap gap-2.5">
        <Button
          variant="primary"
          isLoading={isRunning}
          onClick={() => {
            setIsRunning(true);
            runDataQualityRemediation(incident.incidentId);
          }}
        >
          <PlayCircle className="size-3.5" />
          Run / Remediate
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const notification = createNotificationFromIncident(incident, "DATA_QUALITY_BREACH");
            router.push(`/notifications/${notification.id}`);
          }}
        >
          <Mail className="size-3.5" />
          Send Email
        </Button>
      </CardBody>
    </Card>
  );
}
