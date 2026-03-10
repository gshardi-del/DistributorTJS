import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid
} from "recharts";

// ── palette ──────────────────────────────────────────────
const C = {
  bg: "#0c0c0e",
  card: "#141416",
  border: "#1f1f24",
  orange: "#ff6b2b",
  orangeD: "#e55a1e",
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  text: "#e8e8ee",
  muted: "#52525e",
  sub: "#8888a0",
};

const PIE_COLORS = ["#ff6b2b", "#fb923c", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];

// ── sample / fallback data ────────────────────────────────
const SAMPLE = {
  sales: [
    { name: "Budi Santoso",    area: "Semarang Barat",  target: 850, actual: 920, outlets: 42, visited: 40, lastActive: "Hari ini",   status: "top" },
    { name: "Agus Wibowo",     area: "Semarang Timur",  target: 800, actual: 710, outlets: 38, visited: 30, lastActive: "Hari ini",   status: "warning" },
    { name: "Siti Rahayu",     area: "Kudus",           target: 750, actual: 780, outlets: 35, visited: 35, lastActive: "Hari ini",   status: "good" },
    { name: "Rudi Hermawan",   area: "Demak",           target: 700, actual: 520, outlets: 32, visited: 22, lastActive: "2 hari lalu",status: "danger" },
    { name: "Dewi Lestari",    area: "Kendal",          target: 680, actual: 690, outlets: 30, visited: 29, lastActive: "Hari ini",   status: "good" },
    { name: "Hendra Kurniawan",area: "Ungaran",         target: 720, actual: 750, outlets: 33, visited: 33, lastActive: "Hari ini",   status: "top" },
    { name: "Rina Susanti",    area: "Salatiga",        target: 650, actual: 480, outlets: 28, visited: 20, lastActive: "3 hari lalu",status: "danger" },
    { name: "Joko Prasetyo",   area: "Semarang Selatan",target: 780, actual: 800, outlets: 36, visited: 36, lastActive: "Hari ini",   status: "top" },
  ],
  weekly: [
    { day: "Sen", total: 4200 }, { day: "Sel", total: 3800 },
    { day: "Rab", total: 4600 }, { day: "Kam", total: 5100 },
    { day: "Jum", total: 4900 }, { day: "Sab", total: 3200 },
  ],
  products: [
    { name: "Surya 12", value: 35 }, { name: "Gudang Garam", value: 28 },
    { name: "Sampoerna", value: 20 }, { name: "Djarum", value: 12 },
    { name: "Lainnya", value: 5 },
  ],
};

// ── helpers ───────────────────────────────────────────────
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (n) => Number(n).toLocaleString("id-ID");

function deriveStatus(p) {
  if (p >= 100) return "top";
  if (p >= 90)  return "good";
  if (p >= 75)  return "warning";
  return "danger";
}

const STATUS_CFG = {
  top:     { label: "TOP",      bg: C.orange, text: "#fff" },
  good:    { label: "ON TRACK", bg: C.green,  text: "#fff" },
  warning: { label: "WARNING",  bg: C.yellow, text: "#111" },
  danger:  { label: "CRITICAL", bg: C.red,    text: "#fff" },
};

// ── parse uploaded workbook ───────────────────────────────
function parseWorkbook(wb) {
  const sheets = wb.SheetNames;
  const result = { sales: [], weekly: [], products: [], raw: {}, sheetNames: sheets };

  sheets.forEach((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    result.raw[name] = rows;

    const keys = rows[0] ? Object.keys(rows[0]).map((k) => k.toLowerCase()) : [];
    const has = (...kws) => kws.some((kw) => keys.some((k) => k.includes(kw)));

    // detect sales / penjualan sheet
    if (has("sales", "salesman", "nama") && has("target", "aktual", "actual", "realisasi", "penjualan")) {
      rows.forEach((r) => {
        const get = (...kws) => {
          const key = Object.keys(r).find((k) => kws.some((kw) => k.toLowerCase().includes(kw)));
          return key ? r[key] : "";
        };
        const actual = Number(get("aktual", "actual", "realisasi", "penjualan")) || 0;
        const target = Number(get("target")) || 0;
        const p = pct(actual, target);
        result.sales.push({
          name:       String(get("nama", "salesman", "sales") || "–"),
          area:       String(get("area", "wilayah", "kota", "region") || "–"),
          target,
          actual,
          outlets:    Number(get("total outlet", "outlet")) || 0,
          visited:    Number(get("kunjungan", "visit", "visited")) || 0,
          lastActive: String(get("terakhir", "last", "tanggal") || "–"),
          status:     deriveStatus(p),
        });
      });
    }

    // detect product / SKU sheet
    if (has("produk", "sku", "brand", "item") && has("qty", "jumlah", "penjualan", "value")) {
      rows.slice(0, 10).forEach((r) => {
        const get = (...kws) => {
          const key = Object.keys(r).find((k) => kws.some((kw) => k.toLowerCase().includes(kw)));
          return key ? r[key] : "";
        };
        const name  = String(get("produk", "sku", "brand", "item", "nama") || "–");
        const value = Number(get("qty", "jumlah", "penjualan", "value")) || 0;
        if (name !== "–" && value > 0) result.products.push({ name, value });
      });
    }

    // detect daily / weekly trend
    if (has("tanggal", "date", "hari") && has("total", "qty", "jumlah")) {
      rows.slice(-7).forEach((r) => {
        const get = (...kws) => {
          const key = Object.keys(r).find((k) => kws.some((kw) => k.toLowerCase().includes(kw)));
          return key ? r[key] : "";
        };
        result.weekly.push({
          day:   String(get("tanggal", "date", "hari") || "").slice(-5),
          total: Number(get("total", "qty", "jumlah")) || 0,
        });
      });
    }
  });

  // fallback to sample if nothing detected
  if (!result.sales.length)   result.sales   = SAMPLE.sales;
  if (!result.weekly.length)  result.weekly  = SAMPLE.weekly;
  if (!result.products.length)result.products = SAMPLE.products;

  return result;
}

// ── AI call ───────────────────────────────────────────────
async function askClaude(question, history, data) {
  const sys = `Kamu adalah AI assistant untuk manager distribusi rokok Jawa Tengah.
Data tim sales real-time:
${JSON.stringify(data.sales, null, 2)}

Trend mingguan:
${JSON.stringify(data.weekly, null, 2)}

Product mix:
${JSON.stringify(data.products, null, 2)}

Sheet tersedia: ${data.sheetNames ? data.sheetNames.join(", ") : "sample data"}

Jawab singkat, pakai bahasa Indonesia casual-profesional. Gunakan emoji secukupnya.
Berikan insight actionable. Maks 5 kalimat.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: sys,
      messages: [...history, { role: "user", content: question }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "Maaf, ada gangguan. Coba lagi ya.";
}

// ── sub-components ────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 14, right: 16, fontSize: 26, opacity: 0.15 }}>{icon}</div>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function UploadZone({ onData }) {
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [sheets, setSheets] = useState([]);
  const inputRef = useRef();

  const process = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const parsed = parseWorkbook(wb);
        setFileName(file.name);
        setSheets(wb.SheetNames);
        onData(parsed);
      } catch {
        alert("Gagal membaca file. Pastikan format Excel (.xlsx/.xls) dari Distri.id.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) process(file);
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current.click()}
      style={{
        border: `2px dashed ${drag ? C.orange : C.border}`,
        borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer",
        background: drag ? "#1a100800" : C.card,
        transition: "all 0.2s",
      }}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && process(e.target.files[0])} />

      {fileName ? (
        <>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
          <div style={{ color: C.green, fontWeight: 600, fontSize: 15 }}>{fileName}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
            Sheet terdeteksi: {sheets.join(" · ")}
          </div>
          <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>Klik untuk ganti file</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>Drop file Excel Distri.id di sini</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>atau klik untuk browse · .xlsx / .xls / .csv</div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {["Penjualan by Sales", "Visit Outlet", "Customer Report", "Stock Report"].map((s) => (
              <span key={s} style={{ background: "#1e1e24", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: C.sub }}>{s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── main app ──────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("upload");
  const [data, setData]         = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [chat, setChat]         = useState([]);
  const [apiHist, setApiHist]   = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const chatEnd = useRef();

  const activeData = data || SAMPLE;
  const isSample   = !data;

  useEffect(() => {
    setChat([{
      role: "assistant",
      content: isSample
        ? "Halo Boss! 👋 Saat ini aku pakai data sample. Upload file Excel dari Distri.id dulu di tab **Upload Data** supaya aku bisa analisa data real kamu ya!\n\nAtau boleh tanya-tanya dulu pakai data sample ini 😊"
        : `File berhasil diload! 🎉 Aku sudah baca ${data.sheetNames?.join(", ")}.\n\nAda ${data.sales.length} sales terdeteksi. Mau mulai dari mana Boss?`,
    }]);
  }, [data]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const handleData = (parsed) => { setData(parsed); setTab("dashboard"); };

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput(""); setLoading(true);
    const newChat = [...chat, { role: "user", content: q }];
    setChat(newChat);
    try {
      const reply = await askClaude(q, apiHist, activeData);
      setChat([...newChat, { role: "assistant", content: reply }]);
      setApiHist([...apiHist, { role: "user", content: q }, { role: "assistant", content: reply }]);
    } catch {
      setChat([...newChat, { role: "assistant", content: "⚠️ Koneksi bermasalah. Coba lagi." }]);
    }
    setLoading(false);
  };

  const sales   = activeData.sales;
  const weekly  = activeData.weekly;
  const products= activeData.products;

  const totTarget  = sales.reduce((s, x) => s + x.target, 0);
  const totActual  = sales.reduce((s, x) => s + x.actual, 0);
  const totOutlets = sales.reduce((s, x) => s + x.outlets, 0);
  const totVisited = sales.reduce((s, x) => s + x.visited, 0);
  const achPct     = pct(totActual, totTarget);

  const TABS = [
    { id: "upload",    label: "📂 Upload Data" },
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "team",      label: "👥 Tim Sales" },
    { id: "chat",      label: "🤖 AI Assistant" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Bebas+Neue&display=swap" rel="stylesheet" />

      {/* ── header ── */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🚬</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 19, letterSpacing: 2.5, color: C.orange }}>DISTRIB AI</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: -3 }}>Jawa Tengah · powered by Claude</div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 2 }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans'",
                background: tab === t.id ? C.orange : "transparent",
                color: tab === t.id ? "#fff" : C.muted,
                transition: "all 0.18s",
              }}>{t.label}</button>
            ))}
          </nav>

          {isSample && (
            <div style={{ fontSize: 11, color: C.yellow, background: "#2a220a", border: "1px solid #3d3010", padding: "5px 12px", borderRadius: 20 }}>
              ⚠️ Data Sample
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>

        {/* ══ UPLOAD TAB ══ */}
        {tab === "upload" && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, color: C.orange }}>Upload Data Distri.id</div>
              <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Export file dari Distri.id lalu upload di sini. AI akan langsung analisa datamu.</div>
            </div>

            <UploadZone onData={handleData} />

            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Cara Export dari Distri.id</div>
              {[
                { step: "01", title: "Login ke Distri.id", desc: "Masuk ke dashboard Distri.id kamu" },
                { step: "02", title: "Pilih Laporan", desc: "Buka menu Laporan → pilih: Penjualan by Sales, Visit Outlet, atau Stock Report" },
                { step: "03", title: "Set Periode", desc: "Pilih range tanggal yang ingin dianalisa (harian/mingguan/bulanan)" },
                { step: "04", title: "Export ke Excel", desc: "Klik tombol Export / Download → pilih format .xlsx" },
                { step: "05", title: "Upload di sini", desc: "Drag & drop file yang sudah didownload ke kotak di atas" },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1e1208", border: `1px solid ${C.orange}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'Bebas Neue'", color: C.orange, flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</div>
                    <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: "14px 16px", background: "#0e1a10", border: `1px solid ${C.green}30`, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 4 }}>💡 Tidak punya file sekarang?</div>
              <div style={{ fontSize: 12, color: C.sub }}>Tidak apa-apa! Dashboard & AI tetap bisa dipakai dengan data sample. Klik tab Dashboard atau AI Assistant untuk mulai.</div>
            </div>
          </div>
        )}

        {/* ══ DASHBOARD TAB ══ */}
        {tab === "dashboard" && (
          <div>
            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              <KpiCard label="Total Penjualan"   value={fmt(totActual)}           sub={`karton · target ${fmt(totTarget)}`}         icon="📦" color={C.orange} />
              <KpiCard label="Achievement"       value={`${achPct}%`}             sub={achPct >= 100 ? "Target tercapai! 🎉" : `Kurang ${fmt(totTarget - totActual)} karton`} icon="🎯" color={achPct >= 100 ? C.green : achPct >= 85 ? C.yellow : C.red} />
              <KpiCard label="Coverage Outlet"   value={`${pct(totVisited,totOutlets)}%`} sub={`${fmt(totVisited)} dari ${fmt(totOutlets)} outlet`} icon="🗺️" color={C.blue} />
              <KpiCard label="Sales Aktif Hari Ini" value={`${sales.filter(s=>s.lastActive==="Hari ini").length}/${sales.length}`} sub="personil aktif" icon="👤" color="#a855f7" />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
              <div style={{ background: C.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 }}>Trend Penjualan</div>
                <div style={{ fontSize: 10, color: C.sub, marginBottom: 18 }}>Total karton per periode</div>
                <ResponsiveContainer width="100%" height={155}>
                  <LineChart data={weekly}>
                    <CartesianGrid stroke="#1a1a20" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a20", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                    <Line type="monotone" dataKey="total" stroke={C.orange} strokeWidth={2.5} dot={{ fill: C.orange, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: C.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 }}>Product Mix</div>
                <div style={{ fontSize: 10, color: C.sub, marginBottom: 14 }}>Komposisi SKU</div>
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie data={products} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" paddingAngle={2}>
                      {products.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a1a20", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {products.slice(0, 5).map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.sub }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Area bar */}
            <div style={{ background: C.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 }}>Performa per Sales</div>
              <div style={{ fontSize: 10, color: C.sub, marginBottom: 18 }}>% pencapaian target</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={sales.map(s => ({ name: s.name.split(" ")[0], pct: pct(s.actual, s.target) }))} barSize={26}>
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 130]} />
                  <Tooltip contentStyle={{ background: "#1a1a20", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                    formatter={(v) => [`${v}%`, "Achievement"]} />
                  <Bar dataKey="pct" radius={[5, 5, 0, 0]}>
                    {sales.map((s, i) => {
                      const p2 = pct(s.actual, s.target);
                      return <Cell key={i} fill={p2 >= 100 ? C.orange : p2 >= 90 ? C.green : p2 >= 75 ? C.yellow : C.red} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TEAM TAB ══ */}
        {tab === "team" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
              {[
                { label: "Top Performer", count: sales.filter(s => s.status === "top").length,    color: C.orange, icon: "🏆" },
                { label: "On Track",      count: sales.filter(s => s.status === "good").length,    color: C.green,  icon: "✅" },
                { label: "Butuh Perhatian",count: sales.filter(s=>["warning","danger"].includes(s.status)).length, color: C.red, icon: "⚠️" },
              ].map((s, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'Bebas Neue'" }}>{s.count} Sales</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...sales].sort((a, b) => pct(b.actual, b.target) - pct(a.actual, a.target)).map((s, i) => {
                const p2 = pct(s.actual, s.target);
                const cov = pct(s.visited, s.outlets);
                const sc = STATUS_CFG[s.status];
                const open = expanded === i;
                return (
                  <div key={i} onClick={() => setExpanded(open ? null : i)}
                    style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${open ? C.orange : C.border}`, cursor: "pointer", transition: "border-color 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#1e1e24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                          {s.status === "top" ? "⭐" : s.status === "good" ? "✅" : s.status === "warning" ? "⚡" : "🔴"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>📍 {s.area} · {s.lastActive}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue'", color: p2 >= 100 ? C.orange : p2 >= 90 ? C.green : p2 >= 75 ? C.yellow : C.red }}>{p2}%</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{fmt(s.actual)} / {fmt(s.target)}</div>
                        </div>
                        <div style={{ padding: "3px 9px", borderRadius: 6, fontSize: 9, fontWeight: 700, letterSpacing: 1, background: sc.bg, color: sc.text }}>{sc.label}</div>
                      </div>
                    </div>

                    {open && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                        {[
                          { label: "Coverage",     value: `${cov}%`,                            sub: `${s.visited}/${s.outlets} outlet` },
                          { label: "Avg / Visit",  value: s.visited ? Math.round(s.actual / s.visited) : "–", sub: "karton per kunjungan" },
                          { label: "Gap Target",   value: s.actual >= s.target ? `+${fmt(s.actual - s.target)}` : fmt(s.actual - s.target), sub: "karton vs target", color: s.actual >= s.target ? C.green : C.red },
                          { label: "Outlet Missed",value: s.outlets - s.visited,                 sub: "belum dikunjungi", color: (s.outlets - s.visited) > 5 ? C.red : C.yellow },
                        ].map((m, j) => (
                          <div key={j} style={{ background: "#0f0f12", borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{m.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: m.color || C.orange, fontFamily: "'Bebas Neue'" }}>{m.value}</div>
                            <div style={{ fontSize: 10, color: C.sub }}>{m.sub}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ CHAT TAB ══ */}
        {tab === "chat" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, height: "calc(100vh - 160px)" }}>
            {/* chat panel */}
            <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>AI Sales Assistant</span>
                <span style={{ fontSize: 10, color: C.muted }}>— {isSample ? "data sample" : `${data.sheetNames?.join(", ")}`}</span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                {chat.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 8 }}>
                    {m.role === "assistant" && (
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${C.orange},${C.orangeD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>🤖</div>
                    )}
                    <div style={{
                      maxWidth: "76%", padding: "11px 15px",
                      borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: m.role === "user" ? `linear-gradient(135deg,${C.orange},${C.orangeD})` : "#1e1e26",
                      fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-line",
                    }}>{m.content}</div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${C.orange},${C.orangeD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
                    <div style={{ padding: "11px 15px", background: "#1e1e26", borderRadius: "14px 14px 14px 4px", display: "flex", gap: 5 }}>
                      {[0,1,2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: C.orange, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${j*0.3}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Tanya tentang tim sales kamu..."
                  style={{ flex: 1, background: "#1a1a22", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 13px", color: C.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans'" }} />
                <button onClick={send} disabled={loading}
                  style={{ padding: "9px 16px", background: loading ? C.border : `linear-gradient(135deg,${C.orange},${C.orangeD})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}>➤</button>
              </div>
            </div>

            {/* sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: C.card, borderRadius: 14, padding: "16px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Pertanyaan Cepat</div>
                {[
                  "Sales mana yang butuh coaching?",
                  "Siapa top performer bulan ini?",
                  "Area mana yang under-perform?",
                  "Coverage outlet gimana?",
                  "Rekomendasikan action plan minggu ini",
                ].map((q, i) => (
                  <button key={i} onClick={() => setInput(q)}
                    style={{ width: "100%", background: "#14141a", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 11px", color: C.sub, fontSize: 11, cursor: "pointer", textAlign: "left", marginBottom: 6, transition: "all 0.15s", fontFamily: "'DM Sans'" }}
                    onMouseOver={e => { e.currentTarget.style.color = C.orange; e.currentTarget.style.borderColor = `${C.orange}50`; }}
                    onMouseOut={e => { e.currentTarget.style.color = C.sub; e.currentTarget.style.borderColor = C.border; }}>
                    💬 {q}
                  </button>
                ))}
              </div>

              <div style={{ background: C.card, borderRadius: 14, padding: "16px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>⚠️ Perlu Perhatian</div>
                {sales.filter(s => ["warning","danger"].includes(s.status)).map((s, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: "9px 11px", background: "#0f0f12", borderRadius: 8, borderLeft: `3px solid ${s.status === "danger" ? C.red : C.yellow}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{s.area} · {pct(s.actual, s.target)}% achieved</div>
                  </div>
                ))}
                {sales.filter(s => ["warning","danger"].includes(s.status)).length === 0 && (
                  <div style={{ fontSize: 12, color: C.green }}>✅ Semua sales on track!</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:2px}
      `}</style>
    </div>
  );
}
