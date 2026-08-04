import { useState, useEffect, useMemo } from "react";
import {
  Gauge,
  Monitor,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Link,
  Play,
  Settings,
  RefreshCw,
  Download,
  Search,
  Filter,
  Eye,
  Copy,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  Mail,
  Globe,
  Zap,
  BarChart3,
  TrendingUp,
  Users,
  Bug,
  Info,
  AlertCircle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trackingApi } from "./services";
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import type {
  TrackingScript,
  ConsentConfiguration,
  FormValidation,
  SubmissionDestination,
  EventTest,
  TrackingAuditLog,
  DashboardStats,
  TrackingProvider,
  TrackingStatus,
  VerificationStatus,
  HealthStatus,
  ConsentStatus,
  EventType,
  MeasurementPlan,
  FormSubmission,
  FormSubmissionStatus,
} from "./types";
import { trackingFoundationNav, getStatusColor } from "./nav";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

function StatusIndicator({ status }: { status: string }) {
  const colorClass = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colorClass}`}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

function ErrorBoundaryWrapper({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary name={name}>
      {children}
    </ErrorBoundary>
  );
}

export function TrackingFoundationNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-2">
      <nav role="tablist" aria-label="Tracking Foundation" className="flex flex-wrap items-center gap-1.5">
        {trackingFoundationNav.map((item) => (
          <RouterLink
            key={item.to}
            to={item.to}
            role="tab"
            aria-selected={path === item.to}
            className={`inline-flex h-10 items-center rounded-xl border px-3.5 text-sm font-medium whitespace-nowrap transition ${path === item.to ? "border-transparent bg-gradient-to-r from-primary/12 to-accent/8 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]" : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/40 hover:text-foreground"}`}
          >
            {item.label}
          </RouterLink>
        ))}
      </nav>
    </div>
  );
}

export function OverviewDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.dashboard.getStats("default");
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: "Tracking Scripts", value: stats?.total_tracking_scripts ?? 0, icon: Monitor, color: "text-primary" },
    { label: "Active Scripts", value: stats?.active_scripts ?? 0, icon: CheckCircle2, color: "text-success" },
    { label: "Verified Scripts", value: stats?.verified_scripts ?? 0, icon: ShieldCheck, color: "text-info" },
    { label: "Healthy Scripts", value: stats?.healthy_scripts ?? 0, icon: TrendingUp, color: "text-success" },
    { label: "Forms Discovered", value: stats?.total_forms ?? 0, icon: FileText, color: "text-primary" },
    { label: "Valid Forms", value: stats?.valid_forms ?? 0, icon: CheckCircle2, color: "text-success" },
    { label: "Destinations", value: stats?.total_destinations ?? 0, icon: Link, color: "text-primary" },
    { label: "Reachable", value: stats?.reachable_destinations ?? 0, icon: Globe, color: "text-success" },
    { label: "Event Tests", value: stats?.total_event_tests ?? 0, icon: Play, color: "text-primary" },
    { label: "Successful Tests", value: stats?.successful_tests ?? 0, icon: CheckCircle, color: "text-success" },
    { label: "Audit Logs", value: stats?.audit_log_count ?? 0, icon: Settings, color: "text-muted-foreground" },
    { label: "Overall Health", value: stats?.overall_health ?? "unknown", icon: Gauge, color: stats?.overall_health === "healthy" ? "text-success" : "text-warning" },
  ];

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {cards.map((card) => {
            const Icon = card.icon as LucideIcon;
            return (
              <Card key={card.label} className="p-4">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  {card.label}
                  <Icon className={`size-3.5 ${card.color}`} />
                </div>
                <div className="text-2xl font-semibold mt-2">{String(card.value)}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TrackingScriptsTable() {
  const [scripts, setScripts] = useState<TrackingScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.scripts.list("default");
        setScripts(data);
      } catch {
        setScripts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query) return scripts;
    const q = query.toLowerCase();
    return scripts.filter(
      (s) =>
        s.provider.toLowerCase().includes(q) ||
        s.tracking_id.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
    );
  }, [scripts, query]);

  const handleVerify = async (scriptId: string) => {
    try {
      await trackingApi.scripts.verify("default", scriptId, true);
      const data = await trackingApi.scripts.list("default");
      setScripts(data);
    } catch {
      // keep existing state
    }
  };

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Tracking Scripts</p>
          <p className="text-xs text-muted-foreground mt-1">Discovered tracking scripts from WordPress connector</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search scripts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 rounded-xl h-9 w-56"
            />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => setLoading(true)}>
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                  No tracking scripts found. Run a scan to discover scripts.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((script) => (
                <TableRow key={script.id}>
                  <TableCell className="font-medium">{script.provider}</TableCell>
                  <TableCell><code className="text-xs bg-muted/30 px-2 py-1 rounded">{script.tracking_id}</code></TableCell>
                  <TableCell><StatusIndicator status={script.status} /></TableCell>
                  <TableCell><StatusIndicator status={script.verification_status} /></TableCell>
                  <TableCell><StatusIndicator status={script.health_status} /></TableCell>
                  <TableCell>{script.installation_method || "—"}</TableCell>
                  <TableCell>{script.detected_version || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => handleVerify(script.id)}>
                        <RefreshCw className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function FormsDiscoveryTable() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.forms.list("default");
        setForms(data);
      } catch {
        setForms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleValidate = async (formId: string) => {
    try {
      await trackingApi.forms.validate("default", formId, true);
    } catch {
      // keep existing state
    }
  };

  const handleTest = async (formId: string) => {
    try {
      await trackingApi.forms.test("default", formId);
    } catch {
      // keep existing state
    }
  };

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Forms Discovery</p>
          <p className="text-xs text-muted-foreground mt-1">Forms discovered from WordPress connector</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setLoading(true)}>
            <RefreshCw className="size-4 mr-2" />
            Sync Forms
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form Name</TableHead>
              <TableHead>Plugin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                  No forms discovered. Run a scan to find forms.
                </TableCell>
              </TableRow>
            ) : (
              forms.map((form) => (
                <TableRow key={form.id || form.form_id}>
                  <TableCell className="font-medium">{form.name || "Untitled"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{form.plugin}</Badge></TableCell>
                  <TableCell><StatusIndicator status={form.status || "draft"} /></TableCell>
                  <TableCell>{form.fields_count ?? form.fieldsCount ?? 0}</TableCell>
                  <TableCell><StatusIndicator status={form.validation_status || "unknown"} /></TableCell>
                  <TableCell>{form.validation_score != null ? `${form.validation_score}%` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => handleValidate(form.id || form.form_id)}>
                        <CheckCircle2 className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => handleTest(form.id || form.form_id)}>
                        <Play className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg h-8">
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function ConsentConfigurationPanel() {
  const [consent, setConsent] = useState<ConsentConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.consent.get("default");
        setConsent(data);
      } catch {
        setConsent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleVerify = async () => {
    try {
      await trackingApi.consent.verify("default", true);
      const data = await trackingApi.consent.get("default");
      setConsent(data);
    } catch {
      // keep existing state
    }
  };

  if (loading) {
    return <Skeleton className="h-40 rounded-xl" />;
  }

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Consent Configuration</p>
          <p className="text-xs text-muted-foreground mt-1">Cookie banner and consent settings</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={handleVerify}>
          <RefreshCw className="size-4 mr-2" />
          Verify
        </Button>
      </div>
      {consent ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border p-4 bg-muted/20">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cookie Banner</div>
            <div className="text-sm font-medium mt-1">{consent.cookie_banner_enabled ? "Enabled" : "Disabled"}</div>
          </div>
          <div className="rounded-xl border border-border p-4 bg-muted/20">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Consent Mode</div>
            <div className="text-sm font-medium mt-1">{consent.consent_mode || "—"}</div>
          </div>
          <div className="rounded-xl border border-border p-4 bg-muted/20">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="text-sm font-medium mt-1"><StatusIndicator status={consent.status} /></div>
          </div>
          <div className="rounded-xl border border-border p-4 bg-muted/20">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Verification</div>
            <div className="text-sm font-medium mt-1"><StatusIndicator status={consent.verification_status} /></div>
          </div>
          {consent.privacy_policy_url && (
            <div className="rounded-xl border border-border p-4 bg-muted/20 col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Privacy Policy</div>
              <div className="text-sm font-medium mt-1 truncate">{consent.privacy_policy_url}</div>
            </div>
          )}
          {consent.terms_url && (
            <div className="rounded-xl border border-border p-4 bg-muted/20 col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Terms of Service</div>
              <div className="text-sm font-medium mt-1 truncate">{consent.terms_url}</div>
            </div>
          )}
          {consent.cookie_categories && consent.cookie_categories.length > 0 && (
            <div className="rounded-xl border border-border p-4 bg-muted/20 col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cookie Categories</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {consent.cookie_categories.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">No consent configuration found</div>
      )}
    </Card>
  );
}

export function ValidationReportTable() {
  const [validations, setValidations] = useState<FormValidation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.forms.list("default");
        setValidations(data as unknown as FormValidation[]);
      } catch {
        setValidations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const checks = [
    { key: "required_fields_present", label: "Required Fields" },
    { key: "email_validation", label: "Email Validation" },
    { key: "phone_validation", label: "Phone Validation" },
    { key: "empty_fields_check", label: "Empty Fields Check" },
    { key: "spam_protection", label: "Spam Protection" },
    { key: "captcha_enabled", label: "Captcha" },
    { key: "recaptcha_enabled", label: "reCAPTCHA" },
    { key: "recaptcha_type", label: "reCAPTCHA Type" },
    { key: "hcaptcha_enabled", label: "hCaptcha" },
    { key: "honeypot_enabled", label: "Honeypot" },
    { key: "duplicate_protection", label: "Duplicate Protection" },
    { key: "file_upload_validation", label: "File Upload Validation" },
    { key: "required_checkbox", label: "Required Checkbox" },
  ];

  const renderCheckStatus = (value: unknown) => {
    if (value === true) {
      return <CheckCircle className="size-4 text-success mx-auto" />;
    }
    if (value === false) {
      return <XCircle className="size-4 text-destructive mx-auto" />;
    }
    return <Info className="size-4 text-muted-foreground mx-auto" />;
  };

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Validation Report</p>
          <p className="text-xs text-muted-foreground mt-1">Form validation checks with pass/fail results</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => setLoading(true)}>
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form</TableHead>
              <TableHead>Plugin</TableHead>
              {checks.map((c) => (
                <TableHead key={c.key} className="text-center">{c.label}</TableHead>
              ))}
              <TableHead>Score</TableHead>
              <TableHead>Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={checks.length + 4} className="py-10 text-center text-xs text-muted-foreground">
                  No validation data available. Validate forms to see results.
                </TableCell>
              </TableRow>
            ) : (
              validations.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.form_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{v.plugin}</Badge></TableCell>
                  {checks.map((c) => (
                    <TableCell key={c.key} className="text-center">
                      {renderCheckStatus((v as any)[c.key])}
                    </TableCell>
                  ))}
                  <TableCell>{v.validation_score != null ? `${v.validation_score}%` : "—"}</TableCell>
                  <TableCell><StatusIndicator status={v.health_status} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function RoutingDestinationsTable() {
  const [destinations, setDestinations] = useState<SubmissionDestination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.routing.list("default");
        setDestinations(data);
      } catch {
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleVerify = async (destId: string) => {
    try {
      await trackingApi.routing.verify("default", destId, true);
      const data = await trackingApi.routing.list("default");
      setDestinations(data);
    } catch {
      // keep existing state
    }
  };

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Routing Destinations</p>
          <p className="text-xs text-muted-foreground mt-1">Submission destinations for forms</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => setLoading(true)}>
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Reachable</TableHead>
              <TableHead>SMTP</TableHead>
              <TableHead>Webhook</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                  No routing destinations found.
                </TableCell>
              </TableRow>
            ) : (
              destinations.map((dest) => (
                <TableRow key={dest.id}>
                  <TableCell><Badge variant="outline" className="text-xs">{dest.destination_type}</Badge></TableCell>
                  <TableCell className="text-xs">{dest.destination_url || dest.destination_email || "—"}</TableCell>
                  <TableCell><StatusIndicator status={dest.status} /></TableCell>
                  <TableCell><StatusIndicator status={dest.verification_status} /></TableCell>
                  <TableCell>{dest.is_reachable ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}</TableCell>
                  <TableCell>{dest.smtp_working ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}</TableCell>
                  <TableCell>{dest.webhook_active ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => handleVerify(dest.id)}>
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function EventTestingPanel() {
  const [tests, setTests] = useState<EventTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState<EventType>("page_view");
  const [eventName, setEventName] = useState("test_event");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.events.test("default", "page_view", "test_event");
        setTests([data]);
      } catch {
        setTests([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRunTest = async () => {
    try {
      const result = await trackingApi.events.test("default", eventType, eventName);
      setTests((prev) => [result, ...prev]);
    } catch {
      // keep existing state
    }
  };

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Event Testing</p>
          <p className="text-xs text-muted-foreground mt-1">Run safe event tests to verify tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
          >
            {["page_view", "session_start", "cta_click", "button_click", "form_start", "form_submit", "phone_click", "email_click", "whatsapp_click", "purchase", "download", "custom"].map((et) => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
          <Input
            className="rounded-xl h-9 w-48"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event name"
          />
          <Button variant="outline" className="rounded-xl" onClick={handleRunTest}>
            <Play className="size-4 mr-2" />
            Run Test
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>Event Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Success</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead>Event ID</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                  No event tests run yet. Click "Run Test" to start.
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell><Badge variant="outline" className="text-xs">{test.event_type}</Badge></TableCell>
                  <TableCell className="font-medium">{test.event_name}</TableCell>
                  <TableCell><StatusIndicator status={test.status} /></TableCell>
                  <TableCell>{test.success ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}</TableCell>
                  <TableCell>{test.response_time_ms != null ? `${test.response_time_ms}ms` : "—"}</TableCell>
                  <TableCell><code className="text-xs bg-muted/30 px-2 py-1 rounded">{test.event_id || "—"}</code></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{test.timestamp ? new Date(test.timestamp).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function AuditLogsTable() {
  const [logs, setLogs] = useState<TrackingAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterOp, setFilterOp] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await trackingApi.auditLogs.list("default");
        setLogs(data.items || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query && !filterOp) return logs;
    return logs.filter((log) => {
      const matchesQuery = !query || log.operation.toLowerCase().includes(query.toLowerCase()) || log.result.toLowerCase().includes(query.toLowerCase());
      const matchesOp = !filterOp || log.operation === filterOp;
      return matchesQuery && matchesOp;
    });
  }, [logs, query, filterOp]);

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Audit Logs</p>
          <p className="text-xs text-muted-foreground mt-1">Search and filter tracking audit logs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 rounded-xl h-9 w-56"
            />
          </div>
          <select
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm"
            value={filterOp}
            onChange={(e) => setFilterOp(e.target.value)}
          >
            <option value="">All Operations</option>
            <option value="get_tracking_scripts">Get Scripts</option>
            <option value="verify_tracking_script">Verify Script</option>
            <option value="get_forms_discovery">Discover Forms</option>
            <option value="validate_form">Validate Form</option>
            <option value="get_consent_config">Get Consent</option>
            <option value="verify_consent">Verify Consent</option>
            <option value="get_routing_destinations">Get Destinations</option>
            <option value="verify_destination">Verify Destination</option>
            <option value="run_event_test">Event Test</option>
            <option value="run_full_scan">Full Scan</option>
          </select>
          <Button variant="outline" className="rounded-xl" onClick={() => setLoading(true)}>
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operation</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Correlation ID</TableHead>
              <TableHead>Executed By</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-xs">{log.operation}</TableCell>
                  <TableCell><StatusIndicator status={log.result} /></TableCell>
                  <TableCell className="text-xs">{log.duration_seconds != null ? `${log.duration_seconds.toFixed(2)}s` : "—"}</TableCell>
                  <TableCell className="text-xs"><code className="bg-muted/30 px-1.5 py-0.5 rounded">{log.correlation_id || "—"}</code></TableCell>
                  <TableCell className="text-xs">{log.executed_by || "system"}</TableCell>
                  <TableCell className="text-xs text-destructive">{log.error_message || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function MeasurementPlanManager() {
  const [plans, setPlans] = useState<MeasurementPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await trackingApi.measurementPlans.list("default");
        setPlans(data?.items || data || []);
      } catch {
        setPlans([]);
        setError("Unable to load measurement plans.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Measurement Plans</p>
          <p className="text-xs text-muted-foreground mt-1">Define business goals, events, and KPI targets.</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => setRefreshKey((key) => key + 1)}>
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">Loading measurement plans...</TableCell></TableRow>
              : plans.length === 0 ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No measurement plans found.</TableCell></TableRow>
              : plans.map((plan) => <TableRow key={plan.id}><TableCell className="font-medium">{plan.name}</TableCell><TableCell className="max-w-96 truncate text-muted-foreground">{plan.description || "—"}</TableCell><TableCell><StatusIndicator status={plan.status} /></TableCell><TableCell className="text-xs text-muted-foreground">{new Date(plan.updated_at).toLocaleString()}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function FormSubmissionsTable() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<FormSubmissionStatus | "">("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await trackingApi.submissions.list("default", status || undefined);
        setSubmissions(data.items || []);
      } catch {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, refreshKey]);

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div><p className="text-sm font-semibold">Form Submissions</p><p className="text-xs text-muted-foreground mt-1">Monitor form delivery and visitor submissions.</p></div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm" value={status} onChange={(event) => setStatus(event.target.value as FormSubmissionStatus | "")}>
            <option value="">All statuses</option><option value="pending">Pending</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="failed">Failed</option><option value="spamming">Spam</option>
          </select>
          <Button variant="outline" className="rounded-xl" onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw className="size-4 mr-2" />Refresh</Button>
        </div>
      </div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Form</TableHead><TableHead>Plugin</TableHead><TableHead>Destination</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Loading submissions...</TableCell></TableRow>
          : submissions.length === 0 ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No form submissions found.</TableCell></TableRow>
          : submissions.map((submission) => <TableRow key={submission.id}><TableCell className="font-medium">{submission.form_name || submission.form_id}</TableCell><TableCell><Badge variant="outline" className="text-xs">{submission.plugin || "—"}</Badge></TableCell><TableCell className="max-w-56 truncate text-xs">{submission.destination_address || submission.destination_type || "—"}</TableCell><TableCell><StatusIndicator status={submission.delivery_status || submission.status} /></TableCell><TableCell className="text-xs text-muted-foreground">{new Date(submission.submitted_at).toLocaleString()}</TableCell></TableRow>)}
      </TableBody></Table></div>
    </Card>
  );
}
