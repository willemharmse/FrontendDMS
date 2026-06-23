import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCaretLeft,
    faCaretRight,
    faArrowLeft,
    faDownload,
    faCalendarAlt,
    faFilter,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import TopBar from "../Notifications/TopBar";
import TopBarDD from "../Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../../utils/auth";
import { ToastContainer } from "react-toastify";
import "./DMSMainDash.css";
import { exportDashboardPDF } from "./exportDashboardPDF";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt = (n) => (n ?? 0).toLocaleString("en-ZA");

const donutArc = (pct, offset) => {
    const c = 2 * Math.PI * 45;
    return { dash: (pct / 100) * c, offset: -(offset / 100) * c };
};

const linePoint = (val, min, max, svgH, svgPadT, svgPadB, idx, total, svgW, padL, padR) => {
    const x = total <= 1 ? svgW - padR : padL + (idx / (total - 1)) * (svgW - padL - padR);
    const range = max - min || 1;
    const y = svgPadT + (1 - (val - min) / range) * (svgH - svgPadT - svgPadB);
    return { x, y };
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const DonutChart = ({ data }) => {
    const { critical, high, medium, low, uncategorized } = data;
    let offset = 0;
    const segments = [
        { key: "critical", pct: critical.pct, cls: "mdash-donut--red" },
        { key: "high", pct: high.pct, cls: "mdash-donut--orange" },
        { key: "medium", pct: medium.pct, cls: "mdash-donut--yellow" },
        { key: "low", pct: low.pct, cls: "mdash-donut--green" },
        { key: "uncategorized", pct: uncategorized.pct, cls: "mdash-donut--grey" },
    ];
    return (
        <svg className="mdash-donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="45" fill="none" stroke="#eff3f8" strokeWidth="22" />
            {segments.map((s) => {
                const { dash: dashLen, offset: dashOff } = donutArc(s.pct, offset);
                const c = 2 * Math.PI * 45;
                const el = (
                    <circle key={s.key} cx="60" cy="60" r="45" fill="none" strokeWidth="22"
                        strokeDasharray={`${dashLen} ${c - dashLen}`} strokeDashoffset={dashOff}
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

// Bar chart — mirrors DWMainDash: expects { label, value, class } per item
const BarChart = ({ data }) => {
    const n = data.length;
    const svgW = Math.max(320, Math.min(520, n * 52));
    const svgH = 205;
    const padL = 10, padR = 10, padB = 26, padT = 18;
    const chartW = svgW - padL - padR;
    const maxVal = Math.max(...data.map((d) => d.value), 1);
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

// TrendChart — right-aligns data so sparse ranges end at the right edge
const TrendChart = ({ months, series, totalSlots }) => {
    // totalSlots = the chosen range (1/2/3/6/12); months.length may be smaller
    // if the system has fewer months of data. We always render `slots` positions
    // spaced evenly, and the actual data is right-aligned into those slots.
    const slots = totalSlots || months.length;
    const offset = slots - months.length; // how many empty slots on the left

    const allReal = [
        ...(series.overdue ?? []),
        ...(series.open ?? []),
    ].filter(v => v !== null);
    const rawMinV = allReal.length ? Math.min(...allReal) : 0;
    const rawMaxV = allReal.length ? Math.max(...allReal) : 1;

    const {
        ticks: yTicks,
        min: minV,
        max: maxV,
    } = getNiceTicks(rawMinV, rawMaxV, 5, true);
    const svgW = 400, svgH = 120, padL = 30, padR = 30, padT = 12, padB = 24;

    // Map a data index (0..months.length-1) to an x position using the full `slots` span
    const pt = (val, dataIdx) => {
        const slotIdx = dataIdx + offset;
        return linePoint(val, minV, maxV, svgH, padT, padB, slotIdx, slots, svgW, padL, padR);
    };

    // Build polyline segments through consecutive non-null points
    const buildPath = (arr) => {
        const segments = [];
        let seg = [];
        arr.forEach((v, i) => {
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
            {arr.map((v, i) => v !== null
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
            {renderSeries(series.overdue, "mdash-line--red", "mdash-dot--red")}
            {renderSeries(series.open, "mdash-line--grey", "mdash-dot--grey")}
        </svg>
    );
};

const StackedBarChart = ({ rows }) => (
    <div className="mdash-stacked-wrap">
        {rows.map((row) => {
            const total = row.valid + row.expiring + row.expired || 1;
            const vPct = (row.valid / total) * 100;
            const ePct = (row.expiring / total) * 100;
            const xPct = (row.expired / total) * 100;
            return (
                <div key={row.type} className="mdash-stacked-row">
                    <span className="mdash-stacked-label">{row.type}</span>
                    <div className="mdash-stacked-bar">
                        <div className="mdash-seg mdash-seg--valid" style={{ width: `${vPct}%` }}>{vPct > 8 && <span>{row.valid}</span>}</div>
                        <div className="mdash-seg mdash-seg--expiring" style={{ width: `${ePct}%` }}>{ePct > 5 && <span>{row.expiring}</span>}</div>
                        <div className="mdash-seg mdash-seg--expired" style={{ width: `${xPct}%` }}>{xPct > 5 && <span>{row.expired}</span>}</div>
                    </div>
                    <span className="mdash-stacked-pct">{row.pctExpired}%</span>
                </div>
            );
        })}
    </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const CTSMainDash = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dash, setDash] = useState(null);
    const [trendRange, setTrendRange] = useState(6);

    // ── Excel-style filter state ──────────────────────────────────────────
    const BLANK = "(Blanks)";

    const [excelFilter, setExcelFilter] = useState({
        open: false,
        tableId: null,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    const DEFAULT_SORT = { colId: null, direction: "asc" };
    const [expiredFilters, setExpiredFilters] = useState({});
    const [expiredSort, setExpiredSort] = useState(DEFAULT_SORT);
    const [expiringSoonFilters, setExpiringSoonFilters] = useState({});
    const [expiringSoonSort, setExpiringSoonSort] = useState(DEFAULT_SORT);
    const [typeFilters, setTypeFilters] = useState({});
    const [typeSort, setTypeSort] = useState(DEFAULT_SORT);
    const [discFilters, setDiscFilters] = useState({});
    const [discSort, setDiscSort] = useState(DEFAULT_SORT);

    const getCellValue = (row, colId) => {
        const v = row[colId];
        if (v == null || String(v).trim() === "") return BLANK;
        return String(v).trim();
    };

    const applyFiltersAndSort = (rows, filters, sort) => {
        let result = [...rows];
        for (const [colId, selected] of Object.entries(filters)) {
            if (!Array.isArray(selected)) continue;

            if (selected.length === 0) {
                result = [];
                break;
            }

            result = result.filter(row => selected.includes(getCellValue(row, colId)));
        }
        if (sort.colId) {
            const dir = sort.direction === "desc" ? -1 : 1;
            result.sort((a, b) => {
                const av = getCellValue(a, sort.colId);
                const bv = getCellValue(b, sort.colId);
                if (av === BLANK && bv !== BLANK) return 1;
                if (av !== BLANK && bv === BLANK) return -1;
                const an = parseFloat(av.replace(/,/g, ""));
                const bn = parseFloat(bv.replace(/,/g, ""));
                if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
                return av.localeCompare(bv, undefined, { sensitivity: "base", numeric: true }) * dir;
            });
        }
        return result;
    };

    const getAvailableOptions = (rows, allFilters, colId) => {
        let filtered = [...rows];
        for (const [fColId, selected] of Object.entries(allFilters)) {
            if (fColId === colId) continue;
            if (!Array.isArray(selected) || selected.length === 0) continue;
            filtered = filtered.filter(row => selected.includes(getCellValue(row, fColId)));
        }
        const vals = Array.from(new Set(filtered.map(row => getCellValue(row, colId))));
        return vals.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    };

    const openExcelFilterPopup = (tableId, colId, e) => {
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();
        const filtersMap = tableId === "expired" ? expiredFilters : tableId === "expiringSoon" ? expiringSoonFilters : tableId === "byType" ? typeFilters : discFilters;
        const rowsMap = tableId === "expired" ? (dash?.recentlyExpired || []) : tableId === "expiringSoon" ? (dash?.expiringSoon || []) : tableId === "byType" ? (dash?.byType || []) : (dash?.byDiscipline || []);
        const values = getAvailableOptions(rowsMap, filtersMap, colId);
        const existing = filtersMap[colId];
        const initialSelected = new Set(Array.isArray(existing) ? existing : values);
        setExcelSelected(initialSelected);
        setExcelSearch("");
        setExcelFilter({
            open: true,
            tableId,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(220, rect.width),
            },
        });
    };

    const toggleSort = (tableId, colId, direction) => {
        const setter = tableId === "expired" ? setExpiredSort : tableId === "expiringSoon" ? setExpiringSoonSort : tableId === "byType" ? setTypeSort : setDiscSort;
        setter(prev =>
            prev.colId === colId && prev.direction === direction
                ? DEFAULT_SORT
                : { colId, direction }
        );
    };

    useEffect(() => {
        if (!excelFilter.open) return;
        const excelSelector = '.excel-filter-popup';

        const handleClickOutside = (e) => {
            if (!e.target.closest(".excel-filter-popup")) {
                setExcelFilter(prev => ({ ...prev, open: false }));
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(excelSelector);
            if (!isInsidePopup) {
                setExcelFilter(prev => ({ ...prev, open: false }));
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [excelFilter.open]);

    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;
        const popupRect = el.getBoundingClientRect();
        const vW = window.innerWidth, vH = window.innerHeight, margin = 8;
        let newTop = excelFilter.pos.top, newLeft = excelFilter.pos.left;
        if (popupRect.bottom > vH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) newTop = Math.max(margin, anchor.top - popupRect.height - 4);
        }
        if (popupRect.right > vW - margin) newLeft = Math.max(margin, newLeft - (popupRect.right - (vW - margin)));
        if (popupRect.left < margin) newLeft = margin;
        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top: newTop, left: newLeft } }));
        }
    }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left]);

    const FilterTh = ({ tableId, colId, style, children, className }) => {
        const filtersMap =
            tableId === "expired"
                ? expiredFilters
                : tableId === "expiringSoon"
                    ? expiringSoonFilters
                    : tableId === "byType"
                        ? typeFilters
                        : discFilters;

        const sortMap =
            tableId === "expired"
                ? expiredSort
                : tableId === "expiringSoon"
                    ? expiringSoonSort
                    : tableId === "byType"
                        ? typeSort
                        : discSort;

        const isFiltered = Array.isArray(filtersMap[colId]);
        const isSorted = sortMap.colId === colId;

        return (
            <th
                style={{ ...style, cursor: "pointer", userSelect: "none" }}
                className={className}
                onClick={(e) => openExcelFilterPopup(tableId, colId, e)}
            >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {children}

                    {(isFiltered || isSorted) && (
                        <FontAwesomeIcon
                            icon={faFilter}
                            style={{
                                fontSize: 9,
                                color: "#000",
                                flexShrink: 0
                            }}
                        />
                    )}
                </span>
            </th>
        );
    };

    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.REACT_APP_URL}/api/dashboard/dashboard-cts`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setDash(data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("CTS dashboard fetch failed:", err);
                }
            } finally {
                setLoading(false);
            }
        })();
        return () => controller.abort();
    }, []);

    // Clamp trendRange to the number of months actually returned by the backend
    useEffect(() => {
        if (dash?.trend?.months?.length) {
            setTrendRange((prev) => Math.min(prev, dash.trend.months.length));
        }
    }, [dash]);

    if (loading || !dash) {
        return (
            <div
                className="dc-info-container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
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

    const s = dash.summary;

    // ── Filtered / sorted data ────────────────────────────────────────────
    const normalizeUncategorized = (rows) =>
        rows.map(r => ({ ...r, type: (!r.type || r.type === '—') ? 'Uncategorised' : r.type }));

    const sortUncategorizedFirst = (rows) =>
        [...rows].sort((a, b) => {
            if (a.type === 'Uncategorised') return -1;
            if (b.type === 'Uncategorised') return 1;
            return 0;
        });

    const filteredExpired = applyFiltersAndSort(dash.recentlyExpired, expiredFilters, expiredSort);
    const filteredExpiringSoon = applyFiltersAndSort(dash.expiringSoon, expiringSoonFilters, expiringSoonSort);
    const filteredByType = sortUncategorizedFirst(normalizeUncategorized(applyFiltersAndSort(dash.byType, typeFilters, typeSort)));
    const filteredByDisc = sortUncategorizedFirst(normalizeUncategorized(applyFiltersAndSort(dash.byDiscipline, discFilters, discSort)));

    // ── Delta helper ──────────────────────────────────────────────────────
    // direction: "positive-good"  → up=green, down=red  (valid)
    // direction: "positive-bad"   → up=red,   down=green (expiring/expired)
    // direction: "neutral"        → always grey (total, owners)
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

    const totalDelta = buildDelta(s.vsLastMonth, "neutral");
    const overdueDelta = buildDelta(s.vsExpiredLastMonth, "positive-bad");
    const expiringDelta = buildDelta(s.vsExpiringSoon, "positive-bad");
    const closeoutDelta = buildDelta(s.vsValidLastMonth, "positive-bad");

    const summaryCards = [
        {
            id: "open",
            label: "OPEN TASKS",
            value: s.total,
            sub: totalDelta.label,
            subColorClass: totalDelta.cls,
            colorClass: "mdash-card--grey",
        },
        {
            id: "overdue",
            label: "OVERDUE TASKS",
            value: s.expired,
            sub: overdueDelta.label,
            subColorClass: overdueDelta.cls,
            colorClass: "mdash-card--grey",
        },
        {
            id: "due",
            label: "TASKS DUE THIS WEEK",
            value: s.expiringSoon,
            sub: expiringDelta.label,
            subColorClass: expiringDelta.cls,
            colorClass: "mdash-card--grey",
        },
        {
            id: "closeout",
            label: "TASKS REQUIRING CLOSE OUT",
            value: s.valid,
            sub: closeoutDelta.label,
            subColorClass: closeoutDelta.cls,
            colorClass: "mdash-card--grey",
        },
    ];

    const statusOverview = {
        critical: { count: s.critical, pct: s.pctCritical },
        high: { count: s.high, pct: s.pctHigh },
        medium: { count: s.medium, pct: s.pctMedium },
        low: { count: s.low, pct: s.pctLow },
        uncategorized: { count: s.uncategorized ?? 0, pct: s.pctUncategorized ?? 0 },
    };

    // Drilldown totals
    const calcTotals = (rows) => rows.reduce(
        (acc, r) => ({
            total: acc.total + r.total,
            valid: acc.valid + r.valid,
            expiring: acc.expiring + r.expiring,
            expired: acc.expired + r.expired
        }),
        { total: 0, valid: 0, expiring: 0, expired: 0 }
    );

    const typeTotals = calcTotals(filteredByType);
    const discTotals = calcTotals(filteredByDisc);

    const overallPctExpired = typeTotals.total > 0
        ? Math.round((typeTotals.expired / typeTotals.total) * 100)
        : 0;

    const TABLE_FIXED_HEIGHT = { maxHeight: 220, minHeight: 220, overflowY: "auto" };

    return (
        <div className="dc-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">CTS Dashboard</p>
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
                            <h1 className="mdash-header-title">COMPLIANCE TRACKING SYSTEM</h1>
                        </div>
                        <div className="mdash-header-actions">
                            <button className="mdash-btn-nc">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                Data as at: {dash.dataAsAt}
                            </button>
                            <button className="mdash-btn mdash-btn--primary" onClick={() => exportDashboardPDF(dash.dataAsAt, "CTS")}>
                                <FontAwesomeIcon icon={faDownload} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards ── */}
                    <div className="mdxmash-summary-grid">
                        {summaryCards.map((card) => (
                            <div key={card.id} className={`mdash-summary-card ${card.colorClass}`}>
                                <p className="mdash-summary-label">{card.label}</p>
                                <strong className="mdash-summary-value">
                                    {card.noFmt ? card.value : fmt(card.value)}
                                </strong>
                                {card.sub && (
                                    <span className={`mdash-summary-sub ${card.subColorClass || ""}`}>{card.sub}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Row 1: Status | Bar ── */}
                    <div className="mdash-grid mdash-grid--3col">

                        {/* Status Overview */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>OUTSTANDING TASKS BY PRIORITY</h3>
                            </div>
                            <div className="mdash-status-layout">
                                <DonutChart data={statusOverview} />
                                <div className="mdash-legend-stack">
                                    {[
                                        { label: "Critical", ...statusOverview.critical, cls: "red" },
                                        { label: "High", ...statusOverview.high, cls: "orange" },
                                        { label: "Medium", ...statusOverview.medium, cls: "yellow" },
                                        { label: "Low", ...statusOverview.low, cls: "green" },
                                        { label: "Uncategorised", ...statusOverview.uncategorized, cls: "grey" },
                                    ].filter((item) => item.label !== "Uncategorised" || item.count > 0).map((item) => (
                                        <div key={item.label} className="mdash-legend-row">
                                            <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                            <span className="mdash-legend-text">{item.label}</span>
                                            <strong className="mdash-legend-count">{fmt(item.count)} ({item.pct}%)</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Due For Review Bar */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>TASKS BY TASK TYPE</h3>
                            </div>
                            <BarChart data={dash.expiringBuckets} />
                        </div>
                    </div>

                    {/* ── Row 2: Review Overdue table | Due For Review table ── */}
                    <div className="mdash-grid mdash-grid--3col">

                        {/* Recently Review Overdue — fixed height, scrollable, latest first */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>OVERDUE TASKS</h3>
                            </div>
                            <div className="mdash-table-scroll" style={TABLE_FIXED_HEIGHT}>
                                <table className="mdash-table">
                                    <colgroup>
                                        <col style={{ width: "30%" }} />
                                        <col style={{ width: "18%" }} />
                                        <col style={{ width: "18%" }} />
                                        <col style={{ width: "22%" }} />
                                        <col style={{ width: "15%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <FilterTh tableId="expired" colId="name">Title</FilterTh>
                                            <FilterTh tableId="expired" colId="type" style={{ textAlign: "center" }}>Type</FilterTh>
                                            <FilterTh tableId="expired" colId="area" style={{ textAlign: "center" }}>Area</FilterTh>
                                            <FilterTh tableId="expired" colId="dueDate" style={{ textAlign: "center" }}>Due Date</FilterTh>
                                            <FilterTh tableId="expired" colId="daysLeft" style={{ textAlign: "center" }}>Days Overdue</FilterTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpired.map((doc, i) => (
                                            <tr key={i}>
                                                <td className="mdash-td--wrap">{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td style={{ textAlign: "center" }} >{doc.area}</td>
                                                <td style={{ textAlign: "center" }}>{doc.dueDate}</td>
                                                <td
                                                    className="mdash-alert-text"
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

                        {/* Due For Review — fixed height, scrollable, closest first */}
                        <div className="mdash-panel">
                            <div className="mdash-panel-header">
                                <h3>TASKS DUE SOON</h3>
                            </div>
                            <div className="mdash-table-scroll" style={TABLE_FIXED_HEIGHT}>
                                <table className="mdash-table">
                                    <colgroup>
                                        <col style={{ width: "30%" }} />
                                        <col style={{ width: "18%" }} />
                                        <col style={{ width: "18%" }} />
                                        <col style={{ width: "22%" }} />
                                        <col style={{ width: "15%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <FilterTh tableId="expiringSoon" colId="name">Title</FilterTh>
                                            <FilterTh tableId="expiringSoon" colId="type" style={{ textAlign: "center" }}>Type</FilterTh>
                                            <FilterTh tableId="expiringSoon" colId="area" style={{ textAlign: "center" }}>Area</FilterTh>
                                            <FilterTh tableId="expiringSoon" colId="dueDate" style={{ textAlign: "center" }}>Due Date</FilterTh>
                                            <FilterTh tableId="expiringSoon" colId="daysLeft" style={{ textAlign: "center" }}>Days Left</FilterTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpiringSoon.map((doc, i) => (
                                            <tr key={i}>
                                                <td className="mdash-td--wrap">{doc.name}</td>
                                                <td style={{ textAlign: "center" }}>{doc.type}</td>
                                                <td style={{ textAlign: "center" }}>{doc.area}</td>
                                                <td style={{ textAlign: "center" }}>{doc.dueDate}</td>
                                                <td
                                                    className={
                                                        doc.daysLeft <= 7
                                                            ? "mdash-warn-text"
                                                            : doc.daysLeft > 7 && doc.daysLeft <= 15
                                                                ? "mdash-alr-text"
                                                                : ""
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

                    {/* ── Drilldown: By Document Type ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>TASKS BY DISCIPLINE</h3>
                            <div className="mdash-inline-legend">
                                {[{ label: "Closed Out", cls: "green" }, { label: "Due Soon", cls: "orange" }, { label: "Overdue", cls: "red" }].map((item) => (
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
                                            <FilterTh tableId="byType" colId="type" style={{ width: "40%" }}>Discipline</FilterTh>
                                            <FilterTh tableId="byType" colId="valid" style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--green">Closed Out</FilterTh>
                                            <FilterTh tableId="byType" colId="expiring" style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--orange">Due Soon</FilterTh>
                                            <FilterTh tableId="byType" colId="expired" style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--red">Overdue</FilterTh>
                                            <FilterTh tableId="byType" colId="pctExpired" style={{ textAlign: "center", width: "12%" }}>% Overdue</FilterTh>
                                            <FilterTh tableId="byType" colId="total" style={{ textAlign: "center", width: "12%" }}>Total</FilterTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredByType.map((row) => (
                                            <tr key={row.type} className="mdash-drilldown-row">
                                                <td>{row.type}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.valid)}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.expiring)}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.expired)}</td>
                                                <td style={{ textAlign: "center" }}>{row.pctExpired}%</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="mdash-drilldown-footer">
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{fmt(typeTotals.valid)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(typeTotals.expiring)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(typeTotals.expired)}</td>
                                            <td style={{ textAlign: "center" }}>{overallPctExpired}%</td>
                                            <td style={{ textAlign: "center" }}>{fmt(typeTotals.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Overdue</span>
                                </div>
                                <StackedBarChart rows={filteredByType} />
                                <div className="mdash-stacked-axis-labels">
                                    {["0%", "25%", "50%", "75%", "100%"].map((l) => <span key={l}>{l}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Drilldown: By Discipline ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>TASKS BY AREA</h3>
                            <div className="mdash-inline-legend">
                                {[{ label: "Closed Out", cls: "green" }, { label: "Due Soon", cls: "orange" }, { label: "Overdue", cls: "red" }].map((item) => (
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
                                            <FilterTh tableId="byDisc" colId="type" style={{ width: "40%" }}>Area</FilterTh>
                                            <FilterTh tableId="byDisc" colId="valid" style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--green">Closed Out</FilterTh>
                                            <FilterTh tableId="byDisc" colId="expiring" style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--orange">Due Soon</FilterTh>
                                            <FilterTh tableId="byDisc" colId="expired" style={{ textAlign: "center", width: "12%" }} className="mdash-table-header--red">Overdue</FilterTh>
                                            <FilterTh tableId="byDisc" colId="pctExpired" style={{ textAlign: "center", width: "12%" }}>% Overdue</FilterTh>
                                            <FilterTh tableId="byDisc" colId="total" style={{ textAlign: "center", width: "12%" }}>Total</FilterTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredByDisc.map((row) => (
                                            <tr key={row.type} className="mdash-drilldown-row">
                                                <td>{row.type}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.valid)}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.expiring)}</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.expired)}</td>
                                                <td style={{ textAlign: "center" }}>{row.pctExpired}%</td>
                                                <td style={{ textAlign: "center" }}>{fmt(row.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="mdash-drilldown-footer">
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{fmt(discTotals.valid)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-warn-text">{fmt(discTotals.expiring)}</td>
                                            <td style={{ textAlign: "center" }} className="mdash-alert-text">{fmt(discTotals.expired)}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {discTotals.total > 0 ? Math.round((discTotals.expired / discTotals.total) * 100) : 0}%
                                            </td>
                                            <td style={{ textAlign: "center" }}>{fmt(discTotals.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="mdash-stacked-side">
                                <div className="mdash-inline-legend mdash-inline-legend--right">
                                    <span className="mdash-inline-legend-item mdash-inline-legend-item--right">% Overdue</span>
                                </div>
                                <StackedBarChart rows={filteredByDisc} />
                                <div className="mdash-stacked-axis-labels">
                                    {["0%", "25%", "50%", "75%", "100%"].map((l) => <span key={l}>{l}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Trend: Historical ── */}
                    <div className="mdash-panel mdash-panel--full">
                        <div className="mdash-panel-header">
                            <h3>TASKS OVER TIME (LAST {trendRange} {trendRange === 1 ? "MONTH" : "MONTHS"})</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div className="mdash-inline-legend" style={{ marginBottom: 0 }}>
                                    {[{ label: "Overdue Tasks", cls: "red" }, { label: "Open Tasks", cls: "grey" }].map((item) => (
                                        <span key={item.label} className="mdash-inline-legend-item">
                                            <span className={`mdash-legend-dot mdash-legend-dot--${item.cls}`} />
                                            {item.label}
                                        </span>
                                    ))}
                                </div>
                                <select
                                    className="mdash-trend-select"
                                    value={Math.min(trendRange, dash.trend.months.length)}
                                    onChange={(e) => setTrendRange(Number(e.target.value))}
                                >
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                        .filter((n) => n <= dash.trend.months.length)
                                        .map((n) => (
                                            <option key={n} value={n}>{n} Months</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        <div className="mdash-chart-scroll">
                            <TrendChart
                                months={dash.trend.months.slice(-trendRange)}
                                series={{
                                    overdue: dash.trend.overdue.slice(-trendRange),
                                    open: dash.trend.open.slice(-trendRange),
                                }}
                                totalSlots={trendRange}
                            />
                        </div>
                    </div>

                </div>
            </div>
            <ToastContainer />

            {/* ── Excel filter popup ─────────────────────────────────────── */}
            {excelFilter.open && (() => {
                const { tableId, colId } = excelFilter;
                const filtersMap = tableId === "expired" ? expiredFilters : tableId === "expiringSoon" ? expiringSoonFilters : tableId === "byType" ? typeFilters : discFilters;
                const setFiltersMap = tableId === "expired" ? setExpiredFilters : tableId === "expiringSoon" ? setExpiringSoonFilters : tableId === "byType" ? setTypeFilters : setDiscFilters;
                const sortMap = tableId === "expired" ? expiredSort : tableId === "expiringSoon" ? expiringSoonSort : tableId === "byType" ? typeSort : discSort;
                const rowsMap = tableId === "expired" ? dash.recentlyExpired : tableId === "expiringSoon" ? dash.expiringSoon : tableId === "byType" ? dash.byType : dash.byDiscipline;

                const allValues = getAvailableOptions(rowsMap, filtersMap, colId);
                const visibleValues = allValues.filter(v =>
                    String(v).toLowerCase().includes(excelSearch.toLowerCase())
                );
                const isAllVisibleSelected = visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                const toggleAll = (checked) => {
                    setExcelSelected(prev => {
                        const next = new Set(prev);
                        if (checked) visibleValues.forEach(v => next.add(v));
                        else visibleValues.forEach(v => next.delete(v));
                        return next;
                    });
                };

                const toggleValue = (v) => {
                    setExcelSelected(prev => {
                        const next = new Set(prev);
                        if (next.has(v)) next.delete(v);
                        else next.add(v);
                        return next;
                    });
                };

                const onOk = () => {
                    let finalSelection = new Set(excelSelected);
                    if (excelSearch.trim() !== "") {
                        const visibleSet = new Set(visibleValues);
                        finalSelection = new Set(Array.from(excelSelected).filter(v => visibleSet.has(v)));
                    }
                    const selectedArr = Array.from(finalSelection);
                    const isTotalReset = allValues.length > 0 && allValues.length === selectedArr.length && selectedArr.every(v => finalSelection.has(v));
                    setFiltersMap(prev => {
                        const next = { ...prev };
                        if (isTotalReset) delete next[colId];
                        else next[colId] = selectedArr;
                        return next;
                    });
                    setExcelFilter({ open: false, tableId: null, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                };

                const onCancel = () => {
                    setExcelFilter({ open: false, tableId: null, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                };

                return (
                    <div
                        className="excel-filter-popup"
                        ref={excelPopupRef}
                        style={{
                            position: "fixed",
                            top: excelFilter.pos.top,
                            left: excelFilter.pos.left,
                            width: excelFilter.pos.width,
                            zIndex: 9999,
                        }}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <div className="excel-filter-sortbar">
                            <button
                                type="button"
                                className={`excel-sort-btn ${sortMap.colId === colId && sortMap.direction === "asc" ? "active" : ""}`}
                                onClick={() => toggleSort(tableId, colId, "asc")}
                            >
                                Sort Ascending
                            </button>
                            <button
                                type="button"
                                className={`excel-sort-btn ${sortMap.colId === colId && sortMap.direction === "desc" ? "active" : ""}`}
                                onClick={() => toggleSort(tableId, colId, "desc")}
                            >
                                Sort Descending
                            </button>
                        </div>

                        <input
                            type="text"
                            className="excel-filter-search"
                            placeholder="Search"
                            value={excelSearch}
                            onChange={(e) => setExcelSearch(e.target.value)}
                        />

                        <div className="excel-filter-list">
                            <label className="excel-filter-item">
                                <span className="excel-filter-checkbox">
                                    <input
                                        type="checkbox"
                                        className="checkbox-excel-attend"
                                        checked={isAllVisibleSelected}
                                        onChange={(e) => toggleAll(e.target.checked)}
                                    />
                                </span>
                                <span className="excel-filter-text">
                                    {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                                </span>
                            </label>

                            {visibleValues.map(v => (
                                <label className="excel-filter-item" key={String(v)}>
                                    <span className="excel-filter-checkbox">
                                        <input
                                            type="checkbox"
                                            className="checkbox-excel-attend"
                                            checked={excelSelected.has(v)}
                                            onChange={() => toggleValue(v)}
                                        />
                                    </span>
                                    <span className="excel-filter-text">{v}</span>
                                </label>
                            ))}

                            {visibleValues.length === 0 && (
                                <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                                    No matches found
                                </div>
                            )}
                        </div>

                        <div className="excel-filter-actions">
                            <button type="button" className="excel-filter-btn" onClick={onOk}>Apply</button>
                            <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>Cancel</button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default CTSMainDash;