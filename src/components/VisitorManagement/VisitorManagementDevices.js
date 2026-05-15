import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faX, faFileCirclePlus, faSearch, faArrowLeft, faEdit, faTrash, faShare, faShareAlt, faCirclePlay, faCirclePlus, faBookOpen, faDownload, faBook, faUser, faUserGroup, faColumns, faFilter, faSort, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../utils/auth";
import SortPopupVisitors from "../VisitorsInduction/Popups/SortPopupVisitors";
import TopBar from "../Notifications/TopBar";
import DatePicker from "react-multi-date-picker";
import DeviceDeleteReason from "./DeviceDeleteReason";
import DeleteVisitorDevice from "./DeleteVisitorDevice";
import ModifyVisitorDevicePopup from "./ModifyVisitorDevicePopup";
import SortPopupVisitorDeletedDevices from "./SortPopupVisitorDeletedDevices";
import SortPopupVisitorDevices from "./SortPopupVisitorDevices";

const VisitorManagementDevices = () => {
    const visitorID = useParams().id;
    const [expandedRow, setExpandedRow] = useState(null);
    const scrollerRef = React.useRef(null);
    const dragRef = React.useRef({
        active: false,
        startX: 0,
        startScrollLeft: 0,
        hasDragged: false
    });
    const [isDraggingX, setIsDraggingX] = useState(false);

    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [token, setToken] = useState('');
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

    const totalCols = canIn(access, "TMS", ["systemAdmin", "contributor"]) ? 9 : 8;
    const openSortModal = () => setIsSortModalOpen(true);
    const closeSortModal = () => setIsSortModalOpen(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    const [modifyDevice, setModifyDevice] = useState(null);
    const [deleteContext, setDeleteContext] = useState(null);   // for confirm popup
    const [reasonContext, setReasonContext] = useState(null);   // for reason popup

    const DRAG_THRESHOLD = 5;

    const isInteractive = (el) =>
        !!el.closest('button, a, input, textarea, select, [role="button"], .no-drag');

    const onPointerDownX = (e) => {
        const el = scrollerRef.current;
        if (!el) return;

        if (isInteractive(e.target)) return;

        dragRef.current.active = true;
        dragRef.current.hasDragged = false;
        dragRef.current.startX = e.clientX;
        dragRef.current.startScrollLeft = el.scrollLeft;
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
                return;
            }
        }

        el.scrollLeft = dragRef.current.startScrollLeft - dx;
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

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}.${month}.${year}`;
    };

    const [files, setFiles] = useState([]);
    const [visitorInfo, setVisitorInfo] = useState([]);

    const fetchFiles = async () => {
        const route = `/api/visitorDevices/getDevices/${visitorID}/devices`;
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
            setFiles(data.devices);
        } catch (error) {
        }
    };

    const fetchVisitorInfo = async () => {
        const route = `/api/visitors/visitorInformation/${visitorID}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            setVisitorInfo(data.user);
        } catch (error) {
        }
    };

    useEffect(() => {
        fetchFiles();
        fetchVisitorInfo();
    }, [token]);

    const clearSearch = () => {
        setSearchQuery("");
    };

    // Columns
    const allColumns = [
        { id: "nr", title: "Nr", thClass: "visitor-ind-num-filter", td: (f, i) => i + 1 },
        { id: "deviceType", title: "Device Type", thClass: "visitor-ind-name-filter", td: (f) => f.deviceType },
        { id: "deviceName", title: "Device Name", thClass: "visitor-ind-surname-filter", td: (f) => f.deviceName },
        { id: "serialNumber", title: "Serial Number", thClass: "visitor-ind-company-filter", td: (f) => f.serialNumber ?? "-" },
        { id: "arrivalDate", title: "Arrival Date", thClass: "visitor-ind-company-filter", td: (f) => formatDate(f.arrivalDate) ?? "-" },
        { id: "exitDate", title: "Exit Date", thClass: "visitor-ind-company-filter", td: (f) => formatDate(f.exitDate) ?? "-" },
    ];

    const [showColumns, setShowColumns] = useState(() => {
        const base = ["nr", "deviceType", "deviceName", "serialNumber", "arrivalDate", "exitDate", "action"];
        return canIn(access, "TMS", ["systemAdmin", "contributor"]) ? [...base, "action"] : base;
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const availableColumns = React.useMemo(() => {
        let cols = [...allColumns];
        cols = [...cols, { id: "action", title: "Action", thClass: "visitor-ind-act-filter", td: null }];
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

    // --- Excel Filtering Logic ---

    const getFilterValuesForCell = (row, colId) => {
        if (colId === "nr") return [String(files.indexOf(row) + 1)];
        // Handle dates specifically to match display format
        if (colId === "arrivalDate" || colId === "exitDate") {
            const val = row[colId];
            return val ? [formatDate(val)] : ["-"];
        }
        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Build unique values across ALL rows for this column
        const values = Array.from(
            new Set(
                (files || []).flatMap(r => getFilterValuesForCell(r, colId))
            )
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        // Check if there are existing filters for this column
        const existing = activeExcelFilters[colId];
        // If filters exist, select those. If not, select ALL values (default state)
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

    // --- Sorting Logic (Integrated) ---

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT; // Click same sort again -> reset
            }
            return { colId, direction };
        });
    };

    // --- Processing Data (Filter -> Sort) ---

    const processedFiles = useMemo(() => {
        let current = [...files];

        // 1. Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(f =>
                (f.deviceName ?? "").toLowerCase().includes(lowerQ) ||
                (f.deviceType ?? "").toLowerCase().includes(lowerQ) ||
                (f.serialNumber ?? "").toLowerCase().includes(lowerQ)
            );
        }

        // 2. Excel Column Filters
        current = current.filter(row => {
            for (const [colId, selectedValues] of Object.entries(activeExcelFilters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;

                // Get display values for this cell
                const cellValues = getFilterValuesForCell(row, colId);
                // Check if any of the cell's values are in the selected set
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        // 3. Sorting
        const colId = sortConfig.colId;
        const dir = sortConfig.direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            // Default order (assuming 'files' is initial order)
            // If strict original order is needed, we'd map ID to index. 
            // For now, we assume current 'files' order is "active" or use an index.
            // Since 'files' changes, we just let it be, but strictly speaking 'nr' sort 
            // usually means "creation order". If files comes from API sorted, we are good.
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
                let av = a[colId];
                let bv = b[colId];

                // Special handling for formatted date columns if we want to sort by actual date
                if (colId === 'arrivalDate' || colId === 'exitDate') {
                    const ad = tryDate(av);
                    const bd = tryDate(bv);
                    if (ad !== null && bd !== null) return (ad - bd) * dir;
                }

                av = normalize(av);
                bv = normalize(bv);

                if (av === "(Blanks)" && bv !== "(Blanks)") return 1;
                if (av !== "(Blanks)" && bv === "(Blanks)") return -1;

                return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
            });
        }

        return current;

    }, [files, searchQuery, activeExcelFilters, sortConfig]);


    // --- Handlers ---

    const handleEditDevice = (device) => {
        setModifyDevice({
            visitorId: visitorID,
            device,
        });
    };

    const handleDeleteClick = (device) => {
        setDeleteContext({
            deviceId: device._id,
            name: device.deviceName || device.deviceType || device.serialNumber || "Device",
        });
    };

    const handleConfirmDeleteYes = () => {
        if (!deleteContext) return;
        setReasonContext({
            deviceId: deleteContext.deviceId,
            name: deleteContext.name,
        });
        setDeleteContext(null);
    };

    // Global Sort Modal Handlers (Adapting to new sortConfig)
    const handleGlobalSort = () => {
        // This is called by SortPopupVisitorDevices
        // We need to map the temp state from popup to our sortConfig
        // But the popup typically sets state directly. 
        // We will pass setters that update sortConfig.
        closeSortModal();
    };

    // Close popups on click outside
    useEffect(() => {
        if (!excelFilter.open) return;

        const handleClickOutside = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        const handleScroll = (e) => {
            // Close on scroll to prevent detached popup
            if (e.target.closest('.excel-filter-popup')) return; // Allow internal scroll
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [excelFilter.open]);

    // Popup positioning correction
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

                    {canIn(access, "TMS", ["systemAdmin", "profileManager"]) && (
                        <div className="filter-dm-fi-2">
                            <div className="button-container-dm-fi">
                                <button className="but-dm-fi-no-icon" onClick={() => navigate(`/FrontendDMS/visitorDeletedDevices/${visitorID}`)}>
                                    Deleted Devices
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="sidebar-logo-dm-fi">
                        <img src={`/FrontendDMS/visitorManagement2.svg`} alt="Logo" className="icon-risk-rm" />
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
                        <label className="risk-control-label">{visitorInfo.name} {visitorInfo.surname}’s Devices</label>
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
                                        const isActiveSort = sortConfig.colId === col.id && col.id !== "nr"; // Don't show sort icon for default nr

                                        return (
                                            <th
                                                key={col.id}
                                                className={`${col.thClass} col`}
                                                onClick={(e) => {
                                                    if (isAction) return;
                                                    // Only open if clicking header background or text, not specific internal buttons if any
                                                    openExcelFilterPopup(col.id, e);
                                                }}
                                                style={{ cursor: isAction ? "default" : "pointer", position: "relative" }}
                                            >
                                                <span className="fileinfo-title-filter-1">
                                                    {col.title}
                                                </span>

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
                                                No active visitor devices found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    processedFiles.map((file, index) => (
                                        <tr key={file._id ?? index} className="file-info-row-height vihr-expandable-row" style={{ cursor: "default" }}>
                                            {visibleColumns.map(col => {
                                                if (col.id === "action") {
                                                    return canIn(access, "TMS", ["systemAdmin", "contributor"]) ? (
                                                        <td className="col-act" key={`${file._id ?? index}-action`}>
                                                            <button
                                                                className={"flame-delete-button-fi col-but-res"}
                                                                onClick={() => handleEditDevice(file)}
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} title="Edit Device" />
                                                            </button>
                                                            <button
                                                                className={"flame-delete-button-fi col-but"}
                                                                onClick={() => handleDeleteClick(file)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} title="Delete Device" />
                                                            </button>
                                                        </td>
                                                    ) : null;
                                                }
                                                // Calculate index dynamically based on actual list if sorted? 
                                                // Or just static row number? Requirement usually static row number unless "Nr" is a data field. 
                                                // "nr" col definition uses index.
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
                            new Set((files || []).flatMap(r => getFilterValuesForCell(r, colId)))
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

            {modifyDevice && (
                <ModifyVisitorDevicePopup
                    data={modifyDevice}
                    onClose={() => setModifyDevice(null)}
                    refresh={fetchFiles}
                />
            )}

            {deleteContext && (
                <DeleteVisitorDevice
                    closeModal={() => setDeleteContext(null)}
                    deleteVisitor={handleConfirmDeleteYes}
                    name={deleteContext.name}
                    loading={false}
                />
            )}

            {reasonContext && (
                <DeviceDeleteReason
                    onClose={() => setReasonContext(null)}
                    refresh={fetchFiles}
                    visitorId={visitorID}
                    deviceId={reasonContext.deviceId}
                />
            )}

            <ToastContainer />
        </div >
    );
};

export default VisitorManagementDevices;