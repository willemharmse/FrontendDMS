import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCaretLeft,
    faCaretRight,
    faArrowLeft,
    faDownload,
    faCalendarAlt,
    faInfoCircle,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import TopBar from "../Notifications/TopBar";
import TopBarDD from "../Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../../utils/auth";
import { ToastContainer } from "react-toastify";
import { exportDashboardPDF } from "./exportDashboardPDF";
import InfoPopupDash from "./InfoPopupDash";
import "./DDSMainDash.css";
import InfoPopupDashControl from "./InfoPopupDashControl";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt = (n) => (n ?? 0).toLocaleString("en-ZA");

const getCategoryClass = (q) => {
    switch (q) {
        case "< 30%": return "category-low";
        case "30-59%": return "category-medium";
        case "60-90%": return "category-high";
        case "> 90%": return "category-complete";
        default: return "";
    }
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

// Single shared bar chart component. Both charts use an identical fixed viewBox
// width so their aspect ratio — and therefore their rendered height — is always
// the same, regardless of how many bars each chart contains.
const FIXED_SVG_W = 380;

const BarChart = ({ data }) => {
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const svgH = 215;
    const padL = 10;
    const padR = 10;
    const padB = 20;
    const padT = 20;
    const chartW = FIXED_SVG_W - padL - padR;
    const n = data.length;
    // Bars fill the fixed canvas evenly: 55 % of each slot is bar, 45 % is gap
    const slotW = chartW / n;
    const barW = Math.floor(slotW * 0.55);
    const gap = slotW - barW;

    return (
        <svg className="mdash-bar-svg" viewBox={`0 0 ${FIXED_SVG_W} ${svgH}`} preserveAspectRatio="xMidYMid meet">
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padT + (1 - frac) * (svgH - padT - padB);
                return <line key={i} x1={padL} x2={FIXED_SVG_W - padR} y1={y} y2={y} className="mdash-chart-gridline" />;
            })}
            {data.map((d, i) => {
                const barH = (d.value / maxVal) * (svgH - padT - padB);
                const x = padL + i * slotW + (slotW - barW) / 2; // centre bar in its slot
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

// Trend line chart
const linePoint = (val, min, max, svgH, svgPadT, svgPadB, slotIdx, totalSlots, svgW, padL, padR) => {
    const x = totalSlots <= 1 ? svgW - padR : padL + (slotIdx / (totalSlots - 1)) * (svgW - padL - padR);
    const range = max - min || 1;
    const y = svgPadT + (1 - (val - min) / range) * (svgH - svgPadT - svgPadB);
    return { x, y };
};

const TrendChart = ({ months, series, totalSlots }) => {
    const slots = totalSlots || months.length;
    const offset = slots - months.length;

    const allReal = [...series.added, ...series.updated].filter(v => v !== null && v !== undefined);
    const minV = allReal.length ? Math.min(...allReal) : 0;
    const maxV = allReal.length ? Math.max(...allReal, 1) : 1;
    const svgW = 400, svgH = 140, padL = 30, padR = 30, padT = 12, padB = 24;

    const pt = (val, dataIdx) => {
        const slotIdx = dataIdx + offset;
        return linePoint(val, minV, maxV, svgH, padT, padB, slotIdx, slots, svgW, padL, padR);
    };

    const buildPath = (arr) => {
        const segments = [];
        let seg = [];
        arr.forEach((v, i) => {
            if (v !== null && v !== undefined) { seg.push(pt(v, i)); }
            else { if (seg.length > 1) segments.push(seg); seg = []; }
        });
        if (seg.length > 1) segments.push(seg);
        return segments;
    };

    // Dynamic y-axis ticks: ~5 clean round numbers spanning [0, maxV]
    const rawStep = maxV / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1;
    const yTicks = Array.from({ length: Math.ceil(maxV / niceStep) + 1 }, (_, i) => i * niceStep);

    const renderSeries = (arr, lineCls, dotCls) => (
        <>
            {buildPath(arr).map((seg, si) => (
                <polyline key={si} points={seg.map(p => `${p.x},${p.y}`).join(" ")} className={`mdash-line ${lineCls}`} />
            ))}
            {arr.map((v, i) => (v !== null && v !== undefined)
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
            {renderSeries(series.added, "mdash-line--new5", "mdash-dot--new5")}
            {renderSeries(series.updated, "mdash-line--new4", "mdash-dot--new4")}
        </svg>
    );
};

// Fixed-height scrollable table (matches DDS pattern)
const TABLE_FIXED_HEIGHT = { maxHeight: 220, minHeight: 80, overflowY: "auto" };

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const CMMainDash = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dash, setDash] = useState(null);
    const [trendRange, setTrendRange] = useState(6);

    // ── Info popup states — one per summary tile ──────────────────────────────
    const [infoTotal, setInfoTotal] = useState(false);
    const [infoCritical, setInfoCritical] = useState(false);
    const [infoConcern, setInfoConcern] = useState(false);
    const [infoMonitor, setInfoMonitor] = useState(false);
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchDash = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.REACT_APP_URL}/api/dashboard/dashboard-cmm`, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Failed");
                setDash(data);
            } catch (err) {
                console.error("CMM dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDash();
    }, []);

    if (loading || !dash) {
        return (
            <div className="dc-info-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="draft-loading-vertical" aria-live="polite">
                    <FontAwesomeIcon icon={faSpinner} className="draft-spinner-large draft-spinner-animate" />
                    <span className="draft-loading-text">Loading dashboard…</span>
                </div>
            </div>
        );
    }

    const s = dash.summary;
    const availableMonths = dash.trend.months.length;
    const effectiveTrendRange = Math.min(trendRange, availableMonths);
    const trendOptions = availableMonths === 1
        ? [1]
        : Array.from({ length: Math.min(availableMonths, 12) - 1 }, (_, i) => i + 2);

    const summaryCards = [
        {
            id: "total",
            label: "TOTAL CONTROLS IN SYSTEM",
            value: s.total,
            sub: s.deltaTotal.label,
            subColorClass: s.deltaTotal.cls,
            onInfo: () => setInfoTotal(true),
        },
        {
            id: "critical",
            label: "CRITICAL CONTROLS",
            value: s.critical,
            sub: s.deltaCritical.label,
            subColorClass: s.deltaCritical.cls,
            onInfo: () => setInfoCritical(true),
        },
        {
            id: "concern",
            label: "CONTROLS OF CONCERN",
            value: s.concern,
            sub: s.deltaConcern.label,
            subColorClass: s.deltaConcern.cls,
            onInfo: () => setInfoConcern(true),
        },
        {
            id: "monitor",
            label: "CONTROLS TO MONITOR",
            value: s.monitor,
            sub: s.deltaMonitor.label,
            subColorClass: s.deltaMonitor.cls,
            onInfo: () => setInfoMonitor(true),
        },
    ];

    return (
        <div className="dc-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Control Management Dashboard</p>
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

                    {/* ── Header ── */}
                    <div className="mdash-header">
                        <div>
                            <h1 className="mdash-header-title">RISK MANAGEMENT SYSTEM (CONTROL MANAGEMENT)</h1>
                        </div>
                        <div className="mdash-header-actions">
                            <button className="mdash-btn-nc">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                Data as at: {dash.dataAsAt}
                            </button>
                            <button className="mdash-btn mdash-btn--primary" onClick={() => exportDashboardPDF(dash.dataAsAt, "CMM")}>
                                <FontAwesomeIcon icon={faDownload} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards ── */}
                    <div className="mdxmash-summary-grid">
                        {summaryCards.map((card) => (
                            <div key={card.id} className="mddsash-summary-card mdash-card--grey" style={{ position: "relative" }}>
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    style={{ color: "gray", fontSize: "16px", position: "absolute", top: "12px", right: "12px", cursor: "pointer" }}
                                    onClick={card.onInfo}
                                />
                                <p className="mddsash-summary-label">{card.label}</p>
                                <strong className="mddsash-summary-value">{fmt(card.value)}</strong>
                                <span className={`mddsash-summary-sub ${card.subColorClass}`}>{card.sub}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Row 1: Controls by Hierarchy | Controls by Quality ── */}
                    <div className="mdash-grid mddsash-grid--3col">
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>CONTROLS BY HIERARCHY</h3>
                            </div>
                            <BarChart data={dash.byHierarchy} />
                        </div>
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>CONTROLS BY QUALITY RATING</h3>
                            </div>
                            <BarChart data={dash.byQuality} />
                        </div>
                    </div>

                    {/* ── Row 2: Critical Controls table | Control Attention table ── */}
                    <div className="mdash-grid mddsash-grid--3col">

                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>CRITICAL CONTROLS</h3>
                            </div>
                            <div className="mdash-table-scroll" style={TABLE_FIXED_HEIGHT}>
                                <table className="mdash-table">
                                    <colgroup>
                                        <col style={{ width: "55%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "25%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Control</th>
                                            <th style={{ textAlign: "center" }}>Category</th>
                                            <th style={{ textAlign: "center" }}>Control Quality</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dash.criticalRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "16px" }}>
                                                    No critical controls
                                                </td>
                                            </tr>
                                        ) : (
                                            dash.criticalRows.map((doc, idx) => (
                                                <tr key={`crit-${idx}`}>
                                                    <td className="mdash-td--wrap">{doc.name}</td>
                                                    <td style={{ textAlign: "center" }}>{doc.category}</td>
                                                    <td style={{ textAlign: "center" }} className={getCategoryClass(doc.quality)}>
                                                        {doc.quality}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>CONTROL ATTENTION OVERVIEW</h3>
                            </div>
                            <div className="mdash-table-scroll" style={TABLE_FIXED_HEIGHT}>
                                <table className="mdash-table">
                                    <colgroup>
                                        <col style={{ width: "44%" }} />
                                        <col style={{ width: "16%" }} />
                                        <col style={{ width: "16%" }} />
                                        <col style={{ width: "24%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Control</th>
                                            <th style={{ textAlign: "center" }}>Category</th>
                                            <th style={{ textAlign: "center" }}>Critical</th>
                                            <th style={{ textAlign: "center" }}>Control Quality</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dash.attentionRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "16px" }}>
                                                    No controls requiring attention
                                                </td>
                                            </tr>
                                        ) : (
                                            dash.attentionRows.map((doc, idx) => (
                                                <tr key={`att-${idx}`}>
                                                    <td className="mdash-td--wrap">{doc.name}</td>
                                                    <td style={{ textAlign: "center" }}>{doc.category}</td>
                                                    <td style={{ textAlign: "center" }}>{doc.critical}</td>
                                                    <td style={{ textAlign: "center" }} className={getCategoryClass(doc.quality)}>
                                                        {doc.quality}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Trend: Controls Over Time ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>
                                CONTROLS OVER TIME (LAST {effectiveTrendRange} {effectiveTrendRange === 1 ? "MONTH" : "MONTHS"})
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div className="mdash-inline-legend" style={{ marginBottom: 0 }}>
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
                                <select
                                    className="mdash-trend-select"
                                    value={effectiveTrendRange}
                                    onChange={(e) => setTrendRange(Number(e.target.value))}
                                >
                                    {trendOptions.map((n) => (
                                        <option key={n} value={n}>
                                            {n} {n === 1 ? "Month" : "Months"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mdash-chart-scroll">
                            <TrendChart
                                months={dash.trend.months.slice(-effectiveTrendRange)}
                                series={{
                                    added: dash.trend.added.slice(-effectiveTrendRange),
                                    updated: dash.trend.updated.slice(-effectiveTrendRange),
                                }}
                                totalSlots={effectiveTrendRange}
                            />
                        </div>
                    </div>

                </div>
            </div>
            <ToastContainer />

            {/* ── Info Popups — one per info button ───────────────────────────────── */}
            {infoTotal && (
                <InfoPopupDashControl
                    type="totalControls"
                    title="Total Controls in System"
                    setClose={() => setInfoTotal(false)}
                />
            )}

            {infoCritical && (
                <InfoPopupDashControl
                    type="criticalControls"
                    title="Critical Controls"
                    setClose={() => setInfoCritical(false)}
                />
            )}

            {infoConcern && (
                <InfoPopupDashControl
                    type="controlsOfConcern"
                    title="Controls of Concern"
                    setClose={() => setInfoConcern(false)}
                />
            )}

            {infoMonitor && (
                <InfoPopupDashControl
                    type="controlsToMonitor"
                    title="Controls to Monitor"
                    setClose={() => setInfoMonitor(false)}
                />
            )}
            {/* ─────────────────────────────────────────────────────────────────────── */}
        </div>
    );
};

export default CMMainDash;