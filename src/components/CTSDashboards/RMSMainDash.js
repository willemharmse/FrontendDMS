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
        label: "TOTAL DOCUMENTS IN DEVELOPMENT",
        value: 202,
        sub: "▲ 49 vs last month",
        subColorClass: "mdash-sub--red",
        colorClass: "mdash-card--grey",
        showInfo: true,
    },
    {
        id: "approving",
        label: "IN APPROVAL",
        value: 90,
        sub: "▲ 51 vs last month",
        subColorClass: "mdash-sub--red",
        colorClass: "mdash-card--grey",
        showInfo: true,
    },
    {
        id: "reviewing",
        label: "IN REVIEW",
        value: 102,
        sub: "- vs last month",
        subColorClass: "mdash-sub--grey",
        colorClass: "mdash-card--grey",
        showInfo: true,
    },
    {
        id: "pending",
        label: "PENDING SIGN-OFF",
        value: 10,
        sub: "- vs last month",
        subColorClass: "mdash-sub--grey",
        colorClass: "mdash-card--grey",
        showInfo: true,
    },
    {
        id: "under",
        label: "Under Periodic Review",
        value: 10,
        sub: "▼ 2 vs last month",
        subColorClass: "mdash-sub--green",
        colorClass: "mdash-card--grey",
        showInfo: true,
    },
    {
        id: "turnAround",
        label: "AVERAGE TURN AROUND TIME",
        value: "10 Days",
        sub: "",
        subColorClass: "mdash-sub--green",
        colorClass: "mdash-card--grey",
        showInfo: true,
    },
];

const DMS_CATEGORIES = [
    { name: "", count: 110 },
    { name: "", count: 110 },
    { name: "", count: 100 },
];

const DMS_EXPIRING_BUCKETS = [
    { label: "BLRA", value: 100, class: "new1-colour" },
    { label: "IBRA", value: 60, class: "new2-colour" },
    { label: "JRA", value: 42, class: "new3-colour" },
];

const DMS_STATUS_OVERVIEW = {
    underReview: { count: 10, pct: 4.96 },
    approval: { count: 96, pct: 47.52 },
    review: { count: 96, pct: 47.52 },
};

const DMS_TREND_MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"];
const DMS_TREND_SERIES = {
    underReview: [0, 5, 6, 6, 12, 10],
    approval: [20, 30, 35, 40, 39, 90],
    review: [15, 30, 60, 70, 102, 102],
};

const DDS_APPROVAL_DOCS = [
    { name: "CPS L9 Operational Transition & Handover BLRA", type: "BLRA", expiresOn: "03 Jun 2026", daysLeft: 14, owner: "T. Govender" },
    { name: "Perform UAT and Scenario Testing JRA", type: "JRA", expiresOn: "01 Jun 2026", daysLeft: 12, owner: "R. Singh" },
    { name: "Install CPS L9 Components JRA", type: "JRA", expiresOn: "29 May 2026", daysLeft: 9, owner: "L. Mokoena" },
    { name: "CPS L9 Operational Transition & Handover IBRA", type: "IBRA", expiresOn: "27 May 2026", daysLeft: 7, owner: "P. Naidoo" },
    { name: "Surface CPS L9 Implementation IBRA", type: "IBRA", expiresOn: "25 May 2026", daysLeft: 5, owner: "S. Johnson" },
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

const DonutChart = ({ data }) => {
    const { underReview, approval, review } = data;
    const total = underReview.pct + approval.pct + review.pct;
    let offset = 0;

    const segments = [
        { key: "underReview", pct: underReview.pct, cls: "mdash-donut--new1" },
        { key: "approval", pct: approval.pct, cls: "mdash-donut--new2" },
        { key: "review", pct: review.pct, cls: "mdash-donut--new3" },
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

const TrendChart = ({ months, series }) => {
    const allVals = [...series.underReview, ...series.approval, ...series.review];
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
            <polyline points={polyline(series.approval)} className="mdash-line mdash-line--new3" />
            <polyline points={polyline(series.review)} className="mdash-line mdash-line--new2" />
            <polyline points={polyline(series.underReview)} className="mdash-line mdash-line--new1" />
            {pts(series.approval).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--new3" />)}
            {pts(series.review).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--new2" />)}
            {pts(series.underReview).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.25" className="mdash-dot--new1" />)}
        </svg>
    );
};

const BarChart = ({ data }) => {
    const maxVal = Math.max(...data.map((d) => d.value));
    const svgH = 120;
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
                        <rect x={x} y={y} width={barW} height={barH} rx="0" className={`mddsash-bar ${d.class}`} />
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="mddsash-bar-value">{d.value}</text>
                        <text x={x + barW / 2} y={svgH - 6} textAnchor="middle" className="mdash-axis-text">{d.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

const RMSMainDash = () => {
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
                            <h1 className="mdash-header-title">RISK MANAGEMENT SYSTEM</h1>
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
                            <button className="mdash-btn mdash-btn--primary" onClick={() => navigate('/FrontendDMS/cmsDash')}>
                                Control Management Dashboard
                            </button>
                            <button className="mdash-btn mdash-btn--primary">
                                <FontAwesomeIcon icon={faDownload} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    <div className="mddsash-summary-grid">
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

                    <div className="mdash-grid mdash-grid--3col">

                        {/* Status Overview */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>DOCUMENT STATUS OVERVIEW</h3>
                            </div>
                            <div className="mddsash-status-layout">
                                <DonutChart data={DMS_STATUS_OVERVIEW} />
                                <div className="mdash-legend-stack">
                                    {[
                                        { label: "In Review", count: DMS_STATUS_OVERVIEW.review.count, pct: DMS_STATUS_OVERVIEW.review.pct, cls: "new2" },
                                        { label: "In Approval", count: DMS_STATUS_OVERVIEW.approval.count, pct: DMS_STATUS_OVERVIEW.approval.pct, cls: "new3" },
                                        { label: "Pending Sign-Off", count: DMS_STATUS_OVERVIEW.underReview.count, pct: DMS_STATUS_OVERVIEW.underReview.pct, cls: "new1" },
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

                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>DOCUMENTS IN DEVELOPEMENT BY TYPE</h3>
                            </div>
                            <div className="mdash-chart-scroll">
                                <BarChart data={DMS_EXPIRING_BUCKETS} />
                            </div>
                        </div>
                    </div>

                    <div className="mdash-grid mddsash-grid--3col">
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>UNDER PERIODIC REVIEW</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th style={{ textAlign: "center" }}>Type</th>
                                            <th style={{ textAlign: "center" }}>Date Initiated</th>
                                            <th style={{ textAlign: "center" }}>Days in Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DDS_APPROVAL_DOCS.map((doc) => (
                                            <tr key={doc.name}>
                                                <td>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td style={{ textAlign: "center" }}>{doc.expiresOn}</td><td
                                                    className={
                                                        doc.daysLeft < 7
                                                            ? ""
                                                            : doc.daysLeft < 10
                                                                ? "mdash-warn-text"   // orange
                                                                : "mdash-alert-text"  // red
                                                    }
                                                    style={{ textAlign: "center" }}
                                                >
                                                    {doc.daysLeft}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>PENDING SIGN-OFF</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th style={{ textAlign: "center" }}>Type</th>
                                            <th style={{ textAlign: "center" }}>Date Initiated</th>
                                            <th style={{ textAlign: "center" }}>Days in Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DDS_APPROVAL_DOCS.map((doc) => (
                                            <tr key={doc.name}>
                                                <td>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td style={{ textAlign: "center" }}>{doc.expiresOn}</td><td
                                                    className={
                                                        doc.daysLeft < 7
                                                            ? ""
                                                            : doc.daysLeft < 10
                                                                ? "mdash-warn-text"   // orange
                                                                : "mdash-alert-text"  // red
                                                    }
                                                    style={{ textAlign: "center" }}
                                                >
                                                    {doc.daysLeft}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>PENDING APPROVAL</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th style={{ textAlign: "center" }}>Type</th>
                                            <th style={{ textAlign: "center" }}>Date Initiated</th>
                                            <th style={{ textAlign: "center" }}>Days in Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DDS_APPROVAL_DOCS.map((doc) => (
                                            <tr key={doc.name}>
                                                <td>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td style={{ textAlign: "center" }}>{doc.expiresOn}</td><td
                                                    className={
                                                        doc.daysLeft < 7
                                                            ? ""
                                                            : doc.daysLeft < 10
                                                                ? "mdash-warn-text"   // orange
                                                                : "mdash-alert-text"  // red
                                                    }
                                                    style={{ textAlign: "center" }}
                                                >
                                                    {doc.daysLeft}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>PENDING REVIEW</h3>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: "gray", fontSize: "16px", marginRight: "5px" }} />
                            </div>
                            <div className="mdash-table-scroll">
                                <table className="mdash-table">
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th style={{ textAlign: "center" }}>Type</th>
                                            <th style={{ textAlign: "center" }}>Date Initiated</th>
                                            <th style={{ textAlign: "center" }}>Days in Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DDS_APPROVAL_DOCS.map((doc) => (
                                            <tr key={doc.name}>
                                                <td>{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td style={{ textAlign: "center" }}>{doc.expiresOn}</td><td
                                                    className={
                                                        doc.daysLeft < 7
                                                            ? ""
                                                            : doc.daysLeft < 10
                                                                ? "mdash-warn-text"   // orange
                                                                : "mdash-alert-text"  // red
                                                    }
                                                    style={{ textAlign: "center" }}
                                                >
                                                    {doc.daysLeft}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>DOCUMENTS OVER TIME (LAST 6 MONTHS)</h3>
                            <div className="mdash-inline-legend">
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

export default RMSMainDash;