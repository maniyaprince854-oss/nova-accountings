import { useState, useEffect, useRef } from "react";

// ─── Storage (localStorage for deployment) ────────────────────────────────────
const STORAGE_KEYS = { customers: "nova_customers_v3", settings: "nova_settings_v3", expenses: "nova_expenses_v3" };
async function loadData(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
async function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { price13: 150, price16: 180, dotPrice: 0.07, paperPrice: 30 };
const EXPENSE_CATEGORIES = ["Material Purchase","Electricity","Machine Maintenance","Rent","Transport","Staff Salary","Miscellaneous"];

// ─── Utils ────────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtMonth = iso => { const d = new Date(iso + "-01"); return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }); };
const uid = () => Math.random().toString(36).slice(2) + Date.now();
const inr = n => "₹" + (n || 0).toLocaleString("en-IN");
const thisMonth = () => new Date().toISOString().slice(0, 7);
const thisYear = () => new Date().getFullYear().toString();

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" };
  const p25 = { ...p, strokeWidth: "2.5" };
  const icons = {
    plus:     <svg {...p25}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    users:    <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    settings: <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    back:     <svg {...p25}><polyline points="15 18 9 12 15 6"/></svg>,
    trash:    <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    edit:     <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    x:        <svg {...p25}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    save:     <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    laser:    <svg {...p}><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>,
    cnc:      <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    payment:  <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    chart:    <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    trophy:   <svg {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
    lock:     <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    download: <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    upload:   <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    shield:   <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    file:     <svg {...p}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
    check:    <svg {...p25}><polyline points="20 6 9 17 4 12"/></svg>,
    receipt:  <svg {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/><line x1="12" y1="16" x2="8" y2="16"/></svg>,
    print:    <svg {...p}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    wallet:   <svg {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
    tag:      <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    search:   <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    trending: <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    home:     <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    pen:      <svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  };
  return icons[name] || null;
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const style = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0f0f0f; --surface:#171717; --surface2:#1f1f1f; --surface3:#272727;
    --border:#2e2e2e; --border2:#3a3a3a;
    --text:#e8e8e8; --text2:#9a9a9a; --text3:#5a5a5a;
    --accent:#f0a500; --accent2:#f0c040; --accent-dim:rgba(240,165,0,0.12);
    --red:#e05050; --green:#50c080; --blue:#5090e0; --purple:#a060e0;
    --radius:8px; --radius2:12px;
    --bottom-nav-h: 64px;
  }
  html { -webkit-text-size-adjust:100%; }
  body { font-family:'IBM Plex Sans',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; -webkit-tap-highlight-color:transparent; }
  .app { min-height:100vh; display:flex; flex-direction:column; }
  .header { background:var(--surface); border-bottom:1px solid var(--border); padding:0 24px; height:58px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:200; }
  .header-logo { display:flex; align-items:center; gap:10px; }
  .header-nav { display:flex; gap:4px; }
  .nav-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border:1px solid transparent; border-radius:var(--radius); background:transparent; color:var(--text2); font-family:'IBM Plex Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .nav-btn:hover { color:var(--text); background:var(--surface2); border-color:var(--border); }
  .nav-btn.active { color:var(--accent); background:var(--accent-dim); border-color:var(--accent); }
  .bottom-nav { display:none; }
  .main { flex:1; padding:28px 24px 40px; max-width:1100px; margin:0 auto; width:100%; }
  .page-title { font-size:22px; font-weight:700; color:var(--text); }
  .page-sub { font-size:13px; color:var(--text3); margin-top:4px; font-family:'IBM Plex Mono',monospace; }
  .page-header { margin-bottom:24px; }
  .btn { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:var(--radius); font-family:'IBM Plex Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; border:1px solid transparent; white-space:nowrap; touch-action:manipulation; }
  .btn-primary { background:var(--accent); color:#000; border-color:var(--accent); }
  .btn-primary:hover,.btn-primary:active { background:var(--accent2); border-color:var(--accent2); }
  .btn-green { background:rgba(80,192,128,0.15); color:var(--green); border-color:rgba(80,192,128,0.3); }
  .btn-green:hover,.btn-green:active { background:rgba(80,192,128,0.25); border-color:var(--green); }
  .btn-ghost { background:transparent; color:var(--text2); border-color:var(--border2); }
  .btn-ghost:hover,.btn-ghost:active { background:var(--surface2); color:var(--text); }
  .btn-danger { background:transparent; color:var(--red); border-color:rgba(224,80,80,0.3); }
  .btn-danger:hover,.btn-danger:active { background:rgba(224,80,80,0.1); border-color:var(--red); }
  .btn-sm { padding:7px 12px; font-size:12px; }
  .btn:disabled { opacity:0.4; cursor:not-allowed; }
  .btn-full { width:100%; justify-content:center; }
  .data-table { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); overflow:hidden; width:100%; }
  .data-table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .data-table table { width:100%; border-collapse:collapse; min-width:560px; }
  .data-table th { padding:10px 14px; background:var(--surface2); border-bottom:1px solid var(--border); font-size:11px; font-weight:600; color:var(--text3); letter-spacing:.08em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; text-align:left; white-space:nowrap; }
  .data-table td { padding:12px 14px; border-bottom:1px solid var(--border); font-size:13px; color:var(--text); vertical-align:middle; }
  .data-table tr:last-child td { border-bottom:none; }
  .data-table tr:hover td { background:var(--surface2); }
  .tbl-empty { padding:40px 20px; text-align:center; color:var(--text3); font-size:14px; }
  .card-list { display:none; }
  .entry-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); padding:14px 16px; margin-bottom:10px; }
  .entry-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .entry-card-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:6px; }
  .entry-card-row { display:flex; justify-content:space-between; font-size:13px; color:var(--text2); padding:2px 0; }
  .entry-card-amount { font-family:'IBM Plex Mono',monospace; font-weight:700; font-size:18px; color:var(--accent); }
  .entry-card-amount.green { color:var(--green); }
  .entry-card-amount.red { color:var(--red); }
  .entry-card-date { font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text3); }
  .cust-list-header { display:grid; grid-template-columns:1fr 140px 130px 100px; padding:10px 20px; background:var(--surface2); border-bottom:1px solid var(--border); font-size:11px; font-weight:600; color:var(--text3); letter-spacing:.08em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; }
  .cust-list-row { display:grid; grid-template-columns:1fr 140px 130px 100px; padding:14px 20px; border-bottom:1px solid var(--border); align-items:center; transition:background .1s; cursor:pointer; }
  .cust-list-row:last-child { border-bottom:none; }
  .cust-list-row:hover { background:var(--surface2); }
  .cust-card-list { display:none; }
  .cust-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); padding:16px; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background .15s; }
  .cust-card:active { background:var(--surface2); }
  .cust-card-left { flex:1; min-width:0; }
  .cust-card-name { font-size:16px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; }
  .cust-card-stats { display:flex; gap:12px; flex-wrap:wrap; }
  .cust-card-stat { font-size:12px; font-family:'IBM Plex Mono',monospace; color:var(--text3); }
  .cust-card-right { display:flex; align-items:center; gap:10px; flex-shrink:0; margin-left:12px; }
  .cust-card-balance { font-family:'IBM Plex Mono',monospace; font-size:15px; font-weight:700; }
  .dashboard-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:24px; }
  .dash-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); padding:16px 18px; position:relative; overflow:hidden; }
  .dash-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .dash-card.accent::before { background:var(--accent); }
  .dash-card.green::before { background:var(--green); }
  .dash-card.red::before { background:var(--red); }
  .dash-card.blue::before { background:var(--blue); }
  .dash-card.purple::before { background:var(--purple); }
  .dash-label { font-size:10px; color:var(--text3); font-weight:600; letter-spacing:.08em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; }
  .dash-value { font-size:18px; font-weight:700; margin-top:4px; font-family:'IBM Plex Mono',monospace; }
  .dash-sub { font-size:11px; color:var(--text3); margin-top:2px; font-family:'IBM Plex Mono',monospace; }
  .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
  .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); padding:16px 18px; }
  .stat-label { font-size:10px; color:var(--text3); font-weight:600; letter-spacing:.08em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; }
  .stat-value { font-size:22px; font-weight:700; margin-top:4px; font-family:'IBM Plex Mono',monospace; }
  .stat-accent { color:var(--accent); } .stat-green { color:var(--green); } .stat-red { color:var(--red); } .stat-blue { color:var(--blue); } .stat-purple { color:var(--purple); }
  .stat-sub { font-size:11px; color:var(--text3); margin-top:2px; font-family:'IBM Plex Mono',monospace; }
  .mono { font-family:'IBM Plex Mono',monospace; }
  .amount-cell { font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--accent); white-space:nowrap; }
  .paid-cell { font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--green); white-space:nowrap; }
  .expense-cell { font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--red); white-space:nowrap; }
  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; font-family:'IBM Plex Mono',monospace; }
  .badge-laser { background:rgba(240,165,0,0.15); color:var(--accent); border:1px solid rgba(240,165,0,0.25); }
  .badge-cnc { background:rgba(80,192,128,0.12); color:var(--green); border:1px solid rgba(80,192,128,0.25); }
  .badge-custom { background:rgba(80,144,224,0.12); color:var(--blue); border:1px solid rgba(80,144,224,0.25); }
  .badge-yes { background:rgba(80,192,128,0.12); color:var(--green); border:1px solid rgba(80,192,128,0.2); }
  .badge-no { background:var(--surface3); color:var(--text3); border:1px solid var(--border); }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.80); display:flex; align-items:flex-end; justify-content:center; z-index:1000; animation:fadeIn .15s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal { background:var(--surface); border:1px solid var(--border2); border-radius:16px 16px 0 0; width:100%; max-width:600px; max-height:92vh; overflow-y:auto; animation:slideUpModal .25s ease; -webkit-overflow-scrolling:touch; }
  @keyframes slideUpModal { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .modal-header { padding:16px 20px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; background:var(--surface); z-index:2; }
  .modal-title { font-size:15px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; }
  .modal-body { padding:20px; display:flex; flex-direction:column; gap:16px; padding-bottom:8px; }
  .modal-footer { padding:14px 20px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; position:sticky; bottom:0; background:var(--surface); }
  .field { display:flex; flex-direction:column; gap:6px; }
  .field-label { font-size:11px; font-weight:600; color:var(--text3); letter-spacing:.07em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; }
  .field input,.field select,.field textarea { background:var(--surface2); border:1px solid var(--border2); border-radius:var(--radius); padding:11px 14px; color:var(--text); font-family:'IBM Plex Sans',sans-serif; font-size:16px; outline:none; transition:border-color .15s; appearance:none; -webkit-appearance:none; width:100%; }
  .field input:focus,.field select:focus,.field textarea:focus { border-color:var(--accent); }
  .field textarea { resize:vertical; min-height:72px; font-size:15px; }
  .field select { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239a9a9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .radio-group { display:flex; gap:8px; flex-wrap:wrap; }
  .radio-opt { flex:1; min-width:100px; display:flex; align-items:center; justify-content:center; gap:6px; padding:11px 14px; border:1px solid var(--border2); border-radius:var(--radius); cursor:pointer; font-size:13px; font-weight:500; color:var(--text2); transition:all .15s; user-select:none; background:var(--surface2); touch-action:manipulation; }
  .radio-opt:hover { border-color:var(--accent); color:var(--text); }
  .radio-opt.selected { border-color:var(--accent); background:var(--accent-dim); color:var(--accent); font-weight:600; }
  .radio-opt input { display:none; }
  .calc-preview { background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius); padding:14px 16px; }
  .calc-title { font-size:11px; font-weight:600; color:var(--text3); letter-spacing:.07em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; margin-bottom:10px; }
  .calc-row { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; color:var(--text2); font-family:'IBM Plex Mono',monospace; }
  .calc-row.total { border-top:1px solid var(--border2); margin-top:6px; padding-top:8px; color:var(--accent); font-weight:700; font-size:15px; }
  .settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .settings-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); padding:20px; }
  .settings-card-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .settings-field { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
  .settings-field label { font-size:11px; font-weight:600; color:var(--text3); letter-spacing:.07em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; }
  .settings-field input { background:var(--surface2); border:1px solid var(--border2); border-radius:var(--radius); padding:10px 12px; color:var(--text); font-family:'IBM Plex Mono',monospace; font-size:15px; outline:none; transition:border-color .15s; width:100%; }
  .settings-field input:focus { border-color:var(--accent); }
  .analytics-overview { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
  .chart-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); padding:20px; margin-bottom:14px; }
  .chart-card-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .charts-2col { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
  .bar-wrap { display:flex; flex-direction:column; gap:10px; }
  .bar-item { display:flex; align-items:center; gap:10px; }
  .bar-label { font-size:12px; color:var(--text2); width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex-shrink:0; }
  .bar-track { flex:1; background:var(--surface2); border-radius:4px; height:8px; overflow:hidden; }
  .bar-fill { height:100%; border-radius:4px; transition:width .5s ease; }
  .bar-val { font-size:11px; font-family:'IBM Plex Mono',monospace; color:var(--text3); width:80px; text-align:right; flex-shrink:0; }
  .pie-wrap { display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
  .pie-legend { display:flex; flex-direction:column; gap:6px; }
  .pie-legend-item { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text2); }
  .pie-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .top-customer-card { background:linear-gradient(135deg,rgba(240,165,0,0.1),rgba(240,165,0,0.03)); border:1px solid rgba(240,165,0,0.25); border-radius:var(--radius2); padding:20px; display:flex; align-items:center; gap:18px; margin-bottom:14px; }
  .expense-summary-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .cat-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; font-family:'IBM Plex Mono',monospace; background:var(--surface3); color:var(--text2); border:1px solid var(--border); }
  .month-filter-bar { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; -webkit-overflow-scrolling:touch; margin-bottom:16px; }
  .month-filter-bar::-webkit-scrollbar { display:none; }
  .month-chip { flex-shrink:0; padding:6px 14px; border-radius:50px; border:1px solid var(--border2); background:var(--surface2); color:var(--text2); font-size:12px; font-weight:600; font-family:'IBM Plex Mono',monospace; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .month-chip:hover { border-color:var(--accent); color:var(--text); }
  .month-chip.active { background:var(--accent); border-color:var(--accent); color:#000; }
  .backup-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
  .backup-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius2); padding:20px; display:flex; flex-direction:column; gap:12px; }
  .backup-card-title { font-size:15px; font-weight:700; color:var(--text); }
  .backup-card-desc { font-size:13px; color:var(--text2); line-height:1.6; flex:1; }
  .backup-tip { background:rgba(80,144,224,0.08); border:1px solid rgba(80,144,224,0.2); border-radius:var(--radius2); padding:14px 18px; display:flex; gap:12px; align-items:flex-start; margin-bottom:14px; }
  .backup-tip-text { font-size:13px; color:var(--text2); line-height:1.65; }
  .backup-tip-text strong { color:var(--text); }
  .import-drop { border:2px dashed var(--border2); border-radius:var(--radius2); padding:28px 20px; text-align:center; cursor:pointer; transition:all .2s; background:var(--surface2); }
  .import-drop:hover,.import-drop.drag { border-color:var(--accent); background:var(--accent-dim); }
  .import-drop-icon { color:var(--text3); margin-bottom:10px; }
  .import-drop-text { font-size:14px; font-weight:600; color:var(--text2); }
  .import-drop-sub { font-size:12px; color:var(--text3); margin-top:4px; }
  .success-banner { background:rgba(80,192,128,0.1); border:1px solid rgba(80,192,128,0.25); border-radius:var(--radius); padding:12px 16px; display:flex; align-items:center; gap:10px; font-size:13px; color:var(--green); font-weight:500; }
  .bill-modal { background:#fff; border-radius:0; width:100%; max-width:600px; max-height:92vh; overflow-y:auto; animation:slideUpModal .25s ease; }
  .bill-page { background:#fff; color:#111; font-family:'IBM Plex Sans',sans-serif; padding:32px 36px; }
  .bill-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #111; }
  .bill-brand-name { font-size:22px; font-weight:800; color:#111; }
  .bill-brand-sub { font-size:11px; color:#666; letter-spacing:0.1em; text-transform:uppercase; font-family:'IBM Plex Mono',monospace; }
  .bill-meta { text-align:right; }
  .bill-meta-title { font-size:20px; font-weight:700; color:#111; }
  .bill-meta-detail { font-size:12px; color:#666; font-family:'IBM Plex Mono',monospace; margin-top:4px; }
  .bill-to { margin-bottom:24px; }
  .bill-to-label { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#888; font-family:'IBM Plex Mono',monospace; margin-bottom:4px; }
  .bill-to-name { font-size:18px; font-weight:700; color:#111; }
  .bill-to-period { font-size:13px; color:#555; font-family:'IBM Plex Mono',monospace; }
  .bill-table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  .bill-table th { padding:8px 10px; background:#f5f5f5; border-bottom:1px solid #ddd; font-size:10px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#555; text-align:left; font-family:'IBM Plex Mono',monospace; }
  .bill-table td { padding:9px 10px; border-bottom:1px solid #eee; font-size:12px; color:#222; }
  .bill-table tr:last-child td { border-bottom:none; }
  .bill-table .amt { font-family:'IBM Plex Mono',monospace; font-weight:600; text-align:right; }
  .bill-table .num { font-family:'IBM Plex Mono',monospace; text-align:right; }
  .bill-summary { margin-left:auto; width:220px; margin-bottom:24px; }
  .bill-sum-row { display:flex; justify-content:space-between; font-size:13px; padding:5px 0; color:#444; border-bottom:1px solid #eee; font-family:'IBM Plex Mono',monospace; }
  .bill-sum-row.total { font-size:16px; font-weight:700; color:#111; border-bottom:2px solid #111; border-top:2px solid #111; padding:8px 0; }
  .bill-sum-row.paid { color:#1a7a3f; }
  .bill-sum-row.balance-due { color:#c0392b; font-weight:700; }
  .bill-sum-row.balance-ok { color:#1a7a3f; font-weight:700; }
  .bill-footer { text-align:center; font-size:11px; color:#aaa; font-family:'IBM Plex Mono',monospace; padding-top:20px; border-top:1px solid #eee; }
  .bill-actions { display:flex; gap:10px; padding:14px 20px; border-top:1px solid var(--border); background:var(--surface); position:sticky; bottom:0; }
  @media print { .modal-overlay,.bill-actions{display:none!important} .bill-modal{max-height:none;overflow:visible} .bill-page{padding:20px 24px} }
  .toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:var(--green); color:#000; padding:11px 22px; border-radius:50px; font-size:13px; font-weight:600; animation:toastIn .2s ease; z-index:9999; white-space:nowrap; box-shadow:0 4px 20px rgba(0,0,0,0.4); }
  @keyframes toastIn { from{transform:translateX(-50%) translateY(10px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
  .divider { border:none; border-top:1px solid var(--border); }
  .icon-btn { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border:1px solid transparent; border-radius:var(--radius); background:transparent; cursor:pointer; color:var(--text3); transition:all .15s; }
  .icon-btn:hover { background:rgba(224,80,80,0.1); color:var(--red); border-color:rgba(224,80,80,0.2); }
  .icon-btn.edit:hover { background:rgba(80,144,224,0.1); color:var(--blue); border-color:rgba(80,144,224,0.2); }
  .top-actions { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:10px; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
  .profit-card { border-radius:var(--radius2); padding:18px 20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .profit-positive { background:linear-gradient(135deg,rgba(80,192,128,0.12),rgba(80,192,128,0.04)); border:1px solid rgba(80,192,128,0.25); }
  .profit-negative { background:linear-gradient(135deg,rgba(224,80,80,0.12),rgba(224,80,80,0.04)); border:1px solid rgba(224,80,80,0.25); }
  .search-input { background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius); padding:10px 14px; color:var(--text); font-family:'IBM Plex Sans',sans-serif; font-size:14px; outline:none; width:220px; }
  .search-input:focus { border-color:var(--accent); }
  @media(max-width:1000px) {
    .dashboard-grid { grid-template-columns:repeat(3,1fr) !important; }
    .analytics-overview { grid-template-columns:repeat(3,1fr); }
    .charts-2col { grid-template-columns:1fr; }
    .settings-grid { grid-template-columns:1fr; }
  }
  @media(max-width:600px) {
    :root { --bottom-nav-h:64px; }
    .header { padding:0 16px; height:52px; }
    .header-nav { display:none; }
    .bottom-nav { display:flex; position:fixed; bottom:0; left:0; right:0; height:var(--bottom-nav-h); background:var(--surface); border-top:1px solid var(--border); z-index:200; padding:0 4px; padding-bottom:env(safe-area-inset-bottom); }
    .bnav-btn { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; border:none; background:transparent; color:var(--text3); font-family:'IBM Plex Sans',sans-serif; font-size:10px; font-weight:600; cursor:pointer; padding:8px 0; transition:color .15s; }
    .bnav-btn.active { color:var(--accent); }
    .main { padding:16px 14px calc(var(--bottom-nav-h) + 20px); }
    .page-title { font-size:19px; }
    .dashboard-grid { grid-template-columns:repeat(2,1fr) !important; gap:8px; }
    .dash-value { font-size:14px; }
    .stats-row { gap:8px; }
    .stat-card { padding:12px 10px; }
    .stat-value { font-size:16px; }
    .stat-label { font-size:9px; }
    .expense-summary-row { grid-template-columns:repeat(2,1fr) !important; gap:8px; }
    .data-table.cust-table,.data-table.entries-table,.data-table.payments-table,.data-table.expenses-table { display:none; }
    .cust-card-list,.card-list { display:block; }
    .analytics-overview { grid-template-columns:repeat(2,1fr); gap:8px; }
    .charts-2col { grid-template-columns:1fr; }
    .settings-grid,.backup-grid { grid-template-columns:1fr; }
    .form-row { grid-template-columns:1fr; }
    .modal-footer { flex-direction:column-reverse; }
    .modal-footer .btn { width:100%; justify-content:center; }
    .toast { bottom:calc(var(--bottom-nav-h) + 12px); }
    .top-actions { flex-direction:column; align-items:stretch; }
    .top-actions .btn { width:100%; justify-content:center; }
    .search-input { width:100% !important; }
  }
`;

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedCid, setSelectedCid] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [pwModal, setPwModal] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await loadData(STORAGE_KEYS.customers);
      const s = await loadData(STORAGE_KEYS.settings);
      const e = await loadData(STORAGE_KEYS.expenses);
      if (c) setCustomers(c);
      if (s) setSettings(s);
      if (e) setExpenses(e);
      setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (loaded) saveData(STORAGE_KEYS.customers, customers); }, [customers, loaded]);
  useEffect(() => { if (loaded) saveData(STORAGE_KEYS.settings, settings); }, [settings, loaded]);
  useEffect(() => { if (loaded) saveData(STORAGE_KEYS.expenses, expenses); }, [expenses, loaded]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2200); };
  const requirePw = (label, fn) => setPwModal({ label, fn });
  const selCust = customers.find(c => c.id === selectedCid);
  const totalWork = c => (c.entries || []).reduce((s, e) => s + e.amount, 0);
  const totalPaid = c => (c.payments || []).reduce((s, p) => s + p.amount, 0);
  const balance = c => totalWork(c) - totalPaid(c);
  const globalTotalIncome = customers.reduce((s, c) => s + totalPaid(c), 0);
  const globalTotalPending = customers.reduce((s, c) => s + Math.max(0, balance(c)), 0);
  const globalTotalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const globalNetProfit = globalTotalIncome - globalTotalExpenses;

  function addCustomer(name) { const t=name.trim(); if(!t)return; setCustomers(p=>[...p,{id:uid(),name:t,entries:[],payments:[]}]); setShowAddCustomer(false); showToast("Customer added"); }
  function deleteCustomer(id) { setCustomers(p=>p.filter(c=>c.id!==id)); setPage("customers"); showToast("Customer deleted"); }
  function addEntry(entry) { setCustomers(p=>p.map(c=>c.id===selectedCid?{...c,entries:[entry,...(c.entries||[])]}:c)); setShowAddEntry(false); showToast("Entry saved"); }
  function deleteEntry(cid,eid) { setCustomers(p=>p.map(c=>c.id===cid?{...c,entries:(c.entries||[]).filter(e=>e.id!==eid)}:c)); showToast("Entry deleted"); }
  function addPayment(payment) { setCustomers(p=>p.map(c=>c.id===selectedCid?{...c,payments:[payment,...(c.payments||[])]}:c)); setShowAddPayment(false); showToast("Payment recorded"); }
  function deletePayment(cid,pid) { setCustomers(p=>p.map(c=>c.id===cid?{...c,payments:(c.payments||[]).filter(x=>x.id!==pid)}:c)); showToast("Payment deleted"); }
  function addExpense(exp) { setExpenses(p=>[exp,...p]); setShowAddExpense(false); showToast("Expense added"); }
  function updateExpense(exp) { setExpenses(p=>p.map(e=>e.id===exp.id?exp:e)); setEditExpense(null); showToast("Expense updated"); }
  function deleteExpense(id) { setExpenses(p=>p.filter(e=>e.id!==id)); showToast("Expense deleted"); }
  function saveSettings(s) { setSettings(s); showToast("Settings saved"); }

  if (!loaded) return <div style={{color:"#9a9a9a",padding:40,fontFamily:"IBM Plex Mono"}}>Loading…</div>;

  const navItems = [["home","home","Home"],["customers","users","Customers"],["expenses","wallet","Expenses"],["analytics","chart","Analytics"],["backup","shield","Backup"],["settings","settings","Settings"]];

  return (
    <>
      <style>{style}</style>
      <div className="app">
        <header className="header">
          <div className="header-logo">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#f0a500"/><text x="16" y="22" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontWeight="700" fontSize="17" fill="#000">N</text></svg>
            <span style={{display:"flex",flexDirection:"column",lineHeight:1.1}}>
              <span style={{fontSize:14,fontWeight:700,color:"var(--accent)",letterSpacing:"0.06em"}}>NOVA</span>
              <span style={{fontSize:9,fontWeight:500,color:"var(--text3)",letterSpacing:"0.12em"}}>ACCOUNTINGS</span>
            </span>
          </div>
          <nav className="header-nav">
            {navItems.map(([pg,ic,lb])=>(
              <button key={pg} className={`nav-btn ${page===pg||page==="customer"&&pg==="customers"?"active":""}`} onClick={()=>{setPage(pg);}}>
                <Icon name={ic} size={14}/> {lb}
              </button>
            ))}
          </nav>
        </header>
        <nav className="bottom-nav">
          {navItems.map(([pg,ic,lb])=>(
            <button key={pg} className={`bnav-btn ${page===pg||page==="customer"&&pg==="customers"?"active":""}`} onClick={()=>setPage(pg)}>
              <Icon name={ic} size={20}/><span>{lb}</span>
            </button>
          ))}
        </nav>
        <main className="main">
          {page==="home"&&<DashboardPage customers={customers} expenses={expenses} totalWork={totalWork} totalPaid={totalPaid} balance={balance} globalTotalIncome={globalTotalIncome} globalTotalPending={globalTotalPending} globalTotalExpenses={globalTotalExpenses} globalNetProfit={globalNetProfit} onGoCustomers={()=>setPage("customers")} onGoExpenses={()=>setPage("expenses")}/>}
          {page==="customers"&&<CustomersPage customers={customers} totalWork={totalWork} balance={balance} onOpen={id=>{setSelectedCid(id);setPage("customer");}} onAdd={()=>setShowAddCustomer(true)}/>}
          {page==="customer"&&selCust&&<CustomerPage customer={selCust} totalWork={totalWork(selCust)} totalPaid={totalPaid(selCust)} balance={balance(selCust)} onBack={()=>{setSelectedCid(null);setPage("customers");}} onAddEntry={()=>setShowAddEntry(true)} onAddPayment={()=>setShowAddPayment(true)} onDeleteEntry={eid=>requirePw("Delete this entry?",()=>deleteEntry(selCust.id,eid))} onDeletePayment={pid=>requirePw("Delete this payment?",()=>deletePayment(selCust.id,pid))} onDeleteCustomer={()=>requirePw(`Delete "${selCust.name}"?`,()=>deleteCustomer(selCust.id))}/>}
          {page==="expenses"&&<ExpensesPage expenses={expenses} onAdd={()=>setShowAddExpense(true)} onEdit={exp=>setEditExpense(exp)} onDelete={id=>requirePw("Delete this expense?",()=>deleteExpense(id))} onExport={()=>exportExpensesCSV(expenses,showToast)}/>}
          {page==="analytics"&&<AnalyticsPage customers={customers} expenses={expenses} totalWork={totalWork} totalPaid={totalPaid} balance={balance}/>}
          {page==="backup"&&<BackupPage customers={customers} settings={settings} expenses={expenses} onRestore={(c,s,e)=>{setCustomers(c);setSettings(s);setExpenses(e||[]);showToast("Data restored!");}} showToast={showToast}/>}
          {page==="settings"&&<SettingsPage settings={settings} onSave={saveSettings}/>}
        </main>
        {showAddCustomer&&<AddCustomerModal onClose={()=>setShowAddCustomer(false)} onAdd={addCustomer}/>}
        {showAddEntry&&selCust&&<AddEntryModal onClose={()=>setShowAddEntry(false)} onAdd={addEntry} settings={settings}/>}
        {showAddPayment&&selCust&&<AddPaymentModal onClose={()=>setShowAddPayment(false)} onAdd={addPayment}/>}
        {showAddExpense&&<AddExpenseModal onClose={()=>setShowAddExpense(false)} onSave={addExpense}/>}
        {editExpense&&<AddExpenseModal onClose={()=>setEditExpense(null)} onSave={updateExpense} existing={editExpense}/>}
        {pwModal&&<PasswordModal label={pwModal.label} onClose={()=>setPwModal(null)} onConfirm={()=>{pwModal.fn();setPwModal(null);}}/>}
        {toast&&<div className="toast">✓ {toast}</div>}
      </div>
    </>
  );
}

function exportExpensesCSV(expenses,showToast){
  const rows=[["Date","Category","Title","Description","Amount"]];
  expenses.forEach(e=>rows.push([e.date,e.category,e.title,e.description||"",e.amount]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`nova-expenses-${new Date().toISOString().split("T")[0]}.csv`;a.click();
  URL.revokeObjectURL(url);showToast("Expenses exported!");
}

function DashboardPage({customers,expenses,totalWork,totalPaid,balance,globalTotalIncome,globalTotalPending,globalTotalExpenses,globalNetProfit,onGoCustomers,onGoExpenses}){
  const thisMonthStr=thisMonth();
  const monthExpenses=expenses.filter(e=>e.date.startsWith(thisMonthStr)).reduce((s,e)=>s+e.amount,0);
  const recentCusts=[...customers].sort((a,b)=>{
    const la=(a.entries||[]).concat(a.payments||[]).reduce((s,x)=>x.date>s?x.date:s,"");
    const lb2=(b.entries||[]).concat(b.payments||[]).reduce((s,x)=>x.date>s?x.date:s,"");
    return lb2.localeCompare(la);
  }).slice(0,5);
  return(<>
    <div className="page-header"><div className="page-title">Dashboard</div><div className="page-sub">Business Overview</div></div>
    <div className="dashboard-grid">
      {[["Total Pending","accent",inr(globalTotalPending),"Customer dues"],["Money Received","green",inr(globalTotalIncome),"All-time"],["Total Expenses","red",inr(globalTotalExpenses),"All-time"],["This Month Exp","purple",inr(monthExpenses),thisMonthStr],["Net Profit","blue",inr(globalNetProfit),"Income − Expenses"]].map(([label,col,val,sub])=>(
        <div key={label} className={`dash-card ${col}`}><div className="dash-label">{label}</div><div className="dash-value" style={{color:`var(--${col})`}}>{val}</div><div className="dash-sub">{sub}</div></div>
      ))}
    </div>
    <div className={`profit-card ${globalNetProfit>=0?"profit-positive":"profit-negative"}`}>
      <div><div style={{fontSize:12,color:"var(--text3)",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"IBM Plex Mono",marginBottom:4}}>Net Profit = Income − Expenses</div><div style={{fontSize:13,color:"var(--text2)"}}>{inr(globalTotalIncome)} received &nbsp;−&nbsp; {inr(globalTotalExpenses)} expenses</div></div>
      <div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:800,color:globalNetProfit>=0?"var(--green)":"var(--red)",fontFamily:"IBM Plex Mono"}}>{inr(Math.abs(globalNetProfit))}</div><div style={{fontSize:12,color:"var(--text3)"}}>{globalNetProfit>=0?"Profit":"Loss"}</div></div>
    </div>
    <div className="chart-card">
      <div className="chart-card-title" style={{justifyContent:"space-between"}}><span style={{display:"flex",alignItems:"center",gap:8}}><Icon name="users" size={14}/> Recent Customers</span><button className="btn btn-ghost btn-sm" onClick={onGoCustomers}>View All →</button></div>
      {recentCusts.length===0?<div style={{color:"var(--text3)",fontSize:13}}>No customers yet.</div>:recentCusts.map(c=>{const bal=balance(c);return(<div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}><div><div style={{fontWeight:600,fontSize:14}}>{c.name}</div><div style={{fontSize:12,color:"var(--text3)",fontFamily:"IBM Plex Mono"}}>{(c.entries||[]).length} entries · {(c.payments||[]).length} payments</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:"IBM Plex Mono",fontWeight:700,fontSize:14,color:bal>0?"var(--red)":"var(--green)"}}>{inr(bal)}</div><div style={{fontSize:11,color:"var(--text3)"}}>{bal>0?"Pending":"Settled"}</div></div></div>);})}
    </div>
    <div className="chart-card">
      <div className="chart-card-title" style={{justifyContent:"space-between"}}><span style={{display:"flex",alignItems:"center",gap:8}}><Icon name="wallet" size={14}/> Recent Expenses</span><button className="btn btn-ghost btn-sm" onClick={onGoExpenses}>View All →</button></div>
      {expenses.length===0?<div style={{color:"var(--text3)",fontSize:13}}>No expenses yet.</div>:expenses.slice(0,5).map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}><div><div style={{fontWeight:600,fontSize:14}}>{e.title}</div><div style={{fontSize:12,color:"var(--text3)",fontFamily:"IBM Plex Mono"}}>{fmtDate(e.date)} · {e.category}</div></div><div style={{fontFamily:"IBM Plex Mono",fontWeight:700,fontSize:14,color:"var(--red)"}}>{inr(e.amount)}</div></div>))}
    </div>
  </>);
}

function CustomersPage({customers,totalWork,balance,onOpen,onAdd}){
  const [search,setSearch]=useState("");
  const filtered=customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  return(<>
    <div className="page-header"><div className="page-title">Customers</div><div className="page-sub">Laser &amp; CNC Sheet Billing</div></div>
    <div className="top-actions">
      <input className="search-input" placeholder="Search customer…" value={search} onChange={e=>setSearch(e.target.value)}/>
      <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={14}/> Add Customer</button>
    </div>
    <div className="data-table cust-table">
      <div className="cust-list-header"><span>Customer</span><span>Work Total</span><span>Balance Due</span><span></span></div>
      {filtered.length===0&&<div className="tbl-empty">{customers.length===0?"No customers yet.":"No results."}</div>}
      {filtered.map(c=>{const bal=balance(c);return(<div key={c.id} className="cust-list-row" onClick={()=>onOpen(c.id)}><div style={{fontWeight:600,fontSize:15}}>{c.name}</div><div className="mono" style={{fontWeight:600,color:"var(--accent)",fontSize:14}}>{inr(totalWork(c))}</div><div className="mono" style={{fontWeight:600,fontSize:14,color:bal>0?"var(--red)":"var(--green)"}}>{inr(bal)}</div><div><button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();onOpen(c.id);}}>Open →</button></div></div>);})}
    </div>
    <div className="cust-card-list">
      {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--text3)",fontSize:14}}>{customers.length===0?"No customers yet.":"No results."}</div>}
      {filtered.map(c=>{const bal=balance(c);return(<div key={c.id} className="cust-card" onClick={()=>onOpen(c.id)}><div className="cust-card-left"><div className="cust-card-name">{c.name}</div><div className="cust-card-stats"><div className="cust-card-stat">Work: <span style={{color:"var(--accent)"}}>{inr(totalWork(c))}</span></div><div className="cust-card-stat">{(c.entries||[]).length} entries</div></div></div><div className="cust-card-right"><div className="cust-card-balance" style={{color:bal>0?"var(--red)":"var(--green)"}}>{inr(bal)}</div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div></div>);})}
    </div>
  </>);
}

function CustomerPage({customer,totalWork,totalPaid,balance,onBack,onAddEntry,onAddPayment,onDeleteEntry,onDeletePayment,onDeleteCustomer}){
  const [tab,setTab]=useState("entries");
  const [filterMonth,setFilterMonth]=useState("all");
  const [showBill,setShowBill]=useState(false);
  const [billMonth,setBillMonth]=useState("all");
  const entryMonths=[...new Set((customer.entries||[]).map(e=>e.date.slice(0,7)))].sort((a,b)=>b.localeCompare(a));
  const filteredEntries=filterMonth==="all"?(customer.entries||[]):(customer.entries||[]).filter(e=>e.date.startsWith(filterMonth));
  const filteredWork=filteredEntries.reduce((s,e)=>s+e.amount,0);
  return(<>
    <div style={{marginBottom:18}}>
      <button className="btn btn-ghost btn-sm" style={{marginBottom:12}} onClick={onBack}><Icon name="back" size={13}/> Back</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div><div className="page-title">{customer.name}</div><div className="page-sub">Customer Account</div></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-sm" style={{background:"rgba(80,144,224,0.12)",color:"var(--blue)",border:"1px solid rgba(80,144,224,0.25)"}} onClick={()=>{setBillMonth(filterMonth);setShowBill(true);}}><Icon name="receipt" size={13}/> Bill</button>
          <button className="btn btn-danger btn-sm" onClick={onDeleteCustomer}><Icon name="trash" size={13}/> Delete</button>
        </div>
      </div>
    </div>
    <div className="stats-row">
      <div className="stat-card"><div className="stat-label">{filterMonth==="all"?"Total Work":"Month Work"}</div><div className="stat-value stat-accent">{inr(filterMonth==="all"?totalWork:filteredWork)}</div><div className="stat-sub">{filteredEntries.length} entries</div></div>
      <div className="stat-card"><div className="stat-label">Total Paid</div><div className="stat-value stat-green">{inr(totalPaid)}</div><div className="stat-sub">{(customer.payments||[]).length} payments</div></div>
      <div className="stat-card"><div className="stat-label">Balance</div><div className={`stat-value ${balance>0?"stat-red":"stat-green"}`}>{inr(balance)}</div><div className="stat-sub">{balance>0?"Pending":balance<0?"Overpaid":"Settled ✓"}</div></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      {[["entries","laser","Work Entries"],["payments","payment","Payments"]].map(([t,ic,lb])=>(<button key={t} className={`btn btn-sm ${tab===t?"btn-primary":"btn-ghost"}`} onClick={()=>setTab(t)}><Icon name={ic} size={12}/> {lb}</button>))}
    </div>
    {tab==="entries"&&(<>
      {entryMonths.length>0&&(<div className="month-filter-bar"><div className={`month-chip ${filterMonth==="all"?"active":""}`} onClick={()=>setFilterMonth("all")}>All</div>{entryMonths.map(m=>(<div key={m} className={`month-chip ${filterMonth===m?"active":""}`} onClick={()=>setFilterMonth(m)}>{fmtMonth(m)}</div>))}</div>)}
      <div className="top-actions" style={{marginBottom:12}}><span style={{fontSize:13,color:"var(--text3)",fontWeight:600}}>{filterMonth==="all"?"All Entries":`${fmtMonth(filterMonth)} — ${filteredEntries.length}`}</span><button className="btn btn-primary btn-sm" onClick={onAddEntry}><Icon name="plus" size={13}/> Add Entry</button></div>
      <div className="data-table entries-table">
        {filteredEntries.length===0?<div className="tbl-empty">{(customer.entries||[]).length===0?"No entries yet.":"No entries for this month."}</div>:(
          <div className="data-table-scroll"><table><thead><tr><th>Date</th><th>Type</th><th>Details</th><th>Sheets</th><th>Dots</th><th>Paper</th><th>Amount</th><th></th></tr></thead><tbody>
            {filteredEntries.map(e=>(<tr key={e.id}><td className="mono" style={{fontSize:12,color:"var(--text2)",whiteSpace:"nowrap"}}>{fmtDate(e.date)}</td><td>{e.sheetType==="Custom"?<span className="badge badge-custom"><Icon name="pen" size={10}/> Custom</span>:e.sheetType==="Laser"?<span className="badge badge-laser"><Icon name="laser" size={10}/> Laser</span>:<span className="badge badge-cnc"><Icon name="cnc" size={10}/> CNC</span>}</td><td style={{fontSize:12,color:"var(--text2)",maxWidth:180}}>{e.sheetType==="Custom"?e.description:e.sheetType==="Laser"?e.sheetSize+'" Sheet':e.workType}</td><td className="mono">{e.sheets||"—"}</td><td className="mono" style={{color:"var(--text2)"}}>{e.dots>0?e.dots.toLocaleString("en-IN"):"—"}</td><td>{e.sheetType==="Laser"?<span className={`badge ${e.paper?"badge-yes":"badge-no"}`}>{e.paper?"Yes":"No"}</span>:<span style={{color:"var(--text3)",fontSize:12}}>N/A</span>}</td><td className="amount-cell">{inr(e.amount)}</td><td><button className="icon-btn" onClick={()=>onDeleteEntry(e.id)}><Icon name="trash" size={13}/></button></td></tr>))}
          </tbody></table></div>
        )}
      </div>
      <div className="card-list">
        {filteredEntries.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"var(--text3)",fontSize:14}}>{(customer.entries||[]).length===0?"No entries yet.":"No entries for this month."}</div>}
        {filteredEntries.map(e=>(<div key={e.id} className="entry-card"><div className="entry-card-top"><span className="entry-card-date">{fmtDate(e.date)}</span><div style={{display:"flex",alignItems:"center",gap:8}}><span className="entry-card-amount">{inr(e.amount)}</span><button className="icon-btn" onClick={()=>onDeleteEntry(e.id)}><Icon name="trash" size={13}/></button></div></div><div className="entry-card-meta">{e.sheetType==="Custom"?<span className="badge badge-custom"><Icon name="pen" size={10}/> Custom</span>:e.sheetType==="Laser"?<span className="badge badge-laser"><Icon name="laser" size={10}/> Laser</span>:<span className="badge badge-cnc"><Icon name="cnc" size={10}/> CNC</span>}{e.sheetType!=="Custom"&&<span className="badge badge-no">{e.sheetType==="Laser"?`${e.sheetSize}" Sheet`:e.workType}</span>}</div>{e.sheetType==="Custom"&&<div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{e.description}</div>}{e.sheets&&<div className="entry-card-row"><span style={{color:"var(--text3)"}}>Sheets</span><span className="mono">{e.sheets}</span></div>}{e.dots>0&&<div className="entry-card-row"><span style={{color:"var(--text3)"}}>Dots</span><span className="mono">{e.dots?.toLocaleString("en-IN")}</span></div>}</div>))}
      </div>
      {filterMonth!=="all"&&filteredEntries.length>0&&(<div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius2)",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}><span style={{fontSize:13,color:"var(--text2)",fontWeight:600}}>{fmtMonth(filterMonth)} Total</span><span style={{fontSize:18,fontWeight:700,color:"var(--accent)",fontFamily:"IBM Plex Mono"}}>{inr(filteredWork)}</span></div>)}
    </>)}
    {tab==="payments"&&(<>
      <div className="top-actions"><span style={{fontSize:13,color:"var(--text3)",fontWeight:600}}>Payment History</span><button className="btn btn-green btn-sm" onClick={onAddPayment}><Icon name="plus" size={13}/> Add Payment</button></div>
      <div className="data-table payments-table">{(customer.payments||[]).length===0?<div className="tbl-empty">No payments yet.</div>:(<div className="data-table-scroll"><table><thead><tr><th>Date</th><th>Amount Paid</th><th>Notes</th><th></th></tr></thead><tbody>{(customer.payments||[]).map(p=>(<tr key={p.id}><td className="mono" style={{fontSize:12,color:"var(--text2)",whiteSpace:"nowrap"}}>{fmtDate(p.date)}</td><td className="paid-cell">{inr(p.amount)}</td><td style={{color:"var(--text2)",fontSize:13}}>{p.notes||<span style={{color:"var(--text3)"}}>—</span>}</td><td><button className="icon-btn" onClick={()=>onDeletePayment(p.id)}><Icon name="trash" size={13}/></button></td></tr>))}</tbody></table></div>)}</div>
      <div className="card-list">{(customer.payments||[]).length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"var(--text3)",fontSize:14}}>No payments yet.</div>}{(customer.payments||[]).map(p=>(<div key={p.id} className="entry-card"><div className="entry-card-top"><span className="entry-card-date">{fmtDate(p.date)}</span><div style={{display:"flex",alignItems:"center",gap:8}}><span className="entry-card-amount green">{inr(p.amount)}</span><button className="icon-btn" onClick={()=>onDeletePayment(p.id)}><Icon name="trash" size={13}/></button></div></div>{p.notes&&<div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{p.notes}</div>}</div>))}</div>
    </>)}
    {showBill&&<BillModal customer={customer} billMonth={billMonth} setBillMonth={setBillMonth} totalPaid={totalPaid} balance={balance} onClose={()=>setShowBill(false)}/>}
  </>);
}

function ExpensesPage({expenses,onAdd,onEdit,onDelete,onExport}){
  const [filterCat,setFilterCat]=useState("all");
  const [filterMonth,setFilterMonth]=useState("all");
  const [search,setSearch]=useState("");
  const allCats=[...new Set(expenses.map(e=>e.category))].sort();
  const expMonths=[...new Set(expenses.map(e=>e.date.slice(0,7)))].sort((a,b)=>b.localeCompare(a));
  const filtered=expenses.filter(e=>{
    if(filterCat!=="all"&&e.category!==filterCat)return false;
    if(filterMonth!=="all"&&!e.date.startsWith(filterMonth))return false;
    if(search&&!e.title.toLowerCase().includes(search.toLowerCase())&&!e.category.toLowerCase().includes(search.toLowerCase())&&!(e.description||"").toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const totalAll=expenses.reduce((s,e)=>s+e.amount,0);
  const totalMonth=expenses.filter(e=>e.date.startsWith(thisMonth())).reduce((s,e)=>s+e.amount,0);
  const totalYear=expenses.filter(e=>e.date.startsWith(thisYear())).reduce((s,e)=>s+e.amount,0);
  const totalFiltered=filtered.reduce((s,e)=>s+e.amount,0);
  const catMap={};expenses.forEach(e=>{catMap[e.category]=(catMap[e.category]||0)+e.amount;});
  const catBreakdown=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const maxCat=catBreakdown.length?catBreakdown[0][1]:1;
  const CAT_COLORS=["#e05050","#f0a500","#5090e0","#50c080","#a060e0","#50d0e0","#e07030","#80c050"];
  return(<>
    <div className="page-header"><div className="page-title">Expenses</div><div className="page-sub">Business expense tracking</div></div>
    <div className="expense-summary-row">
      {[["This Month","red",inr(totalMonth)],["This Year","accent",inr(totalYear)],["All Time","purple",inr(totalAll)],["Showing","blue",inr(totalFiltered)]].map(([lb,col,val])=>(<div key={lb} className="stat-card"><div className="stat-label">{lb}</div><div className={`stat-value stat-${col}`} style={{fontSize:18}}>{val}</div></div>))}
    </div>
    {catBreakdown.length>0&&(<div className="chart-card" style={{marginBottom:16}}><div className="chart-card-title"><Icon name="tag" size={14}/> By Category</div><div className="bar-wrap">{catBreakdown.map(([cat,amt],i)=>(<div key={cat} className="bar-item"><div className="bar-label" title={cat}>{cat}</div><div className="bar-track"><div className="bar-fill" style={{width:maxCat>0?(amt/maxCat*100)+"%":"0%",background:CAT_COLORS[i%CAT_COLORS.length]}}/></div><div className="bar-val">{inr(amt)}</div></div>))}</div></div>)}
    <div className="top-actions">
      <div style={{display:"flex",gap:8,flexWrap:"wrap",flex:1}}>
        <input className="search-input" style={{width:160}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",padding:"10px 32px 10px 12px",color:"var(--text)",fontSize:13,outline:"none",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239a9a9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}>
          <option value="all">All Categories</option>{allCats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",padding:"10px 32px 10px 12px",color:"var(--text)",fontSize:13,outline:"none",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239a9a9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}>
          <option value="all">All Months</option>{expMonths.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:8}}><button className="btn btn-ghost btn-sm" onClick={onExport}><Icon name="download" size={13}/> CSV</button><button className="btn btn-primary btn-sm" onClick={onAdd}><Icon name="plus" size={13}/> Add Expense</button></div>
    </div>
    <div className="data-table expenses-table">
      {filtered.length===0?<div className="tbl-empty">{expenses.length===0?"No expenses yet.":"No results."}</div>:(
        <div className="data-table-scroll"><table><thead><tr><th>Date</th><th>Category</th><th>Title</th><th>Description</th><th>Amount</th><th></th></tr></thead><tbody>
          {filtered.map(e=>(<tr key={e.id}><td className="mono" style={{fontSize:12,color:"var(--text2)",whiteSpace:"nowrap"}}>{fmtDate(e.date)}</td><td><span className="cat-badge">{e.category}</span></td><td style={{fontWeight:600,fontSize:13}}>{e.title}</td><td style={{color:"var(--text2)",fontSize:12,maxWidth:200}}>{e.description||<span style={{color:"var(--text3)"}}>—</span>}</td><td className="expense-cell">{inr(e.amount)}</td><td><div style={{display:"flex",gap:4}}><button className="icon-btn edit" onClick={()=>onEdit(e)}><Icon name="edit" size={13}/></button><button className="icon-btn" onClick={()=>onDelete(e.id)}><Icon name="trash" size={13}/></button></div></td></tr>))}
        </tbody></table></div>
      )}
    </div>
    <div className="card-list">
      {filtered.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"var(--text3)",fontSize:14}}>{expenses.length===0?"No expenses yet.":"No results."}</div>}
      {filtered.map(e=>(<div key={e.id} className="entry-card"><div className="entry-card-top"><span className="entry-card-date">{fmtDate(e.date)}</span><div style={{display:"flex",alignItems:"center",gap:6}}><span className="entry-card-amount red">{inr(e.amount)}</span><button className="icon-btn edit" onClick={()=>onEdit(e)}><Icon name="edit" size={13}/></button><button className="icon-btn" onClick={()=>onDelete(e.id)}><Icon name="trash" size={13}/></button></div></div><div className="entry-card-meta"><span className="cat-badge">{e.category}</span></div><div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{e.title}</div>{e.description&&<div style={{fontSize:13,color:"var(--text2)"}}>{e.description}</div>}</div>))}
    </div>
    {filtered.length>0&&(<div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius2)",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}><span style={{fontSize:13,color:"var(--text2)",fontWeight:600}}>{filtered.length} expenses</span><span style={{fontSize:18,fontWeight:700,color:"var(--red)",fontFamily:"IBM Plex Mono"}}>{inr(totalFiltered)}</span></div>)}
  </>);
}

function BillModal({customer,billMonth,setBillMonth,totalPaid,balance,onClose}){
  const billRef=useRef();
  const entryMonths=[...new Set((customer.entries||[]).map(e=>e.date.slice(0,7)))].sort((a,b)=>b.localeCompare(a));
  const billEntries=billMonth==="all"?(customer.entries||[]):(customer.entries||[]).filter(e=>e.date.startsWith(billMonth));
  const billTotal=billEntries.reduce((s,e)=>s+e.amount,0);
  const billBalance=billMonth==="all"?balance:billTotal;
  const periodLabel=billMonth==="all"?"All Time":fmtMonth(billMonth);
  const billNo=`NOVA-${customer.name.replace(/\s/g,"").toUpperCase().slice(0,4)}-${billMonth==="all"?"ALL":billMonth.replace("-","")}`;
  const today=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
  function handlePrint(){const content=billRef.current.innerHTML;const win=window.open("","_blank","width=700,height=900");win.document.write(`<!DOCTYPE html><html><head><title>Bill</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;padding:32px;}table{width:100%;border-collapse:collapse;}th{background:#f5f5f5;padding:8px;font-size:10px;text-transform:uppercase;text-align:left;}td{padding:8px;border-bottom:1px solid #eee;font-size:12px;}.amt,.num{text-align:right;font-family:monospace;}</style></head><body>${content}</body></html>`);win.document.close();win.focus();setTimeout(()=>{win.print();win.close();},400);}
  return(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="bill-modal">
      <div style={{background:"var(--surface)",padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <span style={{fontSize:12,fontWeight:700,color:"var(--text3)",fontFamily:"IBM Plex Mono",whiteSpace:"nowrap"}}>Period:</span>
        <div style={{display:"flex",gap:6,overflowX:"auto",flex:1,scrollbarWidth:"none"}}>
          <div className={`month-chip ${billMonth==="all"?"active":""}`} onClick={()=>setBillMonth("all")}>All Time</div>
          {entryMonths.map(m=>(<div key={m} className={`month-chip ${billMonth===m?"active":""}`} onClick={()=>setBillMonth(m)}>{fmtMonth(m)}</div>))}
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      <div ref={billRef} className="bill-page">
        <div className="bill-header"><div><div className="bill-brand-name">Nova Accountings</div><div className="bill-brand-sub">Laser &amp; CNC Sheet Billing</div></div><div className="bill-meta"><div className="bill-meta-title">INVOICE</div><div className="bill-meta-detail"># {billNo}</div><div className="bill-meta-detail">Date: {today}</div></div></div>
        <div className="bill-to"><div className="bill-to-label">Bill To</div><div className="bill-to-name">{customer.name}</div><div className="bill-to-period">Period: {periodLabel}</div></div>
        {billEntries.length===0?<div style={{textAlign:"center",padding:"32px 0",color:"#aaa"}}>No entries.</div>:(
          <table className="bill-table"><thead><tr><th>Date</th><th>Type</th><th>Details</th><th className="num">Sheets</th><th className="num">Dots</th><th className="amt">Amount</th></tr></thead><tbody>
            {billEntries.map((e,i)=>(<tr key={e.id} style={{background:i%2===0?"#fff":"#fafafa"}}><td style={{fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{fmtDate(e.date)}</td><td><span style={{background:e.sheetType==="Laser"?"#fff8e1":e.sheetType==="Custom"?"#e8f0fe":"#e8f5e9",color:e.sheetType==="Laser"?"#b76e00":e.sheetType==="Custom"?"#1a56db":"#2e7d32",padding:"2px 7px",borderRadius:4,fontSize:11,fontWeight:700}}>{e.sheetType}</span></td><td style={{fontSize:12}}>{e.sheetType==="Custom"?e.description:e.sheetType==="Laser"?`${e.sheetSize}" Sheet${e.paper?" + Paper":""}`:e.workType}</td><td className="num">{e.sheets||"—"}</td><td className="num">{e.dots>0?e.dots.toLocaleString("en-IN"):"—"}</td><td className="amt">₹{e.amount.toLocaleString("en-IN",{minimumFractionDigits:2})}</td></tr>))}
          </tbody></table>
        )}
        <div className="bill-summary">
          <div className="bill-sum-row total"><span>Total Work</span><span>₹{billTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
          {billMonth==="all"&&<><div className="bill-sum-row paid"><span>Paid</span><span>- ₹{totalPaid.toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div><div className={`bill-sum-row ${billBalance>0?"balance-due":"balance-ok"}`}><span>{billBalance>0?"Balance Due":"Settled"}</span><span>₹{Math.abs(billBalance).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div></>}
        </div>
        <div className="bill-footer">Generated by Nova Accountings • {today}</div>
      </div>
      <div className="bill-actions"><button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={onClose}>Close</button><button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={handlePrint}><Icon name="print" size={14}/> Print / PDF</button></div>
    </div>
  </div>);
}

const PIE_COLORS=["#f0a500","#50c080","#5090e0","#e05090","#a050e0","#50d0e0","#e07030","#80c050"];
function AnalyticsPage({customers,expenses,totalWork,totalPaid,balance}){
  const [selCust,setSelCust]=useState("all");
  const totalRevenue=customers.reduce((s,c)=>s+totalWork(c),0);
  const totalPayments=customers.reduce((s,c)=>s+totalPaid(c),0);
  const totalPending=customers.reduce((s,c)=>s+Math.max(0,balance(c)),0);
  const totalExp=expenses.reduce((s,e)=>s+e.amount,0);
  const netProfit=totalPayments-totalExp;
  const custRevenues=[...customers].sort((a,b)=>totalWork(b)-totalWork(a));
  const monthlyMap={};customers.forEach(c=>{(c.entries||[]).forEach(e=>{const mo=e.date.slice(0,7);monthlyMap[mo]=(monthlyMap[mo]||0)+e.amount;});});
  const expMonthlyMap={};expenses.forEach(e=>{const mo=e.date.slice(0,7);expMonthlyMap[mo]=(expMonthlyMap[mo]||0)+e.amount;});
  const allMonths=[...new Set([...Object.keys(monthlyMap),...Object.keys(expMonthlyMap)])].sort();
  const monthlyData=allMonths.map(m=>({month:m,rev:monthlyMap[m]||0,exp:expMonthlyMap[m]||0}));
  const custMonthlyMap={};
  if(selCust!=="all"){const c=customers.find(x=>x.id===selCust);if(c)(c.entries||[]).forEach(e=>{const mo=e.date.slice(0,7);custMonthlyMap[mo]=(custMonthlyMap[mo]||0)+e.amount;});}
  const custMonthlyData=Object.entries(custMonthlyMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({month:k,rev:v}));
  const topCust=custRevenues[0];const maxRev=topCust?totalWork(topCust):1;
  const maxMo=monthlyData.length?Math.max(...monthlyData.map(x=>Math.max(x.rev,x.exp))):1;
  return(<>
    <div className="page-header"><div className="page-title">Analytics</div><div className="page-sub">Business Performance</div></div>
    <div className="analytics-overview" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
      {[["Total Revenue",inr(totalRevenue),"var(--accent)"],["Payments Received",inr(totalPayments),"var(--green)"],["Pending",inr(totalPending),"var(--red)"],["Total Expenses",inr(totalExp),"var(--purple)"],["Net Profit",inr(netProfit),netProfit>=0?"var(--green)":"var(--red)"],["Customers",customers.length,"var(--blue)"]].map(([lb,val,col])=>(<div key={lb} className="stat-card"><div className="stat-label">{lb}</div><div className="stat-value" style={{color:col,fontSize:17}}>{val}</div></div>))}
    </div>
    {topCust&&(<div className="top-customer-card"><div style={{color:"var(--accent)"}}><Icon name="trophy" size={38}/></div><div><div style={{fontSize:11,color:"var(--text3)",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"IBM Plex Mono",marginBottom:4}}>Top Customer</div><div style={{fontSize:20,fontWeight:700}}>{topCust.name}</div><div style={{fontSize:26,fontWeight:700,color:"var(--accent)",fontFamily:"IBM Plex Mono"}}>{inr(totalWork(topCust))}</div></div></div>)}
    <div className="charts-2col">
      <div className="chart-card" style={{marginBottom:0}}><div className="chart-card-title"><Icon name="chart" size={14}/> By Customer</div>{custRevenues.length===0?<div style={{color:"var(--text3)",fontSize:13}}>No data.</div>:(<div className="bar-wrap">{custRevenues.map((c,i)=>{const rev=totalWork(c);const pct=maxRev>0?(rev/maxRev)*100:0;return(<div key={c.id} className="bar-item"><div className="bar-label" title={c.name}>{c.name}</div><div className="bar-track"><div className="bar-fill" style={{width:pct+"%",background:PIE_COLORS[i%PIE_COLORS.length]}}/></div><div className="bar-val">{inr(rev)}</div></div>);})}</div>)}</div>
      <div className="chart-card" style={{marginBottom:0}}><div className="chart-card-title"><Icon name="users" size={14}/> Revenue Share</div>{custRevenues.length===0?<div style={{color:"var(--text3)",fontSize:13}}>No data.</div>:<PieChart data={custRevenues.map((c,i)=>({label:c.name,value:totalWork(c),color:PIE_COLORS[i%PIE_COLORS.length]}))}/>}</div>
    </div>
    <div className="chart-card">
      <div className="chart-card-title"><Icon name="trending" size={14}/> Monthly Revenue vs Expenses</div>
      {monthlyData.length===0?<div style={{color:"var(--text3)",fontSize:13}}>No data.</div>:(<>
        <div style={{display:"flex",gap:16,marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--text2)"}}><div style={{width:10,height:10,borderRadius:2,background:"var(--blue)"}}/> Revenue</div><div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--text2)"}}><div style={{width:10,height:10,borderRadius:2,background:"var(--red)"}}/> Expenses</div></div>
        <div className="bar-wrap">{monthlyData.map(({month,rev,exp})=>(<div key={month}><div className="bar-item" style={{marginBottom:3}}><div className="bar-label">{fmtMonth(month)}</div><div className="bar-track"><div className="bar-fill" style={{width:maxMo>0?(rev/maxMo*100)+"%":"0%",background:"var(--blue)"}}/></div><div className="bar-val">{inr(rev)}</div></div>{exp>0&&<div className="bar-item"><div className="bar-label" style={{visibility:"hidden"}}>·</div><div className="bar-track"><div className="bar-fill" style={{width:maxMo>0?(exp/maxMo*100)+"%":"0%",background:"var(--red)"}}/></div><div className="bar-val" style={{color:"var(--red)"}}>{inr(exp)}</div></div>}</div>))}</div>
      </>)}
    </div>
    <div className="chart-card">
      <div className="chart-card-title"><Icon name="users" size={14}/> Customer Monthly</div>
      <div style={{marginBottom:16}}><select value={selCust} onChange={e=>setSelCust(e.target.value)} style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",padding:"8px 32px 8px 12px",color:"var(--text)",fontSize:13,outline:"none",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239a9a9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}><option value="all">— Select customer —</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      {selCust==="all"?<div style={{color:"var(--text3)",fontSize:13}}>Select a customer above.</div>:custMonthlyData.length===0?<div style={{color:"var(--text3)",fontSize:13}}>No entries yet.</div>:(<div className="bar-wrap">{custMonthlyData.map(({month,rev},i)=>{const maxV=Math.max(...custMonthlyData.map(x=>x.rev));return(<div key={month} className="bar-item"><div className="bar-label">{fmtMonth(month)}</div><div className="bar-track"><div className="bar-fill" style={{width:maxV>0?(rev/maxV*100)+"%":"0%",background:PIE_COLORS[i%PIE_COLORS.length]}}/></div><div className="bar-val">{inr(rev)}</div></div>);})}</div>)}
    </div>
  </>);
}

function PieChart({data}){
  const total=data.reduce((s,d)=>s+d.value,0);if(!total)return null;
  let cum=0;
  const slices=data.map(d=>{const start=cum/total*2*Math.PI-Math.PI/2;cum+=d.value;const end=cum/total*2*Math.PI-Math.PI/2;return{...d,start,end};});
  const R=60,cx=70,cy=70;
  const arc=(s,e)=>{const x1=cx+R*Math.cos(s),y1=cy+R*Math.sin(s),x2=cx+R*Math.cos(e),y2=cy+R*Math.sin(e),lg=(e-s)>Math.PI?1:0;return `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} Z`;};
  return(<div className="pie-wrap"><svg width="140" height="140" viewBox="0 0 140 140">{slices.map((s,i)=><path key={i} d={arc(s.start,s.end)} fill={s.color} stroke="var(--surface)" strokeWidth="1.5"/>)}</svg><div className="pie-legend">{data.slice(0,6).map((d,i)=>(<div key={i} className="pie-legend-item"><div className="pie-dot" style={{background:d.color}}/><span>{d.label}</span><span className="mono" style={{marginLeft:"auto",paddingLeft:8,fontSize:11,color:"var(--text3)"}}>{total>0?Math.round(d.value/total*100):0}%</span></div>))}</div></div>);
}

function SettingsPage({settings,onSave}){
  const [form,setForm]=useState({...settings});
  const set=(k,v)=>setForm(p=>({...p,[k]:parseFloat(v)||0}));
  return(<>
    <div className="page-header"><div className="page-title">Settings</div><div className="page-sub">Laser pricing — new entries only</div></div>
    <div className="settings-grid">
      <div className="settings-card"><div className="settings-card-title"><Icon name="laser" size={15}/> Laser Pricing</div>{[["price13","13\" Sheet Price (₹)"],["price16","16\" Sheet Price (₹)"],["paperPrice","Paper Price (₹/sheet)"]].map(([k,lb])=>(<div key={k} className="settings-field"><label>{lb}</label><input type="number" value={form[k]} onChange={e=>set(k,e.target.value)}/></div>))}<div className="settings-field"><label>Dot Price (₹/dot)</label><input type="number" step="0.001" value={form.dotPrice} onChange={e=>set("dotPrice",e.target.value)}/></div></div>
      <div className="settings-card"><div className="settings-card-title"><Icon name="cnc" size={15}/> CNC Note</div><div style={{padding:14,background:"var(--surface2)",borderRadius:"var(--radius)",fontSize:13,color:"var(--text2)",lineHeight:1.7,fontFamily:"IBM Plex Mono"}}>CNC entries use <strong style={{color:"var(--accent)"}}>manual amount entry</strong>. No preset price applied.</div></div>
    </div>
    <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}><button className="btn btn-primary" onClick={()=>onSave(form)}><Icon name="save" size={14}/> Save Settings</button></div>
  </>);
}

function AddCustomerModal({onClose,onAdd}){
  const [name,setName]=useState("");
  return(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-header"><span className="modal-title">Add Customer</span><button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button></div><div className="modal-body"><div className="field"><span className="field-label">Customer Name</span><input autoFocus type="text" placeholder="e.g. Rameshbhai" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onAdd(name)}/></div></div><div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={()=>onAdd(name)} disabled={!name.trim()}><Icon name="plus" size={13}/> Add</button></div></div></div>);
}

function AddPaymentModal({onClose,onAdd}){
  const [date,setDate]=useState(todayStr());const [amount,setAmount]=useState("");const [notes,setNotes]=useState("");
  const amt=parseFloat(amount);
  function handleSave(){if(!amt||amt<=0)return;onAdd({id:uid(),date,amount:amt,notes:notes.trim()});}
  return(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-header"><span className="modal-title"><Icon name="payment" size={15}/> Add Payment</span><button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button></div><div className="modal-body"><div className="form-row"><div className="field"><span className="field-label">Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div><div className="field"><span className="field-label">Amount (₹)</span><input autoFocus type="number" min="1" placeholder="e.g. 2000" value={amount} onChange={e=>setAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()}/></div></div><div className="field"><span className="field-label">Notes (Optional)</span><textarea placeholder="e.g. UPI, Cash…" value={notes} onChange={e=>setNotes(e.target.value)}/></div>{amt>0&&(<div className="calc-preview"><div className="calc-row total"><span>Payment</span><span style={{color:"var(--green)"}}>{inr(amt)}</span></div></div>)}</div><div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-green" onClick={handleSave} disabled={!amt||amt<=0}><Icon name="save" size={13}/> Save</button></div></div></div>);
}

function AddEntryModal({onClose,onAdd,settings}){
  const [date,setDate]=useState(todayStr());
  const [sheetType,setSheetType]=useState("Laser");
  const [sheetSize,setSheetSize]=useState("13");
  const [sheets,setSheets]=useState("");const [dots,setDots]=useState("");const [paper,setPaper]=useState(true);
  const [workType,setWorkType]=useState("CNC");const [cncSheets,setCncSheets]=useState("");const [cncDots,setCncDots]=useState("");const [cncAmount,setCncAmount]=useState("");
  const [description,setDescription]=useState("");const [customAmount,setCustomAmount]=useState("");
  const sheetsN=parseFloat(sheets)||0;const dotsN=parseFloat(dots)||0;
  const cncSheetsN=parseFloat(cncSheets)||0;const cncDotsN=parseFloat(cncDots)||0;const cncAmtN=parseFloat(cncAmount)||0;
  const customAmtN=parseFloat(customAmount)||0;
  let sheetCost=0,dotCost=0,paperCost=0,amount=0;
  if(sheetType==="Laser"){const sp=sheetSize==="13"?settings.price13:settings.price16;sheetCost=sp*sheetsN;dotCost=dotsN*settings.dotPrice;paperCost=paper?settings.paperPrice*sheetsN:0;amount=sheetCost+dotCost+paperCost;}
  else if(sheetType==="CNC"){amount=cncAmtN;}
  else{amount=customAmtN;}
  const canSave=sheetType==="Laser"?sheetsN>0:sheetType==="CNC"?cncAmtN>0:(description.trim().length>0&&customAmtN>0);
  function handleSave(){
    if(!canSave)return;
    if(sheetType==="Laser")onAdd({id:uid(),date,sheetType:"Laser",sheetSize,sheets:sheetsN,dots:dotsN,paper,sheetCost,dotCost,paperCost,amount});
    else if(sheetType==="CNC")onAdd({id:uid(),date,sheetType:"CNC",workType,sheets:cncSheetsN,dots:cncDotsN,amount:cncAmtN,sheetCost:cncAmtN,dotCost:0,paperCost:0});
    else onAdd({id:uid(),date,sheetType:"Custom",description:description.trim(),amount:customAmtN,sheetCost:customAmtN,dotCost:0,paperCost:0});
  }
  return(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div className="modal-header"><span className="modal-title">Add Work Entry</span><button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button></div>
      <div className="modal-body">
        <div className="field"><span className="field-label">Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field"><span className="field-label">Entry Type</span><div className="radio-group">{[["Laser","laser","Laser Sheet"],["CNC","cnc","CNC Sheet"],["Custom","pen","Custom Entry"]].map(([t,ic,lb])=>(<label key={t} className={`radio-opt ${sheetType===t?"selected":""}`}><input type="radio" checked={sheetType===t} onChange={()=>setSheetType(t)}/><Icon name={ic} size={13}/> {lb}</label>))}</div></div>
        <hr className="divider"/>
        {sheetType==="Laser"&&(<>
          <div className="field"><span className="field-label">Sheet Size</span><div className="radio-group">{["13","16"].map(s=>(<label key={s} className={`radio-opt ${sheetSize===s?"selected":""}`}><input type="radio" checked={sheetSize===s} onChange={()=>setSheetSize(s)}/>{s}" — ₹{s==="13"?settings.price13:settings.price16}</label>))}</div></div>
          <div className="form-row"><div className="field"><span className="field-label">Sheets</span><input type="number" inputMode="numeric" placeholder="e.g. 2" value={sheets} onChange={e=>setSheets(e.target.value)} onFocus={e=>e.target.select()}/></div><div className="field"><span className="field-label">Dots</span><input type="number" inputMode="numeric" placeholder="e.g. 1000" value={dots} onChange={e=>setDots(e.target.value)} onFocus={e=>e.target.select()}/></div></div>
          <div className="field"><span className="field-label">Paper?</span><div className="radio-group">{[true,false].map(v=>(<label key={String(v)} className={`radio-opt ${paper===v?"selected":""}`}><input type="radio" checked={paper===v} onChange={()=>setPaper(v)}/>{v?"Yes — ₹"+settings.paperPrice+"/sheet":"No"}</label>))}</div></div>
          <hr className="divider"/>
          <div className="calc-preview"><div className="calc-title">Calculation</div><div className="calc-row"><span>Sheet Cost</span><span>₹{sheetCost.toFixed(2)}</span></div><div className="calc-row"><span>Dot Cost</span><span>₹{dotCost.toFixed(2)}</span></div><div className="calc-row"><span>Paper</span><span>₹{paperCost.toFixed(2)}</span></div><div className="calc-row total"><span>Total</span><span>{inr(amount)}</span></div></div>
        </>)}
        {sheetType==="CNC"&&(<>
          <div className="field"><span className="field-label">Work Type</span><div className="radio-group">{["CNC","Zircon"].map(t=>(<label key={t} className={`radio-opt ${workType===t?"selected":""}`}><input type="radio" checked={workType===t} onChange={()=>setWorkType(t)}/>{t}</label>))}</div></div>
          <div className="form-row"><div className="field"><span className="field-label">Sheets</span><input type="number" inputMode="numeric" placeholder="e.g. 2" value={cncSheets} onChange={e=>setCncSheets(e.target.value)} onFocus={e=>e.target.select()}/></div><div className="field"><span className="field-label">Dots</span><input type="number" inputMode="numeric" placeholder="e.g. 800" value={cncDots} onChange={e=>setCncDots(e.target.value)} onFocus={e=>e.target.select()}/></div></div>
          <div className="field"><span className="field-label">Amount (₹) — Manual</span><input autoFocus type="number" inputMode="numeric" placeholder="Enter total amount" value={cncAmount} onChange={e=>setCncAmount(e.target.value)} onFocus={e=>e.target.select()}/></div>
          {cncAmtN>0&&<div className="calc-preview"><div className="calc-row total"><span>Total</span><span>{inr(cncAmtN)}</span></div></div>}
        </>)}
        {sheetType==="Custom"&&(<>
          <div style={{background:"rgba(80,144,224,0.08)",border:"1px solid rgba(80,144,224,0.2)",borderRadius:"var(--radius)",padding:"12px 14px",fontSize:13,color:"var(--text2)",lineHeight:1.6}}>Use for design work, material supply, special jobs, or any work not covered by Laser/CNC.</div>
          <div className="field"><span className="field-label">Work Description</span><textarea autoFocus placeholder="e.g. Design work, Material supply, Laser cutting…" value={description} onChange={e=>setDescription(e.target.value)}/></div>
          <div className="field"><span className="field-label">Amount (₹)</span><input type="number" inputMode="numeric" placeholder="Enter amount" value={customAmount} onChange={e=>setCustomAmount(e.target.value)} onFocus={e=>e.target.select()}/></div>
          {customAmtN>0&&<div className="calc-preview"><div className="calc-row total"><span>Amount to Add</span><span>{inr(customAmtN)}</span></div></div>}
        </>)}
      </div>
      <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={!canSave}><Icon name="save" size={13}/> Save Entry</button></div>
    </div>
  </div>);
}

function AddExpenseModal({onClose,onSave,existing}){
  const [date,setDate]=useState(existing?.date||todayStr());
  const [category,setCategory]=useState(existing?.category||"Miscellaneous");
  const [customCat,setCustomCat]=useState("");const [showCustomCat,setShowCustomCat]=useState(false);
  const [title,setTitle]=useState(existing?.title||"");const [description,setDescription]=useState(existing?.description||"");const [amount,setAmount]=useState(existing?.amount?.toString()||"");
  const finalCat=showCustomCat?customCat.trim():category;const amt=parseFloat(amount)||0;
  const canSave=title.trim().length>0&&amt>0&&finalCat.length>0;
  function handleSave(){if(!canSave)return;onSave({id:existing?.id||uid(),date,category:finalCat,title:title.trim(),description:description.trim(),amount:amt});}
  return(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div className="modal-header"><span className="modal-title"><Icon name="wallet" size={15}/> {existing?"Edit":"Add"} Expense</span><button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button></div>
      <div className="modal-body">
        <div className="form-row"><div className="field"><span className="field-label">Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div><div className="field"><span className="field-label">Amount (₹)</span><input autoFocus type="number" inputMode="numeric" placeholder="e.g. 450" value={amount} onChange={e=>setAmount(e.target.value)} onFocus={e=>e.target.select()}/></div></div>
        <div className="field"><span className="field-label">Category</span>{!showCustomCat?(<select value={category} onChange={e=>setCategory(e.target.value)}>{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>):(<input type="text" placeholder="Custom category name" value={customCat} onChange={e=>setCustomCat(e.target.value)}/>)}<button className="btn btn-ghost btn-sm" style={{alignSelf:"flex-start",marginTop:4}} onClick={()=>setShowCustomCat(p=>!p)}>{showCustomCat?"← Use preset":"+ Custom category"}</button></div>
        <div className="field"><span className="field-label">Expense Title</span><input type="text" placeholder="e.g. Electricity Bill, Transport" value={title} onChange={e=>setTitle(e.target.value)}/></div>
        <div className="field"><span className="field-label">Description (Optional)</span><textarea placeholder="e.g. Courier charges for delivery…" value={description} onChange={e=>setDescription(e.target.value)}/></div>
        {amt>0&&(<div className="calc-preview"><div className="calc-title">Summary</div><div className="calc-row"><span>Category</span><span>{finalCat||"—"}</span></div><div className="calc-row total" style={{color:"var(--red)"}}><span>Amount</span><span>{inr(amt)}</span></div></div>)}
      </div>
      <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-danger" onClick={handleSave} disabled={!canSave}><Icon name="save" size={13}/> {existing?"Update":"Add"} Expense</button></div>
    </div>
  </div>);
}

function BackupPage({customers,settings,expenses,onRestore,showToast}){
  const [importStatus,setImportStatus]=useState(null);const [importMsg,setImportMsg]=useState("");const [dragging,setDragging]=useState(false);const fileRef=useRef();
  const totalEntries=customers.reduce((s,c)=>(c.entries||[]).length+s,0);const totalPayments=customers.reduce((s,c)=>(c.payments||[]).length+s,0);
  function exportJSON(){const data={exportedAt:new Date().toISOString(),version:"nova_v3",settings,customers,expenses};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`nova-backup-${new Date().toISOString().split("T")[0]}.json`;a.click();URL.revokeObjectURL(url);showToast("Backup downloaded!");}
  function exportCSV(){const rows=[["Customer","Date","Type","Details","Sheets","Dots","Amount"]];customers.forEach(c=>{(c.entries||[]).forEach(e=>rows.push([c.name,e.date,e.sheetType,e.sheetType==="Laser"?e.sheetSize+'"':e.sheetType==="Custom"?e.description:e.workType,e.sheets||"",e.dots||0,e.amount]));(c.payments||[]).forEach(p=>rows.push([c.name,p.date,"Payment","","","",p.amount]));});expenses.forEach(e=>rows.push(["[EXPENSE]",e.date,e.category,e.title,"","","-"+e.amount]));const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`nova-export-${new Date().toISOString().split("T")[0]}.csv`;a.click();URL.revokeObjectURL(url);showToast("CSV exported!");}
  function processFile(file){if(!file)return;if(!file.name.endsWith(".json")){setImportStatus("error");setImportMsg("Please select a valid Nova JSON backup file.");return;}const reader=new FileReader();reader.onload=e=>{try{const data=JSON.parse(e.target.result);if(!data.version||!data.customers)throw new Error("Invalid.");onRestore(data.customers,data.settings||settings,data.expenses||[]);setImportStatus("success");setImportMsg(`Restored ${data.customers.length} customers & ${(data.expenses||[]).length} expenses.`);}catch{setImportStatus("error");setImportMsg("Invalid backup file.");}};reader.readAsText(file);}
  return(<>
    <div className="page-header"><div className="page-title">Backup &amp; Restore</div><div className="page-sub">Protect your data</div></div>
    <div className="backup-tip"><div style={{color:"var(--blue)",flexShrink:0,marginTop:1}}><Icon name="shield" size={20}/></div><div className="backup-tip-text"><strong>Recommended:</strong> Export a JSON backup weekly. Save to Google Drive or email yourself. Restore anytime in one click.</div></div>
    <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius2)",padding:"14px 20px",marginBottom:20,display:"flex",gap:28,flexWrap:"wrap"}}>
      <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"IBM Plex Mono",alignSelf:"center"}}>Current Data</div>
      {[[customers.length,"Customers"],[totalEntries,"Entries"],[totalPayments,"Payments"],[expenses.length,"Expenses"]].map(([val,lb])=>(<div key={lb} style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontSize:20,fontWeight:700,color:"var(--accent)",fontFamily:"IBM Plex Mono"}}>{val}</span><span style={{fontSize:12,color:"var(--text3)"}}>{lb}</span></div>))}
    </div>
    <div className="backup-grid">
      <div className="backup-card"><div style={{color:"var(--accent)",marginBottom:4}}><Icon name="download" size={22}/></div><div className="backup-card-title">Export JSON Backup</div><div className="backup-card-desc">Full backup including all customers, entries, payments, expenses and settings.</div><button className="btn btn-primary" onClick={exportJSON} style={{width:"100%",justifyContent:"center"}}><Icon name="download" size={14}/> Download JSON</button></div>
      <div className="backup-card"><div style={{color:"var(--blue)",marginBottom:4}}><Icon name="file" size={22}/></div><div className="backup-card-title">Export CSV / Excel</div><div className="backup-card-desc">All data as spreadsheet. Open in Excel or Google Sheets.</div><button className="btn btn-ghost" onClick={exportCSV} style={{width:"100%",justifyContent:"center",borderColor:"var(--blue)",color:"var(--blue)"}}><Icon name="file" size={14}/> Download CSV</button></div>
    </div>
    <div style={{marginTop:8,marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:6}}>Restore from Backup</div>
      <div style={{fontSize:13,color:"var(--text3)",marginBottom:14}}>Select a Nova JSON backup file. All current data will be replaced.</div>
      {importStatus==="success"&&<div className="success-banner" style={{marginBottom:14}}><Icon name="check" size={16}/> {importMsg}</div>}
      {importStatus==="error"&&<div style={{background:"rgba(224,80,80,0.08)",border:"1px solid rgba(224,80,80,0.2)",borderRadius:"var(--radius)",padding:"12px 16px",fontSize:13,color:"var(--red)",marginBottom:14}}>✕ {importMsg}</div>}
      <div className={`import-drop ${dragging?"drag":""}`} onClick={()=>fileRef.current.click()} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);}}>
        <div className="import-drop-icon"><Icon name="upload" size={32}/></div>
        <div className="import-drop-text">Click to select backup file</div>
        <div className="import-drop-sub">or drag and drop .json here</div>
        <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
      </div>
    </div>
    <div style={{background:"rgba(224,80,80,0.06)",border:"1px solid rgba(224,80,80,0.15)",borderRadius:"var(--radius)",padding:"12px 16px",fontSize:12,color:"var(--text3)",lineHeight:1.6,fontFamily:"IBM Plex Mono",marginTop:16}}>⚠ Restoring will overwrite all current data. Export first if needed.</div>
  </>);
}

function PasswordModal({label,onClose,onConfirm}){
  const [pw,setPw]=useState("");const [error,setError]=useState(false);const [shake,setShake]=useState(false);
  function handleConfirm(){if(pw==="123456"){onConfirm();}else{setError(true);setShake(true);setPw("");setTimeout(()=>setShake(false),500);}}
  return(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal" style={{maxWidth:380}}><div className="modal-header"><span className="modal-title"><Icon name="lock" size={15}/> Confirm</span><button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button></div><div className="modal-body"><div style={{background:"rgba(224,80,80,0.08)",border:"1px solid rgba(224,80,80,0.2)",borderRadius:"var(--radius)",padding:"12px 14px",fontSize:13,color:"var(--text2)"}}>{label}</div><div className="field"><span className="field-label">Password</span><input autoFocus type="password" placeholder="••••••" value={pw} onChange={e=>{setPw(e.target.value);setError(false);}} onKeyDown={e=>e.key==="Enter"&&handleConfirm()} style={{border:error?"1px solid var(--red)":undefined,animation:shake?"shake 0.4s ease":undefined}}/>{error&&<span style={{fontSize:12,color:"var(--red)",marginTop:2}}>✕ Wrong password.</span>}</div></div><div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn" style={{background:"var(--red)",color:"#fff",borderColor:"var(--red)"}} onClick={handleConfirm}><Icon name="trash" size={13}/> Confirm</button></div></div></div>);
}
