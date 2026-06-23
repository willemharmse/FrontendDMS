import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCaretLeft,
    faCaretRight,
    faArrowLeft,
    faDownload,
    faCalendarAlt,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import TopBar from "../Notifications/TopBar";
import TopBarDD from "../Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../../utils/auth";
import { ToastContainer } from "react-toastify";
import { exportDashboardPDF } from "./exportDashboardPDF";
import "./DMSMainDash.css";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt = (n) => (n ?? 0).toLocaleString("en-ZA");

// Donut arc builder
const donutArc = (pct, offset) => {
    const c = 2 * Math.PI * 45;
    return { dash: (pct / 100) * c, offset: -(offset / 100) * c };
};

// Line chart point mapper
const linePoint = (val, min, max, svgH, svgPadT, svgPadB, idx, total, svgW, padL, padR) => {
    const x = total <= 1 ? svgW - padR : padL + (idx / (total - 1)) * (svgW - padL - padR);
    const range = max - min || 1;
    const y = svgPadT + (1 - (val - min) / range) * (svgH - svgPadT - svgPadB);
    return { x, y };
};

// ─────────────────────────────────────────────
// Sub-text helpers — identical pattern to DMS
// ─────────────────────────────────────────────

/**
 * direction: "neutral"       → always grey (total, compliance stays grey)
 * direction: "positive-good" → up=green, down=red (valid)
 * direction: "positive-bad"  → up=red,   down=green (expiring/invalid)
 */
const buildDelta = (delta, direction) => {
    const abs = Math.abs(delta);
    if (delta === 0) return { label: `0 vs last month`, cls: "mdash-card--grey" };
    const arrow = delta > 0 ? "▲" : "▼";
    const label = `${arrow} ${fmt(abs)} vs last month`;
    let cls;
    if (direction === "neutral") {
        cls = "mdash-card--grey";
    } else if (direction === "positive-good") {
        cls = delta > 0 ? "mdash-card--green" : "mdash-card--red";
    } else {
        cls = delta > 0 ? "mdash-card--red" : "mdash-card--green";
    }
    return { label, cls };
};

/** Percentage-of-total sub (used by valid/expiring/invalid/outstanding). */
const pctSub = (count, total) => {
    const p = total > 0 ? Math.round((count / total) * 100) : 0;
    return `${p}% of total`;
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const DonutChart = ({ data }) => {
    const { valid, expiring, invalid } = data;
    const c = 2 * Math.PI * 45;

    const totalCount = (valid?.count ?? 0) + (expiring?.count ?? 0) + (invalid?.count ?? 0) || 1;

    // Calculate real percentages from counts, enforce minimum 2% arc for non-zero segments
    const raw = [
        { key: "valid", count: valid?.count ?? 0, cls: "mdash-donut--green" },
        { key: "expiring", count: expiring?.count ?? 0, cls: "mdash-donut--orange" },
        { key: "invalid", count: invalid?.count ?? 0, cls: "mdash-donut--red" },
    ].map(s => ({
        ...s,
        pct: s.count > 0 ? Math.max((s.count / totalCount) * 100, 2) : 0,
    }));

    // Normalise back to 100 after applying minimums
    const pctSum = raw.reduce((a, s) => a + s.pct, 0);
    const segments = raw.map(s => ({ ...s, pct: (s.pct / pctSum) * 100 }));

    let offset = 0;
    return (
        <svg className="mdash-donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="45" fill="none" stroke="#eff3f8" strokeWidth="22" />
            {segments.map((s) => {
                const dash = (s.pct / 100) * c;
                const dashOff = -(offset / 100) * c;
                const el = (
                    <circle
                        key={s.key}
                        cx="60" cy="60" r="45"
                        fill="none"
                        strokeWidth="22"
                        strokeLinecap="butt"
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

/**
 * ComplianceBarChart
 * ──────────────────
 * ViewBox width grows with the number of bars so every bar is full-sized.
 * When there are more than 4 bars the bar width shrinks to fit everything
 * within a proportional canvas so bars stay visible.
 * Gridlines (every 20%) are drawn as light lines — no numbers on the lines.
 */
const ComplianceBarChart = ({ data }) => {
    const svgH = 180;
    const BASE_BAR_W = 36;
    const BASE_GAP = 24;
    const padL = 6;
    const padR = 6;
    const padB = 24;
    const padT = 18;
    const chartH = svgH - padT - padB;

    const n = data.length || 1;

    // For ≤4 bars: natural size. For >4 bars: shrink bar+gap proportionally.
    const MAX_NATURAL_BARS = 4;
    const scale = n > MAX_NATURAL_BARS ? MAX_NATURAL_BARS / n : 1;
    const barW = BASE_BAR_W * scale;
    const gap = BASE_GAP * scale;

    // Total SVG width matches exactly the content needed
    const svgW = padL + n * (barW + gap) - gap + padR;

    const yOf = (pct) => padT + (1 - pct / 100) * chartH;

    const barCls = (val) => {
        if (val >= 100) return "cbar-bar--compliant";
        if (val >= 80) return "cbar-bar--monitor";
        if (val >= 60) return "cbar-bar--attention";
        return "cbar-bar--high-attention";
    };

    const fontSize = Math.max(4.5, 7 * scale);

    if (!data || data.length === 0) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: svgH, color: "#595959", fontSize: 12 }}>
                No data available
            </div>
        );
    }

    return (
        <svg
            className="cbar-svg"
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Gridlines at every 20% — light lines, no text */}
            {[0, 20, 40, 60, 80, 100].map((pct) => {
                const y = yOf(pct);
                return (
                    <line
                        key={pct}
                        x1={padL} x2={svgW - padR}
                        y1={y} y2={y}
                        className="cbar-gridline"
                    />
                );
            })}

            {data.map((d, i) => {
                const x = padL + i * (barW + gap);
                const barH = (d.value / 100) * chartH;
                const y = yOf(d.value);
                return (
                    <g key={d.label}>
                        <rect
                            x={x} y={y}
                            width={barW} height={barH}
                            className={`cbar-bar ${barCls(d.value)}`}
                        />
                        <text
                            x={x + barW / 2} y={y - 3.5}
                            textAnchor="middle"
                            className="cbar-bar-value"
                            style={{ fontSize }}
                        >
                            {d.value}%
                        </text>
                        <text
                            x={x + barW / 2} y={svgH - 6}
                            textAnchor="middle"
                            className="cbar-axis-text"
                            style={{ fontSize }}
                        >
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

const BarChart = ({ data }) => {
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const svgH = 160;
    const barW = 36;
    const gap = 20;
    const padL = 10;
    const padB = 20;
    const padT = 20;
    const totalW = padL + data.length * (barW + gap) - gap + 10;

    return (
        <svg className="mdash-bar-svg" viewBox={`0 0 ${totalW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
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
    const maxVal = Math.max(...data.map((d) => d.value), 1);

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

const niceStep = (rawStep) => {
    const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const fraction = rawStep / power;

    if (fraction <= 1) return 1 * power;
    if (fraction <= 2) return 2 * power;
    if (fraction <= 5) return 5 * power;
    return 10 * power;
};

const getNiceTicks = (min, max, tickCount = 5, forceZero = true) => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return { ticks: [0, 1], min: 0, max: 1 };
    }

    if (forceZero) {
        min = Math.min(0, min);
    }

    if (min === max) {
        const pad = min === 0 ? 1 : Math.abs(min * 0.1);
        min -= pad;
        max += pad;
    }

    const rawStep = (max - min) / Math.max(1, tickCount - 1);
    const step = niceStep(rawStep);

    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;

    const ticks = [];
    for (let value = niceMin; value <= niceMax + step * 0.5; value += step) {
        ticks.push(Number(value.toFixed(10)));
    }

    return {
        ticks,
        min: niceMin,
        max: niceMax,
    };
};

/**
 * TrendChart — matches DMS implementation exactly.
 * totalSlots = chosen range; months.length may be smaller.
 * Data is right-aligned into the slots.
 */
const TrendChart = ({ months, series, totalSlots }) => {
    const slots = totalSlots || months.length;
    const offset = slots - months.length;

    const allReal = [
        ...(series.valid ?? []),
        ...(series.expiring ?? []),
        ...(series.invalid ?? []),
    ].filter(v => v !== null);
    const rawMinV = allReal.length ? Math.min(...allReal) : 0;
    const rawMaxV = allReal.length ? Math.max(...allReal) : 1;

    const {
        ticks: yTicks,
        min: minV,
        max: maxV,
    } = getNiceTicks(rawMinV, rawMaxV, 5, true);
    const svgW = 400, svgH = 120, padL = 30, padR = 30, padT = 12, padB = 24;

    const pt = (val, dataIdx) => {
        const slotIdx = dataIdx + offset;
        return linePoint(val, minV, maxV, svgH, padT, padB, slotIdx, slots, svgW, padL, padR);
    };

    const buildPath = (arr) => {
        const segments = [];
        let seg = [];
        (arr ?? []).forEach((v, i) => {
            if (v !== null) {
                seg.push(pt(v, i));
            } else {
                if (seg.length > 1) segments.push(seg);
                seg = [];
            }
        });
        if (seg.length > 1) segments.push(seg);
        return segments;
    };

    const renderSeries = (arr, lineCls, dotCls) => (
        <>
            {buildPath(arr).map((seg, si) => (
                <polyline key={si} points={seg.map(p => `${p.x},${p.y}`).join(' ')} className={`mdash-line ${lineCls}`} />
            ))}
            {(arr ?? []).map((v, i) => v !== null
                ? <circle key={i} cx={pt(v, i).x} cy={pt(v, i).y} r="1.25" className={dotCls} />
                : null
            )}
        </>
    );

    return (
        <svg className="mdash-trend-svg" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
            {yTicks.map((t) => {
                if (maxV === minV) return null;
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
                const slotIdx = i + offset;
                const x = slots <= 1 ? svgW - padR : padL + (slotIdx / (slots - 1)) * (svgW - padL - padR);
                return <text key={m} x={x} y={svgH - 4} textAnchor="middle" className="mdash-axis-text-trend">{m}</text>;
            })}
            {renderSeries(series.expiring, "mdash-line--orange", "mdash-dot--orange")}
            {renderSeries(series.invalid, "mdash-line--red", "mdash-dot--red")}
            {renderSeries(series.valid, "mdash-line--green", "mdash-dot--green")}
        </svg>
    );
};

const StackedBarChart = ({ rows }) => {
    return (
        <div className="mdash-stacked-wrap">
            {rows.map((row) => {
                const total = (row.valid ?? 0) + (row.expiring ?? 0) + (row.expired ?? 0);
                const vPct = total > 0 ? ((row.valid ?? 0) / total) * 100 : 0;
                const ePct = total > 0 ? ((row.expiring ?? 0) / total) * 100 : 0;
                const xPct = total > 0 ? ((row.expired ?? 0) / total) * 100 : 0;
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
                        <span className="mdash-stacked-pct">{row.pctInvalid ?? 0}%</span>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────
// Empty table state
// ─────────────────────────────────────────────
const NoValues = ({ colSpan }) => (
    <tr>
        <td colSpan={colSpan} style={{ textAlign: "center", color: "#595959", padding: "16px 0", fontStyle: "italic" }}>
            No values
        </td>
    </tr>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const EPAMSMainDash = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    // ── Data state ──
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Trendline window selection ──
    const [trendWindow, setTrendWindow] = useState(6);

    useEffect(() => {
        const fetchDash = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.REACT_APP_URL}/api/dashboard/dashboard-epams`, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Failed");
                setDashData(data);
                console.log(data);
            } catch (err) {
                console.error("[EPAMS dashboard] fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDash();
    }, []);

    if (loading || !dashData) {
        return (
            <div
                className="dc-info-container"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
                <div className="draft-loading-vertical" aria-live="polite">
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="draft-spinner-large draft-spinner-animate"
                    />
                    <span className="draft-loading-text">
                        Loading dashboard…
                    </span>
                </div>
            </div>
        );
    }

    // ── Derived values from API response ──
    const d = dashData;

    const totalCerts = d.totalCerts ?? 0;
    const validCerts = d.validCerts ?? 0;
    const expiringCerts = d.expiringCerts ?? 0;
    const invalidCerts = d.invalidCerts ?? 0;
    const outstandingCerts = d.outstandingCerts ?? 0;
    const orgCompliance = d.orgCompliance ?? 0;

    const vsTotalCerts = d.vsTotalCerts ?? 0;
    const vsOrgCompliance = d.vsOrgCompliance ?? 0;

    // ── Delta helpers — same pattern as DMS ──
    const complianceDelta = buildDelta(vsOrgCompliance, "neutral");   // grey always
    const totalDelta = buildDelta(vsTotalCerts, "neutral");   // grey always

    const certStatusOverview = d.certStatusOverview ?? {
        valid: { count: 0, pct: 0 },
        expiring: { count: 0, pct: 0 },
        invalid: { count: 0, pct: 0 },
    };

    const siteRows = d.siteRows ?? [];
    const areaRows = d.areaRows ?? [];
    const assetTypeRows = d.assetTypeRows ?? [];
    const invalidRows = d.invalidRows ?? [];
    const expiringRows = d.expiringRows ?? [];
    const outstandingRows = d.outstandingRows ?? [];

    const compliancePerSite = d.compliancePerSite ?? [];
    const expiringBuckets = d.expiringBuckets ?? [];
    const warehousePerAssetType = d.warehousePerAssetType ?? [];

    // ── Trendline slicing ──
    const rawTrend = d.trend ?? [];
    const slicedTrend = rawTrend.slice(-trendWindow);
    const trendMonths = slicedTrend.map((t) => t.label);
    const trendSeries = {
        valid: slicedTrend.map((t) => t.valid),
        expiring: slicedTrend.map((t) => t.expiring),
        invalid: slicedTrend.map((t) => t.invalid),
    };

    // ── Site totals ──
    const siteTotals = siteRows.reduce(
        (acc, r) => ({
            total: acc.total + (r.total ?? 0),
            valid: acc.valid + (r.valid ?? 0),
            expiring: acc.expiring + (r.expiring ?? 0),
            expired: acc.expired + (r.expired ?? 0),
        }),
        { total: 0, valid: 0, expiring: 0, expired: 0 }
    );

    // ── Asset type totals ──
    const assetTotals = assetTypeRows.reduce(
        (acc, r) => ({
            total: acc.total + (r.total ?? 0),
            valid: acc.valid + (r.valid ?? 0),
            expiring: acc.expiring + (r.expiring ?? 0),
            expired: acc.expired + (r.expired ?? 0),
        }),
        { total: 0, valid: 0, expiring: 0, expired: 0 }
    );

    // ── Summary cards ──
    const summaryCards = [
        {
            id: "compliance",
            label: "ORGANISATION COMPLIANCE",
            value: `${orgCompliance}%`,
            sub: complianceDelta.label,
            subColorClass: "mdash-card--grey",   // always grey, per spec
            colorClass: "mdash-card--grey",
            skipFmt: true,
        },
        {
            id: "total",
            label: "TOTAL COMPONENT CERTIFICATES",
            value: totalCerts,
            sub: totalDelta.label,
            subColorClass: "mdash-sub--grey",    // always grey
            colorClass: "mdash-card--grey",
        },
        {
            id: "valid",
            label: "VALID COMPONENT CERTIFICATES",
            value: validCerts,
            sub: pctSub(validCerts, totalCerts),
            subColorClass: "mdash-sub--green",   // always green
            colorClass: "mdash-card--grey",
        },
        {
            id: "expiring",
            label: "EXPIRING COMPONENT CERTIFICATES",
            value: expiringCerts,
            sub: pctSub(expiringCerts, totalCerts),
            subColorClass: "mdash-sub--grey",
            colorClass: "mdash-card--orange",
        },
        {
            id: "invalid",
            label: "INVALID COMPONENT CERTIFICATES",
            value: invalidCerts,
            sub: pctSub(invalidCerts, totalCerts),
            subColorClass: "mdash-sub--grey",
            colorClass: "mdash-card--red",
        },
        {
            id: "outstanding",
            label: "OUTSTANDING COMPONENT CERTIFICATES",
            value: outstandingCerts,
            sub: "Certificates Required",
            subColorClass: "mdash-sub--grey",
            colorClass: "mdash-card--red",
        },
    ];

    // ── Warehouse horiz-bar data ──
    const horizBarData = warehousePerAssetType.slice(0, 8).map((item, i) => ({
        label: item.label,
        value: item.value,
        class: `new-bar${(i % 5) + 1}`,
    }));

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
                                Data as at: {d.dataAsAt ?? "—"}
                            </button>
                            <button className="mdash-btn mdash-btn--primary2" onClick={() => navigate('/FrontendDMS/dwDash')}>
                                Digital Warehouse Dashboard
                            </button>
                            <button className="mdash-btn mdash-btn--primary" onClick={() => exportDashboardPDF(d.dataAsAt, "EPAMS")}>
                                <FontAwesomeIcon icon={faDownload} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards ── */}
                    <div className="mdash-summary-grid">
                        {summaryCards.map((card) => (
                            <div key={card.id} className={`mdash-summary-card ${card.colorClass}`}>
                                <p className="mdash-summary-label">{card.label}</p>
                                <strong className="mdash-summary-value">
                                    {card.skipFmt ? card.value : fmt(card.value)}
                                </strong>
                                <span className={`mdash-summary-sub ${card.subColorClass}`}>{card.sub}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Row 1: Status Overview | Compliance per Site ── */}
                    <div className="mdash-grid mdash-grid--3col">

                        {/* Status Overview */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPONENTS CERTIFICATE STATUS OVERVIEW</h3>
                            </div>
                            <div className="mdash-status-layout">
                                <DonutChart data={certStatusOverview} />
                                <div className="mdash-legend-stack">
                                    {[
                                        { label: "Valid", count: certStatusOverview.valid?.count ?? 0, pct: certStatusOverview.valid?.pct ?? 0, cls: "green" },
                                        { label: "Expiring Soon", count: certStatusOverview.expiring?.count ?? 0, pct: certStatusOverview.expiring?.pct ?? 0, cls: "orange" },
                                        { label: "Expired", count: certStatusOverview.invalid?.count ?? 0, pct: certStatusOverview.invalid?.pct ?? 0, cls: "red" },
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

                        {/* Compliance per Site */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPLIANCE STATUS PER SITE</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <ComplianceBarChart data={compliancePerSite} />
                            </div>
                        </div>
                    </div>

                    {/* ── Row 2: Invalid Certs | Expiring Certs ── */}
                    <div className="mdash-grid mdash-grid--3col">

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
                                        {invalidRows.length === 0
                                            ? <NoValues colSpan={5} />
                                            : invalidRows.map((cert, i) => (
                                                <tr key={i}>
                                                    <td>{cert.component}</td>
                                                    <td style={{ textAlign: "center" }}>{cert.site}</td>
                                                    <td style={{ textAlign: "center" }}>{cert.assetType}</td>
                                                    <td style={{ textAlign: "center" }}>{cert.assetNr}</td>
                                                    <td style={{ textAlign: "center" }} className="mdash-alert-text">{cert.expiredOn}</td>
                                                </tr>
                                            ))
                                        }
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
                                        {expiringRows.length === 0
                                            ? <NoValues colSpan={6} />
                                            : expiringRows.map((cert, i) => (
                                                <tr key={i}>
                                                    <td>{cert.component}</td>
                                                    <td style={{ textAlign: "center" }}>{cert.site}</td>
                                                    <td style={{ textAlign: "center" }}>{cert.assetType}</td>
                                                    <td style={{ textAlign: "center" }}>{cert.assetNr}</td>
                                                    <td style={{ textAlign: "center" }}>{cert.expiresOn}</td>
                                                    <td style={{ textAlign: "center" }} className={cert.daysLeft <= 7 ? "mdash-alert-text" : "mdash-warn-text"}>{cert.daysLeft}</td>
                                                </tr>
                                            ))
                                        }
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
                                            <th style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--green">Valid</th>
                                            <th style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--orange">Expiring Soon</th>
                                            <th style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--red">Invalid</th>
                                            <th style={{ textAlign: "center", width: "9%" }}>% Invalid</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Total Certificates</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {siteRows.length === 0
                                            ? <NoValues colSpan={6} />
                                            : siteRows.map((row) => (
                                                <tr key={row.type} className="mdash-drilldown-row">
                                                    <td>{row.type}</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.valid)}</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.expiring)}</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.expired)}</td>
                                                    <td style={{ textAlign: "center" }}>{row.pctInvalid}%</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                    {siteRows.length > 0 && (
                                        <tfoot>
                                            <tr className="mdash-drilldown-footer">
                                                <td>Total</td>
                                                <td style={{ textAlign: "center" }}>{fmt(siteTotals.valid)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(siteTotals.expiring)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(siteTotals.expired)}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    {siteTotals.total > 0 ? Math.round((siteTotals.expired / siteTotals.total) * 100) : 0}%
                                                </td>
                                                <td style={{ textAlign: "center" }}>{fmt(siteTotals.total)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Invalid</span>
                                </div>
                                <StackedBarChart rows={siteRows} />
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
                                            <th style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--green">Valid</th>
                                            <th style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--orange">Expiring Soon</th>
                                            <th style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--red">Invalid</th>
                                            <th style={{ textAlign: "center", width: "9%" }}>% Invalid</th>
                                            <th style={{ textAlign: "center", width: "15%" }}>Total Certificates</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assetTypeRows.length === 0
                                            ? <NoValues colSpan={6} />
                                            : assetTypeRows.map((row) => (
                                                <tr key={row.type} className="mdash-drilldown-row">
                                                    <td>{row.type}</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.valid)}</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.expiring)}</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.expired)}</td>
                                                    <td style={{ textAlign: "center" }}>{row.pctInvalid}%</td>
                                                    <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                    {assetTypeRows.length > 0 && (
                                        <tfoot>
                                            <tr className="mdash-drilldown-footer">
                                                <td>Total</td>
                                                <td style={{ textAlign: "center" }}>{fmt(assetTotals.valid)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(assetTotals.expiring)}</td>
                                                <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(assetTotals.expired)}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    {assetTotals.total > 0 ? Math.round((assetTotals.expired / assetTotals.total) * 100) : 0}%
                                                </td>
                                                <td style={{ textAlign: "center" }}>{fmt(assetTotals.total)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Invalid</span>
                                </div>
                                <StackedBarChart rows={assetTypeRows} />
                                <div className="mdash-stacked-axis-labels">
                                    {["0%", "25%", "50%", "75%", "100%"].map((l) => (
                                        <span key={l}>{l}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Certificates Over Time (Trendline) ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>CERTIFICATES OVER TIME (LAST {trendWindow} {trendWindow === 1 ? "MONTH" : "MONTHS"})</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div className="mdash-inline-legend" style={{ marginBottom: 0 }}>
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
                                <select
                                    className="mdash-trend-select"
                                    value={trendWindow}
                                    onChange={(e) => setTrendWindow(Number(e.target.value))}
                                >
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                        <option key={n} value={n}>{n} Months</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mdash-chart-scroll">
                            <TrendChart
                                months={trendMonths}
                                series={trendSeries}
                                totalSlots={trendWindow}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default EPAMSMainDash;