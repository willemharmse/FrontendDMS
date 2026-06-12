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
        id: "bodies",
        label: "ORGANISATION COMPLIANCE",
        value: "90%",
        sub: "▲ 5% vs last month",
        subColorClass: "mdash-sub--green",
        colorClass: "mdash-card--grey",
    },
    {
        id: "total",
        label: "TOTAL COMPONENT CERTIFICATES",
        value: 150,
        sub: "▲ 5 vs last month",
        subColorClass: "mdash-sub--green",
        colorClass: "mdash-card--grey",
    },
    {
        id: "valid",
        label: "VALID COMPONENT CERTIFICATES",
        value: 100,
        sub: "67% of total",
        colorClass: "mdash-card--grey",
    },
    {
        id: "expiring",
        label: "EXPIRING COMPONENT CERTIFICATES",
        value: 30,
        sub: "20% of total",
        colorClass: "mdash-card--orange",
    },
    {
        id: "invalid",
        label: "INVALID COMPONENT CERTIFICATES",
        value: 20,
        sub: "13% of total",
        colorClass: "mdash-card--red",
    },
    {
        id: "sites",
        label: "OUTSTANDING COMPONENT CERTIFICATES",
        value: 12,
        sub: "Certificates Required",
        colorClass: "mdash-card--red",
    },
];

const DMS_HORIZ_BAR_DATA = [
    { label: "Organisation", value: 80, class: "new-bar1" },
    { label: "Site", value: 70, class: "new-bar2" },
    { label: "Asset", value: 50, class: "new-bar3" },
    { label: "Area", value: 40, class: "new-bar4" }
];

const HorizBarChart = ({ data }) => {
    const svgW = 500;
    const rowH = 40;
    const barH = 28;
    const padL = 70;
    const padR = 40;
    const padT = 8;
    const padB = 8;
    const svgH = padT + data.length * rowH + padB;
    const chartW = svgW - padL - padR;
    const maxVal = Math.max(...data.map((d) => d.value));

    return (
        <svg
            className="mhbar-svg"
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
        >
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const x = padL + frac * chartW;
                return (
                    <line key={i} x1={x} x2={x} y1={padT} y2={svgH - padB} className="mhbar-gridline" />
                );
            })}

            {data.map((d, i) => {
                const rowY = padT + i * rowH;
                const midY = rowY + rowH / 2;
                const barY = midY - barH / 2;
                const bW = (d.value / maxVal) * chartW;

                return (
                    <g key={d.label}>
                        {i > 0 && (
                            <line x1={padL} x2={svgW - padR} y1={rowY} y2={rowY} className="mhbar-row-sep" />
                        )}
                        <text x={padL - 6} y={midY + 1.5} textAnchor="end" className="mhbar-label">{d.label}</text>
                        <rect x={padL} y={barY} width={bW} height={barH} className={`mhbar-bar ${d.class}`} />
                        <text x={padL + bW + 3} y={midY + 1.5} textAnchor="start" className="mhbar-value">{d.value}</text>
                    </g>
                );
            })}
        </svg>
    );
};

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

const SITE_EXPIRING_BUCKETS = [
    { label: "Site 1", value: 70 },
    { label: "Site 2", value: 50 },
    { label: "Site 3", value: 30 },
    { label: "Site 4", value: 20 },
];

const ASSET_EXPIRING_BUCKETS = [
    { label: "CM1", value: 100 },
    { label: "FB2", value: 70 },
    { label: "T3", value: 50 },
    { label: "SC4", value: 30 },
];

const AREA_EXPIRING_BUCKETS = [
    { label: "Section 1", value: 100 },
    { label: "Section 2", value: 80 },
    { label: "Section 3", value: 40 },
    { label: "Section 4", value: 20 },
];

const WAREHOUSE_EXPIRING_BUCKETS = [
    { label: "Continuous Miner", value: 40 },
    { label: "Feeder Breaker", value: 18 },
    { label: "Tractor", value: 15 },
    { label: "Shuttle Car", value: 10 },
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

// Invalid (expired) certificates — 5 rows matching the previous table count
const EPA_INVALID_CERTS = [
    { component: "Master Component", site: "Site 1", assetType: "Continuous Miner", assetNo: "CM1", expiredOn: "02 May 2026" },
    { component: "Component 1", site: "Site 2", assetType: "Feeder Breaker", assetNo: "FB2", expiredOn: "08 May 2026" },
    { component: "Component 2", site: "Site 3", assetType: "Tractor", assetNo: "T3", expiredOn: "12 May 2026" },
    { component: "Component 3", site: "Site 4", assetType: "Shuttle Car", assetNo: "SC4", expiredOn: "18 May 2026" },
    { component: "Component 4", site: "Site 1", assetType: "Continuous Miner", assetNo: "CM5", expiredOn: "25 May 2026" },
];

// Expiring soon certificates — 5 rows matching the previous table count
const EPA_EXPIRING_CERTS = [
    { component: "Component 5", site: "Site 2", assetType: "Feeder Breaker", assetNo: "FB6", expiresOn: "10 Jun 2026", daysLeft: 2 },
    { component: "Component 6", site: "Site 3", assetType: "Tractor", assetNo: "T7", expiresOn: "12 Jun 2026", daysLeft: 4 },
    { component: "Component 7", site: "Site 4", assetType: "Shuttle Car", assetNo: "SC8", expiresOn: "15 Jun 2026", daysLeft: 7 },
    { component: "Component 8", site: "Site 1", assetType: "Continuous Miner", assetNo: "CM9", expiresOn: "20 Jun 2026", daysLeft: 12 },
    { component: "Component 9", site: "Site 2", assetType: "Feeder Breaker", assetNo: "FB10", expiresOn: "28 Jun 2026", daysLeft: 20 },
];

// Certificates by Site
const EPA_SITE_ROWS = [
    { type: "Site 1", total: 42, valid: 28, expiring: 9, expired: 5, pctInvalid: 12 },
    { type: "Site 2", total: 38, valid: 26, expiring: 8, expired: 4, pctInvalid: 11 },
    { type: "Site 3", total: 35, valid: 24, expiring: 7, expired: 4, pctInvalid: 11 },
    { type: "Site 4", total: 35, valid: 22, expiring: 6, expired: 7, pctInvalid: 20 },
];

// Certificates by Asset Type
const EPA_ASSET_TYPE_ROWS = [
    { type: "Continuous Miner", total: 45, valid: 30, expiring: 9, expired: 6, pctInvalid: 13 },
    { type: "Feeder Breaker", total: 38, valid: 26, expiring: 8, expired: 4, pctInvalid: 11 },
    { type: "Tractor", total: 37, valid: 25, expiring: 7, expired: 5, pctInvalid: 14 },
    { type: "Shuttle Car", total: 30, valid: 19, expiring: 6, expired: 5, pctInvalid: 17 },
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

const BarChartPercent = ({ data }) => {
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
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="mdash-bar-value">{d.value}%</text>
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

const EPAMSMainDash = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    const siteTotals = EPA_SITE_ROWS.reduce(
        (acc, r) => ({
            total: acc.total + r.total,
            valid: acc.valid + r.valid,
            expiring: acc.expiring + r.expiring,
            expired: acc.expired + r.expired,
        }),
        { total: 0, valid: 0, expiring: 0, expired: 0 }
    );

    const assetTotals = EPA_ASSET_TYPE_ROWS.reduce(
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
                        <p className="logo-text-um">EPAMS Dashboard</p>
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
                            <h1 className="mdash-header-title">EPA MANAGEMENT SYSTEM</h1>
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
                                <h3>COMPONENTS CERTIFICATE STATUS OVERVIEW</h3>
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
                    <div className="mdash-grid mdash-grid--3col">
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPLIANCE STATUS PER SITE</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <BarChartPercent data={SITE_EXPIRING_BUCKETS} />
                            </div>
                        </div>

                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPLIANCE STATUS PER AREA</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <BarChartPercent data={AREA_EXPIRING_BUCKETS} />
                            </div>
                        </div>
                    </div>

                    <div className="mdash-grid mdash-grid--3col">
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPLIANCE STATUS PER ASSET</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <BarChartPercent data={ASSET_EXPIRING_BUCKETS} />
                            </div>
                        </div>

                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>VALID DIGITAL WAREHOUSE COMPONENTS PER ASSET TYPE</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <BarChart data={WAREHOUSE_EXPIRING_BUCKETS} />
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

                        {/* Invalid Certificates */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPONENTS WITH INVALID CERTIFICATES</h3>
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Component</th>
                                            <th style={{ textAlign: "center" }}>Site</th>
                                            <th style={{ textAlign: "center" }}>Asset Type</th>
                                            <th style={{ textAlign: "center" }}>Asset Nr</th>
                                            <th style={{ textAlign: "center" }}>Expired On</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {EPA_INVALID_CERTS.map((cert, i) => (
                                            <tr key={i}>
                                                <td>{cert.component}</td>
                                                <td style={{ textAlign: "center" }}>{cert.site}</td>
                                                <td style={{ textAlign: "center" }}>{cert.assetType}</td>
                                                <td style={{ textAlign: "center" }}>{cert.assetNo}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-alert-text">{cert.expiredOn}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expiring Soon Certificates */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPONENTS WITH CERTIFICATES EXPIRING SOON</h3>
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Component</th>
                                            <th style={{ textAlign: "center" }}>Site</th>
                                            <th style={{ textAlign: "center" }}>Asset Type</th>
                                            <th style={{ textAlign: "center" }}>Asset Nr</th>
                                            <th style={{ textAlign: "center" }}>Expires On</th>
                                            <th style={{ textAlign: "center" }}>Days Left</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {EPA_EXPIRING_CERTS.map((cert, i) => (
                                            <tr key={i}>
                                                <td>{cert.component}</td>
                                                <td style={{ textAlign: "center" }}>{cert.site}</td>
                                                <td style={{ textAlign: "center" }}>{cert.assetType}</td>
                                                <td style={{ textAlign: "center" }}>{cert.assetNo}</td>
                                                <td style={{ textAlign: "center" }}>{cert.expiresOn}</td>
                                                <td style={{ textAlign: "center" }} className={cert.daysLeft <= 7 ? "mdash-alert-text" : "mdash-warn-text"}>{cert.daysLeft}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Certificates by Site ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>CERTIFICATES BY SITE</h3>
                            <div className="mdash-inline-legend">
                                {[
                                    { label: "Valid", cls: "green" },
                                    { label: "Expiring Soon", cls: "orange" },
                                    { label: "Invalid", cls: "red" },
                                ].map((item) => (
                                    <span key={item.label} className="mdash-inline-legend-item">
                                        <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mdash-drilldown-grid">
                            <div className="mdash-table-scroll">
                                <table className="mdash-table mdash-table--drilldown">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "40%" }}>Site</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Total Certificates</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Valid</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Expiring Soon</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Invalid</th>
                                            <th style={{ textAlign: "center", width: "9%" }}>% Invalid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {EPA_SITE_ROWS.map((row) => (
                                            <tr key={row.type} className="mdash-drilldown-row">
                                                <td>{row.type}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-good-text">{fmt(row.valid)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(row.expiring)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(row.expired)}</td>
                                                <td style={{ textAlign: "center" }}>{row.pctInvalid}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="mdash-drilldown-footer">
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{fmt(siteTotals.total)}</td>
                                            <td style={{ textAlign: "center" }}>{fmt(siteTotals.valid)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(siteTotals.expiring)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(siteTotals.expired)}</td>
                                            <td style={{ textAlign: "center" }}>13%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Invalid</span>
                                </div>
                                <StackedBarChart rows={EPA_SITE_ROWS} />
                                <div className="mdash-stacked-axis-labels">
                                    {["0%", "25%", "50%", "75%", "100%"].map((l) => (
                                        <span key={l}>{l}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Certificates by Asset Type ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>CERTIFICATES BY ASSET TYPE</h3>
                            <div className="mdash-inline-legend">
                                {[
                                    { label: "Valid", cls: "green" },
                                    { label: "Expiring Soon", cls: "orange" },
                                    { label: "Invalid", cls: "red" },
                                ].map((item) => (
                                    <span key={item.label} className="mdash-inline-legend-item">
                                        <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mdash-drilldown-grid">
                            <div className="mdash-table-scroll">
                                <table className="mdash-table mdash-table--drilldown">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "40%" }}>Asset Type</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Total Certificates</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Valid</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Expiring Soon</th>
                                            <th style={{ textAlign: "center", width: "12%" }}>Invalid</th>
                                            <th style={{ textAlign: "center", width: "9%" }}>% Invalid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {EPA_ASSET_TYPE_ROWS.map((row) => (
                                            <tr key={row.type} className="mdash-drilldown-row">
                                                <td>{row.type}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-good-text">{fmt(row.valid)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(row.expiring)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(row.expired)}</td>
                                                <td style={{ textAlign: "center" }}>{row.pctInvalid}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="mdash-drilldown-footer">
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{fmt(assetTotals.total)}</td>
                                            <td style={{ textAlign: "center" }}>{fmt(assetTotals.valid)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(assetTotals.expiring)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(assetTotals.expired)}</td>
                                            <td style={{ textAlign: "center" }}>14%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Invalid</span>
                                </div>
                                <StackedBarChart rows={EPA_ASSET_TYPE_ROWS} />
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

export default EPAMSMainDash;