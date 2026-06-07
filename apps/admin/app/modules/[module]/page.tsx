"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

// ═══════════════════════════════════════════════════════════════
// CMD D80 — Admin Module Management Overview
// Dynamic route: /admin/modules/[module]
// 6 modules: repair · maintain · resell · scrap · parts · withdraw
// Mockup only — mock state, ไม่ fetch API จริง (เฟส 4)
// ═══════════════════════════════════════════════════════════════

type ModuleKey = "repair" | "maintain" | "resell" | "scrap" | "parts" | "withdraw";

interface StatusTab {
  key: string;
  label: string;
  count: number;
  color: string;
  activeColor: string;
}

interface MockRow {
  id: string;
  code: string;
  user: string;
  type: string;
  status: string;
  amount: string;
  date: string;
  [key: string]: string | number | boolean;
}

interface ModuleConfig {
  label: string;
  labelEn: string;
  icon: string;
  totalLabel: string;
  stats: { label: string; value: string; color: string }[];
  tabs: StatusTab[];
  columns: { key: string; label: string }[];
  rows: MockRow[];
  rowLink: (id: string) => string;
}

// ─── Module Configurations ────────────────────────────────────

const MODULE_CONFIGS: Record<ModuleKey, ModuleConfig> = {
  repair: {
    label: "Repair", labelEn: "Repair Jobs", icon: "🔧", totalLabel: "งานซ่อมทั้งหมด",
    stats: [
      { label: "งานใหม่วันนี้", value: "14", color: "text-blue-600" },
      { label: "กำลังซ่อม",     value: "38", color: "text-orange-600" },
      { label: "เสร็จวันนี้",    value: "9",  color: "text-green-600" },
      { label: "Dispute เปิด",  value: "3",  color: "text-red-600" },
    ],
    tabs: [
      { key: "",            label: "ทั้งหมด",     count: 142, color: "bg-gray-100 text-gray-700",   activeColor: "bg-admin-primary text-white" },
      { key: "posted",      label: "ประกาศ",      count: 28,  color: "bg-blue-50 text-blue-700",   activeColor: "bg-blue-600 text-white" },
      { key: "offered",     label: "ข้อเสนอ",     count: 15,  color: "bg-yellow-50 text-yellow-700", activeColor: "bg-yellow-500 text-white" },
      { key: "assigned",    label: "รับงาน",      count: 22,  color: "bg-admin-surface text-admin-primary", activeColor: "bg-admin-primary text-white" },
      { key: "in_progress", label: "กำลังซ่อม",  count: 38,  color: "bg-orange-50 text-orange-700", activeColor: "bg-orange-500 text-white" },
      { key: "completed",   label: "เสร็จแล้ว",  count: 36,  color: "bg-green-50 text-green-700",  activeColor: "bg-green-600 text-white" },
      { key: "dispute",     label: "Dispute",     count: 3,   color: "bg-red-50 text-red-700",     activeColor: "bg-red-600 text-white" },
    ],
    columns: [
      { key: "code",   label: "รหัสงาน" },
      { key: "user",   label: "ลูกค้า" },
      { key: "type",   label: "ประเภทงาน" },
      { key: "status", label: "สถานะ" },
      { key: "amount", label: "ราคา" },
      { key: "date",   label: "วันที่" },
    ],
    rows: [
      { id: "r1", code: "RPR-240501",  user: "สมชาย ใจดี",     type: "ซ่อมแอร์ (Pick-up)",   status: "in_progress", amount: "2,400 ฿", date: "25 พ.ค. 2026" },
      { id: "r2", code: "RPR-240502",  user: "มาลี สุขใส",     type: "ซ่อมตู้เย็น (Walk-in)", status: "completed",   amount: "1,850 ฿", date: "25 พ.ค. 2026" },
      { id: "r3", code: "RPR-240503",  user: "วิชัย มงคล",     type: "ซ่อมเครื่องซักผ้า",     status: "assigned",    amount: "3,200 ฿", date: "24 พ.ค. 2026" },
      { id: "r4", code: "RPR-240498",  user: "ปิยะ พงษ์ดี",   type: "ซ่อมทีวี (Parcel)",     status: "dispute",     amount: "890 ฿",   date: "23 พ.ค. 2026" },
      { id: "r5", code: "RPR-240499",  user: "นิภา รักษ์ดี",   type: "ซ่อมแอร์ (Walk-in)",   status: "offered",     amount: "1,600 ฿", date: "23 พ.ค. 2026" },
      { id: "r6", code: "RPR-240496",  user: "กมล วงษ์ไทย",   type: "ซ่อมตู้เย็น",           status: "posted",      amount: "—",       date: "22 พ.ค. 2026" },
    ],
    rowLink: (id) => `/repair/jobs/${id}`,
  },

  maintain: {
    label: "Maintain", labelEn: "Maintenance Jobs", icon: "🛁", totalLabel: "งานบำรุงรักษาทั้งหมด",
    stats: [
      { label: "รอช่างวันนี้",    value: "7",  color: "text-blue-600" },
      { label: "กำลังทำความสะอาด", value: "12", color: "text-orange-600" },
      { label: "เสร็จวันนี้",      value: "5",  color: "text-green-600" },
      { label: "Recurring active", value: "23", color: "text-admin-primary" },
    ],
    tabs: [
      { key: "",           label: "ทั้งหมด",         count: 89,  color: "bg-gray-100 text-gray-700",   activeColor: "bg-admin-primary text-white" },
      { key: "pending",    label: "รอช่าง",          count: 7,   color: "bg-blue-50 text-blue-700",   activeColor: "bg-blue-600 text-white" },
      { key: "in_progress",label: "กำลังล้าง",       count: 12,  color: "bg-orange-50 text-orange-700", activeColor: "bg-orange-500 text-white" },
      { key: "completed",  label: "เสร็จแล้ว",       count: 47,  color: "bg-green-50 text-green-700",  activeColor: "bg-green-600 text-white" },
      { key: "cancelled",  label: "ยุติ",             count: 9,   color: "bg-red-50 text-red-700",     activeColor: "bg-red-600 text-white" },
      { key: "recurring",  label: "Recurring",        count: 23,  color: "bg-admin-surface text-admin-primary", activeColor: "bg-admin-primary text-white" },
    ],
    columns: [
      { key: "code",   label: "รหัสงาน" },
      { key: "user",   label: "ลูกค้า" },
      { key: "type",   label: "ประเภทงาน" },
      { key: "status", label: "สถานะ" },
      { key: "amount", label: "ราคา" },
      { key: "date",   label: "วันที่" },
    ],
    rows: [
      { id: "mt1", code: "MNT-240201", user: "อรุณ ศรีสุข",    type: "ล้างแอร์ (Walk-in)",     status: "in_progress", amount: "800 ฿",    date: "25 พ.ค. 2026" },
      { id: "mt2", code: "MNT-240202", user: "ภาวิณี ทองดี",   type: "ล้างเครื่องซักผ้า",      status: "pending",     amount: "650 ฿",    date: "25 พ.ค. 2026" },
      { id: "mt3", code: "MNT-240195", user: "เกียรติ มั่นคง",  type: "ล้างตู้เย็น",             status: "completed",   amount: "500 ฿",    date: "24 พ.ค. 2026" },
      { id: "mt4", code: "MNT-240190", user: "ลัดดา วิชัยรัตน์",type: "ล้างแอร์ (Recurring)",   status: "recurring",   amount: "700 ฿/ครั้ง",date: "24 พ.ค. 2026" },
      { id: "mt5", code: "MNT-240185", user: "สุรชาติ พนา",    type: "ตรวจเช็คเครื่องทั่วไป",  status: "cancelled",   amount: "—",        date: "23 พ.ค. 2026" },
      { id: "mt6", code: "MNT-240180", user: "ชลิตา สงวน",     type: "ล้างแอร์ (Walk-in)",     status: "completed",   amount: "800 ฿",    date: "22 พ.ค. 2026" },
    ],
    rowLink: (id) => `/maintain/jobs/${id}`,
  },

  resell: {
    label: "Resell", labelEn: "Resell Listings", icon: "🛍️", totalLabel: "รายการขายทั้งหมด",
    stats: [
      { label: "ประกาศใหม่วันนี้", value: "19", color: "text-blue-600" },
      { label: "คำสั่งซื้อ active",  value: "31", color: "text-orange-600" },
      { label: "พักเงินกลาง รอโอน", value: "8",  color: "text-yellow-600" },
      { label: "Dispute เปิด",     value: "2",  color: "text-red-600" },
    ],
    tabs: [
      { key: "",          label: "ทั้งหมด",    count: 215, color: "bg-gray-100 text-gray-700",   activeColor: "bg-admin-primary text-white" },
      { key: "available", label: "ประกาศ",    count: 91,  color: "bg-blue-50 text-blue-700",   activeColor: "bg-blue-600 text-white" },
      { key: "offered",   label: "มีข้อเสนอ", count: 24,  color: "bg-yellow-50 text-yellow-700", activeColor: "bg-yellow-500 text-white" },
      { key: "ordered",   label: "คำสั่งซื้อ", count: 31,  color: "bg-orange-50 text-orange-700", activeColor: "bg-orange-500 text-white" },
      { key: "escrow",    label: "ระบบพักเงินกลาง (Escrow)",    count: 8,   color: "bg-admin-surface text-admin-primary", activeColor: "bg-admin-primary text-white" },
      { key: "dispute",   label: "Dispute",   count: 2,   color: "bg-red-50 text-red-700",     activeColor: "bg-red-600 text-white" },
    ],
    columns: [
      { key: "code",   label: "รหัสประกาศ" },
      { key: "user",   label: "ผู้ขาย" },
      { key: "type",   label: "สินค้า" },
      { key: "status", label: "สถานะ" },
      { key: "amount", label: "ราคา" },
      { key: "date",   label: "วันที่" },
    ],
    rows: [
      { id: "rs1", code: "RSL-240801", user: "ธนภัทร สร้างชาติ", type: "iPhone 14 Pro 256GB",     status: "available", amount: "24,500 ฿",  date: "25 พ.ค. 2026" },
      { id: "rs2", code: "RSL-240795", user: "พรทิพย์ อุดม",      type: "MacBook Air M2",           status: "escrow",    amount: "32,000 ฿",  date: "24 พ.ค. 2026" },
      { id: "rs3", code: "RSL-240790", user: "ณัฐพล ขยัน",        type: "Samsung Galaxy S24",       status: "ordered",   amount: "18,900 ฿",  date: "24 พ.ค. 2026" },
      { id: "rs4", code: "RSL-240785", user: "อภิษฎา วิวัฒน์",    type: "iPad Air 5th Gen",         status: "offered",   amount: "12,800 ฿",  date: "23 พ.ค. 2026" },
      { id: "rs5", code: "RSL-240779", user: "วิโรจน์ เพียรดี",   type: "AirPods Pro 2nd Gen",      status: "dispute",   amount: "4,200 ฿",   date: "23 พ.ค. 2026" },
      { id: "rs6", code: "RSL-240770", user: "สุภัทรา ชูใจ",      type: "Dyson V12 Absolute",       status: "available", amount: "15,500 ฿",  date: "22 พ.ค. 2026" },
    ],
    rowLink: (id) => `/resell/listings/${id}`,
  },

  scrap: {
    label: "Scrap", labelEn: "Scrap Listings & Jobs", icon: "♻️", totalLabel: "รายการรับซื้อทั้งหมด",
    stats: [
      { label: "ประกาศขายใหม่",  value: "11", color: "text-blue-600" },
      { label: "งานรับซื้อ active", value: "8", color: "text-orange-600" },
      { label: "รอออก E-Cert",    value: "3",  color: "text-yellow-600" },
      { label: "ออก E-Cert แล้ว", value: "47", color: "text-green-600" },
    ],
    tabs: [
      { key: "",          label: "ทั้งหมด",     count: 87,  color: "bg-gray-100 text-gray-700",   activeColor: "bg-admin-primary text-white" },
      { key: "listing",   label: "ประกาศขาย",  count: 31,  color: "bg-blue-50 text-blue-700",   activeColor: "bg-blue-600 text-white" },
      { key: "job",       label: "งานทิ้ง",    count: 9,   color: "bg-orange-50 text-orange-700", activeColor: "bg-orange-500 text-white" },
      { key: "cert",      label: "E-Waste Cert",count: 47, color: "bg-green-50 text-green-700",  activeColor: "bg-green-600 text-white" },
    ],
    columns: [
      { key: "code",   label: "รหัส" },
      { key: "user",   label: "ผู้ขาย/ลูกค้า" },
      { key: "type",   label: "สินค้า/ประเภท" },
      { key: "status", label: "สถานะ" },
      { key: "amount", label: "ราคา/ค่าทิ้ง" },
      { key: "date",   label: "วันที่" },
    ],
    rows: [
      { id: "sc1", code: "SCR-240301", user: "อดิสร จันทร์ดี",    type: "ตู้เย็น Samsung 2 ประตู",  status: "listing", amount: "3,500 ฿",  date: "25 พ.ค. 2026" },
      { id: "sc2", code: "SCJ-240102", user: "รัตนา สว่าง",        type: "ทิ้งแอร์เก่า 3 ตัว",      status: "job",     amount: "600 ฿",    date: "25 พ.ค. 2026" },
      { id: "sc3", code: "SCR-240290", user: "ชาญชัย พงษ์วิจิตร", type: "เครื่องซักผ้า Panasonic", status: "listing", amount: "2,200 ฿",  date: "24 พ.ค. 2026" },
      { id: "sc4", code: "SCE-240055", user: "ปฐมพร ใจกล้า",       type: "แอร์ Mitsubishi",         status: "cert",    amount: "สำเร็จ",   date: "24 พ.ค. 2026" },
      { id: "sc5", code: "SCJ-240099", user: "สิทธิชัย รุ่งเรือง", type: "ทิ้งของเสียอิเล็กทรอนิกส์",status: "job",  amount: "800 ฿",    date: "23 พ.ค. 2026" },
      { id: "sc6", code: "SCE-240052", user: "อาทิตย์ แสงทอง",    type: "ทีวี + ตู้เย็น",           status: "cert",    amount: "สำเร็จ",   date: "22 พ.ค. 2026" },
    ],
    rowLink: (id) => id.startsWith("sc") && id.includes("J") ? `/scrap/jobs/${id}` : id.includes("E") ? `/scrap/certificates/${id}` : `/scrap/listings/${id}`,
  },

  parts: {
    label: "Parts", labelEn: "Parts Inventory", icon: "🔩", totalLabel: "รายการอะไหล่ทั้งหมด",
    stats: [
      { label: "รายการทั้งหมด",    value: "1,240", color: "text-blue-600" },
      { label: "คำสั่งซื้อ B2B",    value: "18",    color: "text-orange-600" },
      { label: "สต็อกใกล้หมด",      value: "7",     color: "text-red-600" },
      { label: "เพิ่มใหม่วันนี้",    value: "4",     color: "text-green-600" },
    ],
    tabs: [
      { key: "",        label: "ทั้งหมด",    count: 1240, color: "bg-gray-100 text-gray-700",   activeColor: "bg-admin-primary text-white" },
      { key: "active",  label: "Listing",   count: 1190, color: "bg-blue-50 text-blue-700",   activeColor: "bg-blue-600 text-white" },
      { key: "b2b",     label: "B2B Order", count: 18,   color: "bg-orange-50 text-orange-700", activeColor: "bg-orange-500 text-white" },
      { key: "low",     label: "สต็อกต่ำ", count: 7,    color: "bg-red-50 text-red-700",     activeColor: "bg-red-600 text-white" },
      { key: "inactive",label: "ปิด",       count: 50,   color: "bg-gray-100 text-gray-500",  activeColor: "bg-gray-600 text-white" },
    ],
    columns: [
      { key: "code",   label: "Part Number" },
      { key: "user",   label: "ชื่ออะไหล่" },
      { key: "type",   label: "ประเภท" },
      { key: "status", label: "สต็อก" },
      { key: "amount", label: "ราคา" },
      { key: "date",   label: "อัพเดต" },
    ],
    rows: [
      { id: "pt1", code: "PRT-AC-0012", user: "บอร์ดคอมแอร์ Daikin FTX-M",    type: "บอร์ดอิเล็กทรอนิกส์", status: "active", amount: "3,200 ฿", date: "25 พ.ค. 2026" },
      { id: "pt2", code: "PRT-RF-0045", user: "คอมเพรสเซอร์ตู้เย็น Samsung",   type: "มอเตอร์/คอมเพรสเซอร์", status: "low",    amount: "4,800 ฿", date: "24 พ.ค. 2026" },
      { id: "pt3", code: "PRT-WM-0023", user: "มอเตอร์เครื่องซักผ้า LG",       type: "มอเตอร์/คอมเพรสเซอร์", status: "active", amount: "2,100 ฿", date: "24 พ.ค. 2026" },
      { id: "pt4", code: "PRT-TV-0067", user: "แผงจอ LED Samsung 55\"",          type: "จอแสดงผล",             status: "active", amount: "7,500 ฿", date: "23 พ.ค. 2026" },
      { id: "pt5", code: "PRT-AC-0019", user: "แผงระบายความร้อน Carrier",        type: "แผงทำความเย็น",        status: "low",    amount: "1,900 ฿", date: "23 พ.ค. 2026" },
      { id: "pt6", code: "PRT-RF-0031", user: "ยางประตูตู้เย็น Panasonic",      type: "ซีล/ยาง",              status: "active", amount: "450 ฿",   date: "22 พ.ค. 2026" },
    ],
    rowLink: (id) => `/parts/${id}`,
  },

  withdraw: {
    label: "Withdraw", labelEn: "Withdrawal Requests", icon: "🏦", totalLabel: "คำขอถอนเงินทั้งหมด",
    stats: [
      { label: "รอ approve",    value: "6",  color: "text-yellow-600" },
      { label: "อนุมัติวันนี้",  value: "11", color: "text-green-600" },
      { label: "ปฏิเสธวันนี้",  value: "1",  color: "text-red-600" },
      { label: "ยอดรวมรอโอน",  value: "42,500 ฿", color: "text-blue-600" },
    ],
    tabs: [
      { key: "",          label: "ทั้งหมด",     count: 84,  color: "bg-gray-100 text-gray-700",   activeColor: "bg-admin-primary text-white" },
      { key: "pending",   label: "รอ Approve",  count: 6,   color: "bg-yellow-50 text-yellow-700", activeColor: "bg-yellow-500 text-white" },
      { key: "approved",  label: "อนุมัติแล้ว", count: 61,  color: "bg-green-50 text-green-700",  activeColor: "bg-green-600 text-white" },
      { key: "rejected",  label: "ปฏิเสธ",      count: 17,  color: "bg-red-50 text-red-700",     activeColor: "bg-red-600 text-white" },
    ],
    columns: [
      { key: "code",   label: "รหัสคำขอ" },
      { key: "user",   label: "ผู้ขอถอน" },
      { key: "type",   label: "Role" },
      { key: "status", label: "สถานะ" },
      { key: "amount", label: "จำนวน" },
      { key: "date",   label: "วันที่" },
    ],
    rows: [
      { id: "wd1", code: "WDR-240501", user: "ช่างวิทย์ ซ่อมดี",    type: "WeeeR", status: "pending",  amount: "8,500 ฿",  date: "25 พ.ค. 2026" },
      { id: "wd2", code: "WDR-240499", user: "สุดา มือสอง",          type: "WeeeU", status: "pending",  amount: "15,200 ฿", date: "25 พ.ค. 2026" },
      { id: "wd3", code: "WDR-240495", user: "ช่างนิรันดร์ ไร้ฝุ่น",type: "WeeeR", status: "approved", amount: "5,000 ฿",  date: "24 พ.ค. 2026" },
      { id: "wd4", code: "WDR-240490", user: "พิมพ์ใจ ขายของมือ2",   type: "WeeeU", status: "rejected", amount: "2,300 ฿",  date: "24 พ.ค. 2026" },
      { id: "wd5", code: "WDR-240487", user: "ช่างกิตติ หมั่นเพียร",  type: "WeeeR", status: "approved", amount: "12,000 ฿", date: "23 พ.ค. 2026" },
      { id: "wd6", code: "WDR-240480", user: "ธีรยุทธ สะสม",         type: "WeeeU", status: "pending",  amount: "18,800 ฿", date: "23 พ.ค. 2026" },
    ],
    rowLink: () => `/withdrawal`,
  },
};

// ─── Status display helper ────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  // Repair
  in_progress: { label: "กำลังซ่อม",    color: "bg-orange-50 text-orange-700" },
  completed:   { label: "เสร็จแล้ว",    color: "bg-green-50 text-green-700" },
  assigned:    { label: "รับงานแล้ว",   color: "bg-admin-surface text-admin-primary" },
  dispute:     { label: "Dispute",       color: "bg-red-50 text-red-700" },
  offered:     { label: "มีข้อเสนอ",    color: "bg-yellow-50 text-yellow-700" },
  posted:      { label: "ประกาศ",        color: "bg-blue-50 text-blue-700" },
  // Maintain
  pending:     { label: "รอช่าง",       color: "bg-blue-50 text-blue-700" },
  cancelled:   { label: "ยุติ",          color: "bg-gray-100 text-gray-500" },
  recurring:   { label: "Recurring",     color: "bg-admin-surface text-admin-primary" },
  // Resell
  available:   { label: "ประกาศอยู่",   color: "bg-blue-50 text-blue-700" },
  ordered:     { label: "คำสั่งซื้อ",   color: "bg-orange-50 text-orange-700" },
  escrow:      { label: "ระบบพักเงินกลาง (Escrow)",        color: "bg-admin-surface text-admin-primary" },
  // Scrap
  listing:     { label: "ประกาศขาย",    color: "bg-blue-50 text-blue-700" },
  job:         { label: "งานทิ้ง",      color: "bg-orange-50 text-orange-700" },
  cert:        { label: "E-Cert ออกแล้ว",color: "bg-green-50 text-green-700" },
  // Parts
  active:      { label: "Active",        color: "bg-green-50 text-green-700" },
  low:         { label: "สต็อกต่ำ",     color: "bg-red-50 text-red-700" },
  inactive:    { label: "ปิด",           color: "bg-gray-100 text-gray-500" },
  b2b:         { label: "B2B Order",     color: "bg-orange-50 text-orange-700" },
  // Withdraw
  approved:    { label: "อนุมัติแล้ว",  color: "bg-green-50 text-green-700" },
  rejected:    { label: "ปฏิเสธ",       color: "bg-red-50 text-red-700" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.label}</span>;
}

const MODULE_ORDER: ModuleKey[] = ["repair", "maintain", "resell", "scrap", "parts", "withdraw"];

// ─── Main Page ────────────────────────────────────────────────

export default function ModuleOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const moduleParam = (params?.module as string) ?? "repair";
  const moduleKey = MODULE_ORDER.includes(moduleParam as ModuleKey)
    ? (moduleParam as ModuleKey) : "repair";

  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const config = MODULE_CONFIGS[moduleKey];

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    setReady(true);
    setActiveTab("");
    setSearch("");
  }, [router, moduleKey]);

  const filteredRows = useMemo(() => {
    let rows = config.rows;
    if (activeTab) rows = rows.filter(r => r.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.code.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [config.rows, activeTab, search]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <span>Admin</span><span>/</span><span>Module Mgmt</span><span>/</span>
          <span className="text-admin-primary font-medium">{config.label}</span>
        </div>

        {/* Module switcher */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {MODULE_ORDER.map(mk => {
            const c = MODULE_CONFIGS[mk];
            const isActive = mk === moduleKey;
            return (
              <button key={mk} onClick={() => router.push(`/modules/${mk}`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-admin-primary text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-admin-primary/40 hover:text-admin-primary"
                }`}>
                <span>{c.icon}</span> {c.label}
              </button>
            );
          })}
        </div>

        {/* Header + stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{config.labelEn}</h1>
                <p className="text-sm text-gray-500">{config.totalLabel}</p>
              </div>
            </div>
            <div className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg">
              🔶 Mockup — wire API เฟส 4
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.stats.map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter + search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          {/* Status tabs */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {config.tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === t.key ? t.activeColor : t.color + " hover:opacity-80"
                }`}>
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === t.key ? "bg-white/20 text-current" : "bg-white/60 text-gray-600"
                }`}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Search row */}
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">ค้นหา (รหัส / ชื่อ / สินค้า)</label>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="พิมพ์รหัสหรือชื่อ..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ตั้งแต่วันที่</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ถึงวันที่</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
            </div>
            <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setActiveTab(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              ล้างค่า
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              รายการ <span className="text-admin-primary font-bold">{filteredRows.length}</span> รายการ
              {activeTab && (
                <span className="ml-2 text-xs text-gray-400">
                  (กรอง: {config.tabs.find(t => t.key === activeTab)?.label})
                </span>
              )}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-500 text-left">
                  {config.columns.map(c => (
                    <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 font-semibold">ดูรายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="px-4 py-10 text-center text-sm text-gray-400">
                      ไม่พบรายการ {search && `"${search}"`}
                    </td>
                  </tr>
                )}
                {filteredRows.map(row => (
                  <tr key={row.id} className="hover:bg-admin-surface/30 transition-colors">
                    {config.columns.map(col => (
                      <td key={col.key} className="px-4 py-3">
                        {col.key === "code" ? (
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{row[col.key] as string}</span>
                        ) : col.key === "status" ? (
                          <StatusBadge status={row.status} />
                        ) : col.key === "amount" ? (
                          <span className="font-mono text-sm font-semibold text-gray-700">{row[col.key] as string}</span>
                        ) : col.key === "user" ? (
                          <span className="font-medium text-gray-800">{row[col.key] as string}</span>
                        ) : (
                          <span className="text-gray-600">{row[col.key] as string}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Link href={config.rowLink(row.id)}
                        className="text-xs text-admin-primary hover:text-admin-dark font-medium flex items-center gap-1 group">
                        ดูรายละเอียด
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
