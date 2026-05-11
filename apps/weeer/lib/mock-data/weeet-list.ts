// ── WeeeT Mock Data — Phase C-5 ───────────────────────────────────────────────

export interface WeeeTMock {
  id: string;
  name: string;
  phone: string;
  type: "default" | "rented";
  status: "active" | "suspended";
  available: boolean;
  active_jobs: number;
}

export const WEEET_MOCK_LIST: WeeeTMock[] = [
  {
    id: "R001-T00",
    name: "ร้าน ABC (ตัวเอง)",
    phone: "081-000-0000",
    type: "default",
    status: "active",
    available: true,
    active_jobs: 1,
  },
  {
    id: "R001-T01",
    name: "นายวิทยา ซ่อมเก่ง",
    phone: "081-111-1111",
    type: "rented",
    status: "active",
    available: true,
    active_jobs: 2,
  },
  {
    id: "R001-T02",
    name: "นายสมชาย ช่างดี",
    phone: "082-222-2222",
    type: "rented",
    status: "active",
    available: false,
    active_jobs: 3,
  },
  {
    id: "R001-T03",
    name: "นายมาลัย ไฟฟ้า",
    phone: "083-333-3333",
    type: "rented",
    status: "suspended",
    available: false,
    active_jobs: 0,
  },
];

/** Only active + available WeeeTs */
export const AVAILABLE_WEEET = WEEET_MOCK_LIST.filter(
  (w) => w.status === "active" && w.available,
);
