import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Copy,
  Download,
  Eye,
  FileDown,
  FlaskConical,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

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
  const [page, setPage] = useState("record");
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

  useEffect(() => {
    try {
      const primary = localStorage.getItem(KEY);
      const fallback = OLD_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
      const raw = primary || fallback;
      const parsed = raw ? safeParse(raw) : null;
      if (Array.isArray(parsed)) setTests(parsed.map(normalize));
    } catch (e) {
      console.error("Kayıtlar okunamadı", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(tests));
    } catch (e) {
      console.error("Kayıtlar yazılamadı", e);
    }
  }, [tests]);

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

  function save() {
    const item = normalize({
      ...form,
      essenceMl: calc.essenceMl,
      ethylAlcoholMl: calc.alcoholMl,
      dpmMl: calc.dpmMl,
      dpgMl: calc.dpgMl,
      augeoMl: calc.augeoMl,
      id: form.id || uid(),
    });
    setTests((old) =>
      old.some((x) => x.id === item.id)
        ? old.map((x) => (x.id === item.id ? item : x))
        : [item, ...old],
    );
    setSelectedId(item.id);
    setForm(blank);
  }

  function edit(t) {
    setForm(normalize(t));
    setSelectedId(t.id);
    setPage("record");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function duplicate(t) {
    const copy = normalize({
      ...t,
      id: uid(),
      testName: `${t.testName || t.essence || "Test"} - Kopya`,
      date: blank.date,
      status: "Takipte",
    });
    setTests((old) => [copy, ...old]);
    setSelectedId(copy.id);
  }

  function remove(testId) {
    setTests((old) => old.filter((x) => x.id !== testId));
    if (selectedId === testId) setSelectedId(null);
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

  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = safeParse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("bad_json");
        const next = data.map(normalize);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-100 p-4 font-sans text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header exportJson={exportJson} onOpenPdf={() => setPdfOpen(true)} importJson={importJson} />
        <Tabs page={page} setPage={setPage} />
        <Stats stats={stats} />
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
        {page === "record" ? (
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
            }}
          />
        ) : (
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
            }}
          />
        )}
      </div>
    </div>
  );
}

function Header({ exportJson, onOpenPdf, importJson }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-slate-700 shadow-sm md:text-base">
          <FlaskConical className="h-4 w-4 md:h-5 md:w-5" /> Homelizan Essence Lab Tracker
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-4xl">
          Reed Diffuser Test Takip Paneli
        </h1>
      </div>
      <div className="flex flex-wrap gap-2">
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
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <Card className="w-full max-w-3xl rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black">PDF Rapor Ayarları</h3>
            <p className="mt-1 text-sm text-slate-500">Profesyonel rapor düzeni ve filtre seçenekleri</p>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Kapat
          </Button>
        </div>

        <div className="space-y-5">
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

        <div className="mt-5 flex flex-wrap justify-end gap-2">
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

function Tabs({ page, setPage }) {
  return (
    <div className="flex w-fit flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <Button variant={page === "record" ? "solid" : "ghost"} onClick={() => setPage("record")}>
        <Plus className="h-4 w-4" /> Kayıt Sayfası
      </Button>
      <Button
        variant={page === "analysis" ? "solid" : "ghost"}
        onClick={() => setPage("analysis")}
      >
        <BarChart3 className="h-4 w-4" /> Analiz Sayfası
      </Button>
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
  } = p;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Yeni Test Kaydı</h2>
          </div>
          <Button variant="outline" onClick={() => setForm(blank)}>
            Sıfırla
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Test Adı">
            <input
              className={input}
              value={form.testName}
              onChange={(e) => update("testName", e.target.value)}
              placeholder="Black Orchid - Alkol A - DPM %5"
            />
          </Field>
          <Field label="Tarih">
            <input
              type="date"
              className={input}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>
          <Field label="Esans Adı">
            <input
              list="essences"
              className={input}
              value={form.essence}
              onChange={(e) => update("essence", e.target.value)}
              placeholder="Black Orchid"
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
          />
        </Field>
        <Button className="mt-5 w-full py-3" onClick={save}>
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
                <Button variant="outline" onClick={() => edit(t)}>
                  Düzenle
                </Button>
                <Button variant="outline" onClick={() => duplicate(t)}>
                  <Copy className="h-4 w-4" /> Kopyala
                </Button>
                <Button variant="outline" className="text-rose-600" onClick={() => remove(t.id)}>
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
  } = p;

  const openInRecord = (id) => {
    setSelectedId(id);
    setPage("record");
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
      {aView === "table" && <DetailTable tests={analysisTests} edit={edit} />}
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

function DetailTable({ tests, edit }) {
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
                  <Button variant="outline" onClick={() => edit(t)}>
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
