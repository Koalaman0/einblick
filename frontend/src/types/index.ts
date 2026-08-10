export type Page =
  | "dashboard" | "po" | "techpack" | "sample" | "material"
  | "reconciliation" | "sticker" | "shipping" | "reference"
  | "users" | "settings";
export type Status = "진행중" | "검토중" | "완료" | "지연" | "취소" | "대기" | "승인대기" | "승인완료" | "테스트중";
export type ShippingMethod = "AIR" | "BOAT" | "SPLIT";
export type SampleStage = "SMS" | "FIT" | "APPROVAL" | "TOP" | "TEST";
export interface POItem {
  id: string; style: string; brand: string; customer: string;
  season: string; status: Status; deadline: string;
  shippingMethod: ShippingMethod; quantity: number; amount: string;
  factory: string; country: string;
}
export interface SampleCard {
  id: number; style: string; team: string; assignee: string;
  deadline: string; status: string; comments: number;
  sent: boolean; brand: string; priority: "높음" | "보통" | "낮음";
}
export type KanbanData = Record<SampleStage, SampleCard[]>;
