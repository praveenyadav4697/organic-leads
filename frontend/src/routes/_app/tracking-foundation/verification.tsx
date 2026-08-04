import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav } from "@/modules/tracking-foundation/components";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";

export const Route = createFileRoute("/_app/tracking-foundation/verification")({
  head: () => ({ meta: [{ title: "Verification Status | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Verification Status">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <VerificationPanel />
      </div>
    </ErrorBoundary>
  ),
});

function VerificationPanel() {
  const [activeTab, setActiveTab] = useState<"scripts" | "forms" | "routing" | "consent">("scripts");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View the verification status of your tracking scripts, forms, routing destinations, and consent configurations.
            </p>
            
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Tracking Scripts", value: "scripts" },
                { label: "Forms", value: "forms" },
                { label: "Routing Destinations", value: "routing" },
                { label: "Consent Configuration", value: "consent" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as typeof activeTab)}
                  className={`p-3 text-center rounded-lg border transition-colors ${
                    activeTab === tab.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-muted-foreground/20 hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-sm">{tab.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {activeTab === "scripts" && "Tracking scripts verification status and health check results."}
                {activeTab === "forms" && "Form validation and field verification status."}
                {activeTab === "routing" && "Form submission destination verification status."}
                {activeTab === "consent" && "Cookie consent configuration verification status."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
