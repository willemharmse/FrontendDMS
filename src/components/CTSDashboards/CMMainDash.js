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
    faGear,
    faGears,
} from "@fortawesome/free-solid-svg-icons";
import TopBar from "../Notifications/TopBar";
import TopBarDD from "../Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../../utils/auth";
import { ToastContainer } from "react-toastify";
import "./DDSMainDash.css";

const DMS_META = {
    dataAsAt: "03 June 2026",
};

const DMS_SUMMARY_CARDS = [
    {
        id: "total",
        label: "TOTAL CONTROLS IN SYSTEM",
        value: 160,
        sub: "▲ 7 vs last month",
        subColorClass: "mdash-sub--grey",
        colorClass: "mdash-card--grey",
        showInfo: false,
    },
    {
        id: "critical",
        label: "CRITICAL CONTROLS",
        value: 40,
        sub: "▲ 10 vs last month",
        subColorClass: "mdash-sub--grey",
        colorClass: "mdash-card--grey",
        showInfo: false,
    },
    {
        id: "concern",
        label: "CONTROLS OF CONCERN",
        value: 20,
        sub: "▲ 2 vs last month",
        subColorClass: "mdash-sub--red",
        colorClass: "mdash-card--grey",
        showInfo: false,
    },
    {
        id: "monitor",
        label: "CONTROLS TO MONITOR",
        value: 50,
        sub: "▼ 5 vs last month",
        subColorClass: "mdash-sub--green",
        colorClass: "mdash-card--grey",
        showInfo: false,
    },
];

//

const DMS_STATUS_OVERVIEW = {
    critical: { count: 40, pct: 40 },
    nonCritical: { count: 60, pct: 60 },
};

const DMS_TREND_MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"];
const DMS_TREND_SERIES = {
    added: [0, 10, 15, 16, 10, 12],
    updated: [15, 30, 35, 40, 30, 25],
};

const CONTROLS_ADDED_DOCS = [
    { name: "Access control (for confined spaces)", category: "General", critical: "Yes", quality: "60-90%" },
    { name: "Fire detection system", category: "General", critical: "No", quality: "60-90%" },
    { name: "CPS L9 - System training", category: "CPS", critical: "No", quality: "60-90%" },
    { name: "CPS L9 - Technician competency verification and certification", category: "CPS", critical: "No", quality: ">90%" },
    { name: "MPLD Solution - Detection infrastructure", category: "MPLD", critical: "No", quality: ">90%" },
];

const CONTROLS_UPDATED_DOCS = [
    { name: "Access control (for restricted spaces)", category: "General", critical: "No", quality: "<30%" },
    { name: "Atmospheric monitoring (for confined spaces)", category: "General", critical: "No", quality: "<30%" },
    { name: "CPS L9 - Supplier warranty and performance obligation", category: "CPS", critical: "No", quality: "<30%" },
    { name: "CPS L9 - Technician competency verification and certification", category: "CPS", critical: "No", quality: "30-59%" },
    { name: "MPLD Solution - Wearable device", category: "MPLD", critical: "No", quality: "30-59%" },
];

const fmt = (n) => n.toLocaleString("en-ZA");

const donutArc = (pct, offset) => {
    const c = 2 * Math.PI * 45; // circumference at r=45
    return { dash: (pct / 100) * c, offset: -(offset / 100) * c };
};

const linePoint = (val, min, max, svgH, svgPadT, svgPadB, idx, total, svgW, padL, padR) => {
    const x = padL + (idx / (total - 1)) * (svgW - padL - padR);
    const y = svgPadT + (1 - (val - min) / (max - min)) * (svgH - svgPadT - svgPadB);
    return { x, y };
};
const DMS_EXPIRING_BUCKETS = [
    { label: "0–30 Days", value: 11 },
    { label: "31–60 Days", value: 9 },
    { label: "61–90 Days", value: 6 },
    { label: "90+ Days", value: 4 },
];

const DMS_HIERARCHY_OVERVIEW = {
    b1: { label: "Elimination", count: 40, pct: 25, value: 40 },
    b2: { label: "Substitution", count: 32, pct: 20, value: 32 },
    b3: { label: "Engineering", count: 29, pct: 18, value: 29 },
    b4: { label: "Separation", count: 24, pct: 15, value: 24 },
    b5: { label: "Administration", count: 22, pct: 14, value: 22 },
    b6: { label: "PPE", count: 13, pct: 8, value: 13 },
};

const DMS_HIERARCHY_OVERVIEW_BAR = [
    { label: "Elimination", count: 40, pct: 25, value: 40, class: "new-b6" },
    { label: "Substitution", count: 32, pct: 20, value: 32, class: "new-b5" },
    { label: "Engineering", count: 29, pct: 18, value: 29, class: "new-b4" },
    { label: "Separation", count: 24, pct: 15, value: 24, class: "new-b3" },
    { label: "Administration", count: 22, pct: 14, value: 22, class: "new-b2" },
    { label: "PPE", count: 13, pct: 8, value: 13, class: "new-b1" },
];

// Total: 160 controls, 100%

const DMS_HIERARCHY_HORIZ_DATA = Object.entries(DMS_HIERARCHY_OVERVIEW).map(([key, item]) => ({
    label: item.label,
    value: item.count,
    class: `new-${key}`,
}));

const DonutChart = ({ data }) => {
    let offset = 0;
    const order = ["b1", "b2", "b3", "b4", "b5", "b6"];
    const segments = order.map((key) => ({
        key,
        pct: data[key].pct,
        cls: `mdash-donut--${key}`,
    }));

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

const TrendChart = ({ months, series }) => {
    const allVals = [...series.added, ...series.updated];
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const svgW = 400, svgH = 140, padL = 30, padR = 30, padT = 12, padB = 24;

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
            <polyline points={polyline(series.added)} className="mdash-line mdash-line--new5" />
            <polyline points={polyline(series.updated)} className="mdash-line mdash-line--new4" />
            {pts(series.added).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--new5" />)}
            {pts(series.updated).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--new4" />)}
        </svg>
    );
};

const BarChart = ({ data }) => {
    const maxVal = Math.max(...data.map((d) => d.value));
    const svgH = 180;
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
                        <rect x={x} y={y} width={barW} height={barH} rx="0" className={`mdash-bar ${d.class}`} />
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="mdash-bar-value">{d.value}</text>
                        <text x={x + barW / 2} y={svgH - 6} textAnchor="middle" className="mddsash-axis-text">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

const getCategoryClass = (category) => {
    switch (category) {
        case "<30%":
            return "category-low";
        case "30-59%":
            return "category-medium";
        case "60-90%":
            return "category-high";
        case ">90%":
            return "category-complete";
        default:
            return "";
    }
};

const BarChartHier = ({ data }) => {
    const maxVal = Math.max(...data.map((d) => d.value));
    const svgH = 215;
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
                        <rect x={x} y={y} width={barW} height={barH} rx="0" className={`mdash-bar ${d.class}`} />
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="mdash-bar-value">{d.value}</text>
                        <text x={x + barW / 2} y={svgH - 6} textAnchor="middle" className="mddsash-axis-text">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

const DMS_DOUBLE_BAR_DATA = [
    { label: "General", critical: 12, nonCritical: 24 },
    { label: "CPS", critical: 18, nonCritical: 36 },
    { label: "MPLD", critical: 10, nonCritical: 20 },
];

const DoubleBarChart = ({ data }) => {
    const allVals = data.flatMap((d) => [d.critical, d.nonCritical]);
    const maxVal = Math.max(...allVals);
    const svgH = 120;
    const barW = 22;
    const barGap = 4;   // gap between the two bars in a group
    const grpGap = 24;  // gap between groups
    const padL = 14;
    const padB = 20;
    const padT = 20;
    const grpW = barW * 2 + barGap;
    const totalW = padL + data.length * (grpW + grpGap) - grpGap + 10;
    const chartH = svgH - padT - padB;

    return (
        <svg
            className="mdash-dbar-svg"
            viewBox={`0 0 ${totalW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
        >
            {/* grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padT + (1 - frac) * chartH;
                return <line key={i} x1={padL} x2={totalW - 4} y1={y} y2={y} className="mdash-chart-gridline" />;
            })}

            {data.map((d, i) => {
                const grpX = padL + i * (grpW + grpGap);
                const cH = (d.critical / maxVal) * chartH;
                const ncH = (d.nonCritical / maxVal) * chartH;
                const cX = grpX;
                const ncX = grpX + barW + barGap;
                const cY = padT + chartH - cH;
                const ncY = padT + chartH - ncH;
                const lblX = grpX + grpW / 2;

                return (
                    <g key={d.label}>
                        {/* Critical bar — red */}
                        <rect x={cX} y={cY} width={barW} height={cH} rx="0" className="mdash-dbar--critical" />
                        <text x={cX + barW / 2} y={cY - 4} textAnchor="middle" className="mdash-dbar-value">{d.critical}</text>

                        {/* Non-critical bar — green */}
                        <rect x={ncX} y={ncY} width={barW} height={ncH} rx="0" className="mdash-dbar--noncritical" />
                        <text x={ncX + barW / 2} y={ncY - 4} textAnchor="middle" className="mdash-dbar-value">{d.nonCritical}</text>

                        {/* Category label centred under the group */}
                        <text x={lblX} y={svgH - 6} textAnchor="middle" className="mdash-axis-text">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

const DMS_HORIZ_BAR_DATA = [
    { label: "Unrated", value: 55, class: "new-bar1" },
    { label: ">90%", value: 40, class: "new-bar2" },
    { label: "60–90%", value: 12, class: "new-bar3" },
    { label: "30–59%", value: 15, class: "new-bar4" },
    { label: "<30%", value: 20, class: "new-bar5" }
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

const HorizBarChart2 = ({ data }) => {
    const svgW = 500;
    const rowH = 40;
    const barH = 28;
    const padL = 110;
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

const CMMainDash = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    return (
        <div className="dc-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">RMS Dashboard</p>
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

                <div className="mddsdash-shell">
                    <div className="mdash-header">
                        <div>
                            <h1 className="mdash-header-title">RISK MANAGEMENT SYSTEM (CONTROL MANAGEMENT)</h1>
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

                    <div className="mdxmash-summary-grid">
                        {DMS_SUMMARY_CARDS.map((card) => (
                            <div key={card.id} className={`mddsash-summary-card ${card.colorClass}`} style={{ position: "relative" }}>
                                {card.showInfo && (
                                    <FontAwesomeIcon
                                        icon={faInfoCircle}
                                        style={{ color: "gray", fontSize: "16px", position: "absolute", top: "12px", right: "12px" }}
                                    />
                                )}
                                <p className="mddsash-summary-label">{card.label}</p>
                                {card.value !== -1 && <strong className="mddsash-summary-value">{fmt(card.value)}</strong>}
                                <span className={`mddsash-summary-sub ${card.subColorClass}`}>{card.sub}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mdash-grid mddsash-grid--3col">
                        <div className="mdash-panel ">
                            <div className="mdash-panel-header">
                                <h3>CONTROLS BY HIERARCHY</h3>
                            </div>
                            <BarChartHier data={DMS_HIERARCHY_OVERVIEW_BAR} />
                        </div>
                        <div className="mdash-panel ">
                            <div className="mdash-panel-header">
                                <h3>CONTROLS BY QUALITY RATING</h3>
                            </div>
                            <BarChart data={DMS_HORIZ_BAR_DATA} />
                        </div>
                    </div>

                    {false && (
                        <>
                            <div className="mdash-grid mddsash-grid--3col">
                                <div className="mdash-panel">
                                    <div className="mdash-panel-header">
                                        <h3>CONTROLS BY HIERARCHY</h3>
                                    </div>
                                    <div className="mdash-status-layout">
                                        <DonutChart data={DMS_HIERARCHY_OVERVIEW} />
                                        <div className="mdash-legend-stack">
                                            {["b1", "b2", "b3", "b4", "b5", "b6"].map((key) => {
                                                const item = DMS_HIERARCHY_OVERVIEW[key];
                                                return (
                                                    <div key={key} className="mdash-legend-row">
                                                        <span className={`mdash-legend-dot mdash-legend-dot--${key}`} />
                                                        <span className="mdash-legend-text">{item.label}</span>
                                                        <strong className="mdash-legend-count">{item.count} ({item.pct}%)</strong>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="mdash-panel ">
                                    <div className="mdash-panel-header">
                                        <h3>CONTROLS BY QUALITY RATING</h3>
                                    </div>
                                    <BarChart data={DMS_HORIZ_BAR_DATA} />
                                </div>
                            </div>

                            <div className="mdash-grid mddsash-grid--3col">
                                <div className="mdash-panel">
                                    <div className="mdash-panel-header">
                                        <h3>CONTROLS BY HIERARCHY</h3>
                                    </div>
                                    <div className="mdash-status-layout">
                                        <DonutChart data={DMS_HIERARCHY_OVERVIEW} />
                                        <div className="mdash-legend-stack">
                                            {["b1", "b2", "b3", "b4", "b5", "b6"].map((key) => {
                                                const item = DMS_HIERARCHY_OVERVIEW[key];
                                                return (
                                                    <div key={key} className="mdash-legend-row">
                                                        <span className={`mdash-legend-dot mdash-legend-dot--${key}`} />
                                                        <span className="mdash-legend-text">{item.label}</span>
                                                        <strong className="mdash-legend-count">{item.count} ({item.pct}%)</strong>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="mdash-panel ">
                                    <div className="mdash-panel-header">
                                        <h3>CONTROLS BY QUALITY RATING</h3>
                                    </div>
                                    <HorizBarChart data={DMS_HORIZ_BAR_DATA} />
                                </div>
                            </div>

                            <div className="mdash-grid mddsash-grid--3col">
                                <div className="mdash-panel">
                                    <div className="mdash-panel-header">
                                        <h3>CONTROLS BY HIERARCHY</h3>
                                    </div>
                                    <HorizBarChart2 data={DMS_HIERARCHY_HORIZ_DATA} />
                                </div>
                                <div className="mdash-panel ">
                                    <div className="mdash-panel-header">
                                        <h3>CONTROLS BY QUALITY RATING</h3>
                                    </div>
                                    <HorizBarChart data={DMS_HORIZ_BAR_DATA} />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mdash-grid mddsash-grid--3col">
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>CRITICAL CONTROLS</h3>
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "50%" }}>Control</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Category</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Control Quality</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CONTROLS_ADDED_DOCS.map((doc) => (
                                            <tr key={doc.name}>
                                                <td style={{ wordBreak: "break-word", whiteSpace: "wrap" }}>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.category}</td>
                                                <td style={{ textAlign: "center" }} className={getCategoryClass(doc.quality)}>{doc.quality}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>CONTROL ATTENTION OVERVIEW</h3>
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "50%" }}>Control</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Category</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Critical Control</th>
                                            <th style={{ textAlign: "center", width: "20%" }}>Control Quality</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CONTROLS_UPDATED_DOCS.map((doc) => (
                                            <tr key={doc.name}>
                                                <td style={{ wordBreak: "break-word", whiteSpace: "wrap" }}>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.category}</td>
                                                <td style={{ textAlign: "center" }}>{doc.critical}</td>
                                                <td style={{ textAlign: "center" }} className={getCategoryClass(doc.quality)}>{doc.quality}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>CONTROLS OVER TIME (LAST 6 MONTHS)</h3>
                            <div className="mdash-inline-legend">
                                {[
                                    { label: "Controls Added", cls: "new5" },
                                    { label: "Controls Updated", cls: "new4" },
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

export default CMMainDash;