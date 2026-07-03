import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faEraser, faTimes, faDownload, faCaretLeft, faCaretRight, faTableColumns, faArrowsLeftRight, faArrowsRotate, faFolderOpen, faCirclePlus, faEdit, faFilter, faSort, faFile, faSave, faCheck, faX, faCalendarAlt, faClock, faClockRotateLeft, faTrash, faRotate, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { saveAs } from "file-saver";
import TopBar from "../../Notifications/TopBar";
import { canIn, getCurrentUser } from "../../../utils/auth";
import AddControlPopup from "../AddControlPopup";
import { ToastContainer, toast } from "react-toastify"; // Added toast import
import EditControlPopup from "../EditControlPopup";
import ControlPopupMenuOptions from "../ControlPopupMenuOptions";
import DeleteControlCMPopup from "../ControlManagement/DeleteControlCMPopup";
import MigrateDraftOwnership from "../../DraftMigration/MigrateDraftOwnership";

const DeletedControlAttributes = () => {
    const [controls, setControls] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    // Removed manual filteredControls state in favor of useMemo
    const [searchPopupVisible, setSearchPopupVisible] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const access = getCurrentUser();
    const scrollerRef = useRef(null);
    const tbodyRef = useRef(null);
    const DRAG_THRESHOLD_PX = 6;
    const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
    const [addControl, setAddControl] = useState(false);
    const [modifyControl, setModifyControl] = useState(false);
    const [deleteControlPopup, setDeleteControlPopup] = useState(false);
    const [deletionControl, setDeletionControl] = useState(false);
    const [modifyingControl, setModifyingControl] = useState("")
    const [categoryChanges, setCategoryChanges] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]);
    const [showRecentChanges, setShowRecentChanges] = useState(false);
    const [categoryTab, setCategoryTab] = useState("All");

    const toggleRecentChanges = () => {
        setShowRecentChanges(prev => !prev);
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    // --- NEW: Dropdown State & Refs ---
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [activeCategoryRow, setActiveCategoryRow] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const categoryInputRefs = useRef({}); // Store refs for each row's textarea
    const dropdownRef = useRef(null);

    const DROPDOWN_MAX_HEIGHT = 240; // px
    const DROPDOWN_MARGIN = 8;       // viewport padding

    // --- Unified Sort Configuration ---
    const DEFAULT_SORT = { colId: null, direction: "asc" };
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
    const [activeControlMenuId, setActiveControlMenuId] = useState(null);

    const formatUpdatedAt = (dateString) => {
        if (!dateString) return "-";
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return "-";

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const handleControlRowClick = (row) => (e) => {
        if (drag.current.moved) return;

        if (
            e.target.closest(".rca-action-btn") ||
            e.target.closest(".risk-control-attributes-action-cell") ||
            e.target.closest(".category-input-container") ||
            e.target.closest(".control-popup-menu") ||
            e.target.closest("button") ||
            e.target.closest("a") ||
            e.target.closest("input") ||
            e.target.closest("textarea") ||
            e.target.closest("select")
        ) {
            return;
        }

        setActiveControlMenuId(prev => (prev === row._id ? null : row._id));
    };

    useEffect(() => {
        if (!activeControlMenuId) return;

        const handleClickOutside = (e) => {
            if (e.target.closest(".control-popup-menu")) return;
            setActiveControlMenuId(null);
        };

        const handleScroll = (e) => {
            if (e.target.closest(".control-popup-menu")) return;
            setActiveControlMenuId(null);
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [activeControlMenuId]);

    const openConfirmDelete = (control) => {
        setDeletionControl(control);
        setDeleteControlPopup(true);
    }

    const closeConfirmDelete = () => {
        setDeleteControlPopup(false);
        fetchControls();
    }

    const onNativeDragStart = (e) => {
        e.preventDefault();
    };

    const onRowPointerDown = (e) => {
        if (
            e.target.closest(".rca-action-btn") ||
            e.target.closest(".risk-control-attributes-action-cell") ||
            e.target.closest(".category-input-container") ||
            e.target.closest(".control-popup-menu") ||
            e.target.closest("button") ||
            e.target.closest("a") ||
            e.target.closest("input") ||
            e.target.closest("textarea") ||
            e.target.closest("select")
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

        // Don't treat it as a drag until user moves enough
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
        const route = `/api/riskInfo/deleted-controls`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }

            const data = await response.json();

            const sortedControls = data.controls.sort((a, b) =>
                a.control.localeCompare(b.control, undefined, { sensitivity: 'base' })
            );

            setControls(sortedControls);

        } catch (error) {
            setError(error.message);
        }
    };

    const deleteControl = async (id) => {
        const route = `/api/riskInfo/deletedControls/${id}/permanent`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to delete control");
            }

            fetchControls();
            setDeleteControlPopup(false);

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Control Deleted from System", {   // ✅ uses backend message
                closeButton: true,
                autoClose: 1200,
                style: { textAlign: "center" }
            });

        } catch (error) {
            setError(error.message);

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Could not delete control.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: "center" }
            });
        }
    };

    const restoreControl = async (id) => {
        const route = `/api/riskInfo/restoreControls/${id}`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to delete control");
            }

            fetchControls();

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Control Restored to Control Management", {   // ✅ uses backend message
                closeButton: true,
                autoClose: 1200,
                style: { textAlign: "center" }
            });

        } catch (error) {
            setError(error.message);

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Could not restore control.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: "center" }
            });
        }
    };

    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        // Add category handler
        if (colId === "category") return [row.category ? String(row.category).trim() : "-"];
        if (colId === "critical") return [row.critical ? String(row.critical).trim() : "-"];
        if (colId === "updatedAt") return [formatUpdatedAt(row?.updatedAt)];

        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        let filtered = [...controls];

        // 1. Apply Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                (c.control || "").toLowerCase().includes(lowerQ)
            );
        }

        // 2. Apply pill filter first, so popup options only reflect the active pill
        if (categoryTab === "General") {
            filtered = filtered.filter(row =>
                String(row.category || "").trim().toLowerCase() === "general"
            );
        } else if (categoryTab === "Specialised") {
            filtered = filtered.filter(row => {
                const category = String(row.category || "").trim().toLowerCase();
                return category !== "general";
            });
        }

        // 3. Apply filters from all OTHER active columns
        for (const [filterColId, selectedValues] of Object.entries(activeExcelFilters)) {
            if (filterColId === colId) continue;
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        // 4. Extract unique values for the requested column from the filtered subset
        const uniqueValues = Array.from(
            new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
        ).sort((a, b) =>
            String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
        );

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
                return DEFAULT_SORT; // Reset to default "nr" sort
            }
            return { colId, direction };
        });
    };

    const processedControls = useMemo(() => {
        let current = [...controls];

        // 1. Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(c =>
                (c.control || "").toLowerCase().includes(lowerQ)
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

        // 3. Pill filter
        if (categoryTab === "General") {
            current = current.filter(row =>
                String(row.category || "").trim().toLowerCase() === "general"
            );
        } else if (categoryTab === "Specialised") {
            current = current.filter(row => {
                const category = String(row.category || "").trim().toLowerCase();
                return category !== "general";
            });
        }

        const normalize = (v) => {
            const s = v == null ? "" : String(v).trim();
            return s === "" ? "(Blanks)" : s;
        };

        const compareText = (a, b) =>
            String(a).localeCompare(String(b), undefined, {
                numeric: true,
                sensitivity: "base"
            });

        const compareDefaultCategory = (a, b) => {
            const catA = normalize(a?.category);
            const catB = normalize(b?.category);

            const isGeneralA = catA.toLowerCase() === "general";
            const isGeneralB = catB.toLowerCase() === "general";

            if (isGeneralA && !isGeneralB) return -1;
            if (!isGeneralA && isGeneralB) return 1;

            if (catA === "(Blanks)" && catB !== "(Blanks)") return 1;
            if (catA !== "(Blanks)" && catB === "(Blanks)") return -1;

            return compareText(catA, catB);
        };

        current.sort((a, b) => {
            if (!sortConfig?.colId) {
                const categoryResult = compareDefaultCategory(a, b);
                if (categoryResult !== 0) return categoryResult;

                const controlA = normalize(a?.control);
                const controlB = normalize(b?.control);
                return compareText(controlA, controlB);
            }

            const { colId, direction } = sortConfig;
            const dir = direction === "desc" ? -1 : 1;

            const valA = normalize(a?.[colId]);
            const valB = normalize(b?.[colId]);

            if (valA === "(Blanks)" && valB !== "(Blanks)") return 1;
            if (valA !== "(Blanks)" && valB === "(Blanks)") return -1;

            const mainResult = compareText(valA, valB) * dir;
            if (mainResult !== 0) return mainResult;

            const controlA = normalize(a?.control);
            const controlB = normalize(b?.control);

            if (controlA === "(Blanks)" && controlB !== "(Blanks)") return 1;
            if (controlA !== "(Blanks)" && controlB === "(Blanks)") return -1;

            return compareText(controlA, controlB);
        });

        return current;
    }, [controls, searchQuery, activeExcelFilters, categoryTab, sortConfig]);

    const availableColumns = [
        { id: "nr", title: "Nr" },
        { id: "category", title: "Category" }, // New Column Added
        { id: "control", title: "Control" },
        { id: "description", title: "Control Description" },
        { id: "performance", title: "Performance Requirements & Verification" },
        { id: "critical", title: "Critical Control" },
        { id: "act", title: "Act, Object or System" },
        { id: "activation", title: "Control Activation (Pre or Post Unwanted Event)" },
        { id: "hierarchy", title: "Hierarchy of Controls" },
        { id: "quality", title: "Control Quality" },
        { id: "cons", title: "Specific Consequence Addressed" },
        { id: "updatedAt", title: "Updated On" },
        { id: "deletingUser", title: "Deleted By" },
        { id: "deletedAt", title: "Deleted On" },
        { id: "action", title: "Action" },
    ];

    const [showColumns, setShowColumns] = useState([
        "nr",
        "category",
        "control",
        "critical",
        "act",
        "activation",
        "hierarchy",
        "cons",
        "deletedAt",
        "deletingUser",
        "action",
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

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
        if (selectAll) {
            setShowColumns(allColumnIds);
        } else {
            setShowColumns(["nr", "action"]);
        }
    };

    const areAllColumnsSelected = () => {
        return allColumnIds.every(id => showColumns.includes(id));
    };

    // Groupings for the first header row
    const identificationColumns = ["nr", "category", "control", "description", "performance", "critical"];
    const cerColumns = ["act", "activation", "hierarchy", "quality", "cons"];

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
        category: 30, // Default width for Category
        control: 200,
        description: 320,
        performance: 260,
        critical: 50,
        act: 50,
        activation: 100,
        hierarchy: 70,
        quality: 120,
        cons: 90,
        updatedAt: 200,
        deletedAt: 200,
        deletingUser: 200,
        action: 80,
    });

    const [initialColumnWidths] = useState({
        nr: 60,
        category: 30,
        control: 200,
        description: 320,
        performance: 260,
        critical: 50,
        act: 50,
        activation: 100,
        hierarchy: 70,
        quality: 120,
        cons: 90,
        updatedAt: 200,
        deletedAt: 100,
        deletingUser: 100,
        action: 80,
    });

    const columnSizeLimits = {
        nr: { min: 60, max: 60 },
        category: { min: 30, max: 300 }, // Limits for category
        control: { min: 150, max: 600 },
        description: { min: 200, max: 800 },
        performance: { min: 150, max: 600 },
        critical: { min: 50, max: 200 },
        act: { min: 50, max: 300 },
        activation: { min: 100, max: 400 },
        hierarchy: { min: 70, max: 400 },
        quality: { min: 100, max: 250 },
        cons: { min: 90, max: 300 },
        updatedAt: { min: 160, max: 320 },
        deletingUser: { min: 160, max: 320 },
        deletedAt: { min: 160, max: 320 },
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

        const defaultColumns = [
            "nr",
            "category",
            "control",
            "critical",
            "act",
            "activation",
            "hierarchy",
            "cons",
            "deletedAt",
            "deletingUser",
            "action",
        ];

        setShowColumns(defaultColumns);

        const visibleCols = defaultColumns.filter(
            id => typeof initialColumnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => initialColumnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        const scale = wrapperWidth / totalWidth;
        let newWidths = prevWidths.map(w => Math.round(w * scale));

        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;

        while (diff !== 0 && i < newWidths.length * 10) {
            const idx = i % newWidths.length;
            const colId = visibleCols[idx];
            const limits = columnSizeLimits[colId] || {};

            if (diff > 0) {
                if (limits.max == null || newWidths[idx] < limits.max) {
                    newWidths[idx] += 1;
                    diff -= 1;
                }
            } else {
                if (limits.min == null || newWidths[idx] > limits.min) {
                    newWidths[idx] -= 1;
                    diff += 1;
                }
            }

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

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== null || sortConfig.direction !== "asc";
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortConfig]);

    const openFilterMenu = (e) => {
        if (!hasActiveFilters) return;
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        setFilterMenu({ isOpen: true, anchorRect: rect });
    };

    const closeFilterMenuWithDelay = () => {
        filterMenuTimerRef.current = setTimeout(() => {
            setFilterMenu(prev => ({ ...prev, isOpen: false }));
        }, 200);
    };

    const cancelCloseFilterMenu = () => {
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
    };

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig({ colId: null, direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        if (showResetButton) {
            return "top-right-button-control-att-3-new";
        }

        return "top-right-button-control-att-2-new";
    };

    return (
        <div className="risk-control-attributes-container" style={{ userSelect: "none" }}>
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
                        <p className="logo-text-dm-fi">{`Deleted Controls`}</p>
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

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper-new">
                        <div className="control-attributes-pill-bar">
                            {["All", "General", "Specialised"].map((pill) => (
                                <div
                                    key={pill}
                                    className={`control-attributes-pill ${categoryTab === pill ? "active" : ""}`}
                                    onClick={() => setCategoryTab(pill)}
                                >
                                    {pill}
                                </div>
                            ))}
                        </div>

                        <label className="risk-control-label-new">Deleted Controls</label>

                        <FontAwesomeIcon
                            icon={faTableColumns}
                            title="Show / Hide Columns"
                            className="top-right-button-control-att-new"
                            onClick={() => setShowColumnSelector(prev => !prev)}
                        />

                        <FontAwesomeIcon
                            icon={faFilter}
                            className={getFilterBtnClass()} // Calculated class (e.g., ibra4, ibra5, ibra6)
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{
                                cursor: hasActiveFilters ? "pointer" : "default",
                                color: hasActiveFilters ? "#002060" : "gray",
                                userSelect: "none"
                            }}
                            onMouseEnter={(e) => {
                                if (hasActiveFilters) openFilterMenu(e);
                            }}
                            onMouseLeave={closeFilterMenuWithDelay}
                            onDoubleClick={handleClearFilters}
                        />

                        {showResetButton && (
                            <FontAwesomeIcon
                                icon={faArrowsRotate}
                                title="Reset column widths"
                                className={showFitButton ? "top-right-button-control-att-2-new" : "top-right-button-control-att-2-new"}
                                onClick={resetColumnWidths}
                            />
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

                                    <div
                                        className="column-checkbox-container"
                                    >
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
                            <thead style={{ fontSize: "14px" }} className="risk-control-attributes-head">
                                <tr>
                                    {visibleIdentificationColumns.length > 0 && (
                                        <th
                                            colSpan={visibleIdentificationColumns.length}
                                            className="risk-control-attributes-split trashed"
                                        >
                                            Control Identification
                                        </th>
                                    )}
                                    {visibleCerColumns.length > 0 && (
                                        <th
                                            colSpan={visibleCerColumns.length}
                                            className="risk-control-attributes-th trashed"
                                        >
                                            Control Effectiveness Rating (CER)
                                        </th>
                                    )}

                                    {showColumns.includes("updatedAt") && (
                                        <th
                                            className="risk-control-attributes-category trashed"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.updatedAt ? `${columnWidths.updatedAt}px` : undefined,
                                                minWidth: columnSizeLimits.updatedAt?.min,
                                                maxWidth: columnSizeLimits.updatedAt?.max,
                                                cursor: "pointer",
                                                zIndex: 2,
                                                textAlign: "center",
                                                borderLeft: "1px solid white",
                                            }}
                                            onClick={(e) => {
                                                if (isResizingRef.current) return;
                                                if (e.target.classList.contains("rca-col-resizer")) return;
                                                openExcelFilterPopup("updatedAt", e);
                                            }}
                                        >
                                            <span>Updated On</span>
                                            {(activeExcelFilters["updatedAt"] || sortConfig.colId === "updatedAt") && (
                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                            )}
                                            <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, "updatedAt")} />
                                        </th>
                                    )}

                                    {showColumns.includes("deletedAt") && (
                                        <th
                                            className="risk-control-attributes-category trashed"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.deletedAt ? `${columnWidths.deletedAt}px` : undefined,
                                                minWidth: columnSizeLimits.deletedAt?.min,
                                                maxWidth: columnSizeLimits.deletedAt?.max,
                                                cursor: "pointer",
                                                zIndex: 2,
                                                textAlign: "center",
                                                borderLeft: "1px solid white",
                                            }}
                                            onClick={(e) => {
                                                if (isResizingRef.current) return;
                                                if (e.target.classList.contains("rca-col-resizer")) return;
                                                openExcelFilterPopup("deletedAt", e);
                                            }}
                                        >
                                            <span>Deleted By</span>
                                            {(activeExcelFilters["deletedAt"] || sortConfig.colId === "deletedAt") && (
                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                            )}
                                            <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, "deletedAt")} />
                                        </th>
                                    )}

                                    {showColumns.includes("deletingUser") && (
                                        <th
                                            className="risk-control-attributes-category trashed"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.deletingUser ? `${columnWidths.deletingUser}px` : undefined,
                                                minWidth: columnSizeLimits.deletingUser?.min,
                                                maxWidth: columnSizeLimits.deletingUser?.max,
                                                cursor: "pointer",
                                                zIndex: 2,
                                                textAlign: "center",
                                                borderLeft: "1px solid white",
                                            }}
                                            onClick={(e) => {
                                                if (isResizingRef.current) return;
                                                if (e.target.classList.contains("rca-col-resizer")) return;
                                                openExcelFilterPopup("deletingUser", e);
                                            }}
                                        >
                                            <span>Deleted On</span>
                                            {(activeExcelFilters["deletingUser"] || sortConfig.colId === "deletingUser") && (
                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                            )}
                                            <div className="rca-col-resizer" onMouseDown={(e) => startColumnResize(e, "deletingUser")} />
                                        </th>
                                    )}

                                    {showColumns.includes("action") && (
                                        <th
                                            className="risk-control-attributes-action-del trashed"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.action
                                                    ? `${columnWidths.action}px`
                                                    : undefined,
                                                minWidth: columnSizeLimits.action?.min,
                                                maxWidth: columnSizeLimits.action?.max,
                                                cursor: "default",
                                                backgroundColor: "#CB6F6F",
                                                color: "white",
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
                                    {/* Render header columns dynamically with filter logic */}
                                    {availableColumns.map(col => {
                                        if (col.id === "action") return null; // Handled in rowSpan above
                                        if (col.id === "updatedAt") return null;
                                        if (col.id === "deletedAt") return null;
                                        if (col.id === "deletingUser") return null;

                                        if (!showColumns.includes(col.id)) return null;

                                        // Map to current CSS classes
                                        const classMap = {
                                            nr: "risk-control-attributes-nr",
                                            category: "risk-control-attributes-control",
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
                                                    // Prevent open if resizing
                                                    if (isResizingRef.current) return;
                                                    // Only open if clicking header background, not resizer
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
                                {processedControls.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={showColumns.length}
                                            style={{
                                                textAlign: "center",
                                                padding: "20px",
                                                color: "#777",
                                                fontStyle: "italic"
                                            }}
                                        >
                                            No deleted controls found
                                        </td>
                                    </tr>
                                ) : (
                                    processedControls.map((row, index) => {
                                        const currentVal = categoryChanges[row._id];
                                        const originalVal = row.category || "";
                                        const isRecent =
                                            showRecentChanges &&
                                            row.updatedAt &&
                                            (Date.now() - new Date(row.updatedAt).getTime()) <
                                            30 * 24 * 60 * 60 * 1000;

                                        return (
                                            <tr
                                                className={`table-scroll-wrapper-attributes-controls ${isRecent ? "recent-control-row" : ""}`}
                                                key={row._id ?? index}
                                                onClick={handleControlRowClick(row)}
                                            >
                                                {showColumns.includes("nr") && (
                                                    <td className="procCent" style={{ fontSize: "14px" }}>
                                                        {index + 1}
                                                    </td>
                                                )}

                                                {showColumns.includes("category") && (
                                                    <td style={{ fontSize: "14px", padding: "4px", textAlign: "center" }}>
                                                        {row.category || ""}
                                                    </td>
                                                )}

                                                {showColumns.includes("control") && (
                                                    <td style={{ fontSize: "14px", position: "relative" }}>
                                                        {row.control}

                                                        {activeControlMenuId === row._id && (
                                                            <ControlPopupMenuOptions
                                                                id={row._id}
                                                                deleted={true}
                                                                onClose={() => setActiveControlMenuId(null)}
                                                            />
                                                        )}
                                                    </td>
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
                                                            ? "procCent"
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

                                                {showColumns.includes("updatedAt") && (
                                                    <td style={{ fontSize: "14px", textAlign: "center" }}>
                                                        {formatUpdatedAt(row?.updatedAt)}
                                                    </td>
                                                )}

                                                {showColumns.includes("deletingUser") && (
                                                    <td style={{ fontSize: "14px", textAlign: "center" }}>
                                                        {(row?.deletingUser?.username)}
                                                    </td>
                                                )}

                                                {showColumns.includes("deletedAt") && (
                                                    <td style={{ fontSize: "14px", textAlign: "center" }}>
                                                        {formatUpdatedAt(row?.deletedAt)}
                                                    </td>
                                                )}

                                                {showColumns.includes("action") && (
                                                    <td className="risk-control-attributes-action-cell">
                                                        <button
                                                            type="button"
                                                            className="rca-action-btn"
                                                            title="Restore Control"
                                                            onClick={() => restoreControl(row._id)}
                                                        >
                                                            <FontAwesomeIcon icon={faRotateLeft} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="rca-action-btn"
                                                            title="Delete Control"
                                                            style={{ marginLeft: "5px" }}
                                                            onClick={() => openConfirmDelete(row)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })
                                )}
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

            {deleteControlPopup && (<DeleteControlCMPopup closeModal={closeConfirmDelete} control={deletionControl} deleteControl={deleteControl} />)}
            <ToastContainer />
        </div >
    );
};

export default DeletedControlAttributes;