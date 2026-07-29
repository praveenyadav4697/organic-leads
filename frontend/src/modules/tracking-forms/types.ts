export type TrackingStatus = "Active" | "Pending" | "Failed" | "Draft";
export type TrackingRecord = { id: string; name: string; type: string; owner: string; status: TrackingStatus; updated: string; detail: string };
export type TrackingDto = { name: string; type: string; owner: string; status: TrackingStatus };
