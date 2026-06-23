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
import "./DDSMainDash.css";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt = (n) => (n ?? 0).toLocaleString("en-ZA");



// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

// Bar chart — grey bars, dynamic width based on bar count (supports up to 10)
const BarChart = ({ data }) => {
    const n = data.length;
    // Aspect ratio widens naturally: fewer bars → wider bars, more bars → narrower
    // Fixed viewBox height 200, width scales with bar count (min 320, max 520)
    const svgW = Math.max(320, Math.min(520, n * 52));
    const svgH = 180;
    const padL = 10;
    const padR = 10;
    const padB = 26;
    const padT = 18;
    const chartW = svgW - padL - padR;
    const maxVal = Math.max(...data.map((d) => d.value), 1);

    // Bar width fills ~60 % of each slot; gap fills the rest
    const slotW = chartW / n;
    const barW = Math.min(Math.floor(slotW * 0.60), 48);

    return (
        <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", width: "100%", height: "auto", minWidth: 220 }}
        >
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padT + (1 - frac) * (svgH - padT - padB);
                return <line key={i} x1={padL} x2={svgW - padR} y1={y} y2={y} className="mdash-chart-gridline" />;
            })}
            {data.map((d, i) => {
                const barH = (d.value / maxVal) * (svgH - padT - padB);
                const slotCentreX = padL + i * slotW + slotW / 2;
                const x = slotCentreX - barW / 2;
                const y = padT + (svgH - padT - padB) - barH;
                return (
                    <g key={d.label}>
                        <rect x={x} y={y} width={barW} height={barH} rx="2" className={`mddsash-bar ${d.class}`} />
                        <text x={slotCentreX} y={y - 4} textAnchor="middle" className="mddsash-bar-value">{d.value}</text>
                        <text x={slotCentreX} y={svgH - 6} textAnchor="middle" className="mddsash-axis-text">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

// Trend line chart — 3 series: valid (green), invalid (red), in-repair (yellow)
const linePoint = (val, min, max, svgH, svgPadT, svgPadB, slotIdx, totalSlots, svgW, padL, padR) => {
    const x = totalSlots <= 1 ? svgW - padR : padL + (slotIdx / (totalSlots - 1)) * (svgW - padL - padR);
    const range = max - min || 1;
    const y = svgPadT + (1 - (val - min) / range) * (svgH - svgPadT - svgPadB);
    return { x, y };
};

const TrendChart = ({ months, series, totalSlots }) => {
    const slots = totalSlots || months.length;
    const offset = slots - months.length;

    const allReal = [...series.valid, ...series.invalid, ...series.inRepair].filter(v => v !== null && v !== undefined);
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
            {/* valid = green, invalid = red, inRepair = yellow */}
            {renderSeries(series.valid, "mdash-line--trend-valid", "mdash-dot--trend-valid")}
            {renderSeries(series.invalid, "mdash-line--trend-invalid", "mdash-dot--trend-invalid")}
            {renderSeries(series.inRepair, "mdash-line--trend-inrepair", "mdash-dot--trend-inrepair")}
        </svg>
    );
};

const TABLE_FIXED_HEIGHT = { maxHeight: 220, minHeight: 80, overflowY: "auto" };

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const DWMainDash = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dash, setDash] = useState(null);
    const [trendRange, setTrendRange] = useState(6);

    useEffect(() => {
        const fetchDash = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.REACT_APP_URL}/api/dashboard/dashboard-dw`, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Failed");
                setDash(data);
            } catch (err) {
                console.error("DW dashboard fetch error:", err);
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

    const availableMonths = dash.trend.months.length;  // always 12 from the API
    const effectiveTrendRange = Math.min(trendRange, availableMonths);
    const trendOptions = availableMonths <= 1
        ? [1]
        : Array.from({ length: availableMonths }, (_, i) => i + 1);

    const buildDelta = (delta, direction = "positive-good") => {
        const value = Number(delta ?? 0);
        const abs = Math.abs(value);

        if (value === 0) {
            return {
                label: "0 vs last month",
                cls: "mdash-card--black",
            };
        }

        const arrow = value > 0 ? "▲" : "▼";

        let cls;

        if (direction === "positive-bad") {
            cls = value > 0 ? "mdash-card--red" : "mdash-card--green";
        } else {
            cls = value > 0 ? "mdash-card--green" : "mdash-card--red";
        }


        if (direction === "neutral") {
            cls = "mdsah-card--black"
        }

        return {
            label: `${arrow} ${fmt(abs)} vs last month`,
            cls,
        };
    };

    const repairDaysClass = (days) => {
        const value = Number(days ?? 0);

        if (value > 60) return "dw-repair-days--red";
        if (value >= 20) return "dw-repair-days--orange";
        if (value >= 10) return "dw-repair-days--yellow";

        return "";
    };

    const totalDelta = buildDelta(dash.summary.vsTotalComponents, "neutral");
    const validDelta = buildDelta(dash.summary.vsValidComponents, "positive-good");
    const invalidDelta = buildDelta(dash.summary.vsInValidComponents, "positive-bad");
    const repairDelta = buildDelta(dash.summary.vsComponentsInRepair, "positive-bad");

    const summaryCards = [
        {
            id: "total",
            label: "NUMBER OF COMPONENTS",
            value: dash.summary.totalComponents,
            sub: totalDelta.label,
            subColorClass: totalDelta.cls,
        },
        {
            id: "valid",
            label: "NUMBER OF VALID COMPONENTS",
            value: dash.summary.validComponents,
            sub: validDelta.label,
            subColorClass: validDelta.cls,
        },
        {
            id: "invalid",
            label: "NUMBER OF INVALID COMPONENTS",
            value: dash.summary.invalidComponents,
            sub: invalidDelta.label,
            subColorClass: invalidDelta.cls
        },
        {
            id: "repair",
            label: "COMPONENTS IN REPAIR",
            value: dash.summary.componentsInRepair,
            sub: repairDelta.label,
            subColorClass: repairDelta.cls,
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
                        <p className="logo-text-um">Digital Warehouse Dashboard</p>
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
                            <h1 className="mdash-header-title">EPA MANAGEMENT SYSTEM (DIGITAL WAREHOUSE)</h1>
                        </div>
                        <div className="mdash-header-actions">
                            <button className="mdash-btn-nc">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                Data as at: {dash.dataAsAt}
                            </button>
                            <button className="mdash-btn mdash-btn--primary" onClick={() => exportDashboardPDF(dash.dataAsAt, "DWS")}>
                                <FontAwesomeIcon icon={faDownload} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards ── */}
                    <div className="mdxmash-summary-grid">
                        {summaryCards.map((card) => (
                            <div key={card.id} className="mddsash-summary-card mdash-card--grey" style={{ position: "relative" }}>
                                <p className="mddsash-summary-label">{card.label}</p>
                                {card.value !== null && (
                                    <strong className="mddsash-summary-value">
                                        {fmt(card.value)}
                                    </strong>
                                )}
                                {card.sub && (
                                    <span className={`mddsash-summary-sub ${card.subColorClass}`}>{card.sub}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Row 1: Valid Components per Asset Type | Valid Components by Certification Body ── */}
                    <div className="mdash-grid mddsash-grid--3col">
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>VALID COMPONENTS PER ASSET TYPE</h3>
                            </div>
                            <BarChart data={dash.byAssetType} />
                        </div>
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>VALID COMPONENTS BY CERTIFICATION BODY</h3>
                            </div>
                            <BarChart data={dash.byCertBody} />
                        </div>
                    </div>

                    {/* ── Row 2: Valid Components table | Components in Repair table ── */}
                    <div className="mdash-grid mddsash-grid--3col">

                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>VALID COMPONENTS</h3>
                            </div>
                            <div className="mdash-table-scroll" style={TABLE_FIXED_HEIGHT}>
                                <table className="mdash-table">
                                    <colgroup>
                                        <col style={{ width: "42%" }} />
                                        <col style={{ width: "19%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "19%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Component</th>
                                            <th style={{ textAlign: "center" }}>Site</th>
                                            <th style={{ textAlign: "center" }}>Asset Type</th>
                                            <th style={{ textAlign: "center" }}>Certification Body</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dash.validRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "16px" }}>
                                                    No valid components
                                                </td>
                                            </tr>
                                        ) : (
                                            dash.validRows.map((row, idx) => (
                                                <tr key={`valid-${idx}`}>
                                                    <td className="mdash-td--wrap">{row.component}</td>
                                                    <td style={{ textAlign: "center" }}>{row.site}</td>
                                                    <td style={{ textAlign: "center" }}>{row.assetType}</td>
                                                    <td style={{ textAlign: "center" }}>{row.certBody}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>COMPONENTS IN REPAIR</h3>
                            </div>
                            <div className="mdash-table-scroll" style={TABLE_FIXED_HEIGHT}>
                                <table className="mdash-table">
                                    <colgroup>
                                        <col style={{ width: "34%" }} />
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "16%" }} />
                                        <col style={{ width: "16%" }} />
                                        <col style={{ width: "17%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Component</th>
                                            <th style={{ textAlign: "center" }}>Site</th>
                                            <th style={{ textAlign: "center" }}>Asset Type</th>
                                            <th style={{ textAlign: "center" }}>Asset</th>
                                            <th style={{ textAlign: "center" }}>Days in Repair</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dash.repairRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "16px" }}>
                                                    No components in repair
                                                </td>
                                            </tr>
                                        ) : (
                                            dash.repairRows.map((row, idx) => (
                                                <tr key={`repair-${idx}`}>
                                                    <td className="mdash-td--wrap">{row.component}</td>
                                                    <td style={{ textAlign: "center" }}>{row.site}</td>
                                                    <td style={{ textAlign: "center" }}>{row.assetType}</td>
                                                    <td style={{ textAlign: "center" }}>{row.asset}</td>
                                                    <td
                                                        style={{ textAlign: "center" }}
                                                        className={repairDaysClass(row.daysInRepair)}
                                                    >
                                                        {row.daysInRepair}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Trend: Components Over Time ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>
                                COMPONENTS OVER TIME (LAST {effectiveTrendRange} {effectiveTrendRange === 1 ? "MONTH" : "MONTHS"})
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div className="mdash-inline-legend" style={{ marginBottom: 0 }}>
                                    {[
                                        { label: "Valid Components", dotStyle: { background: "#7EAC89" } },
                                        { label: "Invalid Components", dotStyle: { background: "#CB6F6F" } },
                                        { label: "Components in Repair", dotStyle: { background: "#FFC000" } },
                                    ].map((item) => (
                                        <span key={item.label} className="mdash-inline-legend-item">
                                            <span
                                                className="mdash-legend-dot"
                                                style={{ ...item.dotStyle, display: "inline-block", width: 10, height: 10, borderRadius: "50%", marginRight: 4 }}
                                            />
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
                                    valid: dash.trend.valid.slice(-effectiveTrendRange),
                                    invalid: dash.trend.invalid.slice(-effectiveTrendRange),
                                    inRepair: dash.trend.inRepair.slice(-effectiveTrendRange),
                                }}
                                totalSlots={effectiveTrendRange}
                            />
                        </div>
                    </div>

                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default DWMainDash;