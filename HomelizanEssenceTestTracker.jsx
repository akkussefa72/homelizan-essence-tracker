import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Copy,
  Database,
  Download,
  Eye,
  FileDown,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { isSupabaseReady, supabase } from "./src/lib/supabase";

const KEY = "homelizan_tests_clean_v1";
const OLD_KEYS = [
  "homelizan_tests_v3",
  "homelizan_essence_reed_diffuser_tests_v2",
  "homelizan_essence_reed_diffuser_tests_v1",
];

const formulas = [
  "Etil+Esans",
  "Etil+Esans+Dpm",
  "Etil+Esans+Dpm+Dpg",
  "Etil+Augeo+Dpm+Dpg",
  "Augeo+Esans",
  "Auego+Esans+Dpm",
  "Auego+Esans+Dpm+Dpg",
];
const statuses = ["Takipte", "Başarılı", "Başarısız", "Tekrar Denenecek"];
const formulaSet = new Set(formulas);
const statusSet = new Set(statuses);
const reportTypes = [
  { id: "cards", label: "Kartlı Rapor" },
  { id: "table", label: "Tablo Raporu" },
  { id: "summaryCards", label: "Özet + Kartlı Rapor" },
];
const pdfDefaults = {
  reportType: "cards",
  source: "all",
  essence: "Tümü",
  alcohol: "Tümü",
  status: "Tümü",
  includeSummary: true,
  includeFormulaPercentages: true,
  includeCalculatedMl: true,
  includeNotes: true,
  includeDate: true,
  includeStatusColors: true,
};
const SUPABASE_FALLBACK_TEXT = "Supabase bağlantı hatası. Yerel yedek kullanılabilir.";
const SAMPLE_KEY = "homelizan_sample_tests_v1";
const SAMPLE_SECTION_KEY = "homelizan_sample_sections_v1";
const sampleBlank = {
  id: null,
  name: "",
  smallRoom: 0,
  bathroom: 0,
  largeRoom: 0,
  continuity: 0,
  notes: "",
};
const sampleSectionBlank = {
  id: null,
  name: "",
};
const roleOptions = ["admin", "editor", "viewer"];
const sampleBands = {
  smallRoom: {
    title: "Küçük-Orta Oda Yayılımı",
    max: 25,
    lines: [
      { text: "Çok zayıf, burna zor geliyor", range: "1-5", recommended: 3 },
      { text: "Hissediliyor ama zayıf", range: "6-10", recommended: 8 },
      { text: "Net hissediliyor", range: "11-15", recommended: 13 },
      { text: "Güçlü ve tatmin edici", range: "16-20", recommended: 18 },
      { text: "Küçük-orta odayı rahat dolduruyor", range: "21-25", recommended: 23 },
    ],
  },
  bathroom: {
    title: "Banyo Yayılımı",
    max: 20,
    lines: [
      { text: "Çok zayıf, burna zor geliyor", range: "1-4", recommended: 3 },
      { text: "Hissediliyor ama zayıf", range: "5-8", recommended: 6 },
      { text: "Net hissediliyor", range: "9-12", recommended: 10 },
      { text: "Güçlü ve tatmin edici", range: "13-16", recommended: 14 },
      { text: "Banyoyu rahat dolduruyor", range: "17-20", recommended: 18 },
    ],
  },
  largeRoom: {
    title: "Büyük Oda Yayılımı",
    max: 35,
    lines: [
      { text: "Neredeyse yayılmıyor", range: "1-7", recommended: 4 },
      { text: "Sadece yakından hissediliyor", range: "8-14", recommended: 11 },
      { text: "Odaya girince hafif fark ediliyor", range: "15-21", recommended: 18 },
      { text: "Odayı dengeli şekilde dolduruyor", range: "22-28", recommended: 25 },
      { text: "Büyük odada net ve güçlü yayılıyor", range: "29-35", recommended: 32 },
    ],
  },
  continuity: {
    title: "12-24 Saat Yayılım Devamlılığı",
    max: 20,
    lines: [
      { text: "İlk saatten sonra ciddi düşüyor", range: "1-4", recommended: 3 },
      { text: "6-12 saat içinde belirgin zayıflıyor", range: "5-8", recommended: 6 },
      { text: "12-24 saate kadar kabul edilebilir kalıyor", range: "9-12", recommended: 10 },
      { text: "24 saat boyunca dengeli hissediliyor", range: "13-16", recommended: 14 },
      { text: "24 saat sonunda hâlâ net yayılım var", range: "17-20", recommended: 18 },
    ],
  },
};

function supabaseErrorText(err) {
  const message =
    err?.message ||
    err?.error_description ||
    err?.details ||
    err?.hint ||
    (typeof err === "string" ? err : "");
  return message ? `${SUPABASE_FALLBACK_TEXT} (${message})` : SUPABASE_FALLBACK_TEXT;
}

const blank = {
  id: null,
  date: new Date().toISOString().slice(0, 10),
  testName: "",
  essence: "",
  alcohol: "",
  formula: "Etil+Esans",
  totalMl: 40,
  essencePct: "",
  alcoholPct: "",
  dpmPct: "",
  dpgPct: "",
  augeoPct: "",
  status: "Takipte",
  notes: "",
};

const n = (v) => {
  const x = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
};

const uid = () => `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const clean = (v) => String(v || "").trim();
const pctTotal = (t) =>
  n(t.essencePct) + n(t.alcoholPct) + n(t.dpmPct) + n(t.dpgPct) + n(t.augeoPct);
const ml = (pct, total) => ((n(pct) * n(total)) / 100).toFixed(2);
const formatDate = (v) => v || "-";

function statusPdfTone(status) {
  if (status === "Başarılı") return { fill: [236, 253, 245], text: [6, 95, 70], border: [110, 231, 183] };
  if (status === "Başarısız") return { fill: [255, 241, 242], text: [159, 18, 57], border: [253, 164, 175] };
  if (status === "Tekrar Denenecek") return { fill: [255, 251, 235], text: [146, 64, 14], border: [252, 211, 77] };
  return { fill: [239, 246, 255], text: [30, 64, 175], border: [147, 197, 253] };
}

function shortFormula(v) {
  const map = {
    "Etil Alkol + Esans": "Etil+Esans",
    "Alkol+Esans": "Etil+Esans",
    "Sade": "Etil+Esans",
    "Etil Alkol + DPM + Esans": "Etil+Esans+Dpm",
    "Alkol+Esans+Dpm": "Etil+Esans+Dpm",
    "DPM": "Etil+Esans+Dpm",
    "Etil Alkol + DPG + Esans": "Etil+Esans+Dpm+Dpg",
    "Alkol+Esans+Dpm+Dpg": "Etil+Esans+Dpm+Dpg",
    "DPG": "Etil+Esans+Dpm+Dpg",
    "Etil Alkol + DPM + DPG + Esans": "Etil+Esans+Dpm+Dpg",
    "DPM+DPG": "Etil+Esans+Dpm+Dpg",
    "Etil Alkol + Augeo + DPM + DPG + Esans": "Etil+Augeo+Dpm+Dpg",
    "Alkol+Augeo+Dpm+Dpg": "Etil+Augeo+Dpm+Dpg",
    "Etil Alkol + Augeo + Esans": "Augeo+Esans",
    "Augeo": "Augeo+Esans",
    "Etil Alkol + Augeo + DPM + Esans": "Auego+Esans+Dpm",
    "Augeo + DPM + Esans": "Auego+Esans+Dpm",
    "Augeo+DPM": "Auego+Esans+Dpm",
    "Augeo Ana": "Auego+Esans+Dpm",
    "Augeo + DPM + DPG + Esans": "Auego+Esans+Dpm+Dpg",
    "Auego+Esans+Dpm+Dpg": "Auego+Esans+Dpm+Dpg",
    "Özel Formül": "Etil+Esans",
    "Özel": "Etil+Esans",
  };
  return map[v] || v || "Etil+Esans";
}

function formulaText(t) {
  const parts = [];
  if (n(t.essencePct)) parts.push(`Esans ${n(t.essencePct)}%`);
  if (n(t.alcoholPct)) parts.push(`Alkol ${n(t.alcoholPct)}%`);
  if (n(t.dpmPct)) parts.push(`DPM ${n(t.dpmPct)}%`);
  if (n(t.dpgPct)) parts.push(`DPG ${n(t.dpgPct)}%`);
  if (n(t.augeoPct)) parts.push(`Augeo ${n(t.augeoPct)}%`);
  return parts.join(" · ") || "Oran girilmedi";
}

function statusClass(status) {
  if (status === "Başarılı") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Başarısız") return "bg-rose-100 text-rose-700 border-rose-200";
  if (status === "Tekrar Denenecek") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

function safeParse(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function normalize(t = {}) {
  const total = n(t.totalMl) > 0 ? n(t.totalMl) : 40;
  const fromMl = (pct, amount) => {
    if (pct !== undefined && pct !== null && pct !== "") return String(pct).replace(",", ".");
    if (amount !== undefined && amount !== null && amount !== "") {
      return ((n(amount) / total) * 100).toFixed(1);
    }
    return "";
  };
  const formula = shortFormula(t.formula || t.formulaType || "Etil+Esans");
  const status = t.status || t.resultStatus || "Takipte";
  return {
    ...blank,
    ...t,
    id: t.id || uid(),
    date: t.date || blank.date,
    testName: clean(t.testName),
    essence: clean(t.essence || t.essenceName),
    alcohol: clean(t.alcohol || t.alcoholType),
    formula: formulaSet.has(formula) ? formula : "Etil+Esans",
    totalMl: total,
    essencePct: fromMl(t.essencePct ?? t.essencePercent, t.essenceMl),
    alcoholPct: fromMl(t.alcoholPct ?? t.ethylAlcoholPercent, t.ethylAlcoholMl),
    dpmPct: fromMl(t.dpmPct ?? t.dpmPercent, t.dpmMl),
    dpgPct: fromMl(t.dpgPct ?? t.dpgPercent, t.dpgMl),
    augeoPct: fromMl(t.augeoPct ?? t.augeoPercent, t.augeoMl),
    status: statusSet.has(status) ? status : "Takipte",
    notes: String(t.notes || "").trim(),
  };
}

function loadLocalBackup() {
  try {
    const primary = localStorage.getItem(KEY);
    const fallback = OLD_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
    const raw = primary || fallback;
    const parsed = raw ? safeParse(raw) : null;
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch (e) {
    console.error("Yerel yedek okunamadı", e);
    return [];
  }
}

function toDbRow(t) {
  return {
    id: t.id,
    date: t.date || blank.date,
    testName: clean(t.testName),
    essence: clean(t.essence),
    alcohol: clean(t.alcohol),
    formula: shortFormula(t.formula || "Etil+Esans"),
    totalMl: n(t.totalMl) || 40,
    essencePct: t.essencePct === "" ? null : n(t.essencePct),
    alcoholPct: t.alcoholPct === "" ? null : n(t.alcoholPct),
    dpmPct: t.dpmPct === "" ? null : n(t.dpmPct),
    dpgPct: t.dpgPct === "" ? null : n(t.dpgPct),
    augeoPct: t.augeoPct === "" ? null : n(t.augeoPct),
    status: statusSet.has(t.status) ? t.status : "Takipte",
    notes: String(t.notes || "").trim(),
  };
}

function normalizeSample(row = {}) {
  return {
    ...sampleBlank,
    ...row,
    id: row.id || uid(),
    section_id: row.section_id || null,
    name: clean(row.name),
    smallRoom: n(row.smallRoom),
    bathroom: n(row.bathroom),
    largeRoom: n(row.largeRoom),
    continuity: n(row.continuity),
    notes: String(row.notes || "").trim(),
  };
}

function normalizeSampleSection(row = {}) {
  return {
    ...sampleSectionBlank,
    ...row,
    id: row.id || uid(),
    name: clean(row.name) || "Yeni Bölüm",
  };
}

function sampleTotal(t) {
  return n(t.smallRoom) + n(t.bathroom) + n(t.largeRoom) + n(t.continuity);
}

function sampleDecision(total) {
  if (total >= 85) return "Güçlü yayılım, satışa uygun";
  if (total >= 75) return "İyi yayılım, tekrar test edilebilir";
  if (total >= 65) return "Orta yayılım, dikkatli değerlendir";
  if (total >= 55) return "Zayıf yayılım, revize gerekebilir";
  return "Eleme adayı";
}

function sampleDecisionTone(total) {
  if (total >= 85) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (total >= 75) return "bg-sky-100 text-sky-700 border-sky-200";
  if (total >= 65) return "bg-violet-100 text-violet-700 border-violet-200";
  if (total >= 55) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
}

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  return roleOptions.includes(value) ? value : "viewer";
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Button({ children, className = "", variant = "solid", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
  const styles =
    variant === "solid"
      ? "bg-slate-900 text-white hover:bg-slate-700"
      : variant === "ghost"
        ? "text-slate-600 hover:bg-slate-100"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Badge({ children, status }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}>
      {children}
    </span>
  );
}

export default function HomelizanEssenceTestTracker() {
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(blank);
  const [page, setPage] = useState("formulaRecord");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [sortBy, setSortBy] = useState("date");
  const [selectedId, setSelectedId] = useState(null);
  const [aEssence, setAEssence] = useState("Tümü");
  const [aAlcohol, setAAlcohol] = useState("Tümü");
  const [aView, setAView] = useState("cards");
  const [aSearch, setASearch] = useState("");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfOptions, setPdfOptions] = useState(pdfDefaults);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [sampleTests, setSampleTests] = useState([]);
  const [sampleLoading, setSampleLoading] = useState(true);
  const [sampleError, setSampleError] = useState("");
  const [sampleDraft, setSampleDraft] = useState(sampleBlank);
  const [sampleSearch, setSampleSearch] = useState("");
  const [sampleDecisionFilter, setSampleDecisionFilter] = useState("Tümü");
  const [sampleMin, setSampleMin] = useState("");
  const [sampleMax, setSampleMax] = useState("");
  const [sampleAnalysisView, setSampleAnalysisView] = useState("summary");
  const [sampleSections, setSampleSections] = useState([]);
  const [selectedSampleSectionId, setSelectedSampleSectionId] = useState(null);
  const [sampleSectionName, setSampleSectionName] = useState("");
  const [currentRole, setCurrentRole] = useState("viewer");
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const canManageUsers = currentRole === "admin";
  const canWrite = currentRole === "admin" || currentRole === "editor";
  const connectionStatus = !loading && !supabaseError;

  useEffect(() => {
    if (!canManageUsers && page === "admin") {
      setPage("formulaRecord");
    }
  }, [canManageUsers, page]);

  useEffect(() => {
    let active = true;
    async function initAuth() {
      if (!isSupabaseReady) {
        if (!active) return;
        setAuthReady(true);
        setUser(null);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setUser(data?.session?.user ?? null);
      setAuthReady(true);
    }
    initAuth();
    const { data: sub } = isSupabaseReady
      ? supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setAuthReady(true);
        })
      : { data: null };
    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadCurrentRole() {
      if (!authReady) return;
      if (!user) {
        if (!active) return;
        setCurrentRole("viewer");
        setRoleLoading(false);
        setRoleError("");
        return;
      }
      if (!isSupabaseReady) {
        if (!active) return;
        setCurrentRole("viewer");
        setRoleLoading(false);
        setRoleError(`${SUPABASE_FALLBACK_TEXT} (user_roles)`);
        return;
      }
      setRoleLoading(true);
      setRoleError("");
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("user_id, email, role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          const row = {
            user_id: user.id,
            email: user.email || "",
            role: "viewer",
            updated_at: new Date().toISOString(),
          };
          const { error: insertError } = await supabase.from("user_roles").insert([row]);
          if (insertError && !String(insertError.message || "").toLowerCase().includes("duplicate")) {
            throw insertError;
          }
          if (!active) return;
          setCurrentRole("viewer");
        } else {
          if (!active) return;
          setCurrentRole(normalizeRole(data.role));
        }
      } catch (e) {
        console.error("user_roles okunamadı", e);
        if (!active) return;
        setCurrentRole("viewer");
        setRoleError(supabaseErrorText(e));
      } finally {
        if (active) setRoleLoading(false);
      }
    }
    loadCurrentRole();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  useEffect(() => {
    let active = true;
    async function loadUserRoles() {
      if (!authReady || !user || !isSupabaseReady || !canManageUsers) {
        if (active) setUserRoles([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("user_id, email, role, created_at, updated_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!active) return;
        setUserRoles(Array.isArray(data) ? data.map((x) => ({ ...x, role: normalizeRole(x.role) })) : []);
      } catch (e) {
        console.error("Kullanıcı rolleri alınamadı", e);
        if (!active) return;
        setRoleError(supabaseErrorText(e));
      }
    }
    loadUserRoles();
    return () => {
      active = false;
    };
  }, [authReady, user, canManageUsers]);

  useEffect(() => {
    let active = true;
    async function loadTests() {
      if (!authReady) return;
      if (!isSupabaseReady) {
        if (!active) return;
        setTests(loadLocalBackup());
        setSupabaseError(`${SUPABASE_FALLBACK_TEXT} (VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY eksik)`);
        setLoading(false);
        return;
      }
      if (!user) {
        if (!active) return;
        setTests([]);
        setSupabaseError("");
        setLoading(false);
        return;
      }
      setLoading(true);
      setSupabaseError("");
      const localBackup = loadLocalBackup();
      try {
        const { data, error } = await supabase.from("tests").select("*").order("date", { ascending: false });
        if (error) throw error;
        if (!active) return;
        const remote = Array.isArray(data) ? data.map(normalize) : [];
        setTests(remote);
      } catch (e) {
        console.error("Supabase kayıtları alınamadı", e);
        if (!active) return;
        setTests(localBackup);
        setSupabaseError(supabaseErrorText(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTests();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  useEffect(() => {
    let active = true;
    async function loadSampleSections() {
      if (!authReady) return;
      if (!isSupabaseReady) {
        if (!active) return;
        const localSections = safeParse(localStorage.getItem(SAMPLE_SECTION_KEY) || "[]");
        const normalizedSections = Array.isArray(localSections)
          ? localSections.map(normalizeSampleSection)
          : [];
        setSampleSections(normalizedSections);
        setSelectedSampleSectionId((prev) => prev || normalizedSections[0]?.id || null);
        setSampleError(`${SUPABASE_FALLBACK_TEXT} (sample_sections)`);
        return;
      }
      if (!user) {
        if (!active) return;
        setSampleSections([]);
        setSelectedSampleSectionId(null);
        return;
      }
      try {
        const { data, error } = await supabase.from("sample_sections").select("*").order("created_at", { ascending: true });
        if (error) throw error;
        if (!active) return;
        const sections = Array.isArray(data) ? data.map(normalizeSampleSection) : [];
        setSampleSections(sections);
        setSelectedSampleSectionId((prev) => prev || sections[0]?.id || null);
      } catch (e) {
        console.error("sample_sections okunamadı", e);
        if (!active) return;
        const localSections = safeParse(localStorage.getItem(SAMPLE_SECTION_KEY) || "[]");
        const normalizedSections = Array.isArray(localSections)
          ? localSections.map(normalizeSampleSection)
          : [];
        setSampleSections(normalizedSections);
        setSelectedSampleSectionId((prev) => prev || normalizedSections[0]?.id || null);
        setSampleError(supabaseErrorText(e));
      }
    }
    loadSampleSections();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  useEffect(() => {
    let active = true;
    async function loadSampleTests() {
      if (!authReady) return;
      if (!selectedSampleSectionId) {
        setSampleTests([]);
        setSampleLoading(false);
        return;
      }
      if (!isSupabaseReady) {
        if (!active) return;
        const local = safeParse(localStorage.getItem(SAMPLE_KEY) || "[]");
        const tests = Array.isArray(local) ? local.map(normalizeSample) : [];
        setSampleTests(tests.filter((x) => x.section_id === selectedSampleSectionId));
        setSampleError(`${SUPABASE_FALLBACK_TEXT} (sample_tests)`);
        setSampleLoading(false);
        return;
      }
      if (!user) {
        if (!active) return;
        setSampleTests([]);
        setSampleError("");
        setSampleLoading(false);
        return;
      }
      setSampleLoading(true);
      setSampleError("");
      try {
        const { data, error } = await supabase
          .from("sample_tests")
          .select("*")
          .eq("section_id", selectedSampleSectionId)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        if (!active) return;
        setSampleTests(
          Array.isArray(data)
            ? data.map(normalizeSample).filter((x) => x.section_id === selectedSampleSectionId)
            : [],
        );
      } catch (e) {
        console.error("sample_tests okunamadı", e);
        if (!active) return;
        const local = safeParse(localStorage.getItem(SAMPLE_KEY) || "[]");
        const tests = Array.isArray(local) ? local.map(normalizeSample) : [];
        setSampleTests(tests.filter((x) => x.section_id === selectedSampleSectionId));
        setSampleError(supabaseErrorText(e));
      } finally {
        if (active) setSampleLoading(false);
      }
    }
    loadSampleTests();
    return () => {
      active = false;
    };
  }, [authReady, user, selectedSampleSectionId]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(tests));
    } catch (e) {
      console.error("Kayıtlar yazılamadı", e);
    }
  }, [tests]);

  useEffect(() => {
    try {
      const existing = safeParse(localStorage.getItem(SAMPLE_KEY) || "[]");
      const all = Array.isArray(existing) ? existing.map(normalizeSample) : [];
      if (!selectedSampleSectionId) {
        return;
      }
      const scoped = sampleTests.map(normalizeSample).filter((x) => x.section_id === selectedSampleSectionId);
      if (scoped.length !== sampleTests.length) {
        return;
      }
      const merged = [
        ...all.filter((x) => x.section_id !== selectedSampleSectionId),
        ...scoped,
      ];
      localStorage.setItem(SAMPLE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.error("Numune yedeği yazılamadı", e);
    }
  }, [sampleTests, selectedSampleSectionId]);

  useEffect(() => {
    try {
      localStorage.setItem(SAMPLE_SECTION_KEY, JSON.stringify(sampleSections));
    } catch (e) {
      console.error("Numune bölüm yedeği yazılamadı", e);
    }
  }, [sampleSections]);

  useEffect(() => {
    if (!selectedSampleSectionId && sampleSections.length > 0) {
      setSelectedSampleSectionId(sampleSections[0].id);
      return;
    }
    if (selectedSampleSectionId && !sampleSections.some((x) => x.id === selectedSampleSectionId)) {
      setSelectedSampleSectionId(sampleSections[0]?.id || null);
    }
  }, [sampleSections, selectedSampleSectionId]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const totalPct = pctTotal(form);
  const calc = {
    essenceMl: ml(form.essencePct, form.totalMl),
    alcoholMl: ml(form.alcoholPct, form.totalMl),
    dpmMl: ml(form.dpmPct, form.totalMl),
    dpgMl: ml(form.dpgPct, form.totalMl),
    augeoMl: ml(form.augeoPct, form.totalMl),
  };
  const totalMl = Object.values(calc).reduce((s, v) => s + n(v), 0);

  const essences = useMemo(
    () => [...new Set(tests.map((t) => clean(t.essence)).filter(Boolean))].sort(),
    [tests],
  );
  const alcohols = useMemo(
    () => [...new Set(tests.map((t) => clean(t.alcohol)).filter(Boolean))].sort(),
    [tests],
  );

  const filtered = useMemo(() => {
    let arr = [...tests];
    const s = q.toLowerCase().trim();
    if (s) {
      arr = arr.filter((t) =>
        [t.testName, t.essence, t.alcohol, t.formula, t.status, t.notes]
          .join(" ")
          .toLowerCase()
          .includes(s),
      );
    }
    if (statusFilter !== "Tümü") arr = arr.filter((t) => t.status === statusFilter);
    if (sortBy === "date") arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortBy === "essence") arr.sort((a, b) => a.essence.localeCompare(b.essence));
    if (sortBy === "alcohol") arr.sort((a, b) => a.alcohol.localeCompare(b.alcohol));
    if (sortBy === "formula") arr.sort((a, b) => a.formula.localeCompare(b.formula));
    return arr;
  }, [tests, q, statusFilter, sortBy]);

  const selected = tests.find((t) => t.id === selectedId) || filtered[0] || null;

  const analysisTests = useMemo(() => {
    const s = aSearch.toLowerCase().trim();
    return tests.filter((t) => {
      const okEss = aEssence === "Tümü" || t.essence === aEssence;
      const okAlc = aAlcohol === "Tümü" || t.alcohol === aAlcohol;
      const okSearch =
        !s ||
        [t.testName, t.essence, t.alcohol, t.formula, t.status, t.notes]
          .join(" ")
          .toLowerCase()
          .includes(s);
      return okEss && okAlc && okSearch;
    });
  }, [tests, aEssence, aAlcohol, aSearch]);

  const groups = useMemo(() => {
    const map = new Map();
    analysisTests.forEach((t) => {
      const k = `${t.essence || "Belirtilmemiş"}|${t.alcohol || "Belirtilmemiş"}`;
      if (!map.has(k)) {
        map.set(k, {
          essence: t.essence || "Belirtilmemiş",
          alcohol: t.alcohol || "Belirtilmemiş",
          tests: [],
        });
      }
      map.get(k).tests.push(t);
    });
    return [...map.values()]
      .map((g) => ({
        ...g,
        tests: [...g.tests].sort((a, b) => new Date(b.date) - new Date(a.date)),
      }))
      .sort((a, b) =>
        `${a.essence} ${a.alcohol}`.localeCompare(`${b.essence} ${b.alcohol}`),
      );
  }, [analysisTests]);

  const formulaSummary = useMemo(() => summaryBy(analysisTests, "formula"), [analysisTests]);
  const alcoholSummary = useMemo(() => summaryBy(analysisTests, "alcohol"), [analysisTests]);

  const stats = {
    total: tests.length,
    essences: essences.length,
    alcohols: alcohols.length,
    combos: new Set(tests.map((t) => `${t.essence}|${t.alcohol}|${t.formula}`)).size,
    success: tests.filter((t) => t.status === "Başarılı").length,
  };

  const sampleFiltered = useMemo(() => {
    const s = sampleSearch.toLowerCase().trim();
    const min = sampleMin === "" ? null : n(sampleMin);
    const max = sampleMax === "" ? null : n(sampleMax);
    return sampleTests
      .filter((x) => (!s ? true : `${x.name} ${x.notes}`.toLowerCase().includes(s)))
      .filter((x) => {
        const decision = sampleDecision(sampleTotal(x));
        return sampleDecisionFilter === "Tümü" ? true : decision === sampleDecisionFilter;
      })
      .filter((x) => (min === null ? true : sampleTotal(x) >= min))
      .filter((x) => (max === null ? true : sampleTotal(x) <= max))
      .sort((a, b) => sampleTotal(b) - sampleTotal(a));
  }, [sampleTests, sampleSearch, sampleDecisionFilter, sampleMin, sampleMax]);

  const sampleSummary = useMemo(() => {
    const total = sampleTests.length;
    const totalScore = sampleTests.reduce((sum, x) => sum + sampleTotal(x), 0);
    const best = [...sampleTests].sort((a, b) => sampleTotal(b) - sampleTotal(a))[0] || null;
    const counts = {
      strong: 0,
      good: 0,
      medium: 0,
      weak: 0,
      rejected: 0,
    };
    sampleTests.forEach((x) => {
      const score = sampleTotal(x);
      if (score >= 85) counts.strong += 1;
      else if (score >= 75) counts.good += 1;
      else if (score >= 65) counts.medium += 1;
      else if (score >= 55) counts.weak += 1;
      else counts.rejected += 1;
    });
    const avgBy = (field) =>
      total ? (sampleTests.reduce((sum, x) => sum + n(x[field]), 0) / total).toFixed(1) : "0.0";
    return {
      total,
      avg: total ? (totalScore / total).toFixed(1) : "0.0",
      best,
      counts,
      avgSmall: avgBy("smallRoom"),
      avgBath: avgBy("bathroom"),
      avgLarge: avgBy("largeRoom"),
      avgContinuity: avgBy("continuity"),
    };
  }, [sampleTests]);

  const formulaStatusSummary = useMemo(
    () =>
      statuses.map((label) => ({
        label,
        value: tests.filter((t) => t.status === label).length,
      })),
    [tests],
  );

  const sampleDecisionSummary = useMemo(
    () =>
      sampleDecisionOptions.map((label) => ({
        label,
        value: sampleTests.filter((x) => sampleDecision(sampleTotal(x)) === label).length,
      })),
    [sampleTests],
  );

  const topEssenceSummary = useMemo(() => summaryBy(tests, "essence").slice(0, 6), [tests]);
  const topAlcoholSummary = useMemo(() => summaryBy(tests, "alcohol").slice(0, 6), [tests]);
  const selectedSampleSectionName = useMemo(
    () => sampleSections.find((x) => x.id === selectedSampleSectionId)?.name || "Bölüm seçili değil",
    [sampleSections, selectedSampleSectionId],
  );

  function setPdfField(field, value) {
    setPdfOptions((prev) => ({ ...prev, [field]: value }));
  }

  function getExportTests(opts) {
    const base = opts.source === "analysis" ? analysisTests : tests;
    return base
      .filter((t) => (opts.essence === "Tümü" ? true : t.essence === opts.essence))
      .filter((t) => (opts.alcohol === "Tümü" ? true : t.alcohol === opts.alcohol))
      .filter((t) => (opts.status === "Tümü" ? true : t.status === opts.status))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function applyLocalUpsert(item) {
    setTests((old) =>
      old.some((x) => x.id === item.id)
        ? old.map((x) => (x.id === item.id ? item : x))
        : [item, ...old],
    );
  }

  function applyLocalDelete(testId) {
    setTests((old) => old.filter((x) => x.id !== testId));
  }

  function summaryBy(list, field) {
    const map = new Map();
    list.forEach((t) => {
      const k = clean(t[field]) || "Belirtilmemiş";
      if (!map.has(k)) {
        map.set(k, { name: k, total: 0, success: 0, tracking: 0, fail: 0, repeat: 0 });
      }
      const x = map.get(k);
      x.total += 1;
      if (t.status === "Başarılı") x.success += 1;
      if (t.status === "Takipte") x.tracking += 1;
      if (t.status === "Başarısız") x.fail += 1;
      if (t.status === "Tekrar Denenecek") x.repeat += 1;
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  function denyWrite() {
    alert("İzleyici modunda düzenleme işlemi yapılamaz.");
  }

  async function updateUserRole(userId, nextRole) {
    if (!canManageUsers) {
      denyWrite();
      return;
    }
    const role = normalizeRole(nextRole);
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error } = await supabase
        .from("user_roles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
      setRoleError("");
      setUserRoles((old) => old.map((x) => (x.user_id === userId ? { ...x, role } : x)));
      if (userId === user?.id) setCurrentRole(role);
    } catch (e) {
      console.error("Rol güncelleme hatası", e);
      setRoleError(supabaseErrorText(e));
    }
  }

  async function save() {
    if (!canWrite) {
      denyWrite();
      return;
    }
    const item = normalize({
      ...form,
      essenceMl: calc.essenceMl,
      ethylAlcoholMl: calc.alcoholMl,
      dpmMl: calc.dpmMl,
      dpgMl: calc.dpgMl,
      augeoMl: calc.augeoMl,
      id: form.id || uid(),
    });
    const exists = tests.some((x) => x.id === item.id);
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      if (exists) {
        const { error } = await supabase.from("tests").update(toDbRow(item)).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tests").insert([toDbRow(item)]);
        if (error) throw error;
      }
      setSupabaseError("");
      applyLocalUpsert(item);
    } catch (e) {
      console.error("Supabase kaydetme hatası", e);
      setSupabaseError(supabaseErrorText(e));
      applyLocalUpsert(item);
    }
    setSelectedId(item.id);
    setForm(blank);
  }

  function edit(t) {
    setForm(normalize(t));
    setSelectedId(t.id);
    setPage("formulaRecord");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function duplicate(t) {
    if (!canWrite) {
      denyWrite();
      return;
    }
    const copy = normalize({
      ...t,
      id: uid(),
      testName: `${t.testName || t.essence || "Test"} - Kopya`,
      date: blank.date,
      status: "Takipte",
    });
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error } = await supabase.from("tests").insert([toDbRow(copy)]);
      if (error) throw error;
      setSupabaseError("");
      applyLocalUpsert(copy);
    } catch (e) {
      console.error("Supabase kopyalama hatası", e);
      setSupabaseError(supabaseErrorText(e));
      applyLocalUpsert(copy);
    }
    setSelectedId(copy.id);
  }

  async function remove(testId) {
    if (!canWrite) {
      denyWrite();
      return;
    }
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error } = await supabase.from("tests").delete().eq("id", testId);
      if (error) throw error;
      setSupabaseError("");
      applyLocalDelete(testId);
    } catch (e) {
      console.error("Supabase silme hatası", e);
      setSupabaseError(supabaseErrorText(e));
      applyLocalDelete(testId);
    }
    if (selectedId === testId) setSelectedId(null);
  }

  async function createSampleSection() {
    if (!canWrite) {
      denyWrite();
      return;
    }
    const name = clean(sampleSectionName);
    if (!name) return;
    const section = normalizeSampleSection({ id: uid(), name });
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error } = await supabase.from("sample_sections").insert([{ id: section.id, name: section.name }]);
      if (error) throw error;
      setSampleError("");
    } catch (e) {
      console.error("sample_sections oluşturma hatası", e);
      setSampleError(supabaseErrorText(e));
    }
    setSampleSections((old) => [...old, section]);
    setSelectedSampleSectionId(section.id);
    setSampleSectionName("");
  }

  async function renameSampleSection(id, name) {
    if (!canWrite) {
      denyWrite();
      return;
    }
    const nextName = clean(name);
    if (!nextName) return;
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error } = await supabase.from("sample_sections").update({ name: nextName }).eq("id", id);
      if (error) throw error;
      setSampleError("");
    } catch (e) {
      console.error("sample_sections güncelleme hatası", e);
      setSampleError(supabaseErrorText(e));
    }
    setSampleSections((old) => old.map((x) => (x.id === id ? { ...x, name: nextName } : x)));
  }

  async function deleteSampleSection(id) {
    if (!canWrite) {
      denyWrite();
      return;
    }
    if (!id) return;
    const remain = sampleSections.filter((x) => x.id !== id);
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error: testDeleteError } = await supabase.from("sample_tests").delete().eq("section_id", id);
      if (testDeleteError) throw testDeleteError;
      const { error } = await supabase.from("sample_sections").delete().eq("id", id);
      if (error) throw error;
      setSampleError("");
    } catch (e) {
      console.error("sample_sections silme hatası", e);
      setSampleError(supabaseErrorText(e));
    }
    setSampleSections(remain);
    setSelectedSampleSectionId(remain[0]?.id || null);
    if (selectedSampleSectionId === id) setSampleTests([]);
    try {
      const existing = safeParse(localStorage.getItem(SAMPLE_KEY) || "[]");
      const next = Array.isArray(existing)
        ? existing.map(normalizeSample).filter((x) => x.section_id !== id)
        : [];
      localStorage.setItem(SAMPLE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Yerel numune bölüm temizleme hatası", e);
    }
  }

  async function saveSample(item) {
    if (!canWrite) {
      denyWrite();
      return null;
    }
    if (!selectedSampleSectionId) {
      setSampleError("Önce bir numune bölümü oluştur veya seç.");
      return null;
    }
    const next = normalizeSample(item);
    const payload = {
      id: next.id || uid(),
      section_id: selectedSampleSectionId,
      name: next.name || "İsimsiz Numune",
      smallRoom: n(next.smallRoom),
      bathroom: n(next.bathroom),
      largeRoom: n(next.largeRoom),
      continuity: n(next.continuity),
      notes: next.notes || "",
      updated_at: new Date().toISOString(),
    };
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error } = await supabase.from("sample_tests").upsert([payload], { onConflict: "id" });
      if (error) throw error;
      setSampleError("");
      const synced = normalizeSample(payload);
      setSampleTests((old) =>
        old.some((x) => x.id === synced.id) ? old.map((x) => (x.id === synced.id ? synced : x)) : [synced, ...old],
      );
      return synced;
    } catch (e) {
      console.error("sample_tests kaydetme hatası", e);
      setSampleError(supabaseErrorText(e));
      const synced = normalizeSample(payload);
      setSampleTests((old) =>
        old.some((x) => x.id === synced.id) ? old.map((x) => (x.id === synced.id ? synced : x)) : [synced, ...old],
      );
      return synced;
    }
  }

  async function deleteSample(id) {
    if (!canWrite) {
      denyWrite();
      return;
    }
    try {
      if (!isSupabaseReady) throw new Error("supabase_not_ready");
      const { error } = await supabase.from("sample_tests").delete().eq("id", id);
      if (error) throw error;
      setSampleError("");
    } catch (e) {
      console.error("sample_tests silme hatası", e);
      setSampleError(supabaseErrorText(e));
    }
    setSampleTests((old) => old.filter((x) => x.id !== id));
  }

  async function exportSampleJson() {
    const blob = new Blob([JSON.stringify(sampleTests, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homelizan-numune-testleri-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function importSampleJson(e) {
    if (!canWrite) {
      denyWrite();
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = safeParse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("bad_json");
        if (!selectedSampleSectionId) throw new Error("no_section");
        const next = data.map((x) =>
          normalizeSample({ ...x, id: x.id || uid(), section_id: selectedSampleSectionId }),
        );
        try {
          if (!isSupabaseReady) throw new Error("supabase_not_ready");
          const rows = next.map((x) => ({
            id: x.id,
            section_id: selectedSampleSectionId,
            name: x.name,
            smallRoom: n(x.smallRoom),
            bathroom: n(x.bathroom),
            largeRoom: n(x.largeRoom),
            continuity: n(x.continuity),
            notes: x.notes || "",
            updated_at: new Date().toISOString(),
          }));
          const { error } = await supabase.from("sample_tests").upsert(rows, { onConflict: "id" });
          if (error) throw error;
          setSampleError("");
        } catch (supErr) {
          console.error("sample_tests import hatası", supErr);
          setSampleError(supabaseErrorText(supErr));
        }
        setSampleTests(next);
      } catch {
        alert("Numune JSON dosyası okunamadı.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(tests, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homelizan-testler-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function exportPdf() {
    const list = getExportTests(pdfOptions);
    if (list.length === 0) {
      alert("Seçtiğin filtrelerle dışa aktarılacak test bulunamadı.");
      return;
    }
    setPdfLoading(true);
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableMod.default || autoTableMod.autoTable || autoTableMod;
      const orientation = pdfOptions.reportType === "table" ? "landscape" : "portrait";
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = { left: 12, right: 12, top: 12, bottom: 14 };
      const contentWidth = pageWidth - margin.left - margin.right;
      const today = new Date();
      const todayIso = today.toISOString().slice(0, 10);
      const generatedAt = `${todayIso} ${today.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      const includeSummary = pdfOptions.includeSummary || pdfOptions.reportType === "summaryCards";

      const reportStats = {
        total: list.length,
        essences: new Set(list.map((t) => t.essence).filter(Boolean)).size,
        alcohols: new Set(list.map((t) => t.alcohol).filter(Boolean)).size,
        combos: new Set(list.map((t) => `${t.essence}|${t.alcohol}|${t.formula}`)).size,
        success: list.filter((t) => t.status === "Başarılı").length,
        tracking: list.filter((t) => t.status === "Takipte").length,
        fail: list.filter((t) => t.status === "Başarısız").length,
        repeat: list.filter((t) => t.status === "Tekrar Denenecek").length,
      };
      const formulaRows = summaryBy(list, "formula");
      const alcoholRows = summaryBy(list, "alcohol");

      function drawHeader({ compact = false } = {}) {
        const boxY = margin.top;
        const boxH = compact ? 16 : 31;
        doc.setFillColor(250, 247, 242);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin.left, boxY, contentWidth, boxH, 2, 2, "FD");

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(compact ? 10 : 17);
        doc.text("Homelizan Essence Test Raporu", margin.left + 4, boxY + (compact ? 6.8 : 9.5));

        doc.setFont("helvetica", "normal");
        doc.setFontSize(compact ? 8.5 : 10.5);
        if (!compact) {
          doc.setTextColor(71, 85, 105);
          doc.text("Reed Diffuser Formula & Performance Tracking", margin.left + 4, boxY + 15.2);
        }

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        const labelText = "Homelizan Essence Lab Tracker";
        const labelW = doc.getTextWidth(labelText) + 8;
        const labelH = 6.2;
        const labelX = margin.left + contentWidth - labelW - 4;
        const labelY = boxY + 3.5;
        doc.roundedRect(labelX, labelY, labelW, labelH, 2, 2, "FD");
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        doc.text(labelText, labelX + 4, labelY + 4.2);

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`Olusturma: ${generatedAt}`, margin.left + 4, boxY + boxH - 4.2);

        return boxY + boxH + 5;
      }

      function drawSummaryCards(startY) {
        const items = [
          ["Toplam Test", reportStats.total],
          ["Esans Sayisi", reportStats.essences],
          ["Alkol Sayisi", reportStats.alcohols],
          ["Kombinasyon", reportStats.combos],
          ["Basarili", reportStats.success],
          ["Takipte", reportStats.tracking],
          ["Basarisiz", reportStats.fail],
          ["Tekrar", reportStats.repeat],
        ];
        const gap = 3.2;
        const perRow = 4;
        const cardW = (contentWidth - gap * (perRow - 1)) / perRow;
        const cardH = 16;
        let y = startY;
        items.forEach(([label, value], i) => {
          const col = i % perRow;
          const row = Math.floor(i / perRow);
          const x = margin.left + col * (cardW + gap);
          const yy = y + row * (cardH + gap);
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(x, yy, cardW, cardH, 2, 2, "FD");
          doc.setTextColor(100, 116, 139);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.7);
          doc.text(String(label), x + 3, yy + 5.5);
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.text(String(value), x + 3, yy + 12.3);
        });
        return y + 2 * (cardH + gap) + 2;
      }

      function drawSummaryTables(startY) {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Formul Tipi Ozeti", margin.left, startY + 4);
        autoTable(doc, {
          startY: startY + 6,
          margin: { left: margin.left, right: margin.right },
          head: [["Formul", "Toplam", "Basarili", "Takipte", "Tekrar", "Basarisiz"]],
          body: formulaRows.map((r) => [r.name, r.total, r.success, r.tracking, r.repeat, r.fail]),
          styles: { font: "helvetica", fontSize: 8.2, cellPadding: 2, textColor: [30, 41, 59] },
          headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.1,
        });
        const formulaEndY = doc.lastAutoTable?.finalY ?? startY + 25;

        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Alkol Tipi Ozeti", margin.left, formulaEndY + 10);
        autoTable(doc, {
          startY: formulaEndY + 12,
          margin: { left: margin.left, right: margin.right },
          head: [["Alkol", "Toplam", "Basarili", "Takipte", "Tekrar", "Basarisiz"]],
          body: alcoholRows.map((r) => [r.name, r.total, r.success, r.tracking, r.repeat, r.fail]),
          styles: { font: "helvetica", fontSize: 8.2, cellPadding: 2, textColor: [30, 41, 59] },
          headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.1,
        });
        return doc.lastAutoTable?.finalY ?? formulaEndY + 40;
      }

      function drawStatusBadge(status, x, y) {
        const tone = statusPdfTone(status);
        doc.setFillColor(...tone.fill);
        doc.setDrawColor(...tone.border);
        const text = status || "Takipte";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        const w = doc.getTextWidth(text) + 6;
        doc.roundedRect(x, y - 3.8, w, 6, 1.6, 1.6, "FD");
        doc.setTextColor(...tone.text);
        doc.text(text, x + 3, y);
      }

      function drawFormulaPills(test, startX, startY, maxW) {
        const parts = [
          ["Esans", n(test.essencePct)],
          ["Etil", n(test.alcoholPct)],
          ["DPM", n(test.dpmPct)],
          ["DPG", n(test.dpgPct)],
          ["Augeo", n(test.augeoPct)],
        ].filter(([, value]) => value > 0);
        if (parts.length === 0) return startY;
        let x = startX;
        let y = startY;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        parts.forEach(([label, value]) => {
          const text = `${label} ${value}%`;
          const w = doc.getTextWidth(text) + 5;
          if (x + w > startX + maxW) {
            x = startX;
            y += 6;
          }
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(x, y - 4.2, w, 5.6, 1.6, 1.6, "FD");
          doc.setTextColor(51, 65, 85);
          doc.text(text, x + 2.5, y - 0.2);
          x += w + 2;
        });
        return y + 3;
      }

      function drawCardsReport(startY) {
        let y = startY;
        const cardW = contentWidth;
        const minBottom = pageHeight - margin.bottom - 7;
        list.forEach((test, idx) => {
          const total = n(test.totalMl) || 40;
          const noteLines =
            pdfOptions.includeNotes && test.notes
              ? doc.splitTextToSize(String(test.notes), cardW - 10)
              : [];
          const pctParts = [
            n(test.essencePct),
            n(test.alcoholPct),
            n(test.dpmPct),
            n(test.dpgPct),
            n(test.augeoPct),
          ].filter((v) => v > 0).length;
          const mlRows = [
            ["Esans", ml(test.essencePct, total)],
            ["Etil", ml(test.alcoholPct, total)],
            ["DPM", ml(test.dpmPct, total)],
            ["DPG", ml(test.dpgPct, total)],
            ["Augeo", ml(test.augeoPct, total)],
          ].filter(([, value], i) =>
            pdfOptions.includeCalculatedMl
              ? n([test.essencePct, test.alcoholPct, test.dpmPct, test.dpgPct, test.augeoPct][i]) > 0
              : false,
          );
          const cardH =
            26 +
            (pdfOptions.includeDate ? 5 : 0) +
            (pdfOptions.includeFormulaPercentages ? (pctParts > 3 ? 10 : 6) : 0) +
            (pdfOptions.includeCalculatedMl ? 5 + Math.ceil(mlRows.length / 3) * 5.2 : 0) +
            (noteLines.length ? 5 + noteLines.length * 4.1 : 0);

          if (y + cardH > minBottom) {
            doc.addPage();
            y = drawHeader({ compact: true });
          }

          doc.setFillColor(250, 250, 250);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin.left, y, cardW, cardH, 2.2, 2.2, "FD");

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11.3);
          const title = test.testName || test.essence || `Test ${idx + 1}`;
          doc.text(title, margin.left + 4, y + 7);

          if (pdfOptions.includeStatusColors) {
            const badgeX = margin.left + cardW - 38;
            drawStatusBadge(test.status, badgeX, y + 7);
          } else {
            doc.setTextColor(100, 116, 139);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.text(`Durum: ${test.status}`, margin.left + cardW - 34, y + 7);
          }

          doc.setTextColor(71, 85, 105);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.text(`Esans: ${test.essence || "-"}`, margin.left + 4, y + 12.2);
          doc.text(`Etil: ${test.alcohol || "-"}`, margin.left + 68, y + 12.2);
          doc.text(`Formul: ${test.formula || "-"}`, margin.left + 122, y + 12.2);

          let lineY = y + 16.5;
          if (pdfOptions.includeDate) {
            doc.setTextColor(71, 85, 105);
            doc.text(`Tarih: ${formatDate(test.date)}`, margin.left + 4, lineY);
            doc.text(`Toplam ml: ${total.toFixed(2)} ml`, margin.left + 68, lineY);
            lineY += 5;
          } else {
            doc.setTextColor(71, 85, 105);
            doc.text(`Toplam ml: ${total.toFixed(2)} ml`, margin.left + 4, lineY);
            lineY += 5;
          }

          if (pdfOptions.includeFormulaPercentages) {
            lineY = drawFormulaPills(test, margin.left + 4, lineY + 1, cardW - 8);
          }

          if (pdfOptions.includeCalculatedMl) {
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.2);
            doc.text("Hesaplanan ml", margin.left + 4, lineY + 3.2);
            lineY += 6.6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.1);
            mlRows.forEach(([name, value], i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const x = margin.left + 4 + col * 33;
              const yy = lineY + row * 4.8;
              doc.setTextColor(71, 85, 105);
              doc.text(`${name}: ${value} ml`, x, yy);
            });
            lineY += Math.ceil(mlRows.length / 3) * 4.8 + 1.2;
          }

          if (noteLines.length) {
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.2);
            doc.text("Notlar", margin.left + 4, lineY + 3.2);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(8.1);
            doc.text(noteLines, margin.left + 4, lineY + 7);
          }
          y += cardH + 4;
        });
      }

      function drawTableReport(startY) {
        const columns = [];
        if (pdfOptions.includeDate) columns.push("Tarih");
        columns.push("Test Adi", "Esans", "Alkol", "Formul", "Toplam ml");
        if (pdfOptions.includeFormulaPercentages) {
          columns.push("Esans %", "Etil %", "DPM %", "DPG %", "Augeo %");
        }
        columns.push("Durum");
        if (pdfOptions.includeNotes) columns.push("Not");

        const statusIdx = columns.indexOf("Durum");
        const body = list.map((t) => {
          const row = [];
          if (pdfOptions.includeDate) row.push(formatDate(t.date));
          row.push(
            t.testName || "-",
            t.essence || "-",
            t.alcohol || "-",
            t.formula || "-",
            `${(n(t.totalMl) || 40).toFixed(2)}`,
          );
          if (pdfOptions.includeFormulaPercentages) {
            row.push(
              `${n(t.essencePct)}`,
              `${n(t.alcoholPct)}`,
              `${n(t.dpmPct)}`,
              `${n(t.dpgPct)}`,
              `${n(t.augeoPct)}`,
            );
          }
          row.push(t.status || "Takipte");
          if (pdfOptions.includeNotes) row.push(t.notes || "-");
          return row;
        });

        autoTable(doc, {
          startY,
          margin: { left: margin.left, right: margin.right, bottom: margin.bottom + 4 },
          head: [columns],
          body,
          styles: {
            font: "helvetica",
            fontSize: 7.8,
            cellPadding: 2,
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            overflow: "linebreak",
            valign: "top",
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [51, 65, 85],
            fontStyle: "bold",
            halign: "left",
          },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          didParseCell: (data) => {
            if (pdfOptions.includeStatusColors && data.section === "body" && data.column.index === statusIdx) {
              const tone = statusPdfTone(String(data.cell.raw));
              data.cell.styles.fillColor = tone.fill;
              data.cell.styles.textColor = tone.text;
              data.cell.styles.fontStyle = "bold";
            }
          },
        });
      }

      let y = drawHeader();
      if (includeSummary) {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Rapor Ozeti", margin.left, y + 3);
        y = drawSummaryCards(y + 6);
        y = drawSummaryTables(y + 4) + 7;
      }

      if (pdfOptions.reportType === "table") {
        drawTableReport(y);
      } else if (pdfOptions.reportType === "cards") {
        drawCardsReport(y);
      } else {
        doc.addPage();
        y = drawHeader({ compact: true });
        drawCardsReport(y);
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i);
        const footerY = doc.internal.pageSize.getHeight() - 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin.left, footerY - 3.8, doc.internal.pageSize.getWidth() - margin.right, footerY - 3.8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Generated by Homelizan Essence Lab Tracker", margin.left, footerY);
        doc.text(`${i} / ${totalPages}`, doc.internal.pageSize.getWidth() - margin.right, footerY, {
          align: "right",
        });
      }

      doc.save(`homelizan-test-raporu-${todayIso}.pdf`);
      setPdfOpen(false);
    } catch (e) {
      console.error("PDF oluşturulamadı", e);
      alert("PDF raporu oluşturulamadı. Lütfen tekrar dene.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function importTestsToSupabase(list) {
    if (!isSupabaseReady) throw new Error("supabase_not_ready");
    const rows = list.map(toDbRow);
    const { error } = await supabase.from("tests").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }

  function importJson(e) {
    if (!canWrite) {
      denyWrite();
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = safeParse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("bad_json");
        const next = data.map(normalize);
        try {
          await importTestsToSupabase(next);
          setSupabaseError("");
        } catch (supErr) {
          console.error("Supabase import hatası", supErr);
          setSupabaseError(supabaseErrorText(supErr));
        }
        setTests(next);
        setSelectedId(next[0]?.id ?? null);
      } catch {
        alert("JSON dosyası okunamadı.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function setAuthField(field, value) {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitAuth() {
    if (!isSupabaseReady) {
      setAuthError("Supabase ayarları eksik. .env.local dosyasını kontrol et.");
      return;
    }
    const email = clean(authForm.email);
    const password = String(authForm.password || "");
    if (!email || password.length < 6) {
      setAuthError("E-posta ve en az 6 karakter şifre gir.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setAuthError("Kayıt oluşturuldu. Giriş için e-posta doğrulamasını tamamla.");
        }
      }
    } catch (e) {
      setAuthError(e?.message || "Giriş işlemi başarısız.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    if (!isSupabaseReady) return;
    await supabase.auth.signOut();
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-100 p-4 font-sans text-slate-900 md:p-8">
        <div className="mx-auto max-w-md">
          <Card className="rounded-2xl p-6 text-center text-sm font-semibold text-slate-600">
            Oturum kontrol ediliyor...
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-100 p-4 font-sans text-slate-900 md:p-8">
        <div className="mx-auto max-w-md">
          <AuthPanel
            mode={authMode}
            setMode={setAuthMode}
            form={authForm}
            setField={setAuthField}
            onSubmit={submitAuth}
            loading={authLoading}
            error={authError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-100 p-4 font-sans text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header
          exportJson={exportJson}
          onOpenPdf={() => setPdfOpen(true)}
          importJson={importJson}
          connectionStatus={connectionStatus}
          onLogout={logout}
          userEmail={user?.email || ""}
        />
        {loading && (
          <Card className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">
            Kayıtlar yükleniyor...
          </Card>
        )}
        {supabaseError && (
          <Card className="rounded-2xl border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {supabaseError}
          </Card>
        )}
        {roleLoading && (
          <Card className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">
            Kullanıcı yetkisi kontrol ediliyor...
          </Card>
        )}
        {roleError && (
          <Card className="rounded-2xl border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {roleError}
          </Card>
        )}
        <Tabs page={page} setPage={setPage} canManageUsers={canManageUsers} />
        {(page === "formulaRecord" || page === "formulaAnalysis") && <Stats stats={stats} />}
        {page === "formulaRecord" || page === "formulaAnalysis" ? (
          <PdfExportModal
            open={pdfOpen}
            onClose={() => !pdfLoading && setPdfOpen(false)}
            options={pdfOptions}
            setField={setPdfField}
            onExport={exportPdf}
            loading={pdfLoading}
            essences={essences}
            alcohols={alcohols}
            statuses={statuses}
            allCount={tests.length}
            analysisCount={analysisTests.length}
            filteredCount={getExportTests(pdfOptions).length}
          />
        ) : null}
        {page === "formulaRecord" ? (
          <RecordPage
            {...{
              form,
              update,
              save,
              setForm,
              totalPct,
              calc,
              totalMl,
              essences,
              alcohols,
              filtered,
              q,
              setQ,
              statusFilter,
              setStatusFilter,
              sortBy,
              setSortBy,
              selected,
              edit,
              duplicate,
              remove,
              canEdit: canWrite,
            }}
          />
        ) : null}
        {page === "formulaAnalysis" ? (
          <AnalysisPage
            {...{
              analysisTests,
              groups,
              formulas,
              aEssence,
              setAEssence,
              aAlcohol,
              setAAlcohol,
              aSearch,
              setASearch,
              aView,
              setAView,
              essences,
              alcohols,
              formulaSummary,
              alcoholSummary,
              edit,
              setSelectedId,
              setPage,
              canEdit: canWrite,
            }}
          />
        ) : null}
        {page === "sampleRecord" ? (
          <SampleTestPage
            sections={sampleSections}
            selectedSectionId={selectedSampleSectionId}
            onSelectSection={setSelectedSampleSectionId}
            sectionName={sampleSectionName}
            setSectionName={setSampleSectionName}
            onCreateSection={createSampleSection}
            onRenameSection={renameSampleSection}
            onDeleteSection={deleteSampleSection}
            draft={sampleDraft}
            setDraft={setSampleDraft}
            onAdd={async () => {
              const saved = await saveSample({ ...sampleDraft, id: uid(), section_id: selectedSampleSectionId });
              if (saved) setSampleDraft(sampleBlank);
            }}
            list={sampleTests}
            loading={sampleLoading}
            error={sampleError}
            onSave={saveSample}
            onDelete={deleteSample}
            onExportJson={exportSampleJson}
            onImportJson={importSampleJson}
            canEdit={canWrite}
          />
        ) : null}
        {page === "sampleAnalysis" ? (
          <SampleAnalysisPage
            sections={sampleSections}
            selectedSectionId={selectedSampleSectionId}
            onSelectSection={setSelectedSampleSectionId}
            sampleTests={sampleTests}
            filtered={sampleFiltered}
            summary={sampleSummary}
            search={sampleSearch}
            setSearch={setSampleSearch}
            decisionFilter={sampleDecisionFilter}
            setDecisionFilter={setSampleDecisionFilter}
            min={sampleMin}
            setMin={setSampleMin}
            max={sampleMax}
              setMax={setSampleMax}
              view={sampleAnalysisView}
              setView={setSampleAnalysisView}
              canEdit={canWrite}
              onEditSample={(x) => {
                setSampleDraft(x);
                setPage("sampleRecord");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
          />
        ) : null}
        {page === "admin" ? (
          <AdminPage
            connectionStatus={connectionStatus}
            tests={tests}
            sampleTests={sampleTests}
            sampleSections={sampleSections}
            selectedSampleSectionName={selectedSampleSectionName}
            formulaStatusSummary={formulaStatusSummary}
            sampleDecisionSummary={sampleDecisionSummary}
            topEssenceSummary={topEssenceSummary}
            topAlcoholSummary={topAlcoholSummary}
            currentRole={currentRole}
            userRoles={userRoles}
            canManageUsers={canManageUsers}
            onUpdateUserRole={updateUserRole}
            setPage={setPage}
          />
        ) : null}
      </div>
    </div>
  );
}

function Header({ exportJson, onOpenPdf, importJson, connectionStatus, onLogout, userEmail }) {
  const statusStyle = connectionStatus
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-slate-700 shadow-sm md:text-base">
            <FlaskConical className="h-4 w-4 md:h-5 md:w-5" /> Homelizan Essence Lab Tracker
          </div>
          <div
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle}`}
            aria-label={connectionStatus ? "Supabase bağlı" : "Supabase bağlantı hatası"}
            title={connectionStatus ? "Supabase bağlı" : "Supabase bağlantı hatası"}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-4xl">
          Reed Diffuser Test Takip Paneli
        </h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
          {userEmail}
        </span>
        <Button variant="outline" onClick={onOpenPdf}>
          <FileDown className="h-4 w-4" /> PDF Rapor İndir
        </Button>
        <Button variant="outline" onClick={exportJson}>
          <Download className="h-4 w-4" /> Yedek Al
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <Upload className="h-4 w-4" /> Yedek Yükle
          <input type="file" accept="application/json" className="hidden" onChange={importJson} />
        </label>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> Çıkış
        </Button>
      </div>
    </div>
  );
}

function AuthPanel({ mode, setMode, form, setField, onSubmit, loading, error }) {
  return (
    <Card className="rounded-2xl p-6 md:p-7">
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
          <FlaskConical className="h-4 w-4" /> Homelizan Essence Lab Tracker
        </div>
        <h2 className="text-2xl font-black text-slate-900">Giriş Paneli</h2>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            mode === "signin" ? "bg-slate-900 text-white" : "text-slate-600"
          }`}
        >
          Giriş Yap
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            mode === "signup" ? "bg-slate-900 text-white" : "text-slate-600"
          }`}
        >
          Kayıt Ol
        </button>
      </div>

      <div className="space-y-3">
        <Field label="E-posta">
          <input
            className={input}
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="ornek@mail.com"
          />
        </Field>
        <Field label="Şifre">
          <input
            className={input}
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            placeholder="******"
          />
        </Field>
      </div>

      {error && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{error}</p>}

      <Button className="mt-4 w-full py-3" onClick={onSubmit} disabled={loading}>
        {loading ? "İşleniyor..." : mode === "signin" ? "Giriş Yap" : "Kayıt Ol"}
      </Button>
    </Card>
  );
}

function PdfExportModal({
  open,
  onClose,
  options,
  setField,
  onExport,
  loading,
  essences,
  alcohols,
  statuses,
  allCount,
  analysisCount,
  filteredCount,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/35 p-3 md:p-4">
      <Card className="mx-auto my-2 flex w-full max-w-3xl max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl p-4 md:my-6 md:max-h-[calc(100dvh-3rem)] md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black">PDF Rapor Ayarları</h3>
            <p className="mt-1 text-sm text-slate-500">Profesyonel rapor düzeni ve filtre seçenekleri</p>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Kapat
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-3 md:grid-cols-3">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setField("reportType", type.id)}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  options.reportType === type.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="font-bold">{type.label}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Dışa Aktarım Kaynağı">
              <select className={input} value={options.source} onChange={(e) => setField("source", e.target.value)}>
                <option value="all">Tüm Testler ({allCount})</option>
                <option value="analysis">Sadece Analizde Filtrelenen Testler ({analysisCount})</option>
              </select>
            </Field>
            <Field label="Durum Filtresi">
              <select className={input} value={options.status} onChange={(e) => setField("status", e.target.value)}>
                <option>Tümü</option>
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Esans Filtresi">
              <select className={input} value={options.essence} onChange={(e) => setField("essence", e.target.value)}>
                <option>Tümü</option>
                {essences.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Etil Alkol Filtresi">
              <select className={input} value={options.alcohol} onChange={(e) => setField("alcohol", e.target.value)}>
                <option>Tümü</option>
                {alcohols.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">Raporda Dahil Edilecekler</p>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                ["includeSummary", "Özet bölümü"],
                ["includeFormulaPercentages", "Formül yüzde değerleri"],
                ["includeCalculatedMl", "Hesaplanan ml değerleri"],
                ["includeNotes", "Notlar"],
                ["includeDate", "Tarih"],
                ["includeStatusColors", "Durum rozetleri / renkler"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(options[key])}
                    onChange={(e) => setField(key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Bu ayarlarla dışa aktarılacak test sayısı: <b className="text-slate-900">{filteredCount}</b>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white pt-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button onClick={onExport} disabled={loading}>
            <FileDown className="h-4 w-4" /> {loading ? "Rapor Hazırlanıyor..." : "Raporu İndir"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Tabs({ page, setPage, canManageUsers }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:flex md:w-fit md:flex-wrap">
      <Button
        className="w-full md:w-auto"
        variant={page === "formulaRecord" ? "solid" : "ghost"}
        onClick={() => setPage("formulaRecord")}
      >
        <Plus className="h-4 w-4" /> Formül Kayıtları
      </Button>
      <Button
        className="w-full md:w-auto"
        variant={page === "formulaAnalysis" ? "solid" : "ghost"}
        onClick={() => setPage("formulaAnalysis")}
      >
        <BarChart3 className="h-4 w-4" /> Formül Analizi
      </Button>
      <Button
        className="w-full md:w-auto"
        variant={page === "sampleRecord" ? "solid" : "ghost"}
        onClick={() => setPage("sampleRecord")}
      >
        <Plus className="h-4 w-4" /> Numune Yayılım Testi
      </Button>
      <Button
        className="w-full md:w-auto"
        variant={page === "sampleAnalysis" ? "solid" : "ghost"}
        onClick={() => setPage("sampleAnalysis")}
      >
        <BarChart3 className="h-4 w-4" /> Numune Analizi
      </Button>
      {canManageUsers ? (
        <Button
          className="w-full md:w-auto"
          variant={page === "admin" ? "solid" : "ghost"}
          onClick={() => setPage("admin")}
        >
          <LayoutDashboard className="h-4 w-4" /> Admin Paneli
        </Button>
      ) : null}
    </div>
  );
}

function AdminPage({
  connectionStatus,
  tests,
  sampleTests,
  sampleSections,
  selectedSampleSectionName,
  formulaStatusSummary,
  sampleDecisionSummary,
  topEssenceSummary,
  topAlcoholSummary,
  currentRole,
  userRoles,
  canManageUsers,
  onUpdateUserRole,
  setPage,
}) {
  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h2 className="text-2xl font-black">Admin Paneli</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">Bağlantı</p>
            <p className={`mt-1 text-lg font-black ${connectionStatus ? "text-emerald-700" : "text-rose-700"}`}>
              {connectionStatus ? "Bağlı" : "Hata"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">Formül Kaydı</p>
            <p className="mt-1 text-2xl font-black">{tests.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">Numune Bölümü</p>
            <p className="mt-1 text-2xl font-black">{sampleSections.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">Seçili Bölüm</p>
            <p className="mt-1 line-clamp-2 text-sm font-black text-slate-700">{selectedSampleSectionName}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">Seçili Bölüm Numune</p>
            <p className="mt-1 text-2xl font-black">{sampleTests.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">Benim Yetkim</p>
            <p className="mt-1 text-lg font-black uppercase">{currentRole}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPage("formulaRecord")}>
            Formül Kayıtları
          </Button>
          <Button variant="outline" onClick={() => setPage("formulaAnalysis")}>
            Formül Analizi
          </Button>
          <Button variant="outline" onClick={() => setPage("sampleRecord")}>
            Numune Yayılım Testi
          </Button>
          <Button variant="outline" onClick={() => setPage("sampleAnalysis")}>
            Numune Analizi
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 md:p-6">
          <h3 className="mb-4 text-xl font-black">Formül Durum Dağılımı</h3>
          <div className="space-y-2">
            {formulaStatusSummary.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm font-semibold text-slate-700">{row.label}</span>
                <b>{row.value}</b>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 md:p-6">
          <h3 className="mb-4 text-xl font-black">Numune Karar Dağılımı</h3>
          <div className="space-y-2">
            {sampleDecisionSummary.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm font-semibold text-slate-700">{row.label}</span>
                <b>{row.value}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 md:p-6">
          <h3 className="mb-4 text-xl font-black">En Çok Kullanılan Esanslar</h3>
          <div className="space-y-2">
            {topEssenceSummary.length === 0 ? (
              <Empty text="Kayıt yok." />
            ) : (
              topEssenceSummary.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-700">{row.name}</span>
                  <b>{row.total}</b>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="p-5 md:p-6">
          <h3 className="mb-4 text-xl font-black">En Çok Kullanılan Etil Alkol</h3>
          <div className="space-y-2">
            {topAlcoholSummary.length === 0 ? (
              <Empty text="Kayıt yok." />
            ) : (
              topAlcoholSummary.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-700">{row.name}</span>
                  <b>{row.total}</b>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 md:p-6">
        <h3 className="mb-4 text-xl font-black">Kullanıcı Yetkileri</h3>
        {!canManageUsers ? (
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            Bu alanı yalnızca admin kullanıcı yönetebilir.
          </p>
        ) : userRoles.length === 0 ? (
          <Empty text="Kullanıcı rol kaydı bulunamadı." />
        ) : (
          <div className="overflow-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  {["E-posta", "Kullanıcı ID", "Yetki", "İşlem"].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userRoles.map((row) => (
                  <tr key={row.user_id} className="border-t border-slate-100">
                    <td className="p-3 font-semibold">{row.email || "-"}</td>
                    <td className="p-3 text-xs text-slate-500">{row.user_id}</td>
                    <td className="p-3">
                      <select
                        className={input}
                        value={row.role}
                        onChange={(e) => onUpdateUserRole(row.user_id, e.target.value)}
                      >
                        <option value="admin">admin</option>
                        <option value="editor">editor</option>
                        <option value="viewer">viewer</option>
                      </select>
                    </td>
                    <td className="p-3 text-xs font-semibold text-slate-500">Anında kaydedilir</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stats({ stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {[
        ["Toplam Test", stats.total],
        ["Esans", stats.essences],
        ["Alkol", stats.alcohols],
        ["Kombinasyon", stats.combos],
        ["Başarılı", stats.success],
      ].map(([k, v]) => (
        <Card key={k} className="rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{k}</p>
          <p className="mt-2 text-3xl font-black">{v}</p>
        </Card>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-500">{label}</label>
      {children}
    </div>
  );
}

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-500";

function RecordPage(p) {
  const {
    form,
    update,
    save,
    setForm,
    totalPct,
    calc,
    totalMl,
    essences,
    alcohols,
    filtered,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    selected,
    edit,
    duplicate,
    remove,
    canEdit,
  } = p;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Yeni Test Kaydı</h2>
          </div>
          <Button variant="outline" onClick={() => setForm(blank)} disabled={!canEdit}>
            Sıfırla
          </Button>
        </div>
        {!canEdit ? (
          <p className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            İzleyici modunda düzenleme işlemleri kapalıdır.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Test Adı">
            <input
              className={input}
              value={form.testName}
              onChange={(e) => update("testName", e.target.value)}
              placeholder="Black Orchid - Alkol A - DPM %5"
              disabled={!canEdit}
            />
          </Field>
          <Field label="Tarih">
            <input
              type="date"
              className={input}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Esans Adı">
            <input
              list="essences"
              className={input}
              value={form.essence}
              onChange={(e) => update("essence", e.target.value)}
              placeholder="Black Orchid"
              disabled={!canEdit}
            />
            <datalist id="essences">
              {essences.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>
          <Field label="Etil Alkol Türü">
            <input
              list="alcohols"
              className={input}
              value={form.alcohol}
              onChange={(e) => update("alcohol", e.target.value)}
              placeholder="Etil Alkol A"
              disabled={!canEdit}
            />
            <datalist id="alcohols">
              {alcohols.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>
          <Field label="Formül Tipi">
            <select
              className={input}
              value={form.formula}
              onChange={(e) => update("formula", e.target.value)}
              disabled={!canEdit}
            >
              {formulas.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Sonuç Durumu">
            <select
              className={input}
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              disabled={!canEdit}
            >
              {statuses.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black">Formül Oranları</h3>
            <span
              className={`rounded-full bg-white px-3 py-1 text-xs font-black ${
                totalPct === 100 ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              Toplam: {totalPct.toFixed(1)}%
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Toplam ml">
              <input
                className={input}
                type="number"
                value={form.totalMl}
                onChange={(e) => update("totalMl", e.target.value)}
                disabled={!canEdit}
              />
            </Field>
            {[
              ["Esans %", "essencePct", calc.essenceMl],
              ["Etil Alkol %", "alcoholPct", calc.alcoholMl],
              ["DPM %", "dpmPct", calc.dpmMl],
              ["DPG %", "dpgPct", calc.dpgMl],
              ["Augeo %", "augeoPct", calc.augeoMl],
            ].map(([label, key, value]) => (
              <Field key={key} label={label}>
                <input
                  className={input}
                  type="number"
                  step="0.1"
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  disabled={!canEdit}
                />
                <p className="mt-1 text-xs text-slate-500">{value} ml</p>
              </Field>
            ))}
            <div className="rounded-xl bg-white p-3 text-xs leading-6 text-slate-600">
              <p>
                Hedef: <b>{n(form.totalMl).toFixed(2)} ml</b>
              </p>
              <p>
                Hesaplanan: <b>{totalMl.toFixed(2)} ml</b>
              </p>
              <p>
                Fark: <b>{(n(form.totalMl) - totalMl).toFixed(2)} ml</b>
              </p>
            </div>
          </div>
        </div>
        <Field label="Notlar">
          <textarea
            className={`${input} mt-4 min-h-24`}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Yayılım, dipte yağ, alkol farkı, DPM/DPG/Augeo etkisi..."
            disabled={!canEdit}
          />
        </Field>
        <Button className="mt-5 w-full py-3" onClick={save} disabled={!canEdit}>
          <Plus className="h-4 w-4" /> {form.id ? "Testi Güncelle" : "Testi Kaydet"}
        </Button>
      </Card>
      <div className="space-y-6">
        <TestList
          {...{
            filtered,
            q,
            setQ,
            statusFilter,
            setStatusFilter,
            sortBy,
            setSortBy,
            selected,
            edit,
            duplicate,
            remove,
            canEdit,
          }}
        />
        <Selected test={selected} />
      </div>
    </div>
  );
}

function TestList({
  filtered,
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  selected,
  edit,
  duplicate,
  remove,
  canEdit,
}) {
  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-xl font-black">Test Listesi</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className={`${input} pl-9`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara"
          />
        </div>
        <select
          className={input}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>Tümü</option>
          {statuses.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className={input} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Tarihe göre</option>
          <option value="essence">Esansa göre</option>
          <option value="alcohol">Alkole göre</option>
          <option value="formula">Formüle göre</option>
        </select>
      </div>
      <div className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">
        {filtered.length === 0 ? (
          <Empty text="Henüz test kaydı yok." />
        ) : (
          filtered.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${
                selected?.id === t.id ? "border-slate-900" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{t.testName || t.essence || "İsimsiz Test"}</h3>
                  <p className="text-xs text-slate-500">
                    {t.date} · {t.alcohol || "Alkol yok"} · {t.formula}
                  </p>
                </div>
                <Badge status={t.status}>{t.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">{formulaText(t)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => edit(t)} disabled={!canEdit}>
                  Düzenle
                </Button>
                <Button variant="outline" onClick={() => duplicate(t)} disabled={!canEdit}>
                  <Copy className="h-4 w-4" /> Kopyala
                </Button>
                <Button variant="outline" className="text-rose-600" onClick={() => remove(t.id)} disabled={!canEdit}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function Selected({ test }) {
  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5" />
        <h2 className="text-xl font-black">Seçili Test Özeti</h2>
      </div>
      {!test ? (
        <p className="text-sm text-slate-500">Bir test seçince detaylar burada görünür.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-black">{test.testName || test.essence}</h3>
            <p className="text-sm text-slate-500">
              {test.essence} · {test.alcohol} · {test.formula}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Durum" value={test.status} />
            <Info label="Tarih" value={test.date} />
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="mb-2 font-black">Formül</p>
            <p className="text-slate-600">{formulaText(test)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="mb-2 font-black">Notlar</p>
            <p className="whitespace-pre-wrap text-slate-600">{test.notes || "Not eklenmemiş."}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function AnalysisPage(p) {
  const {
    analysisTests,
    groups,
    aEssence,
    setAEssence,
    aAlcohol,
    setAAlcohol,
    aSearch,
    setASearch,
    aView,
    setAView,
    essences,
    alcohols,
    formulaSummary,
    alcoholSummary,
    edit,
    setSelectedId,
    setPage,
    canEdit,
  } = p;

  const openInRecord = (id) => {
    setSelectedId(id);
    setPage("formulaRecord");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Analiz Sayfası</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-3 lg:min-w-[680px]">
            <select className={input} value={aEssence} onChange={(e) => setAEssence(e.target.value)}>
              <option>Tümü</option>
              {essences.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select className={input} value={aAlcohol} onChange={(e) => setAAlcohol(e.target.value)}>
              <option>Tümü</option>
              {alcohols.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <input
              className={input}
              value={aSearch}
              onChange={(e) => setASearch(e.target.value)}
              placeholder="Analizde ara"
            />
          </div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["cards", "Kart"],
            ["matrix", "Matris"],
            ["summary", "Özet"],
            ["table", "Detay Tablo"],
          ].map(([k, v]) => (
            <Button key={k} variant={aView === k ? "solid" : "outline"} onClick={() => setAView(k)}>
              {v}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Gösterilen Test", analysisTests.length],
            ["Esans", new Set(analysisTests.map((t) => t.essence)).size],
            ["Alkol", new Set(analysisTests.map((t) => t.alcohol)).size],
            ["Formül", new Set(analysisTests.map((t) => t.formula)).size],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400">{k}</p>
              <p className="mt-2 text-2xl font-black">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      {aView === "cards" && <CardsView groups={groups} openInRecord={openInRecord} />}
      {aView === "matrix" && <MatrixView groups={groups} openInRecord={openInRecord} />}
      {aView === "summary" && <SummaryView formulaSummary={formulaSummary} alcoholSummary={alcoholSummary} />}
      {aView === "table" && <DetailTable tests={analysisTests} edit={edit} canEdit={canEdit} />}
    </div>
  );
}

function CardsView({ groups, openInRecord }) {
  return (
    <Card className="p-5 md:p-6">
      <h2 className="mb-4 text-xl font-black">Kart Görünümü</h2>
      {groups.length === 0 ? (
        <Empty text="Bu filtreye göre kayıt yok." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <div
              key={`${g.essence}-${g.alcohol}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{g.essence}</h3>
                  <p className="text-sm text-slate-500">{g.alcohol}</p>
                </div>
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {g.tests.length} test
                </span>
              </div>
              <div className="space-y-2">
                {g.tests.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openInRecord(t.id)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <b>{t.formula}</b>
                      <Badge status={t.status}>{t.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.date} · {formulaText(t)}
                    </p>
                    {t.notes && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{t.notes}</p>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MatrixView({ groups, openInRecord }) {
  return (
    <Card className="p-5 md:p-6">
      <h2 className="mb-4 text-xl font-black">Yapılan Kombinasyon Matrisi</h2>
      <div className="overflow-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[900px] bg-white text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Esans</th>
              <th className="p-3">Alkol</th>
              {formulas.map((f) => (
                <th key={f} className="p-3 text-center">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={`${g.essence}-${g.alcohol}`} className="border-t border-slate-100">
                <td className="p-3 font-bold">{g.essence}</td>
                <td className="p-3 text-slate-600">{g.alcohol}</td>
                {formulas.map((f) => {
                  const m = g.tests.filter((t) => t.formula === f);
                  const latest = m[0];
                  return (
                    <td key={f} className="p-2 text-center">
                      {latest ? (
                        <button
                          onClick={() => openInRecord(latest.id)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold ${statusClass(latest.status)}`}
                        >
                          {m.length > 1 ? `${m.length} test` : latest.status}
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryView({ formulaSummary, alcoholSummary }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SummaryCard title="Formül Tipine Göre" rows={formulaSummary} />
      <SummaryCard title="Etil Alkole Göre" rows={alcoholSummary} />
    </div>
  );
}

function SummaryCard({ title, rows }) {
  return (
    <Card className="p-5 md:p-6">
      <h2 className="mb-4 text-xl font-black">{title}</h2>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.name} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex justify-between">
              <b>{r.name}</b>
              <b className="text-slate-500">{r.total} test</b>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <Mini label="Başarılı" value={r.success} color="emerald" />
              <Mini label="Takipte" value={r.tracking} color="sky" />
              <Mini label="Tekrar" value={r.repeat} color="amber" />
              <Mini label="Başarısız" value={r.fail} color="rose" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DetailTable({ tests, edit, canEdit }) {
  return (
    <Card className="p-5 md:p-6">
      <h2 className="mb-4 text-xl font-black">Detay Tablo</h2>
      <div className="overflow-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[980px] bg-white text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              {[
                "Tarih",
                "Esans",
                "Alkol",
                "Formül",
                "Esans %",
                "DPM %",
                "DPG %",
                "Augeo %",
                "Durum",
                "İşlem",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="p-3">{t.date}</td>
                <td className="p-3 font-bold">{t.essence}</td>
                <td className="p-3">{t.alcohol}</td>
                <td className="p-3">{t.formula}</td>
                <td className="p-3">{n(t.essencePct)}</td>
                <td className="p-3">{n(t.dpmPct)}</td>
                <td className="p-3">{n(t.dpgPct)}</td>
                <td className="p-3">{n(t.augeoPct)}</td>
                <td className="p-3">
                  <Badge status={t.status}>{t.status}</Badge>
                </td>
                <td className="p-3">
                  <Button variant="outline" onClick={() => edit(t)} disabled={!canEdit}>
                    Düzenle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const sampleDecisionOptions = [
  "Güçlü yayılım, satışa uygun",
  "İyi yayılım, tekrar test edilebilir",
  "Orta yayılım, dikkatli değerlendir",
  "Zayıf yayılım, revize gerekebilir",
  "Eleme adayı",
];

function SampleScoreField({ item, field, onChange, disabled = false }) {
  const conf = sampleBands[field];
  const value = n(item[field]);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="font-black text-slate-800">{conf.title}</h4>
        <span className="text-xs font-bold text-slate-500">/ {conf.max}</span>
      </div>
      <input
        className={input}
        type="number"
        min={0}
        max={conf.max}
        value={value}
        onChange={(e) => onChange(field, Math.max(0, Math.min(conf.max, n(e.target.value))))}
        disabled={disabled}
      />
      <div className="mt-2 space-y-1.5">
        {conf.lines.map((line) => (
          <div key={`${field}-${line.text}`} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-xs text-slate-600">{line.text}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                Aralık: {line.range}
              </span>
              <Button
                type="button"
                variant="outline"
                className="px-2.5 py-1 text-xs"
                onClick={() => onChange(field, line.recommended)}
                disabled={disabled}
              >
                Önerilen: {line.recommended}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SampleTestPage({
  sections,
  selectedSectionId,
  onSelectSection,
  sectionName,
  setSectionName,
  onCreateSection,
  onRenameSection,
  onDeleteSection,
  draft,
  setDraft,
  onAdd,
  list,
  loading,
  error,
  onSave,
  onDelete,
  onExportJson,
  onImportJson,
  canEdit,
}) {
  const [editMap, setEditMap] = useState({});
  useEffect(() => {
    setEditMap((old) => {
      const next = { ...old };
      list.forEach((x) => {
        if (!next[x.id]) next[x.id] = normalizeSample(x);
      });
      return next;
    });
  }, [list]);

  function updateDraft(field, value) {
    setDraft((p) => ({ ...p, [field]: value }));
  }
  function updateEdit(id, field, value) {
    setEditMap((old) => ({ ...old, [id]: { ...(old[id] || {}), [field]: value, id } }));
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-black">Numune Yayılım Testi</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onExportJson}><Download className="h-4 w-4" /> Numune JSON Dışa Aktar</Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Upload className="h-4 w-4" /> Numune JSON İçe Aktar
              <input type="file" accept="application/json" className="hidden" onChange={onImportJson} disabled={!canEdit} />
            </label>
          </div>
        </div>
        {!canEdit ? (
          <p className="mb-3 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            İzleyici modunda numune düzenleme kapalıdır.
          </p>
        ) : null}
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
          <select className={input} value={selectedSectionId || ""} onChange={(e) => onSelectSection(e.target.value || null)}>
            <option value="">Bölüm seç</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            className={input}
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="Yeni bölüm adı"
            disabled={!canEdit}
          />
          <Button onClick={onCreateSection} disabled={!canEdit}><Plus className="h-4 w-4" /> Bölüm Oluştur</Button>
          <Button
            variant="outline"
            onClick={() => {
              const current = sections.find((s) => s.id === selectedSectionId);
              const next = window.prompt("Bölüm adını güncelle", current?.name || "");
              if (next) onRenameSection(selectedSectionId, next);
            }}
            disabled={!selectedSectionId || !canEdit}
          >
            Düzenle
          </Button>
        </div>
        <div className="mb-4">
          <Button
            variant="outline"
            className="text-rose-600"
            disabled={!selectedSectionId || !canEdit}
            onClick={() => {
              if (window.confirm("Bu bölüm ve içindeki tüm numuneler silinsin mi?")) onDeleteSection(selectedSectionId);
            }}
          >
            <Trash2 className="h-4 w-4" /> Bölümü Sil
          </Button>
        </div>
        {loading ? <p className="text-sm text-slate-500">Numune kayıtları yükleniyor...</p> : null}
        {error ? <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{error}</p> : null}
        {sections.length === 0 ? (
          <p className="mb-3 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            Numune eklemek için önce bir bölüm oluştur.
          </p>
        ) : null}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-black">Yeni Numune</h3>
            <Button onClick={onAdd} disabled={!selectedSectionId || !canEdit}><Plus className="h-4 w-4" /> Numune Ekle</Button>
          </div>
          <Field label="Numune Adı">
            <input className={input} value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} placeholder="Numune adı" disabled={!canEdit} />
          </Field>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {["smallRoom", "bathroom", "largeRoom", "continuity"].map((field) => (
              <SampleScoreField key={field} item={draft} field={field} onChange={updateDraft} disabled={!canEdit} />
            ))}
          </div>
          <Field label="Notlar">
            <textarea
              className={`${input} mt-3 min-h-24`}
              value={draft.notes}
              onChange={(e) => updateDraft("notes", e.target.value)}
              placeholder="Yayılım gözlemleri, kullanıcı hissi..."
              disabled={!canEdit}
            />
          </Field>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700">
            Toplam: {sampleTotal(draft)} / 100
            <span className={`rounded-full border px-2.5 py-1 text-xs ${sampleDecisionTone(sampleTotal(draft))}`}>
              {sampleDecision(sampleTotal(draft))}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {list.length === 0 ? (
          <Empty text="Henüz numune kaydı yok." />
        ) : (
          list.map((x) => {
            const item = editMap[x.id] || x;
            const total = sampleTotal(item);
            return (
              <Card key={x.id} className="p-5 md:p-6">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <Field label="Numune Adı">
                      <input
                        className={input}
                        value={item.name}
                        onChange={(e) => updateEdit(x.id, "name", e.target.value)}
                        placeholder="Numune adı"
                        disabled={!canEdit}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">{total} / 100</span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${sampleDecisionTone(total)}`}>
                      {sampleDecision(total)}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {["smallRoom", "bathroom", "largeRoom", "continuity"].map((field) => (
                    <SampleScoreField key={field} item={item} field={field} onChange={(f, v) => updateEdit(x.id, f, v)} disabled={!canEdit} />
                  ))}
                </div>
                <Field label="Notlar">
                  <textarea
                    className={`${input} mt-3 min-h-20`}
                    value={item.notes}
                    onChange={(e) => updateEdit(x.id, "notes", e.target.value)}
                    disabled={!canEdit}
                  />
                </Field>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => onSave(item)} disabled={!canEdit}>Kaydet</Button>
                  <Button variant="outline" className="text-rose-600" onClick={() => onDelete(x.id)} disabled={!canEdit}>
                    <Trash2 className="h-4 w-4" /> Sil
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function SampleAnalysisPage({
  sections,
  selectedSectionId,
  onSelectSection,
  sampleTests,
  filtered,
  summary,
  search,
  setSearch,
  decisionFilter,
  setDecisionFilter,
  min,
  setMin,
  max,
  setMax,
  view,
  setView,
  canEdit,
  onEditSample,
}) {
  const categoryMap = sampleDecisionOptions.map((label) => ({
    label,
    items: filtered.filter((x) => sampleDecision(sampleTotal(x)) === label),
  }));
  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Numune Analizi</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <select className={input} value={selectedSectionId || ""} onChange={(e) => onSelectSection(e.target.value || null)}>
              <option value="">Bölüm seç</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input className={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Numune ara" />
            <select className={input} value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}>
              <option>Tümü</option>
              {sampleDecisionOptions.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input className={input} type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min puan" />
            <input className={input} type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Maks puan" />
          </div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["summary", "Genel Özet"],
            ["ranking", "Sıralama"],
            ["category", "Kategori Analizi"],
            ["table", "Detay Tablo"],
          ].map(([k, t]) => (
            <Button key={k} variant={view === k ? "solid" : "outline"} onClick={() => setView(k)}>{t}</Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Toplam Numune</p><p className="mt-1 text-2xl font-black">{summary.total}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Ortalama Toplam</p><p className="mt-1 text-2xl font-black">{summary.avg}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Satışa Uygun</p><p className="mt-1 text-2xl font-black">{summary.counts.strong}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Eleme Adayı</p><p className="mt-1 text-2xl font-black">{summary.counts.rejected}</p></div>
        </div>
      </Card>

      {!selectedSectionId ? <Empty text="Analiz için önce bir numune bölümü seç." /> : null}

      {selectedSectionId && view === "summary" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5 md:p-6">
            <h3 className="mb-4 text-xl font-black">Genel Özet</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="En Yüksek Numune" value={summary.best?.name || "-"} />
              <Info label="En Yüksek Puan" value={summary.best ? `${sampleTotal(summary.best)} / 100` : "-"} />
              <Info label="Ortalama Küçük-Orta Oda" value={summary.avgSmall} />
              <Info label="Ortalama Banyo" value={summary.avgBath} />
              <Info label="Ortalama Büyük Oda" value={summary.avgLarge} />
              <Info label="Ortalama Devamlılık" value={summary.avgContinuity} />
            </div>
          </Card>
          <Card className="p-5 md:p-6">
            <h3 className="mb-4 text-xl font-black">Karar Dağılımı</h3>
            <div className="space-y-2">
              {sampleDecisionOptions.map((x) => {
                const count = sampleTests.filter((t) => sampleDecision(sampleTotal(t)) === x).length;
                return (
                  <div key={x} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-sm font-semibold text-slate-700">{x}</span>
                    <b>{count}</b>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : null}

      {selectedSectionId && view === "ranking" ? (
        <Card className="p-5 md:p-6">
          <h3 className="mb-4 text-xl font-black">Sıralama</h3>
          <div className="overflow-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[960px] bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>{["Sıra", "Numune", "K/Oda", "Banyo", "B/Oda", "Devamlılık", "Toplam", "Karar"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={x.id} className="border-t border-slate-100">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-bold">{x.name || "-"}</td>
                    <td className="p-3">{n(x.smallRoom)}</td>
                    <td className="p-3">{n(x.bathroom)}</td>
                    <td className="p-3">{n(x.largeRoom)}</td>
                    <td className="p-3">{n(x.continuity)}</td>
                    <td className="p-3 font-black">{sampleTotal(x)} / 100</td>
                    <td className="p-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${sampleDecisionTone(sampleTotal(x))}`}>{sampleDecision(sampleTotal(x))}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {selectedSectionId && view === "category" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {categoryMap.map((cat) => (
            <Card key={cat.label} className="p-5 md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black">{cat.label}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{cat.items.length} numune</span>
              </div>
              {cat.items.length === 0 ? <p className="text-sm text-slate-500">Kayıt yok.</p> : (
                <div className="space-y-2">
                  {cat.items.map((x) => (
                    <div key={x.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <b>{x.name || "-"}</b>
                        <span className="text-sm font-black">{sampleTotal(x)} / 100</span>
                      </div>
                      {x.notes ? <p className="mt-1 text-xs text-slate-600">{x.notes}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : null}

      {selectedSectionId && view === "table" ? (
        <Card className="p-5 md:p-6">
          <h3 className="mb-4 text-xl font-black">Detay Tablo</h3>
          <div className="overflow-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[1120px] bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>{["Numune", "Küçük-Orta Oda", "Banyo", "Büyük Oda", "Devamlılık", "Toplam", "Karar", "Notlar", "İşlem"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr key={x.id} className="border-t border-slate-100">
                    <td className="p-3 font-bold">{x.name || "-"}</td>
                    <td className="p-3">{n(x.smallRoom)}</td>
                    <td className="p-3">{n(x.bathroom)}</td>
                    <td className="p-3">{n(x.largeRoom)}</td>
                    <td className="p-3">{n(x.continuity)}</td>
                    <td className="p-3 font-black">{sampleTotal(x)} / 100</td>
                    <td className="p-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${sampleDecisionTone(sampleTotal(x))}`}>{sampleDecision(sampleTotal(x))}</span></td>
                    <td className="p-3">{x.notes || "-"}</td>
                    <td className="p-3"><Button variant="outline" onClick={() => onEditSample(x)} disabled={!canEdit}>Düzenle</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-black">{value}</p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function Mini({ label, value, color }) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-800",
    sky: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
  }[color];
  return (
    <div className={`rounded-xl p-2 ${cls}`}>
      <b>{value}</b>
      <br />
      {label}
    </div>
  );
}
