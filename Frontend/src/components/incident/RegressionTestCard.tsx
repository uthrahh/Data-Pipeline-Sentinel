import { FlaskConical } from "lucide-react";
import type { RegressionTestCase } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-2.5 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-0.5 text-sm text-text-primary">{value}</p>
    </div>
  );
}

/**
 * Shown once an incident resolves (or otherwise reaches a final,
 * investigated state): proof this exact failure scenario is now a named
 * regression test, added to the CI/CD suite so a future deployment can't
 * silently reintroduce it.
 */
export function RegressionTestCard({ test }: { test: RegressionTestCase }) {
  return (
    <Card>
      <CardHeader
        title="Regression Test Suite"
        description={`${test.testId} — added to the CI/CD regression suite so this scenario is checked on every production deployment.`}
        icon={<FlaskConical className="size-4" />}
      />
      <CardBody className="py-1">
        <Row label="Scenario" value={test.scenario} />
        <Row label="Expected Behavior" value={test.expectedBehavior} />
        <Row label="Expected Classification" value={test.expectedClassification} />
        <Row label="Expected Workflow" value={test.expectedWorkflow} />
        <Row label="Expected Remediation" value={test.expectedRemediation} />
        <Row label="Expected Final State" value={test.expectedFinalState} />
      </CardBody>
    </Card>
  );
}
