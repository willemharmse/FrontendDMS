import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faTimes, faTableColumns, faArrowsRotate, faFilter } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { saveAs } from "file-saver";
import { getCurrentUser } from "../../../utils/auth";
import { ToastContainer } from "react-toastify";
import TopBar from "../../Notifications/TopBar";
import SuggestControlPopup from "./SuggestControlPopup";

const SuggestedControls = () => {
    const [controls, setControls] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const { id: draftID } = useParams();
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    // Search & Sort State
    const [searchPopupVisible, setSearchPopupVisible] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const scrollerRef = useRef(null);
    const tbodyRef = useRef(null);
    const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0, pointerId: null });

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

    const onNativeDragStart = (e) => {
        e.preventDefault();
    };

    const DRAG_THRESHOLD = 6;

    const onRowPointerDown = (e) => {
        if (
            e.target.closest(".rca-action-btn") ||
            e.target.closest(".risk-control-attributes-action-cell") ||
            e.target.closest("button,a,input,textarea,select")
        ) return;

        const tr = e.target.closest("tr");
        if (!tr) return;

        const scroller = scrollerRef.current;
        if (!scroller) return;

        drag.current.active = true;
        drag.current.moved = false;
        drag.current.startX = e.clientX;
        drag.current.startLeft = scroller.scrollLeft;
        drag.current.pointerId = e.pointerId;

        // IMPORTANT: don't setPointerCapture here
    };

    const onRowPointerMove = (e) => {
        if (!drag.current.active) return;

        const scroller = scrollerRef.current;
        if (!scroller) return;

        const dx = e.clientX - drag.current.startX;

        if (!drag.current.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD) return;

            drag.current.moved = true;
            scroller.classList.add("dragging");

            // capture only once we KNOW it’s a drag
            e.currentTarget.setPointerCapture?.(e.pointerId);
        }

        scroller.scrollLeft = drag.current.startLeft - dx;
        e.preventDefault();
    };

    const onRowPointerUp = (e) => {
        if (!drag.current.active) return;

        const wasDrag = drag.current.moved;

        // cleanup first
        drag.current.active = false;
        drag.current.moved = false;
        scrollerRef.current?.classList.remove("dragging");
        e.currentTarget.releasePointerCapture?.(e.pointerId);

        // if it was NOT a drag, treat as a "row click"
        if (!wasDrag) {
            const tr = e.target.closest("tr");
            if (!tr) return;

            const index = Number(tr.dataset.index);
            if (Number.isNaN(index)) return;

            const row = processedControls[index];
            if (!row) return;

            setSelectedDraft(row);
            setShowPopup(true);
        }
    };

    const endRowDrag = (e) => {
        if (!drag.current.active) return;

        drag.current.active = false;
        scrollerRef.current?.classList.remove("dragging");
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        fetchControls();
    }, []);

    const fetchControls = async () => {
        // [Cite: documentRiskValues.mjs] - Using draftControls endpoint to get suggestions
        const route = `/api/riskInfo/draftControls`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            // Map the draft data to flat structure for table
            const mappedControls = (data.drafts || []).map(draft => ({
                ...draft,
                suggestedBy: draft.suggestedBy?.username || "Unknown",
                dateSuggested: draft.suggestedOn || draft.dateSuggested, // Fallback if createdAt missing
                dateReviewed: draft.approvalDate,
                status: draft.approvalStatus || "Pending"
            }));

            // Initial sort by control name
            const sortedControls = mappedControls.sort((a, b) =>
                (b.status || "").localeCompare((a.status || ""), undefined, { sensitivity: 'base' })
            );
            setControls(sortedControls);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDownload = async () => {
        const dataToStore = controls;
        const documentName = `Suggested Site Controls Output Register`;

        try {
            // Updated to reflect this might be a different report, 
            // but keeping original endpoint if user didn't specify a new report route.
            const response = await fetch(`${process.env.REACT_APP_URL}/api/generateExcels/generate-xlsx-siteControls`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.xlsx`);
        } catch (error) {
            console.error("Error generating document:", error);
        }
    };

    // --- Excel Filtering Logic Helpers ---
    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        // Add category handler
        if (colId === "category") return [row.category ? String(row.category).trim() : "No Category"];
        if (colId === "critical") return [row.critical ? String(row.critical).trim() : "-"];

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
                return DEFAULT_SORT; // Reset to default "nr" sort
            }
            return { colId, direction };
        });
    };

    // --- Main Processing: Search -> Filter -> Sort ---

    const processedControls = useMemo(() => {
        let current = [...controls];

        // 1. Global Search (on control name)
        if (searchInput) {
            const lowerQ = searchInput.toLowerCase();
            current = current.filter(c =>
                c.control.toLowerCase().includes(lowerQ)
            );
        }

        // 2. Excel Column Filters
        current = current.filter((row, originalIndex) => {
            for (const [colId, selectedValues] of Object.entries(activeExcelFilters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;

                const cellValues = getFilterValuesForCell(row, colId, originalIndex);
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        // 3. Sorting
        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            // Default load order
        } else {
            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? "(Blanks)" : s;
            };

            current.sort((a, b) => {
                const valA = a[colId];
                const valB = b[colId];

                const normA = normalize(valA);
                const normB = normalize(valB);

                if (normA === "(Blanks)" && normB !== "(Blanks)") return 1;
                if (normA !== "(Blanks)" && normB === "(Blanks)") return -1;

                return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }

        return current;

    }, [controls, searchInput, activeExcelFilters, sortConfig]);

    // Added new columns to availableColumns
    const availableColumns = [
        { id: "nr", title: "Nr" },
        { id: "category", title: "Category" },
        { id: "control", title: "Control" },
        { id: "description", title: "Control Description" },
        { id: "performance", title: "Performance Requirements & Verification" },
        { id: "critical", title: "Critical Control" },
        { id: "act", title: "Act, Object or System" },
        { id: "activation", title: "Control Activation (Pre or Post Unwanted Event)" },
        { id: "hierarchy", title: "Hierarchy of Controls" },
        { id: "quality", title: "Control Quality" },
        { id: "cons", title: "Specific Consequence Addressed" },
        { id: "dateSuggested", title: "Date Suggested" },
        { id: "dateReviewed", title: "Date Reviewed" },
        { id: "suggestedBy", title: "Suggested By" },
        { id: "status", title: "Status" },
        { id: "suggestionMessage", title: "User Message" }
    ];

    const [showColumns, setShowColumns] = useState([
        "nr",
        "dateSuggested",
        "dateReviewed",
        "suggestedBy",
        "category",
        "status",
        "control",
        "description",
        "critical",
        "suggestionMessage"
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const allColumnIds = availableColumns.map(c => c.id);

    const toggleColumn = (columnId) => {
        if (columnId === "nr") return;

        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                return prev.filter(id => id !== columnId);
            }
            return [...prev, columnId];
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            setShowColumns(allColumnIds);
        } else {
            setShowColumns(["nr"]);
        }
    };

    const areAllColumnsSelected = () => {
        return allColumnIds.every(id => showColumns.includes(id));
    };

    // Groupings for the first header row
    const identificationColumns = ["control", "description", "performance", "critical"];
    const cerColumns = ["act", "activation", "hierarchy", "quality", "cons"];
    // Identify columns that span 2 rows (Standalone)
    const standaloneColumns = ["nr", "category", "dateSuggested", "dateReviewed", "suggestedBy", "status", "suggestionMessage"];

    const visibleIdentificationColumns = identificationColumns.filter(id => showColumns.includes(id));
    const visibleCerColumns = cerColumns.filter(id => showColumns.includes(id));

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

    const [columnWidths, setColumnWidths] = useState({
        nr: 60,
        category: 70,
        dateSuggested: 120,
        dateReviewed: 120,
        suggestedBy: 150,
        status: 100,
        control: 250,
        description: 320,
        performance: 260,
        critical: 90,
        act: 140,
        activation: 200,
        hierarchy: 220,
        quality: 120,
        cons: 150,
        suggestionMessage: 250
    });

    const [initialColumnWidths] = useState({
        nr: 60,
        category: 70,
        dateSuggested: 120,
        dateReviewed: 120,
        suggestedBy: 150,
        status: 100,
        control: 250,
        description: 320,
        performance: 260,
        critical: 90,
        act: 140,
        activation: 200,
        hierarchy: 220,
        quality: 120,
        cons: 150,
        suggestionMessage: 250
    });

    const columnSizeLimits = {
        nr: { min: 60, max: 60 },
        category: { min: 60, max: 150 },
        dateSuggested: { min: 100, max: 200 },
        dateReviewed: { min: 100, max: 200 },
        suggestedBy: { min: 100, max: 300 },
        status: { min: 80, max: 150 },
        control: { min: 150, max: 600 },
        description: { min: 200, max: 800 },
        performance: { min: 150, max: 600 },
        critical: { min: 70, max: 200 },
        act: { min: 100, max: 300 },
        activation: { min: 150, max: 400 },
        hierarchy: { min: 150, max: 400 },
        quality: { min: 100, max: 250 },
        cons: { min: 120, max: 300 },
        suggestionMessage: { min: 200, max: 650 }
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
    }, [showColumns, columnWidths]);

    const fitTableToWidth = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof columnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => columnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);

        if (totalWidth >= wrapperWidth) {
            setTableWidth(totalWidth);
            return;
        }

        const scale = wrapperWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);
        newWidths = newWidths.map(w => Math.round(w));

        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            newWidths[i % newWidths.length] += diff > 0 ? 1 : -1;
            diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidth);
        setWrapperWidth(wrapperWidth);
    };

    const resetColumnWidths = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof initialColumnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => initialColumnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        const scale = wrapperWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);
        newWidths = newWidths.map(w => Math.round(w));

        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            const idx = i % newWidths.length;
            newWidths[idx] += diff > 0 ? 1 : -1;
            diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidth);
        setWrapperWidth(wrapperWidth);
    };

    const isTableFitted =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        Math.abs(tableWidth - wrapperWidth) <= 1;

    const showFitButton =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        tableWidth < wrapperWidth - 1;

    const showResetButton =
        hasFittedOnce && !isTableFitted;

    useEffect(() => {
        if (!hasFittedOnce) return;
        fitTableToWidth();
    }, [isSidebarVisible, showColumns]);

    // Cleanup Popup Listeners
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

    // Popup Positioning
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

    // Format helper for dates
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const renderHeaderCell = (col) => {
        // Shared logic for rendering a TH with sort, filter, and resize
        const isActiveFilter = activeExcelFilters[col.id];
        const isActiveSort = sortConfig.colId === col.id && col.id !== "nr";

        return (
            <>
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
            </>
        );
    };

    useEffect(() => {
        // no id in URL -> do nothing
        if (!draftID) return;

        // if the id is literally "new", just return (do nothing)
        if (draftID === "new") return;

        // wait until controls are loaded
        if (!controls || controls.length === 0) return;

        // find the draft with this id
        const draft = controls.find(d => d._id === draftID);
        if (!draft) return; // id doesn't match any draft -> do nothing

        // only open if it's in Review (same rule as handleRowClick)
        if (draft.status !== "Pending") return;

        setSelectedDraft(draft);
        setShowPopup(true);
    }, [draftID, controls]);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== "nr" || sortConfig.direction !== "asc";
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortConfig]);

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig({ colId: "nr", direction: "asc" });
    };

    const getFilterBtnClass = () => {
        if (showResetButton) {
            return "top-right-button-control-att-3";
        }

        return "top-right-button-control-att-2";
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
                        <p className="logo-text-dm-fi">{`Suggested Controls`}</p>
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
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper">
                        <label className="risk-control-label">Suggested Controls</label>

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
                                className={showFitButton ? "top-right-button-control-att-2" : "top-right-button-control-att-2"}
                                onClick={resetColumnWidths}
                            />
                        )}

                        <FontAwesomeIcon
                            icon={faFilter}
                            className={getFilterBtnClass()} // Calculated class (e.g., ibra4, ibra5, ibra6)
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{
                                cursor: hasActiveFilters ? "pointer" : "default",
                                color: hasActiveFilters ? "#002060" : "gray",
                                userSelect: "none"
                            }}
                            onDoubleClick={handleClearFilters}
                        />

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

                                    <div
                                        className="column-checkbox-container"
                                    >
                                        {availableColumns.map(column => (
                                            <div className="column-checkbox-item" key={column.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(column.id)}
                                                        disabled={column.id === 'nr'}
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
                            <thead className="risk-control-attributes-head" style={{ fontSize: "14px" }}>
                                <tr>
                                    {/* Render Headers Row 1: Standalone columns (RowSpan 2) AND Group Headers (ColSpan X) */}
                                    {availableColumns.map(col => {
                                        if (!showColumns.includes(col.id)) return null;

                                        // 1. Standalone Columns (RowSpan 2)
                                        if (standaloneColumns.includes(col.id)) {
                                            return (
                                                <th
                                                    key={col.id}
                                                    rowSpan={2}
                                                    className={`risk-control-attributes`} // Ensure CSS exists for these classes
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
                                                        cursor: col.id === "nr" ? "default" : "pointer",
                                                        zIndex: 2, // Bring above row 2 headers visually if needed
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    {renderHeaderCell(col)}
                                                </th>
                                            );
                                        }

                                        // 2. Control ID Group Header
                                        if (col.id === visibleIdentificationColumns[0] && visibleIdentificationColumns.length > 0) {
                                            return (
                                                <th
                                                    key="group-id"
                                                    colSpan={visibleIdentificationColumns.length}
                                                    className="risk-control-attributes-split"
                                                >
                                                    Control Identification
                                                </th>
                                            );
                                        }

                                        // 3. CER Group Header
                                        if (col.id === visibleCerColumns[0] && visibleCerColumns.length > 0) {
                                            return (
                                                <th
                                                    key="group-cer"
                                                    colSpan={visibleCerColumns.length}
                                                    className="risk-control-attributes-th"
                                                >
                                                    Control Effectiveness Rating (CER)
                                                </th>
                                            );
                                        }

                                        // If it is inside a group but NOT the first one, it is handled by the colSpan of the first one in this row.
                                        // We return null here.
                                        return null;
                                    })}
                                </tr>
                                <tr>
                                    {/* Render Headers Row 2: Only the columns belonging to a group */}
                                    {availableColumns.map(col => {
                                        if (!showColumns.includes(col.id)) return null;
                                        if (standaloneColumns.includes(col.id)) return null; // Already rendered in Row 1

                                        // Map legacy classes
                                        const classMap = {
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

                                        return (
                                            <th
                                                key={col.id}
                                                className={classMap[col.id] || ""}
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
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {renderHeaderCell(col)}
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
                                {processedControls.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={showColumns.length}
                                            style={{
                                                textAlign: "center",
                                                padding: "25px",
                                                fontSize: "14px",
                                                color: "#666",
                                                fontStyle: "italic"
                                            }}
                                        >
                                            There are currently no suggested controls for your approval.
                                        </td>
                                    </tr>
                                ) : (
                                    processedControls.map((row, index) => (
                                        <tr className="table-scroll-wrapper-attributes-controls" key={row._id ?? index} onClick={() => {
                                            if (drag.current.moved) return;
                                            if (row.status === "Approved" || row.status === "Declined") return;
                                            setSelectedDraft(row);
                                            setShowPopup(true);
                                        }}>
                                            {showColumns.includes("nr") && (
                                                <td className="procCent" style={{ fontSize: "14px" }}>
                                                    {index + 1}
                                                </td>
                                            )}

                                            {showColumns.includes("category") && (
                                                <td style={{ fontSize: "14px" }}>{row.category}</td>
                                            )}

                                            {showColumns.includes("control") && (
                                                <td style={{ fontSize: "14px" }}>{row.control}</td>
                                            )}

                                            {showColumns.includes("description") && (
                                                <td style={{ fontSize: "14px" }}>{row.description}</td>
                                            )}

                                            {showColumns.includes("performance") && (
                                                <td style={{ fontSize: "14px" }}>{row.performance}</td>
                                            )}

                                            {showColumns.includes("critical") && (
                                                <td
                                                    className={`${row.critical === "Yes"
                                                        ? "procCent cea-table-page-critical"
                                                        : "procCent"
                                                        }`}
                                                    style={{ fontSize: "14px" }}
                                                >
                                                    {row.critical}
                                                </td>
                                            )}

                                            {showColumns.includes("act") && (
                                                <td className="procCent" style={{ fontSize: "14px" }}>
                                                    {row.act}
                                                </td>
                                            )}

                                            {showColumns.includes("activation") && (
                                                <td style={{ fontSize: "14px" }}>{row.activation}</td>
                                            )}

                                            {showColumns.includes("hierarchy") && (
                                                <td style={{ fontSize: "14px" }}>{row.hierarchy}</td>
                                            )}

                                            {showColumns.includes("quality") && (
                                                <td style={{ fontSize: "14px" }}>{row.quality}</td>
                                            )}

                                            {showColumns.includes("cons") && (
                                                <td style={{ fontSize: "14px" }}>{row.cons}</td>
                                            )}

                                            {showColumns.includes("dateSuggested") && (
                                                <td style={{ fontSize: "14px", textAlign: "center" }}>{formatDate(row.dateSuggested)}</td>
                                            )}

                                            {showColumns.includes("dateReviewed") && (
                                                <td style={{ fontSize: "14px", textAlign: "center" }}>{formatDate(row.dateReviewed)}</td>
                                            )}

                                            {showColumns.includes("suggestedBy") && (
                                                <td style={{ fontSize: "14px", textAlign: "center" }}>{row.suggestedBy}</td>
                                            )}

                                            {showColumns.includes("status") && (
                                                <td
                                                    className={
                                                        row.status === "Approved" ? "procCent status-good" :
                                                            row.status === "Declined" ? "procCent status-worst" : // Assuming you have a red/danger class, reusing 'high' or similar
                                                                "procCent status-missing"
                                                    }
                                                    style={{ fontSize: "14px", fontWeight: "bold" }}
                                                >
                                                    {row.status}
                                                </td>
                                            )}

                                            {showColumns.includes("suggestionMessage") && (
                                                <td
                                                    style={{ fontSize: "14px", fontWeight: "normal" }}
                                                >
                                                    {row.suggestionMessage ? row.suggestionMessage : "-"}
                                                </td>
                                            )}
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Excel Filter Popup */}
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

            {showPopup && (<SuggestControlPopup data={selectedDraft} onClose={() => setShowPopup(false)} onSuccess={fetchControls} />)}
            <ToastContainer />
        </div >
    );
};

export default SuggestedControls;