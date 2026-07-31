import type { TrackingDto, TrackingRecord } from "./types";
const wait = <T,>(data: T) => new Promise<T>((resolve) => setTimeout(() => resolve(data), 180));
const records: TrackingRecord[] = [
  { id: "tr_01", name: "Lead capture form", type: "Form routing", owner: "Revenue Ops", status: "Active", updated: "18 min ago", detail: "HubSpot + Sales Team" },
  { id: "tr_03", name: "EU consent banner", type: "Consent policy", owner: "Legal", status: "Pending", updated: "1 hr ago", detail: "GDPR wording review" },
  { id: "tr_04", name: "LinkedIn Insight Tag", type: "Platform verification", owner: "Paid Media", status: "Failed", updated: "3 hrs ago", detail: "No recent events received" },
];
export const trackingFormsService = { list: () => wait(records), create: (dto: TrackingDto) => wait({ ...dto, id: `tr_${Date.now()}`, updated: "Just now", detail: "Record" }), update: (id: string, dto: Partial<TrackingDto>) => wait({ ...records[0], ...dto, id }) };
