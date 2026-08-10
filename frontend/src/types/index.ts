export type Page =
  | "dashboard" | "po" | "techpack" | "sample" | "material"
  | "reconciliation" | "sticker" | "shipping" | "reference"
  | "users" | "settings";
export type Status = "진행중" | "검토중" | "완료" | "지연" | "취소" | "대기" | "승인대기" | "승인완료" | "테스트중";
export type ShippingMethod = "AIR" | "BOAT" | "SPLIT";
// 백엔드 PurchaseOrderSummaryResponse와 대응
export interface PurchaseOrderSummary {
  id: number; poNumber: string; styleCode: string; brand: string;
  customerName: string; season: string; status: string;
  dlvyDate: string | null; transportMethod: string; totalQty: number;
}
