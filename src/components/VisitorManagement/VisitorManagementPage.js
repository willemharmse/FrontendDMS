import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faX, faFileCirclePlus, faSearch, faArrowLeft, faEdit, faTrash, faShare, faShareAlt, faCirclePlay, faCirclePlus, faBookOpen, faDownload, faBook, faUser, faUserGroup, faColumns, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../utils/auth";
import SortPopupVisitors from "../VisitorsInduction/Popups/SortPopupVisitors";
import TopBar from "../Notifications/TopBar";
import DatePicker from "react-multi-date-picker";
import SortPopupVisitorManagementPage from "./SortPopupVisitorManagementPage";

const VisitorManagementPage = () => {
    const [expandedRow, setExpandedRow] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const access = getCurrentUser();
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);

    // Unified Sort Configuration
    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    // Excel Filter States
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

    const navigate = useNavigate();
    const scrollerRef = React.useRef(null);
    const dragRef = React.useRef({
        active: false,
        startX: 0,
        startScrollLeft: 0,
        hasDragged: false
    });
    const [isDraggingX, setIsDraggingX] = useState(false);

    const DRAG_THRESHOLD = 5;

    const isInteractive = (el) =>
        !!el.closest('button, a, input, textarea, select, [role="button"], .no-drag');

    const onPointerDownX = (e) => {
        const el = scrollerRef.current;
        if (!el) return;

        // If the press is on an interactive element, don't start drag logic
        if (isInteractive(e.target)) return;

        dragRef.current.active = true;
        dragRef.current.hasDragged = false;
        dragRef.current.startX = e.clientX;
        dragRef.current.startScrollLeft = el.scrollLeft;
        // IMPORTANT: do NOT set isDraggingX yet; wait until we cross threshold
    };

    const onPointerMoveX = (e) => {
        const el = scrollerRef.current;
        if (!el || !dragRef.current.active) return;

        const dx = e.clientX - dragRef.current.startX;

        if (!dragRef.current.hasDragged) {
            if (Math.abs(dx) >= DRAG_THRESHOLD) {
                dragRef.current.hasDragged = true;
                setIsDraggingX(true);
                try { el.setPointerCapture?.(e.pointerId); } catch { }
            } else {
                return; // still a click, do nothing
            }
        }

        el.scrollLeft = dragRef.current.startScrollLeft - dx;
        // prevent text selection while actually dragging
        e.preventDefault();
    };

    const endDragX = (e) => {
        const el = scrollerRef.current;
        if (dragRef.current.active && dragRef.current.hasDragged && e?.pointerId != null) {
            try { el?.releasePointerCapture?.(e.pointerId); } catch { }
        }
        dragRef.current.active = false;
        dragRef.current.hasDragged = false;
        setIsDraggingX(false);
    };

    const toggleRow = (rowKey) => {
        setExpandedRow((prev) => (prev === rowKey ? null : rowKey));
    };

    const getComplianceColor = (status) => {
        if (status === "valid") return "status-good";
        if (status === "requiresRetake") return "status-bad"
        if (status === "invalid") return "status-worst";
        if (status === "-") return "status-missing"
    };

    const formatStatus = (type) => {
        if (!type) return "-";
        if (type === "requiresRetake") return "Requires Retake"
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    const extractNumbers = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        // keep only one leading +
        return cleaned.startsWith('+')
            ? '+' + cleaned.slice(1).replace(/\+/g, '')
            : cleaned.replace(/\+/g, '');
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${day}.${month}.${year}`;
    };

    const [files, setFiles] = useState([]);
    const [token, setToken] = useState('');

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    const fetchFiles = async () => {
        const route = `/api/visitorDevices/getVisitorsWithDevices`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            console.log(data);
            setFiles(data.visitors);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [token]);

    const totalCols = canIn(access, "TMS", ["systemAdmin", "contributor"]) ? 9 : 8;
    const openSortModal = () => setIsSortModalOpen(true);
    const closeSortModal = () => setIsSortModalOpen(false);

    // Sort logic integrated into processedFiles, but wrapper for popup if needed
    const handleGlobalSort = () => {
        closeSortModal();
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    // Which columns exist and how to render them
    const allColumns = [
        { id: "nr", title: "Nr", thClass: "visitor-management-num-filter", td: (f, i) => i + 1 },
        { id: "name", title: "Name", thClass: "visitor-management-name-filter", td: (f) => f.name },
        { id: "surname", title: "Surname", thClass: "visitor-management-surname-filter", td: (f) => f.surname },
        { id: "email", title: "Email", thClass: "visitor-management-email-filter", td: (f) => f.email ?? "-" },
        { id: "phone", title: "Contact Number", thClass: "visitor-management-phone-filter", td: (f) => extractNumbers(f.contactNr) ?? "-" },
        { id: "idnum", title: "ID/Passport", thClass: "visitor-management-id-filter", td: (f) => f.idNumber ?? "-" },
        { id: "company", title: "Company", thClass: "visitor-management-company-filter", td: (f) => f.company ?? "-" },
        { id: "createdBy", title: "Profile Created By", thClass: "visitor-management-profileBy-filter", td: (f) => f.profileCreatedBy?.username ?? "-" },
        { id: "validity", title: "Induction Validity", thClass: "visitor-management-valid-filter", td: (f) => formatStatus(f.validity) ?? "-" },
        { id: "createdDate", title: "Profile Creation Date", thClass: "visitor-management-added-filter", td: (f) => formatDate(f.dateAdded) ?? "-" },
        { id: "completionDate", title: "Induction Completion Date", thClass: "visitor-management-comp-filter", td: (v) => formatDate(v.completionDate) ?? "-" },
        { id: "expiry", title: "Induction Expiry Date", thClass: "visitor-management-exp-filter", td: (f) => formatDate(f.expiryDate) },
        { id: "version", title: "Induction Version Nr", thClass: "visitor-management-vers-filter", td: (f) => f.indicationVersion ?? "-" },
        // "action" column is permission-based
    ];

    const [showColumns, setShowColumns] = useState(() => {
        const base = ["nr", "name", "surname", "company", "createdBy", "createdDate", "completionDate", "expiry"];
        return canIn(access, "TMS", ["systemAdmin", "contributor"]) ? [...base, "action"] : base;
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const availableColumns = React.useMemo(() => {
        let cols = [...allColumns];
        return cols;
    }, [access]);

    const toggleColumn = (id) => {
        setShowColumns(prev => {
            if (id === "nr" || id === "action") return prev;
            return prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            const allIds = availableColumns.map(c => c.id);
            setShowColumns(allIds);
        } else {
            setShowColumns(
                canIn(access, "TMS", ["systemAdmin", "contributor"]) ? ["nr", "action"] : ["nr"]
            );
        }
    };

    const areAllSelected = () => {
        const selectable = availableColumns.map(c => c.id);
        return selectable.every(id => showColumns.includes(id));
    };

    const visibleColumns = availableColumns.filter(c => showColumns.includes(c.id));
    const visibleCount = visibleColumns.length;
    const isWide = visibleCount > 9;

    // --- Excel Filtering Helpers ---

    const getFilterValuesForCell = (row, colId, index) => {
        // Handle fields that need formatting
        if (colId === "nr") return [String(index + 1)]; // using index based on original load
        if (colId === "phone") return [extractNumbers(row.contactNr ?? "")];
        if (colId === "createdBy") return [row.profileCreatedBy?.username ?? "-"];
        if (colId === "validity") return [formatStatus(row.validity ?? "-")];

        // Dates
        if (colId === "createdDate") return [formatDate(row.dateAdded)];
        if (colId === "completionDate") return [formatDate(row.completionDate)];
        if (colId === "expiry") return [formatDate(row.expiryDate)];

        // Standard fields (name, surname, etc)
        // Map colId to actual data key if different
        let key = colId;
        if (colId === "idnum") key = "idNumber";
        if (colId === "version") key = "indicationVersion";

        const val = row[key];
        return [val ? String(val).trim() : "-"];
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Build unique values across ALL rows
        const values = Array.from(
            new Set(
                (files || []).flatMap((r, i) => getFilterValuesForCell(r, colId, i))
            )
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

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

    // --- Sorting Logic ---

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT; // Reset to default if clicked again
            }
            return { colId, direction };
        });
    };

    // --- Main Data Processing (Filter + Sort) ---

    const processedFiles = useMemo(() => {
        let current = [...files];

        // 1. Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(f =>
                (f.name ?? "").toLowerCase().includes(lowerQ) ||
                (f.surname ?? "").toLowerCase().includes(lowerQ) ||
                (f.idNumber ?? "").toLowerCase().includes(lowerQ) ||
                (f.company ?? "").toLowerCase().includes(lowerQ)
            );
        }

        // 2. Excel Column Filters
        // We need original index for "nr" filter, but usually filter applies to data content. 
        // For "nr", we just use the current index in the full list as the "value".
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
        const colId = sortConfig.colId;
        const dir = sortConfig.direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            // Default load order (assumed to be 'files' order)
        } else {
            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? "(Blanks)" : s;
            };

            const tryDate = (v) => {
                if (!v) return null;
                const d = new Date(v);
                return isNaN(d.getTime()) ? null : d.getTime();
            }

            current.sort((a, b) => {
                // Map column ID to data key
                let keyA = a[colId];
                let keyB = b[colId];

                // Remap keys if necessary
                if (colId === "idnum") { keyA = a.idNumber; keyB = b.idNumber; }
                if (colId === "phone") { keyA = extractNumbers(a.contactNr); keyB = extractNumbers(b.contactNr); }
                if (colId === "createdBy") { keyA = a.profileCreatedBy?.username; keyB = b.profileCreatedBy?.username; }
                if (colId === "version") { keyA = a.indicationVersion; keyB = b.indicationVersion; }

                // Date specific sorting
                if (colId === "createdDate") { keyA = a.dateAdded; keyB = b.dateAdded; }
                if (colId === "completionDate") { keyA = a.completionDate; keyB = b.completionDate; }
                if (colId === "expiry") { keyA = a.expiryDate; keyB = b.expiryDate; }

                // Check for dates
                if (["createdDate", "completionDate", "expiry"].includes(colId)) {
                    const da = tryDate(keyA);
                    const db = tryDate(keyB);
                    if (da !== null && db !== null) return (da - db) * dir;
                }

                const av = normalize(keyA);
                const bv = normalize(keyB);

                if (av === "(Blanks)" && bv !== "(Blanks)") return 1;
                if (av !== "(Blanks)" && bv === "(Blanks)") return -1;

                return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
            });
        }

        return current;

    }, [files, searchQuery, activeExcelFilters, sortConfig]);


    // --- Popup Close Logic ---
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
        const hasSort = sortConfig.colId !== "nr" || sortConfig.direction !== "asc";
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
        setSortConfig({ colId: "nr", direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        return "top-right-button-control-att-2";
    };

    return (
        <div className="file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/visitorManagement2.svg`} alt="Logo" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">Visitor Management</p>
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

            <div className="main-box-file-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            autoComplete="off"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper">
                        <label className="risk-control-label">Visitor Equipment</label>
                        <FontAwesomeIcon
                            icon={faColumns}
                            title="Select Columns to Display"
                            className="top-right-button-control-att"
                            onClick={() => setShowColumnSelector(v => !v)}
                        />
                        <FontAwesomeIcon
                            icon={faFilter}
                            className={getFilterBtnClass()} // Calculated class (e.g., ibra4, ibra5, ibra6)
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{
                                cursor: hasActiveFilters ? "pointer" : "default",
                                color: hasActiveFilters ? "#002060" : "gray"
                            }}
                            onMouseEnter={(e) => {
                                if (hasActiveFilters) openFilterMenu(e);
                            }}
                            onMouseLeave={closeFilterMenuWithDelay}
                            onDoubleClick={handleClearFilters}
                        />
                        {showColumnSelector && (
                            <div className="column-selector-popup"
                                onMouseDown={(e) => e.stopPropagation()}>
                                <div className="column-selector-header">
                                    <h4>Select Columns</h4>
                                    <button className="close-popup-btn" onClick={() => setShowColumnSelector(false)}>×</button>
                                </div>

                                <div className="column-selector-content">
                                    <p className="column-selector-note">Select columns to display</p>

                                    <div className="select-all-container">
                                        <label className="select-all-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={areAllSelected()}
                                                onChange={(e) => toggleAllColumns(e.target.checked)}
                                            />
                                            <span className="select-all-text">Select All</span>
                                        </label>
                                    </div>

                                    <div className="column-checkbox-container">
                                        {availableColumns.map(col => (
                                            <div className="column-checkbox-item" key={col.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(col.id)}
                                                        disabled={col.id === "nr" || col.id === "action"}
                                                        onChange={() => toggleColumn(col.id)}
                                                    />
                                                    <span>{col.title}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="column-selector-footer">
                                        <p>{visibleCount} columns selected</p>
                                        <button className="apply-columns-btn" onClick={() => setShowColumnSelector(false)}>
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                    <div
                        className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} ${isWide ? 'wide' : ''}`}
                        ref={scrollerRef}
                        onPointerDown={onPointerDownX}
                        onPointerMove={onPointerMoveX}
                        onPointerUp={endDragX}
                        onPointerLeave={endDragX}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        <table className={`limit-table-height-visitor ${isWide ? 'wide2' : ''}`}>
                            <thead>
                                <tr>
                                    {visibleColumns.map(col => {
                                        const isAction = col.id === "action";
                                        const isActiveFilter = activeExcelFilters[col.id];
                                        const isActiveSort = sortConfig.colId === col.id && col.id !== "nr";

                                        return (
                                            <th
                                                key={col.id}
                                                className={`${col.thClass} col`}
                                                onClick={(e) => {
                                                    if (isAction) return;
                                                    openExcelFilterPopup(col.id, e);
                                                }}
                                                style={{ cursor: isAction ? "default" : "pointer", position: "relative" }}
                                            >
                                                <span className="fileinfo-title-filter-1">{col.title}</span>

                                                {/* Show filter/sort icons */}
                                                {(isActiveFilter || isActiveSort) && (
                                                    <FontAwesomeIcon
                                                        icon={faFilter}
                                                        className="th-filter-icon"
                                                        style={{ marginLeft: "8px", opacity: 0.8 }}
                                                    />
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            <tbody>
                                {processedFiles.length === 0 ? (
                                    <tr className="empty-row">
                                        <td colSpan={visibleColumns.length} style={{ textAlign: "center" }}>
                                            <div className="empty-state">
                                                No visitor profiles found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    processedFiles.map((file, index) => (
                                        <tr key={file._id ?? index} className="file-info-row-height vihr-expandable-row" style={{ cursor: "pointer" }} onClick={() => navigate(`/FrontendDMS/visitorDevices/${file._id}`)}>
                                            {visibleColumns.map(col => {
                                                if (col.id === "validity") {
                                                    return (
                                                        <td key={`${file._id ?? index}-${col.id}`} className={`col ${getComplianceColor(file.validity)}`}>
                                                            {file.validity ? formatStatus(file.validity) : "-"}
                                                        </td>
                                                    );
                                                }

                                                // If sorted, index might change order. For "Nr", we typically want the row number in the visual list (1, 2, 3...)
                                                // So we use 'index' from the map here.
                                                const value = col.id === "nr" ? (index + 1) : (col.td ? col.td(file, index) : "-");
                                                return (
                                                    <td key={`${file._id ?? index}-${col.id}`} className="col" style={{ textAlign: "center" }}>
                                                        {value ?? "-"}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div >
            </div >

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

                        // Recalculate unique values for the list
                        const allValues = Array.from(
                            new Set((files || []).flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
                        ).sort((a, b) => String(a).localeCompare(String(b)));

                        const visibleValues = allValues.filter(v =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const allSelected =
                            allValues.length > 0 && allValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(() => {
                                if (checked) return new Set(allValues); // select everything
                                return new Set();                      // clear everything
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
                            const selectedArr = Array.from(excelSelected);
                            const isAllSelected = allValues.length > 0 && allValues.every(v => excelSelected.has(v));

                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isAllSelected) delete next[colId];
                                else next[colId] = selectedArr;
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
                                                checked={allSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                            />
                                        </span>
                                        <span className="excel-filter-text">(Select All)</span>
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
            <ToastContainer />
        </div >
    );
};

export default VisitorManagementPage;