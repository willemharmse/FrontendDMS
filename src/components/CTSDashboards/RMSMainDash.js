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
import "./DDSMainDash.css";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt = (n) => (n ?? 0).toLocaleString("en-ZA");

const donutArc = (pct, offset) => {
    const c = 2 * Math.PI * 45;
    return { dash: (pct / 100) * c, offset: -(offset / 100) * c };
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const DonutChart = ({ data }) => {
    const { inReview, inApproval, pendingSignOff } = data;
    const total = (inReview?.pct ?? 0) + (inApproval?.pct ?? 0) + (pendingSignOff?.pct ?? 0) || 100;
    let offset = 0;
    const segments = [
        { key: "inReview", pct: inReview?.pct ?? 0, cls: "mdash-donut--new2" },
        { key: "inApproval", pct: inApproval?.pct ?? 0, cls: "mdash-donut--new3" },
        { key: "pendingSignOff", pct: pendingSignOff?.pct ?? 0, cls: "mdash-donut--new1" },
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
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const svgH = 120, barW = 36, gap = 20, padL = 10, padB = 20, padT = 20;
    const totalW = padL + data.length * (barW + gap) - gap + 10;
    return (
        <svg className="mdash-bar-svg" viewBox={`0 0 ${totalW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padT + (1 - frac) * (svgH - padT - padB);
                return <line key={i} x1={padL} x2={totalW - 4} y1={y} y2={y} className="mdash-chart-gridline" />;
            })}
            {data.map((d, i) => {
                const barH = (d.value / maxVal) * (svgH - padT - padB);
                const x = padL + i * (barW + gap);
                const y = padT + (svgH - padT - padB) - barH;
                return (
                    <g key={d.label}>
                        <rect x={x} y={y} width={barW} height={barH} rx="0" className={`mddsash-bar ${d.class}`} />
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="mddsash-bar-value">{d.value}</text>
                        <text x={x + barW / 2} y={svgH - 6} textAnchor="middle" className="mdash-axis-text">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

// ─────────────────────────────────────────────
// TrendChart
// Right-aligns data so sparse ranges end at the right edge,
// matching the DMS dashboard behaviour.
// ─────────────────────────────────────────────

const linePoint = (val, min, max, svgH, svgPadT, svgPadB, slotIdx, totalSlots, svgW, padL, padR) => {
    const x = totalSlots <= 1 ? svgW - padR : padL + (slotIdx / (totalSlots - 1)) * (svgW - padL - padR);
    const range = max - min || 1;
    const y = svgPadT + (1 - (val - min) / range) * (svgH - svgPadT - svgPadB);
    return { x, y };
};

const TrendChart = ({ months, series, totalSlots }) => {
    const slots = totalSlots || months.length;
    const offset = slots - months.length;

    const allReal = [
        ...series.inReview,
        ...series.inApproval,
        ...series.pendingSignOff,
    ].filter(v => v !== null && v !== undefined);

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
            if (v !== null && v !== undefined) {
                seg.push(pt(v, i));
            } else {
                if (seg.length > 1) segments.push(seg);
                seg = [];
            }
        });
        if (seg.length > 1) segments.push(seg);
        return segments;
    };

    const yTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

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
            {renderSeries(series.inApproval, "mdash-line--new3", "mdash-dot--new3")}
            {renderSeries(series.inReview, "mdash-line--new2", "mdash-dot--new2")}
            {renderSeries(series.pendingSignOff, "mdash-line--new1", "mdash-dot--new1")}
        </svg>
    );
};

// ─────────────────────────────────────────────
// Reusable workflow table
// ─────────────────────────────────────────────

const WorkflowTable = ({ rows, col3Label, col3Key, col4Label, col4Key, col4Class, scrollStyle }) => (
    <div className="mdash-table-scroll" style={scrollStyle}>
        <table className="mdash-table mdash-table--dds-workflow">
            <colgroup>
                <col style={{ width: "42%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
                <tr>
                    <th>Document</th>
                    <th style={{ textAlign: "center" }}>Type</th>
                    <th style={{ textAlign: "center" }}>{col3Label}</th>
                    <th style={{ textAlign: "center" }}>{col4Label}</th>
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "16px" }}>
                            No documents
                        </td>
                    </tr>
                ) : (
                    rows.map((doc, idx) => (
                        <tr key={`${doc.name}-${idx}`}>
                            <td className="mdash-td--wrap">{doc.name}</td>
                            <td style={{ textAlign: "center" }}>{doc.docType}</td>
                            <td style={{ textAlign: "center" }}>{doc[col3Key]}</td>
                            <td
                                className={col4Class ? col4Class(doc) : ""}
                                style={{ textAlign: "center" }}
                            >
                                {doc[col4Key]}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const daysClass = (val) => {
    if (val === 'N/A' || val == null) return "";
    const n = Number(val);
    if (n >= 14) return "mdash-alert-text";
    if (n >= 7) return "mdash-warn-text";
    return "";
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const RMSMainDash = () => {
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
                const res = await fetch(`${process.env.REACT_APP_URL}/api/dashboard/dashboard-rms`, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Failed");
                setDash(data);
            } catch (err) {
                console.error("RMS dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDash();
    }, []);

    if (loading || !dash) {
        return (
            <div
                className="dc-info-container"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
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

    const TABLE_FIXED_HEIGHT = { maxHeight: 220, minHeight: 220, overflowY: "auto" };

    const buildDelta = (delta, direction) => {
        const abs = Math.abs(delta);
        if (delta === 0) return { label: `0 vs last month`, cls: direction === "neutral" ? "mdash-card--grey" : "mdash-card--black" };
        const arrow = delta > 0 ? "▲" : "▼";
        const label = `${arrow} ${abs} vs last month`;
        let cls;
        if (direction === "neutral") {
            cls = "mdash-card--grey";
        } else if (direction === "positive-good") {
            cls = delta > 0 ? "mdash-card--green" : "mdash-card--red";
        } else { // positive-bad
            cls = delta > 0 ? "mdash-card--red" : "mdash-card--green";
        }
        return { label, cls };
    };

    const totalDelta = buildDelta(s.vsTotalInDev, "neutral");
    const approvalDelta = buildDelta(s.vsInApproval, "positive-bad");
    const reviewDelta = buildDelta(s.vsInReview, "positive-bad");
    const pendingDelta = buildDelta(s.vsPendingSignOff, "positive-bad");
    const periodicDelta = buildDelta(s.vsUnderPeriodicReview, "positive-bad");

    const summaryCards = [
        {
            id: "total",
            label: "TOTAL DOCUMENTS IN DEVELOPMENT",
            value: s.totalInDev,
            sub: totalDelta.label,
            subColorClass: totalDelta.cls,
        },
        {
            id: "approving",
            label: "IN APPROVAL",
            value: s.inApproval,
            sub: approvalDelta.label,
            subColorClass: approvalDelta.cls,
        },
        {
            id: "reviewing",
            label: "IN REVIEW",
            value: s.inReview,
            sub: reviewDelta.label,
            subColorClass: reviewDelta.cls,
        },
        {
            id: "pending",
            label: "PENDING SIGN-OFF",
            value: s.pendingSignOff,
            sub: pendingDelta.label,
            subColorClass: pendingDelta.cls,
        },
        {
            id: "under",
            label: "UNDER PERIODIC REVIEW",
            value: s.underPeriodicReview,
            sub: periodicDelta.label,
            subColorClass: periodicDelta.cls,
        },
        {
            id: "turnAround",
            label: "AVERAGE TURN AROUND TIME",
            value: "10 Days",
            sub: "",
            subColorClass: "mdash-card--grey",
            noFmt: true,
        },
    ];

    const statusOverview = dash.statusOverview;

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

                    {/* ── Header ── */}
                    <div className="mdash-header">
                        <div>
                            <h1 className="mdash-header-title">RISK MANAGEMENT SYSTEM</h1>
                        </div>
                        <div className="mdash-header-actions">
                            <button className="mdash-btn-nc">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                Data as at: {dash.dataAsAt}
                            </button>
                            <button className="mdash-btn mdash-btn--primary" onClick={() => navigate('/cmsDash')}>
                                Control Management Dashboard
                            </button>
                            <button className="mdash-btn mdash-btn--primary">
                                <FontAwesomeIcon icon={faDownload} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards ── */}
                    <div className="mddsash-summary-grid">
                        {summaryCards.map((card) => (
                            <div key={card.id} className="mddsash-summary-card mdash-card--grey" style={{ position: "relative" }}>
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    style={{ color: "gray", fontSize: "16px", position: "absolute", top: "12px", right: "12px" }}
                                />
                                <p className="mddsash-summary-label">{card.label}</p>
                                <strong className="mddsash-summary-value">{card.noFmt ? card.value : fmt(card.value)}</strong>
                                <span className={`mddsash-summary-sub ${card.subColorClass}`}>{card.sub}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Row 1: Status Overview | Bar Chart ── */}
                    <div className="mdash-grid mdash-grid--3col">

                        {/* Status Overview Donut */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>DOCUMENT STATUS OVERVIEW</h3>
                            </div>
                            <div className="mddsash-status-layout">
                                <DonutChart data={statusOverview} />
                                <div className="mdash-legend-stack">
                                    {[
                                        { label: "In Review", ...statusOverview.inReview, cls: "new2" },
                                        { label: "In Approval", ...statusOverview.inApproval, cls: "new3" },
                                        { label: "Pending Sign-Off", ...statusOverview.pendingSignOff, cls: "new1" },
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

                        {/* Bar Chart: By Doc Type */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>DOCUMENTS IN DEVELOPMENT BY TYPE</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <BarChart data={dash.byDocType} />
                            </div>
                        </div>
                    </div>

                    {/* ── Row 2: Four workflow tables ── */}
                    <div className="mdash-grid mddsash-grid--3col">

                        {/* Under Periodic Review */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>UNDER PERIODIC REVIEW</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <WorkflowTable
                                rows={dash.periodicReviewRows}
                                col3Label="Date Initiated"
                                col3Key="dateInitiated"
                                col4Label="Days in Progress"
                                col4Key="daysInProgress"
                                col4Class={(row) => daysClass(row.daysInProgress)}
                                scrollStyle={TABLE_FIXED_HEIGHT}
                            />
                        </div>

                        {/* Pending Sign-Off */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>PENDING SIGN-OFF</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <WorkflowTable
                                rows={dash.pendingSignOffRows}
                                col3Label="Date Published"
                                col3Key="datePublished"
                                col4Label="Days Waiting"
                                col4Key="daysWaiting"
                                col4Class={(row) => daysClass(row.daysWaiting)}
                                scrollStyle={TABLE_FIXED_HEIGHT}
                            />
                        </div>

                        {/* Pending Approval */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>PENDING APPROVAL</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <WorkflowTable
                                rows={dash.inApprovalRows}
                                col3Label="Date Initiated"
                                col3Key="dateInitiated"
                                col4Label="Days in Progress"
                                col4Key="daysInProgress"
                                col4Class={(row) => daysClass(row.daysInProgress)}
                                scrollStyle={TABLE_FIXED_HEIGHT}
                            />
                        </div>

                        {/* Pending Review */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>PENDING REVIEW</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <WorkflowTable
                                rows={dash.inReviewRows}
                                col3Label="Date Initiated"
                                col3Key="dateInitiated"
                                col4Label="Days in Progress"
                                col4Key="daysInProgress"
                                col4Class={(row) => daysClass(row.daysInProgress)}
                                scrollStyle={TABLE_FIXED_HEIGHT}
                            />
                        </div>
                    </div>

                    {/* ── Trend: Documents Over Time ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>
                                DOCUMENTS OVER TIME (LAST {effectiveTrendRange} {effectiveTrendRange === 1 ? "MONTH" : "MONTHS"})
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div className="mdash-inline-legend" style={{ marginBottom: 0 }}>
                                    {[
                                        { label: "In Review", cls: "new2" },
                                        { label: "In Approval", cls: "new3" },
                                        { label: "Pending Sign-Off", cls: "new1" },
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
                                    inReview: dash.trend.inReview.slice(-effectiveTrendRange),
                                    inApproval: dash.trend.inApproval.slice(-effectiveTrendRange),
                                    pendingSignOff: dash.trend.pendingSignOff.slice(-effectiveTrendRange),
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

export default RMSMainDash;