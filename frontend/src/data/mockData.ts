import type { KanbanData } from "@/types";

// ── Mock Data ─────────────────────────────────────────────
export const initKanban: KanbanData = {
  SMS: [
    { id: 1, style: "NK-JKT-2401", team: "생산1팀", assignee: "김민준", deadline: "2024-07-15", status: "검토중", comments: 3, sent: false, brand: "Nike", priority: "높음" },
    { id: 2, style: "AD-PNT-2403", team: "생산2팀", assignee: "이서연", deadline: "2024-07-20", status: "대기", comments: 1, sent: true, brand: "Adidas", priority: "보통" },
    { id: 3, style: "FL-SET-2401", team: "생산3팀", assignee: "박지훈", deadline: "2024-07-18", status: "검토중", comments: 0, sent: false, brand: "FILA", priority: "낮음" },
  ],
  FIT: [
    { id: 4, style: "NK-TOP-2402", team: "생산1팀", assignee: "최수아", deadline: "2024-07-12", status: "진행중", comments: 5, sent: true, brand: "Nike", priority: "높음" },
    { id: 5, style: "NB-JKT-2402", team: "생산2팀", assignee: "정우성", deadline: "2024-07-22", status: "진행중", comments: 2, sent: false, brand: "New Balance", priority: "보통" },
  ],
  APPROVAL: [
    { id: 6, style: "UA-SET-2401", team: "생산3팀", assignee: "한지민", deadline: "2024-07-10", status: "승인대기", comments: 4, sent: true, brand: "Under Armour", priority: "높음" },
    { id: 7, style: "AD-JKT-2401", team: "생산1팀", assignee: "오현우", deadline: "2024-07-25", status: "승인대기", comments: 0, sent: false, brand: "Adidas", priority: "보통" },
    { id: 8, style: "FL-JKT-2402", team: "생산2팀", assignee: "임지영", deadline: "2024-07-28", status: "승인완료", comments: 2, sent: true, brand: "FILA", priority: "낮음" },
  ],
  TOP: [
    { id: 9, style: "NK-PNT-2401", team: "생산1팀", assignee: "강동원", deadline: "2024-07-08", status: "완료", comments: 6, sent: true, brand: "Nike", priority: "높음" },
    { id: 10, style: "UA-JKT-2402", team: "생산3팀", assignee: "김태희", deadline: "2024-07-14", status: "완료", comments: 1, sent: true, brand: "Under Armour", priority: "보통" },
  ],
  TEST: [
    { id: 11, style: "NB-SET-2401", team: "생산2팀", assignee: "이민호", deadline: "2024-07-05", status: "테스트중", comments: 3, sent: true, brand: "New Balance", priority: "높음" },
    { id: 12, style: "AD-TOP-2403", team: "생산1팀", assignee: "박신혜", deadline: "2024-07-30", status: "테스트중", comments: 0, sent: false, brand: "Adidas", priority: "낮음" },
  ],
};

export const productionChart = [
  { month: "1월", 진행: 65, 완료: 30, 지연: 5 },
  { month: "2월", 진행: 72, 완료: 45, 지연: 8 },
  { month: "3월", 진행: 80, 완료: 55, 지연: 3 },
  { month: "4월", 진행: 88, 완료: 62, 지연: 6 },
  { month: "5월", 진행: 75, 완료: 70, 지연: 4 },
  { month: "6월", 진행: 92, 완료: 80, 지연: 2 },
  { month: "7월", 진행: 85, 완료: 75, 지연: 7 },
];
export const shippingChart = [
  { week: "7/1주", AIR: 4, BOAT: 8, SPLIT: 2 },
  { week: "7/2주", AIR: 6, BOAT: 5, SPLIT: 3 },
  { week: "7/3주", AIR: 3, BOAT: 10, SPLIT: 1 },
  { week: "7/4주", AIR: 8, BOAT: 6, SPLIT: 4 },
];
export const brandChart = [
  { name: "Nike", value: 35, color: "#2563EB" },
  { name: "Adidas", value: 28, color: "#7C3AED" },
  { name: "Under Armour", value: 18, color: "#059669" },
  { name: "New Balance", value: 12, color: "#D97706" },
  { name: "FILA", value: 7, color: "#DC2626" },
];
export const recentActivities = [
  { id: 1, type: "PO등록", content: "PO-2024-0830 신규 등록", user: "김민준", time: "5분 전", color: "bg-blue-500" },
  { id: 2, type: "샘플승인", content: "NK-JKT-2401 FIT 샘플 승인 완료", user: "이서연", time: "23분 전", color: "bg-violet-500" },
  { id: 3, type: "자동대사", content: "PO-2024-0826 대사 불일치 발견 (수량 차이)", user: "시스템", time: "1시간 전", color: "bg-red-500" },
  { id: 4, type: "출고", content: "PO-2024-0825 항공 출고 완료", user: "박지훈", time: "2시간 전", color: "bg-teal-500" },
  { id: 5, type: "결재", content: "자재발주 결재 요청 (NK-JKT-2401)", user: "최수아", time: "3시간 전", color: "bg-amber-500" },
];
export const notifications = [
  { id: 1, type: "danger", title: "대사 불일치", desc: "PO-2024-0826: 수량 차이 200개 발견", time: "1시간 전" },
  { id: 2, type: "warning", title: "결제 지연", desc: "AD-PNT-2403 PI 결제 3일 초과", time: "2시간 전" },
  { id: 3, type: "warning", title: "출고 임박", desc: "PO-2024-0825 내일까지 출고 예정", time: "3시간 전" },
  { id: 4, type: "info", title: "댓글 회신 지연", desc: "NK-JKT-2401 샘플 댓글 미답변 2일 경과", time: "어제" },
];
