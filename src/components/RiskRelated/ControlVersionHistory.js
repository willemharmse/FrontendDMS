import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faSearch,
    faTimes,
    faTableColumns,
    faArrowsRotate,
    faCaretLeft,
    faCaretRight,
    faFilter,
    faRotateLeft,
    faSave
} from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import TopBar from "../Notifications/TopBar";
import "./ControlAttributes.css";
import { canIn, getCurrentUser } from "../../utils/auth";
import { ToastContainer, toast } from "react-toastify";

const ControlVersionHistory = () => {
    const [controls, setControls] = useState([]); // history versions
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();
    const [changesMadeEdits, setChangesMadeEdits] = useState({});

    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [searchPopupVisible, setSearchPopupVisible] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const access = getCurrentUser();

    const scrollerRef = useRef(null);
    const tbodyRef = useRef(null);

    const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
    const DRAG_THRESHOLD_PX = 6;

    // --- Unified Sort Configuration ---
    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    // --- Excel Filter States ---
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    const [showColumns, setShowColumns] = useState([
        "nr",
        "control",
        "description",
        "critical",
        "act",
        "activation",
        "hierarchy",
        "cons",
        "version",
        "updatedBy",
        "updatedAt",
        "changesMade",
        "action",
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const availableColumns = [
        { id: "nr", title: "Nr" },
        { id: "control", title: "Control" },
        { id: "description", title: "Control Description" },
        { id: "performance", title: "Performance Requirements & Verification" },
        { id: "critical", title: "Critical Control" },
        { id: "act", title: "Act, Object or System" },
        { id: "activation", title: "Control Activation (Pre or Post Unwanted Event)" },
        { id: "hierarchy", title: "Hierarchy of Controls" },
        { id: "quality", title: "Control Quality" },
        { id: "cons", title: "Specific Consequence Addressed" },
        { id: "version", title: "Version" },
        { id: "updatedBy", title: "Updated By" },
        { id: "updatedAt", title: "Updated At" },
        { id: "changesMade", title: "Changes Made" },
        { id: "action", title: "Action" },
    ];

    const allColumnIds = availableColumns.map(c => c.id);

    const toggleColumn = (columnId) => {
        if (columnId === "nr") return;
        if (columnId === "action") return;

        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                return prev.filter(id => id !== columnId);
            }
            return [...prev, columnId];
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) setShowColumns(allColumnIds);
        else setShowColumns(["nr", "action"]);
    };

    const areAllColumnsSelected = () => {
        return allColumnIds.every(id => showColumns.includes(id));
    };

    // Groupings for the first header row
    const identificationColumns = ["nr", "control", "description", "performance", "critical"];
    const cerColumns = ["act", "activation", "hierarchy", "quality", "cons"];

    const visibleIdentificationColumns = identificationColumns.filter(id => showColumns.includes(id));
    const visibleCerColumns = cerColumns.filter(id => showColumns.includes(id));

    // Column sizing (kept)
    const [columnWidths, setColumnWidths] = useState({
        nr: 60,
        control: 250,
        description: 320,
        performance: 260,
        critical: 90,
        act: 140,
        activation: 200,
        hierarchy: 220,
        quality: 120,
        cons: 150,
        version: 260,
        updatedBy: 220,
        updatedAt: 200,
        changesMade: 260,
        action: 80,
    });

    const [initialColumnWidths] = useState({
        nr: 60,
        control: 250,
        description: 320,
        performance: 260,
        critical: 90,
        act: 140,
        activation: 200,
        hierarchy: 220,
        quality: 120,
        cons: 150,
        version: 260,
        updatedBy: 220,
        updatedAt: 200,
        changesMade: 260,
        action: 80,
    });

    const columnSizeLimits = {
        nr: { min: 60, max: 60 },
        control: { min: 150, max: 600 },
        description: { min: 200, max: 800 },
        performance: { min: 150, max: 600 },
        critical: { min: 70, max: 200 },
        act: { min: 100, max: 300 },
        activation: { min: 150, max: 400 },
        hierarchy: { min: 150, max: 400 },
        quality: { min: 100, max: 250 },
        cons: { min: 120, max: 300 },
        version: { min: 220, max: 420 },
        updatedBy: { min: 160, max: 360 },
        updatedAt: { min: 160, max: 320 },
        changesMade: { min: 220, max: 520 },
        action: { min: 80, max: 80 },
    };

    const [tableWidth, setTableWidth] = useState(null);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const [hasFittedOnce, setHasFittedOnce] = useState(false);
    const widthsInitializedRef = useRef(false);
    const isResizingRef = useRef(false);
    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);

    const getDisplayColumns = () => showColumns;

    const startColumnResize = (e, columnId) => {
        e.preventDefault();
        e.stopPropagation();

        isResizingRef.current = true;
        resizingColRef.current = columnId;
        resizeStartXRef.current = e.clientX;

        const th = e.target.closest('th');
        const currentWidth =
            columnWidths[columnId] ??
            (th ? th.getBoundingClientRect().width : 150);

        resizeStartWidthRef.current = currentWidth;

        document.addEventListener('mousemove', handleColumnResizeMove);
        document.addEventListener('mouseup', stopColumnResize);
    };

    const handleColumnResizeMove = (e) => {
        const colId = resizingColRef.current;
        if (!colId) return;

        const deltaX = e.clientX - resizeStartXRef.current;
        let newWidth = resizeStartWidthRef.current + deltaX;

        const limits = columnSizeLimits[colId];
        if (limits) {
            if (limits.min != null) newWidth = Math.max(limits.min, newWidth);
            if (limits.max != null) newWidth = Math.min(limits.max, newWidth);
        }

        setColumnWidths(prev => {
            const updated = { ...prev, [colId]: newWidth };
            const visibleCols = getDisplayColumns().filter(
                id => typeof updated[id] === "number"
            );
            const totalWidth = visibleCols.reduce(
                (sum, id) => sum + (updated[id] || 0),
                0
            );
            setTableWidth(totalWidth);
            return updated;
        });
    };

    const stopColumnResize = () => {
        document.removeEventListener('mousemove', handleColumnResizeMove);
        document.removeEventListener('mouseup', stopColumnResize);

        setTimeout(() => {
            isResizingRef.current = false;
        }, 0);

        resizingColRef.current = null;
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            jwtDecode(storedToken);
        }
    }, [navigate]);

    // ---------- Dragging (kept, with click-friendly threshold) ----------
    const onNativeDragStart = (e) => e.preventDefault();

    const onRowPointerDown = (e) => {
        if (
            e.target.closest(".rca-action-btn") ||
            e.target.closest(".risk-control-attributes-action-cell") ||
            e.target.closest("button") ||
            e.target.closest("a") ||
            e.target.closest("input") ||
            e.target.closest("textarea") ||
            e.target.closest("select") ||
            e.target.closest(".changesmade-input-container")
        ) {
            return;
        }

        const tr = e.target.closest("tr");
        if (!tr) return;

        const scroller = scrollerRef.current;
        if (!scroller) return;

        drag.current.active = true;
        drag.current.moved = false;
        drag.current.startX = e.clientX;
        drag.current.startLeft = scroller.scrollLeft;

        tr.setPointerCapture?.(e.pointerId);
    };

    const onRowPointerMove = (e) => {
        if (!drag.current.active) return;
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const dx = e.clientX - drag.current.startX;

        if (!drag.current.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
            drag.current.moved = true;
            scroller.classList.add("dragging");
        }

        scroller.scrollLeft = drag.current.startLeft - dx;
        e.preventDefault();
    };

    const endRowDrag = (e) => {
        if (!drag.current.active) return;

        drag.current.active = false;
        scrollerRef.current?.classList.remove("dragging");

        const tr = e.target.closest("tr");
        tr?.releasePointerCapture?.(e.pointerId);
    };

    // ---------- Fetch history ----------
    const fetchHistory = async (historyID) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/controls/${historyID}/history`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch history");
            const data = await response.json();

            const hist = Array.isArray(data.history) ? data.history : [];
            setControls(hist);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    };

    useEffect(() => {
        fetchHistory(id);
        // eslint-disable-next-line
    }, [id]);

    // ---------- Search / Filter / Sort helpers ----------
    const handleSearchClick = () => setSearchPopupVisible(prev => !prev);
    const handleCloseSearch = () => {
        setSearchPopupVisible(false);
        setSearchInput("");
    };
    const handleSearchChange = (e) => setSearchInput(e.target.value);

    const formatUpdatedBy = (u) => {
        if (!u) return "-";
        if (typeof u === "string") return u; // if backend returns id only
        return u.name || u.email || u.username || "-";
    };

    const formatUpdatedAt = (dateString) => {
        console.log(dateString)
        if (dateString === "" || dateString === null || !dateString) return "-"
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        // Add category handler
        if (colId === "category") return [row.category ? String(row.category).trim() : "No Category"];
        if (colId === "critical") return [row.critical ? String(row.critical).trim() : "-"];
        if (colId === "updatedAt") return [formatUpdatedAt(row?.updatedAt)];

        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        // Start with all controls
        let filtered = controls;
        // 2. Apply filters from ALL OTHER active columns
        for (const [filterColId, selectedValues] of Object.entries(activeExcelFilters)) {
            if (filterColId === colId) continue; // Don't filter a column by itself
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                // Keep row if ANY of its cell values match the selection
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        // 3. Extract unique values for the requested column from the filtered subset
        const uniqueValues = Array.from(
            new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        return uniqueValues;
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // CHANGED: Use the helper to get cross-filtered values
        const values = getAvailableOptions(colId);

        const existing = activeExcelFilters[colId];
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);

        setExcelSelected(initialSelected);
        setExcelSearch("");

        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(220, rect.width),
            },
        });
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    const processedControls = useMemo(() => {
        let current = [...controls];

        if (searchInput) {
            const lowerQ = searchInput.toLowerCase();
            current = current.filter(c =>
                String(c.control || "").toLowerCase().includes(lowerQ)
            );
        }

        current = current.filter((row, originalIndex) => {
            for (const [colId, selectedValues] of Object.entries(activeExcelFilters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;

                const cellValues = getFilterValuesForCell(row, colId, originalIndex);
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            // keep as is
        } else if (colId === "version") {
            current.sort((a, b) => {
                const va = Number(a.version ?? 0);
                const vb = Number(b.version ?? 0);
                return (va - vb) * dir;
            });
        } else if (colId === "updatedAt") {
            current.sort((a, b) => {
                const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : Number.POSITIVE_INFINITY;
                const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : Number.POSITIVE_INFINITY;
                return (ta - tb) * dir;
            });
        } else {
            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? "(Blanks)" : s;
            };

            current.sort((a, b) => {
                const normA = normalize(a[colId]);
                const normB = normalize(b[colId]);

                if (normA === "(Blanks)" && normB !== "(Blanks)") return 1;
                if (normA !== "(Blanks)" && normB === "(Blanks)") return -1;

                return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }

        return current;
    }, [controls, searchInput, activeExcelFilters, sortConfig]);

    // Column selector close logic (kept)
    useEffect(() => {
        if (!showColumnSelector) return;

        const handleClickOutside = (e) => {
            if (
                !e.target.closest('.column-selector-popup') &&
                !e.target.closest('.top-right-button-control-att-3')
            ) {
                setShowColumnSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showColumnSelector]);

    // Fit-to-width initialization (kept)
    useEffect(() => {
        if (widthsInitializedRef.current) return;
        if (!scrollerRef.current) return;

        const wrapperEl = scrollerRef.current;
        const wWidth = wrapperEl.clientWidth;
        if (!wWidth) return;

        const displayColumns = getDisplayColumns();

        const totalWidth = displayColumns.reduce((sum, colId) => {
            const w = columnWidths[colId];
            return sum + (typeof w === "number" ? w : 0);
        }, 0);

        if (!totalWidth) return;

        const factor = wWidth / totalWidth;

        setColumnWidths(prev => {
            const updated = { ...prev };
            displayColumns.forEach(colId => {
                const w = prev[colId];
                if (typeof w === "number") {
                    updated[colId] = Math.round(w * factor);
                }
            });
            return updated;
        });

        setWrapperWidth(wrapperEl.getBoundingClientRect().width);
        setTableWidth(wWidth);
        setHasFittedOnce(true);

        widthsInitializedRef.current = true;
        // eslint-disable-next-line
    }, [showColumns]);

    const fitTableToWidth = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidthNow = wrapper.getBoundingClientRect().width;
        if (!wrapperWidthNow) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof columnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => columnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);

        if (totalWidth >= wrapperWidthNow) {
            setTableWidth(totalWidth);
            return;
        }

        const scale = wrapperWidthNow / totalWidth;
        let newWidths = prevWidths.map(w => w * scale).map(w => Math.round(w));

        let diff = wrapperWidthNow - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            newWidths[i % newWidths.length] += diff > 0 ? 1 : -1;
            diff = wrapperWidthNow - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id2, index) => {
                updated[id2] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidthNow);
        setWrapperWidth(wrapperWidthNow);
    };

    const resetColumnWidths = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidthNow = wrapper.getBoundingClientRect().width;
        if (!wrapperWidthNow) return;

        const visibleCols = getDisplayColumns().filter(
            id2 => typeof initialColumnWidths[id2] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id2 => initialColumnWidths[id2]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        const scale = wrapperWidthNow / totalWidth;
        let newWidths = prevWidths.map(w => w * scale).map(w => Math.round(w));

        let diff = wrapperWidthNow - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            const idx = i % newWidths.length;
            newWidths[idx] += diff > 0 ? 1 : -1;
            diff = wrapperWidthNow - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id2, index) => {
                updated[id2] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidthNow);
        setWrapperWidth(wrapperWidthNow);
    };

    const isTableFitted =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        Math.abs(tableWidth - wrapperWidth) <= 1;

    const showResetButton =
        hasFittedOnce && !isTableFitted;

    useEffect(() => {
        if (!hasFittedOnce) return;
        fitTableToWidth();
        // eslint-disable-next-line
    }, [isSidebarVisible, showColumns]);

    // Cleanup Popup Listeners (kept)
    useEffect(() => {
        if (!excelFilter.open) return;

        const handleClickOutside = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        const handleScroll = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [excelFilter.open]);

    // Popup Positioning (kept)
    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;

        const popupRect = el.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;

        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) {
                const desiredTop = anchor.top - popupRect.height - 4;
                newTop = Math.max(margin, desiredTop);
            }
        }

        if (popupRect.right > viewportW - margin) {
            const overflow = popupRect.right - (viewportW - margin);
            newLeft = Math.max(margin, newLeft - overflow);
        }
        if (popupRect.left < margin) newLeft = margin;

        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({
                ...prev,
                pos: { ...prev.pos, top: newTop, left: newLeft }
            }));
        }
    }, [excelFilter.open, excelFilter.pos, excelSearch]);

    // ---------- Restore ----------
    const onRestore = async (versionId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/revert-control`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ id: versionId })
            });

            if (!res.ok) throw new Error("Failed to restore version");

            const data = await res.json();
            const restoredId = data?.restoredId || versionId;

            toast.success("Version restored");

            navigate(`/FrontendDMS/controlsHistory/${restoredId}`, { replace: true });
        } catch (e) {
            console.error(e);
            toast.error("Failed to restore version");
        }
    };

    const handleChangesMadeChange = (rowId, value) => {
        setChangesMadeEdits(prev => ({
            ...prev,
            [rowId]: value
        }));
    };

    const handleSaveChangesMade = async (row) => {
        const rowId = row._id;
        const newVal = changesMadeEdits[rowId];

        // If undefined, user hasn't typed anything
        if (newVal === undefined) return;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/riskInfo/versionChange/${rowId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({ changesMade: newVal }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to update changes made");
            }

            setControls(prev =>
                prev.map(c => c._id === rowId ? { ...c, changesMade: newVal } : c)
            );

            setChangesMadeEdits(prev => {
                const next = { ...prev };
                delete next[rowId];
                return next;
            });

            toast.success("Changes Made updated successfully");

            fetchHistory(id);
        } catch (e) {
            console.error("Save failed:", e);
            toast.error("Failed to save Changes Made");
        }
    };

    const disableRestoreAll = controls.length <= 1;

    // --- Highlight Logic: Compare Current vs Previous ---
    const latestDiffs = useMemo(() => {
        if (!controls || controls.length < 2) return {};

        // 1. Sort by version descending to ensure we get Current (top) and Previous (2nd)
        const sortedByVersion = [...controls].sort((a, b) => (b.version || 0) - (a.version || 0));

        const currentVer = sortedByVersion.find(c => c.isCurrent) || sortedByVersion[0];
        // Find the version immediately preceding the current one
        const previousVer = sortedByVersion.find(c => c.version < currentVer.version);

        if (!currentVer || !previousVer) return {};

        const diffs = new Set();
        const fieldsToCompare = [
            "control", "description", "performance", "critical",
            "act", "activation", "hierarchy", "quality", "cons"
        ];

        fieldsToCompare.forEach(field => {
            const val1 = currentVer[field] != null ? String(currentVer[field]).trim() : "";
            const val2 = previousVer[field] != null ? String(previousVer[field]).trim() : "";

            if (val1 !== val2) {
                diffs.add(field);
            }
        });

        return {
            rowId: currentVer._id,
            fields: diffs
        };
    }, [controls]);

    const getHighlightStyle = (row, fieldKey) => {
        // Only highlight if this is the Current row AND the field is in the diff set
        if (row.isCurrent && latestDiffs.rowId === row._id && latestDiffs.fields?.has(fieldKey)) {
            return { backgroundColor: "#fff9c4" }; // Light Yellow Highlight
        }
        return {};
    };

    return (
        <div className="risk-control-attributes-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/controlAttributes.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{`Control Version History`}</p>
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

            <div className="main-box-risk-control-attributes">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="spacer"></div>
                    <TopBar />
                </div>

                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper">
                        <label className="risk-control-label">Control Version History</label>

                        <FontAwesomeIcon
                            icon={faTableColumns}
                            title="Show / Hide Columns"
                            className="top-right-button-control-att"
                            onClick={() => setShowColumnSelector(prev => !prev)}
                        />

                        {showResetButton && (
                            <FontAwesomeIcon
                                icon={faArrowsRotate}
                                title="Reset column widths"
                                className="top-right-button-control-att-2"
                                onClick={resetColumnWidths}
                            />
                        )}

                        {searchPopupVisible && (
                            <div className="search-popup-rca">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    placeholder="Search control name."
                                    className="search-popup-input-rca"
                                />
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    className="search-popup-close-rca"
                                    onClick={handleCloseSearch}
                                />
                            </div>
                        )}

                        {showColumnSelector && (
                            <div className="column-selector-popup" onMouseDown={e => e.stopPropagation()}>
                                <div className="column-selector-header">
                                    <h4>Select Columns</h4>
                                    <button
                                        className="close-popup-btn"
                                        type="button"
                                        onClick={() => setShowColumnSelector(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="column-selector-content">
                                    <p className="column-selector-note">Select columns to display</p>

                                    <div className="select-all-container">
                                        <label className="select-all-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={areAllColumnsSelected()}
                                                onChange={(e) => toggleAllColumns(e.target.checked)}
                                            />
                                            <span className="select-all-text">Select All</span>
                                        </label>
                                    </div>

                                    <div className="column-checkbox-container">
                                        {availableColumns.map(column => (
                                            <div className="column-checkbox-item" key={column.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(column.id)}
                                                        disabled={column.id === 'nr' || column.id === 'action'}
                                                        onChange={() => toggleColumn(column.id)}
                                                    />
                                                    <span>{column.title}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="column-selector-footer">
                                        <p>{showColumns.length} columns selected</p>
                                        <button
                                            className="apply-columns-btn"
                                            type="button"
                                            onClick={() => setShowColumnSelector(false)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="table-scroll-wrapper-attributes-controls" ref={scrollerRef}>
                        <table className={`${isSidebarVisible ? `risk-control-attributes-table` : `risk-control-attributes-table-ws`}`}>
                            <thead className="risk-control-attributes-head">
                                <tr>
                                    {visibleIdentificationColumns.length > 0 && (
                                        <th
                                            colSpan={visibleIdentificationColumns.length}
                                            className="risk-control-attributes-split"
                                        >
                                            Control Identification
                                        </th>
                                    )}
                                    {visibleCerColumns.length > 0 && (
                                        <th
                                            colSpan={visibleCerColumns.length}
                                            className="risk-control-attributes-th"
                                        >
                                            Control Effectiveness Rating (CER)
                                        </th>
                                    )}

                                    {showColumns.includes("version") && (
                                        <th
                                            className="risk-control-attributes-category"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.version ? `${columnWidths.version}px` : undefined,
                                                minWidth: columnSizeLimits.version?.min,
                                                maxWidth: columnSizeLimits.version?.max,
                                                cursor: "pointer",
                                                zIndex: 2,
                                                textAlign: "center",
                                                borderLeft: "1px solid white"
                                            }}
                                            onClick={(e) => {
                                                if (isResizingRef.current) return;
                                                if (e.target.classList.contains('rca-col-resizer')) return;
                                                openExcelFilterPopup("version", e);
                                            }}
                                        >
                                            <span>Version</span>
                                            {(activeExcelFilters["version"] || sortConfig.colId === "version") && (
                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                            )}
                                            <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, "version")} />
                                        </th>
                                    )}

                                    {showColumns.includes("updatedBy") && (
                                        <th
                                            className="risk-control-attributes-category"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.updatedBy ? `${columnWidths.updatedBy}px` : undefined,
                                                minWidth: columnSizeLimits.updatedBy?.min,
                                                maxWidth: columnSizeLimits.updatedBy?.max,
                                                cursor: "pointer",
                                                zIndex: 2,
                                                textAlign: "center",
                                                borderLeft: "1px solid white"
                                            }}
                                            onClick={(e) => {
                                                if (isResizingRef.current) return;
                                                if (e.target.classList.contains('rca-col-resizer')) return;
                                                openExcelFilterPopup("updatedBy", e);
                                            }}
                                        >
                                            <span>Updated By</span>
                                            {(activeExcelFilters["updatedBy"] || sortConfig.colId === "updatedBy") && (
                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                            )}
                                            <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, "updatedBy")} />
                                        </th>
                                    )}

                                    {showColumns.includes("updatedAt") && (
                                        <th
                                            className="risk-control-attributes-category"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.updatedAt ? `${columnWidths.updatedAt}px` : undefined,
                                                minWidth: columnSizeLimits.updatedAt?.min,
                                                maxWidth: columnSizeLimits.updatedAt?.max,
                                                cursor: "pointer",
                                                zIndex: 2,
                                                textAlign: "center",
                                                borderLeft: "1px solid white"
                                            }}
                                            onClick={(e) => {
                                                if (isResizingRef.current) return;
                                                if (e.target.classList.contains('rca-col-resizer')) return;
                                                openExcelFilterPopup("updatedAt", e);
                                            }}
                                        >
                                            <span>Updated At</span>
                                            {(activeExcelFilters["updatedAt"] || sortConfig.colId === "updatedAt") && (
                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                            )}
                                            <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, "updatedAt")} />
                                        </th>
                                    )}

                                    {showColumns.includes("changesMade") && (
                                        <th
                                            className="risk-control-attributes-category"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.changesMade ? `${columnWidths.changesMade}px` : undefined,
                                                minWidth: columnSizeLimits.changesMade?.min,
                                                maxWidth: columnSizeLimits.changesMade?.max,
                                                cursor: "pointer",
                                                zIndex: 2,
                                                textAlign: "center",
                                                borderLeft: "1px solid white"
                                            }}
                                            onClick={(e) => {
                                                if (isResizingRef.current) return;
                                                if (e.target.classList.contains('rca-col-resizer')) return;
                                                openExcelFilterPopup("changesMade", e);
                                            }}
                                        >
                                            <span>Changes Made</span>
                                            {(activeExcelFilters["changesMade"] || sortConfig.colId === "changesMade") && (
                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                            )}
                                            <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, "changesMade")} />
                                        </th>
                                    )}

                                    {showColumns.includes("action") && (
                                        <th
                                            className="risk-control-attributes-action"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.action ? `${columnWidths.action}px` : undefined,
                                                minWidth: columnSizeLimits.action?.min,
                                                maxWidth: columnSizeLimits.action?.max,
                                                cursor: "default"
                                            }}
                                        >
                                            <span>Action</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={(e) => startColumnResize(e, "action")}
                                            />
                                        </th>
                                    )}
                                </tr>

                                <tr>
                                    {availableColumns.map(col => {
                                        if (col.id === "action") return null;
                                        if (col.id === "version") return null;
                                        if (col.id === "updatedBy") return null;
                                        if (col.id === "updatedAt") return null;
                                        if (col.id === "changesMade") return null;
                                        if (!showColumns.includes(col.id)) return null;

                                        const classMap = {
                                            nr: "risk-control-attributes-nr",
                                            control: "risk-control-attributes-control",
                                            description: "risk-control-attributes-description",
                                            performance: "risk-control-attributes-perf",
                                            critical: "risk-control-attributes-critcal",
                                            act: "risk-control-attributes-act",
                                            activation: "risk-control-attributes-activation",
                                            hierarchy: "risk-control-attributes-hiearchy",
                                            quality: "risk-control-attributes-quality",
                                            cons: "risk-control-attributes-cons"
                                        };

                                        const isActiveFilter = activeExcelFilters[col.id];
                                        const isActiveSort = sortConfig.colId === col.id && col.id !== "nr";

                                        return (
                                            <th
                                                key={col.id}
                                                className={classMap[col.id]}
                                                onClick={(e) => {
                                                    if (isResizingRef.current) return;
                                                    if (e.target.classList.contains('rca-col-resizer')) return;
                                                    openExcelFilterPopup(col.id, e);
                                                }}
                                                style={{
                                                    position: "relative",
                                                    width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                                                    minWidth: columnSizeLimits[col.id]?.min,
                                                    maxWidth: columnSizeLimits[col.id]?.max,
                                                    cursor: col.id === "nr" ? "default" : "pointer"
                                                }}
                                            >
                                                <span>{col.title}</span>
                                                {(isActiveFilter || isActiveSort) && (
                                                    <FontAwesomeIcon
                                                        icon={faFilter}
                                                        className="th-filter-icon"
                                                        style={{ marginLeft: "8px", opacity: 0.8 }}
                                                    />
                                                )}
                                                <div
                                                    className="rca-col-resizer"
                                                    onMouseDown={e => startColumnResize(e, col.id)}
                                                />
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            <tbody
                                ref={tbodyRef}
                                onPointerDown={onRowPointerDown}
                                onPointerMove={onRowPointerMove}
                                onPointerUp={endRowDrag}
                                onPointerCancel={endRowDrag}
                                onDragStart={onNativeDragStart}
                            >
                                {processedControls.map((row, index) => {
                                    const disableRestore = disableRestoreAll || row.isCurrent === true;

                                    return (
                                        <tr className="table-scroll-wrapper-attributes-controls" key={row._id ?? index}>
                                            {showColumns.includes("nr") && (
                                                <td className="procCent" style={{ fontSize: "14px" }}>
                                                    {index + 1}
                                                </td>
                                            )}

                                            {showColumns.includes("control") && (
                                                <td style={{ fontSize: "14px", ...getHighlightStyle(row, "control") }}>{row.control}</td>
                                            )}

                                            {showColumns.includes("description") && (
                                                <td style={{ fontSize: "14px", ...getHighlightStyle(row, "description") }}>{row.description}</td>
                                            )}

                                            {showColumns.includes("performance") && (
                                                <td style={{ fontSize: "14px", ...getHighlightStyle(row, "performance") }}>{row.performance}</td>
                                            )}

                                            {showColumns.includes("critical") && (
                                                <td
                                                    className={`${row.critical === "Yes"
                                                        ? "procCent"
                                                        : "procCent"
                                                        }`}
                                                    style={{ fontSize: "14px", ...getHighlightStyle(row, "critical") }}
                                                >
                                                    {row.critical}
                                                </td>
                                            )}

                                            {showColumns.includes("act") && (
                                                <td className="procCent" style={{ fontSize: "14px", ...getHighlightStyle(row, "act") }}>
                                                    {row.act}
                                                </td>
                                            )}

                                            {showColumns.includes("activation") && (
                                                <td style={{ fontSize: "14px", ...getHighlightStyle(row, "activation") }}>{row.activation}</td>
                                            )}

                                            {showColumns.includes("hierarchy") && (
                                                <td style={{ fontSize: "14px", ...getHighlightStyle(row, "hierarchy") }}>{row.hierarchy}</td>
                                            )}

                                            {showColumns.includes("quality") && (
                                                <td style={{ fontSize: "14px", ...getHighlightStyle(row, "quality") }}>{row.quality}</td>
                                            )}

                                            {showColumns.includes("cons") && (
                                                <td style={{ fontSize: "14px", ...getHighlightStyle(row, "cons") }}>{row.cons}</td>
                                            )}

                                            {showColumns.includes("version") && (
                                                <td className="procCent" style={{ fontSize: "14px" }}>
                                                    Version {row.version ?? (index + 1)}{row.isCurrent ? " (Current)" : ""}
                                                </td>
                                            )}

                                            {showColumns.includes("updatedBy") && (
                                                <td style={{ fontSize: "14px", textAlign: "center" }}>
                                                    {formatUpdatedBy(row.updatedBy)}
                                                </td>
                                            )}

                                            {showColumns.includes("updatedAt") && (
                                                <td style={{ fontSize: "14px", textAlign: "center" }}>
                                                    {formatUpdatedAt(row?.updatedAt)}
                                                </td>
                                            )}

                                            {showColumns.includes("changesMade") && (() => {
                                                const versionNumber = Number(row.version ?? index + 1);

                                                // 🚫 Version 1: no edits allowed
                                                if (versionNumber === 1) {
                                                    return (
                                                        <td
                                                            style={{
                                                                fontSize: "14px",
                                                                textAlign: "center",
                                                                color: "#666",
                                                                fontStyle: "italic"
                                                            }}
                                                        >
                                                            -
                                                        </td>
                                                    );
                                                }

                                                // ✅ Version 2+
                                                const currentVal = changesMadeEdits[row._id];
                                                const originalVal = row.changeMessage || "";
                                                const isDirty = currentVal !== undefined && currentVal !== originalVal;
                                                const displayVal = currentVal !== undefined ? currentVal : originalVal;

                                                return (
                                                    <td style={{ fontSize: "14px", padding: "4px" }}>
                                                        <div
                                                            className="changesmade-input-container"
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "2px",
                                                                width: "100%",
                                                                height: "100%"
                                                            }}
                                                        >
                                                            <textarea
                                                                value={displayVal}
                                                                onChange={(e) =>
                                                                    handleChangesMadeChange(row._id, e.target.value)
                                                                }
                                                                className="category-inline-input"
                                                                style={{
                                                                    flex: "1",
                                                                    minWidth: "0",
                                                                    padding: "4px 6px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid gray",
                                                                    resize: "none",
                                                                    minHeight: "10px",
                                                                    fieldSizing: "content",
                                                                    fontFamily: "Arial",
                                                                    wordBreak: "break-word",
                                                                }}
                                                            />

                                                            {isDirty && (
                                                                <button
                                                                    onClick={() => handleSaveChangesMade(row)}
                                                                    className="category-save-btn"
                                                                    title="Save Change"
                                                                    style={{
                                                                        flex: "0 0 auto", // Do not shrink
                                                                        background: "transparent",
                                                                        color: "gray",
                                                                        border: "none",
                                                                        borderRadius: "4px",
                                                                        fontSize: "24px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={faSave} size="xs" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })()}

                                            {showColumns.includes("action") && (
                                                <td className="risk-control-attributes-action-cell">
                                                    <button
                                                        type="button"
                                                        className="rca-action-btn"
                                                        disabled={disableRestore}
                                                        title={
                                                            controls.length <= 1
                                                                ? "No previous versions to restore"
                                                                : row.isCurrent
                                                                    ? "Current version cannot be restored"
                                                                    : "Restore this version"
                                                        }
                                                        onClick={() => onRestore(row._id)}
                                                        style={{
                                                            opacity: disableRestore ? 0.4 : 1,
                                                            cursor: disableRestore ? "not-allowed" : "pointer"
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faRotateLeft} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Excel Filter Popup (kept) */}
                {excelFilter.open && (
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
                                className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                    sortConfig.direction === "asc" ? "active" : ""
                                    }`}
                                onClick={() => toggleSort(excelFilter.colId, "asc")}
                            >
                                Sort Acsending
                            </button>

                            <button
                                type="button"
                                className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                    sortConfig.direction === "desc" ? "active" : ""
                                    }`}
                                onClick={() => toggleSort(excelFilter.colId, "desc")}
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

                        {(() => {
                            const colId = excelFilter.colId;

                            const allValues = getAvailableOptions(colId);

                            const visibleValues = allValues.filter(v =>
                                String(v).toLowerCase().includes(excelSearch.toLowerCase())
                            );

                            const isAllVisibleSelected =
                                visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                            const toggleAll = (checked) => {
                                setExcelSelected(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                        visibleValues.forEach(v => next.add(v));
                                    } else {
                                        visibleValues.forEach(v => next.delete(v));
                                    }
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
                                    finalSelection = new Set(
                                        Array.from(excelSelected).filter(v => visibleSet.has(v))
                                    );
                                }

                                const selectedArr = Array.from(finalSelection);
                                const isTotalReset = allValues.length > 0 &&
                                    allValues.length === selectedArr.length &&
                                    selectedArr.every(v => finalSelection.has(v));

                                setActiveExcelFilters(prev => {
                                    const next = { ...prev };
                                    if (isTotalReset) {
                                        delete next[colId];
                                    } else {
                                        next[colId] = selectedArr;
                                    }
                                    return next;
                                });

                                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                            };

                            const onCancel = () => {
                                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                            };

                            return (
                                <>
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
                                </>
                            );
                        })()}
                    </div>
                )}

                {error && <div style={{ padding: 10, color: "red" }}>{error}</div>}
                <ToastContainer />
            </div>
        </div>
    );
};

export default ControlVersionHistory;