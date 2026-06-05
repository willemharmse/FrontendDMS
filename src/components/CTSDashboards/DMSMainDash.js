import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCaretLeft,
    faCaretRight,
    faArrowLeft,
    faDownload,
    faFilter,
    faCalendarAlt,
    faChevronRight,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import TopBar from "../Notifications/TopBar";
import TopBarDD from "../Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../../utils/auth";
import { ToastContainer } from "react-toastify";
import "./DMSMainDash.css";

// ─────────────────────────────────────────────
// MOCK DATA — swap these consts for API fetches
// ─────────────────────────────────────────────

const DMS_META = {
    dataAsAt: "03 June 2026",
};

const DMS_SUMMARY_CARDS = [
    {
        id: "total",
        label: "TOTAL DOCUMENTS",
        value: 150,
        sub: "▲ 5 vs last month",
        subColorClass: "mdash-sub--green",
        colorClass: "mdash-card--grey",
    },
    {
        id: "valid",
        label: "VALID DOCUMENTS",
        value: 100,
        sub: "67% of total",
        colorClass: "mdash-card--grey",
    },
    {
        id: "expiring",
        label: "EXPIRING SOON",
        value: 30,
        sub: "20% of total",
        colorClass: "mdash-card--orange",
    },
    {
        id: "expired",
        label: "EXPIRED DOCUMENTS",
        value: 20,
        sub: "13% of total",
        colorClass: "mdash-card--red",
    },
    {
        id: "owners",
        label: "DOCUMENT OWNERS",
        value: 12,
        sub: "Active owners",
        colorClass: "mdash-card--blue",
    },
    {
        id: "upload",
        label: "LATEST UPLOAD DATE",
        value: '03 June 2026',
        sub: "",
        colorClass: "mdash-card--grey",
    },
];

const DMS_STATUS_OVERVIEW = {
    valid: { count: 100, pct: 67 },
    expiring: { count: 30, pct: 20 },
    expired: { count: 20, pct: 13 },
};

// Expiring soon bar chart — days buckets
const DMS_EXPIRING_BUCKETS = [
    { label: "0–30 Days", value: 11 },
    { label: "31–60 Days", value: 9 },
    { label: "61–90 Days", value: 6 },
    { label: "90+ Days", value: 4 },
];

// Line chart — last 6 months
const DMS_TREND_MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"];
const DMS_TREND_SERIES = {
    valid: [60, 68, 75, 82, 90, 100],
    expiring: [10, 14, 18, 22, 26, 30],
    expired: [0, 5, 8, 12, 16, 20],
};

// Top 5 categories
const DMS_CATEGORIES = [
    { name: "DMPR MCOP Guidelines", count: 12 },
    { name: "Procedures", count: 8 },
    { name: "Policies", count: 7 },
    { name: "Risk Assessments", count: 6 },
    { name: "Standards", count: 6 },
];

// Recently expired
const DMS_RECENTLY_EXPIRED = [
    { name: "Confined Space Procedure", type: "Procedure", expiredOn: "18 May 2025", owner: "S. Johnson", alert: true },
    { name: "Lockout Tagout Procedure", type: "Procedure", expiredOn: "16 May 2025", owner: "P. Naidoo", alert: true },
    { name: "Hazardous Materials Standard", type: "Standard", expiredOn: "14 May 2025", owner: "L. Mokoena", alert: true },
    { name: "Emergency Response Plan", type: "Policy", expiredOn: "12 May 2025", owner: "R. Singh", alert: true },
    { name: "Visitor Safety Procedure", type: "Procedure", expiredOn: "10 May 2025", owner: "T. Govender", alert: true },
];

// Expiring soon docs
const DMS_EXPIRING_DOCS = [
    { name: "Safe Work Procedure", type: "Procedure", expiresOn: "25 May 2025", daysLeft: 5, owner: "S. Johnson" },
    { name: "PPE Inspection Standard", type: "Standard", expiresOn: "27 May 2025", daysLeft: 7, owner: "P. Naidoo" },
    { name: "Working at Heights Procedure", type: "Procedure", expiresOn: "29 May 2025", daysLeft: 9, owner: "L. Mokoena" },
    { name: "Forklift Operating Manual", type: "Manual", expiresOn: "01 Jun 2025", daysLeft: 12, owner: "R. Singh" },
    { name: "First Aid Procedure", type: "Procedure", expiresOn: "03 Jun 2025", daysLeft: 14, owner: "T. Govender" },
];

// Drilldown table
const DMS_DRILLDOWN_ROWS = [
    { type: "DMPR MCOP Guidelines", icon: "📄", total: 8, valid: 5, expiring: 2, expired: 1, pctExpired: 13 },
    { type: "Guidelines", icon: "📄", total: 25, valid: 17, expiring: 5, expired: 3, pctExpired: 12 },
    { type: "Procedures", icon: "📄", total: 34, valid: 22, expiring: 8, expired: 4, pctExpired: 12 },
    { type: "Policies", icon: "📄", total: 38, valid: 26, expiring: 8, expired: 4, pctExpired: 11 },
    { type: "Standards", icon: "📄", total: 23, valid: 16, expiring: 4, expired: 3, pctExpired: 13 },
    { type: "Risk Assessments", icon: "📄", total: 15, valid: 11, expiring: 2, expired: 2, pctExpired: 13 },
    { type: "Others", icon: "📄", total: 7, valid: 3, expiring: 1, expired: 3, pctExpired: 43 },
];

const DMS_DRILLDOWN_DISCIPLINE_ROWS = [
    { type: "Engineering", icon: "📄", total: 8, valid: 5, expiring: 2, expired: 1, pctExpired: 13 },
    { type: "Finance", icon: "📄", total: 25, valid: 17, expiring: 5, expired: 3, pctExpired: 12 },
    { type: "Human Resources", icon: "📄", total: 34, valid: 22, expiring: 8, expired: 4, pctExpired: 12 },
    { type: "Metallurgy", icon: "📄", total: 38, valid: 26, expiring: 8, expired: 4, pctExpired: 11 },
    { type: "Mining", icon: "📄", total: 23, valid: 16, expiring: 4, expired: 3, pctExpired: 13 },
    { type: "SHE", icon: "📄", total: 15, valid: 11, expiring: 2, expired: 2, pctExpired: 13 },
    { type: "Others", icon: "📄", total: 7, valid: 3, expiring: 1, expired: 3, pctExpired: 43 },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt = (n) => n.toLocaleString("en-ZA");

// Donut arc builder
const donutArc = (pct, offset) => {
    const c = 2 * Math.PI * 45; // circumference at r=45
    return { dash: (pct / 100) * c, offset: -(offset / 100) * c };
};

// Line chart point mapper
const linePoint = (val, min, max, svgH, svgPadT, svgPadB, idx, total, svgW, padL, padR) => {
    const x = padL + (idx / (total - 1)) * (svgW - padL - padR);
    const y = svgPadT + (1 - (val - min) / (max - min)) * (svgH - svgPadT - svgPadB);
    return { x, y };
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const DonutChart = ({ data }) => {
    const { valid, expiring, expired } = data;
    const total = valid.pct + expiring.pct + expired.pct;
    let offset = 0;

    const segments = [
        { key: "valid", pct: valid.pct, cls: "mdash-donut--green" },
        { key: "expiring", pct: expiring.pct, cls: "mdash-donut--orange" },
        { key: "expired", pct: expired.pct, cls: "mdash-donut--red" },
    ];

    return (
        <svg className="mdash-donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="45" fill="none" stroke="#eff3f8" strokeWidth="22" />
            {segments.map((s) => {
                const { dash, offset: dashOff } = donutArc(s.pct, offset);
                const c = 2 * Math.PI * 45;
                const el = (
                    <circle
                        key={s.key}
                        cx="60" cy="60" r="45"
                        fill="none"
                        strokeWidth="22"
                        strokeDasharray={`${dash} ${c - dash}`}
                        strokeDashoffset={dashOff}
                        className={s.cls}
                        style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
                    />
                );
                offset += s.pct;
                return el;
            })}
            <circle cx="60" cy="60" r="34" fill="white" />
        </svg>
    );
};

const BarChart = ({ data }) => {
    const maxVal = Math.max(...data.map((d) => d.value));
    const svgH = 160;
    const barW = 36;
    const gap = 20;
    const padL = 10;
    const padB = 20;
    const padT = 20;
    const totalW = padL + data.length * (barW + gap) - gap + 10;

    return (
        <svg className="mdash-bar-svg" viewBox={`0 0 ${totalW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
            {/* grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padT + (1 - frac) * (svgH - padT - padB);
                return <line key={i} x1={padL} x2={totalW - 4} y1={y} y2={y} className="mdash-chart-gridline" />;
            })}
            {data.map((d, i) => {
                const barH = ((d.value / maxVal) * (svgH - padT - padB));
                const x = padL + i * (barW + gap);
                const y = padT + (svgH - padT - padB) - barH;
                return (
                    <g key={d.label}>
                        <rect x={x} y={y} width={barW} height={barH} rx="0" className="mdash-bar" />
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="mdash-bar-value">{d.value}</text>
                        <text x={x + barW / 2} y={svgH - 6} textAnchor="middle" className="mdash-axis-text">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

const TrendChart = ({ months, series }) => {
    const allVals = [...series.expiring, ...series.expired, ...series.valid];
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const svgW = 400, svgH = 120, padL = 30, padR = 30, padT = 12, padB = 24;

    const pts = (arr) => arr.map((v, i) => linePoint(v, minV, maxV, svgH, padT, padB, i, months.length, svgW, padL, padR));
    const polyline = (arr) => pts(arr).map((p) => `${p.x},${p.y}`).join(" ");

    const yTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    return (
        <svg className="mdash-trend-svg" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
            {yTicks.map((t) => {
                const y = padT + (1 - (t - minV) / (maxV - minV)) * (svgH - padT - padB);
                if (y < padT || y > svgH - padB) return null;
                return (
                    <g key={t}>
                        <line x1={padL} x2={svgW - padR} y1={y} y2={y} className="mdash-chart-gridline" />
                        <text x={padL - 4} y={y + 1.25} textAnchor="end" className="mdash-axis-text-trend">{t}</text>
                    </g>
                );
            })}
            {months.map((m, i) => {
                const x = padL + (i / (months.length - 1)) * (svgW - padL - padR);
                return <text key={m} x={x} y={svgH - 4} textAnchor="middle" className="mdash-axis-text-trend">{m}</text>;
            })}
            <polyline points={polyline(series.expiring)} className="mdash-line mdash-line--orange" />
            <polyline points={polyline(series.expired)} className="mdash-line mdash-line--red" />
            <polyline points={polyline(series.valid)} className="mdash-line mdash-line--green" />
            {pts(series.expiring).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--orange" />)}
            {pts(series.expired).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--red" />)}
            {pts(series.valid).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--green" />)}
        </svg>
    );
};

const StackedBarChart = ({ rows }) => {
    return (
        <div className="mdash-stacked-wrap">
            {rows.map((row) => {
                const total = row.valid + row.expiring + row.expired;
                const vPct = (row.valid / total) * 100;
                const ePct = (row.expiring / total) * 100;
                const xPct = (row.expired / total) * 100;
                return (
                    <div key={row.type} className="mdash-stacked-row">
                        <span className="mdash-stacked-label">{row.type}</span>
                        <div className="mdash-stacked-bar">
                            <div className="mdash-seg mdash-seg--valid" style={{ width: `${vPct}%` }}>
                                {vPct > 8 && <span>{row.valid}</span>}
                            </div>
                            <div className="mdash-seg mdash-seg--expiring" style={{ width: `${ePct}%` }}>
                                {ePct > 5 && <span>{row.expiring}</span>}
                            </div>
                            <div className="mdash-seg mdash-seg--expired" style={{ width: `${xPct}%` }}>
                                {xPct > 5 && <span>{row.expired}</span>}
                            </div>
                        </div>
                        <span className="mdash-stacked-pct">{row.pctExpired}%</span>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const DMSMainDash = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    const totals = DMS_DRILLDOWN_ROWS.reduce(
        (acc, r) => ({
            total: acc.total + r.total,
            valid: acc.valid + r.valid,
            expiring: acc.expiring + r.expiring,
            expired: acc.expired + r.expired,
        }),
        { total: 0, valid: 0, expiring: 0, expired: 0 }
    );

    return (
        <div className="dc-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">DMS Dashboard</p>
                    </div>
                </div>
            )}
            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-dc">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="spacer"></div>
                    <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} showInfo={false} type={"DDS"} />
                </div>

                <div className="mdash-shell">

                    {/* ── Header ── */}
                    <div className="mdash-header">
                        <div>
                            <h1 className="mdash-header-title">DOCUMENT MANAGEMENT SYSTEM</h1>
                        </div>
                        <div className="mdash-header-actions">
                            <button className="mdash-btn-nc">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                Data as at: {DMS_META.dataAsAt}
                            </button>
                            {false && (<button className="mdash-btn">
                                <FontAwesomeIcon icon={faFilter} />
                                Filters
                            </button>)}
                            <button className="mdash-btn mdash-btn--primary">
                                <FontAwesomeIcon icon={faDownload} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards ── */}
                    <div className="mdash-summary-grid">
                        {DMS_SUMMARY_CARDS.map((card) => (
                            <div key={card.id} className={`mdash-summary-card ${card.colorClass}`}>
                                <p className="mdash-summary-label">{card.label}</p>
                                {card.value !== -1 && <strong className="mdash-summary-value">{fmt(card.value)}</strong>}
                                <span className={`mdash-summary-sub ${card.subColorClass}`}>{card.sub}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Row 1: Status | Bar | Trend ── */}
                    <div className="mdash-grid mdash-grid--3col">

                        {/* Status Overview */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>DOCUMENT STATUS OVERVIEW</h3>
                            </div>
                            <div className="mdash-status-layout">
                                <DonutChart data={DMS_STATUS_OVERVIEW} />
                                <div className="mdash-legend-stack">
                                    {[
                                        { label: "Valid", count: DMS_STATUS_OVERVIEW.valid.count, pct: DMS_STATUS_OVERVIEW.valid.pct, cls: "green" },
                                        { label: "Expiring Soon", count: DMS_STATUS_OVERVIEW.expiring.count, pct: DMS_STATUS_OVERVIEW.expiring.pct, cls: "orange" },
                                        { label: "Expired", count: DMS_STATUS_OVERVIEW.expired.count, pct: DMS_STATUS_OVERVIEW.expired.pct, cls: "red" },
                                    ].map((item) => (
                                        <div key={item.label} className="mdash-legend-row">
                                            <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                            <span className="mdash-legend-text">{item.label}</span>
                                            <strong className="mdash-legend-count">{fmt(item.count)} ({item.pct}%)</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Expiring Soon Bar */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>EXPIRING SOON BY TIME PERIOD</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <BarChart data={DMS_EXPIRING_BUCKETS} />
                            </div>
                        </div>
                    </div>

                    {/* ── Row 2: Categories | Expired | Expiring Docs ── */}
                    <div className="mdash-grid mdash-grid--3col">

                        {/* Top Categories */}
                        {false && (<div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>EXPIRED DOCUMENTS BY DOCUMENT TYPE</h3>
                            </div>
                            <table className="mdash-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th style={{ textAlign: "right" }}>Documents</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {DMS_CATEGORIES.map((cat) => (
                                        <tr key={cat.name}>
                                            <td>{cat.name}</td>
                                            <td style={{ textAlign: "right" }}>{fmt(cat.count)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>)}

                        {/* Recently Expired */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>EXPIRED DOCUMENTS</h3>
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th style={{ textAlign: "center" }}>Type</th>
                                            <th style={{ textAlign: "center" }}>Expired On</th>
                                            <th style={{ textAlign: "center" }}>Owner</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DMS_RECENTLY_EXPIRED.map((doc) => (
                                            <tr key={doc.name}>
                                                <td>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td className={doc.alert ? "mdash-alert-text" : ""}>{doc.expiredOn}</td>
                                                <td style={{ textAlign: "center" }}>{doc.owner}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expiring Soon Docs */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>EXPIRING SOON DOCUMENTS</h3>
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th style={{ textAlign: "center" }}>Type</th>
                                            <th style={{ textAlign: "center" }}>Expires On</th>
                                            <th style={{ textAlign: "center" }}>Days Left</th>
                                            <th style={{ textAlign: "center" }}>Owner</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DMS_EXPIRING_DOCS.map((doc) => (
                                            <tr key={doc.name}>
                                                <td>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td style={{ textAlign: "center" }}>{doc.expiresOn}</td>
                                                <td className={doc.daysLeft <= 7 ? "mdash-alert-text" : "mdash-warn-text"}>{doc.daysLeft}</td>
                                                <td style={{ textAlign: "center" }}>{doc.owner}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Drilldown Section ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>DOCUMENTS BY DOCUMENT TYPE</h3>
                            <div className="mdash-inline-legend">
                                {[
                                    { label: "Valid", cls: "green" },
                                    { label: "Expiring Soon", cls: "orange" },
                                    { label: "Expired", cls: "red" },
                                ].map((item) => (
                                    <span key={item.label} className="mdash-inline-legend-item">
                                        <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mdash-drilldown-grid">

                            {/* Table side */}
                            <div className="mdash-table-scroll">
                                <table className="mdash-table mdash-table--drilldown">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "40%" }}>Document Type</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Total Documents</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Valid</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Expiring Soon</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Expired</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>% Expired</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DMS_DRILLDOWN_ROWS.map((row) => (
                                            <tr key={row.type} className="mdash-drilldown-row">
                                                <td>
                                                    {row.type}
                                                </td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-good-text">{fmt(row.valid)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(row.expiring)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(row.expired)}</td>
                                                <td style={{ textAlign: "center" }}>{row.pctExpired}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="mdash-drilldown-footer">
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{fmt(totals.total)}</td>
                                            <td style={{ textAlign: "center" }}>{fmt(totals.valid)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(totals.expiring)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(totals.expired)}</td>
                                            <td style={{ textAlign: "center" }}>{13}%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Stacked bar side */}
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Expired</span>
                                </div>
                                <StackedBarChart rows={DMS_DRILLDOWN_ROWS} />
                                <div className="mdash-stacked-axis-labels">
                                    {["0%", "25%", "50%", "75%", "100%"].map((l) => (
                                        <span key={l}>{l}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>DOCUMENTS BY DISCIPLINE</h3>
                            <div className="mdash-inline-legend">
                                {[
                                    { label: "Valid", cls: "green" },
                                    { label: "Expiring Soon", cls: "orange" },
                                    { label: "Expired", cls: "red" },
                                ].map((item) => (
                                    <span key={item.label} className="mdash-inline-legend-item">
                                        <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mdash-drilldown-grid">

                            {/* Table side */}
                            <div className="mdash-table-scroll">
                                <table className="mdash-table mdash-table--drilldown">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "40%" }}>Discipline</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Total Documents</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Valid</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Expiring Soon</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Expired</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>% Expired</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DMS_DRILLDOWN_DISCIPLINE_ROWS.map((row) => (
                                            <tr key={row.type} className="mdash-drilldown-row">
                                                <td>
                                                    {row.type}
                                                </td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-good-text">{fmt(row.valid)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(row.expiring)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(row.expired)}</td>
                                                <td style={{ textAlign: "center" }}>{row.pctExpired}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="mdash-drilldown-footer">
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{fmt(totals.total)}</td>
                                            <td style={{ textAlign: "center" }}>{fmt(totals.valid)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(totals.expiring)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(totals.expired)}</td>
                                            <td style={{ textAlign: "center" }}>{13}%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Stacked bar side */}
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Expired</span>
                                </div>
                                <StackedBarChart rows={DMS_DRILLDOWN_DISCIPLINE_ROWS} />
                                <div className="mdash-stacked-axis-labels">
                                    {["0%", "25%", "50%", "75%", "100%"].map((l) => (
                                        <span key={l}>{l}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>DOCUMENTS OVER TIME (LAST 6 MONTHS)</h3>
                            <div className="mdash-inline-legend">
                                {[
                                    { label: "Valid", cls: "green" },
                                    { label: "Expiring Soon", cls: "orange" },
                                    { label: "Expired", cls: "red" },
                                ].map((item) => (
                                    <span key={item.label} className="mdash-inline-legend-item">
                                        <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mdash-chart-scroll">
                            <TrendChart months={DMS_TREND_MONTHS} series={DMS_TREND_SERIES} />
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default DMSMainDash;