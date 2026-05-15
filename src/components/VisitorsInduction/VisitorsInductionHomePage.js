import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faX, faSearch, faArrowLeft, faTrash, faShareAlt, faUser, faUserGroup, faColumns, faSort, faFilter, faCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, canIn } from "../../utils/auth";
import "./VisitorsInductionHomePage.css"
import SortPopupVisitors from "./Popups/SortPopupVisitors";
import TopBar from "../Notifications/TopBar";
import CreateProfilePopup from "./Popups/CreateProfilePopup";
import CreateBatchProfiles from "./Popups/CreateBatchProfiles";
import BatchExcelUpload from "./Popups/BatchExcelUpload";
import CreateProfileLink from "./Popups/CreateProfileLink";
import DeleteVisitor from "./Popups/DeleteVisitor";

const VisitorsInductionHomePage = () => {
    // --- Existing State ---
    const scrollerRef = React.useRef(null);
    const dragRef = React.useRef({ active: false, startX: 0, startScrollLeft: 0, hasDragged: false });
    const [isDraggingX, setIsDraggingX] = useState(false);
    const DRAG_THRESHOLD = 5;

    // --- Excel Filter State ---
    const excelPopupRef = useRef(null);
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ colId: null, direction: null });
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    // ---------------------------

    const [upload, setUpload] = useState(false);
    const [batchProg, setBatchProg] = useState(false);
    const [batchExcel, setBatchExcel] = useState(false);
    const [shareLink, setShareLink] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [deleteVisitor, setDeleteVisitor] = useState(false);
    const [deleteName, setDeleteName] = useState(false);
    const [deleteId, setDeleteId] = useState(false);
    const [linkId, setLinkId] = useState("");
    const [files, setFiles] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [token, setToken] = useState('');
    const access = getCurrentUser();
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    // Legacy sort state (kept for the external button, though Excel sort overrides it in view)
    const [sortField, setSortField] = useState("");
    const [sortOrder, setSortOrder] = useState("ascending");
    const navigate = useNavigate();

    // --- Drag Scrolling Logic ---
    const isInteractive = (el) => !!el.closest('button, a, input, textarea, select, [role="button"], .no-drag');
    const onPointerDownX = (e) => {
        const el = scrollerRef.current;
        if (!el || isInteractive(e.target)) return;
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
            } else return;
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

    // --- Helpers ---
    const getComplianceColor = (status) => {
        if (status === "valid") return "status-good";
        if (status === "requiresRetake") return "status-bad"
        if (status === "invalid") return "status-worst";
        if (status === "-") return "status-missing"
    };

    const formatStatus = (type) => {
        if (!type) return "-";
        if (type === "requiresRetake") return "Requires Retake"
        return type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };

    const extractNumbers = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        return cleaned.startsWith('+') ? '+' + cleaned.slice(1).replace(/\+/g, '') : cleaned.replace(/\+/g, '');
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}.${month}.${year}`;
    };

    const fetchFiles = async () => {
        const route = `/api/visitors/getVisitors`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {});
            if (!response.ok) throw new Error('Failed to fetch files');

            const data = await response.json();

            const sortedVisitors = (data.visitors || []).sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
            );

            setFiles(sortedVisitors);
        } catch (error) { }
    };

    useEffect(() => {
        fetchFiles();
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            jwtDecode(storedToken);
        }
    }, [navigate]);

    const deleteVisitorInstance = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/visitors/deleteVisitor/${deleteId}`, {
                headers: { Authorization: `Bearer ${token}` },
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete the file');
            setDeleteVisitor(false);
            setDeleteId(null);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    // --- Modals Toggles ---
    const openUpload = () => setUpload(true);
    const closeUpload = () => setUpload(!upload);
    const openDelete = (name, id) => { setDeleteName(name); setDeleteId(id); setDeleteVisitor(true); };
    const closeDelete = () => { setDeleteName(""); setDeleteId(""); setDeleteVisitor(!deleteVisitor); };
    const openBatchProg = () => setBatchProg(true);
    const closeBatchProg = () => setBatchProg(!batchProg);
    const openBatchExcel = () => { setBatchExcel(true); setBatchProg(false); };
    const closeBatchExcel = () => setBatchExcel(!batchExcel);
    const openShareLink = (name, email, id) => { setUsername(name); setEmail(email); setShareLink(true); setLinkId(id); };
    const closeShareLink = () => { setUsername(""); setEmail(""); setLinkId(""); setShareLink(false); };
    const openUserLinkShare = (user) => { setUsername(user.name); setEmail(user.email); setShareLink(true); setLinkId(user._id); };
    const openSortModal = () => setIsSortModalOpen(true);
    const closeSortModal = () => setIsSortModalOpen(false);

    // --- Column Config ---
    const allColumns = [
        { id: "nr", title: "Nr", thClass: "visitor-ind-num-filter", td: (f, i) => i + 1 },
        { id: "name", title: "Name", thClass: "visitor-ind-name-filter", td: (f) => f.name },
        { id: "surname", title: "Surname", thClass: "visitor-ind-surname-filter", td: (f) => f.surname },
        { id: "email", title: "Email", thClass: "visitor-ind-email-filter", td: (f) => f.email ?? "-" },
        { id: "phone", title: "Contact Number", thClass: "visitor-ind-company-filter", td: (f) => extractNumbers(f.contactNr) ?? "-" },
        { id: "idnum", title: "ID/Passport", thClass: "visitor-ind-company-filter", td: (f) => f.idNumber ?? "-" },
        { id: "company", title: "Company", thClass: "visitor-ind-company-filter", td: (f) => f.company ?? "-" },
        { id: "createdBy", title: "Profile Created By", thClass: "visitor-ind-profileBy-filter", td: (f) => f.profileCreatedBy?.username ?? "-" },
        { id: "validity", title: "Induction Validity", thClass: "visitor-ind-valid-filter", td: (f) => formatStatus(f.validity) ?? "-" },
        { id: "expiry", title: "Induction Expiry Date", thClass: "visitor-ind-exp-filter", td: (f) => formatDate(f.expiryDate) },
        { id: "version", title: "Induction Version Nr", thClass: "visitor-ind-vers-filter", td: (f) => f.indicationVersion ?? "-" },
    ];

    const [showColumns, setShowColumns] = useState(() => {
        const base = ["nr", "name", "surname", "company", "createdBy", "validity", "expiry", "version"];
        return canIn(access, "TMS", ["systemAdmin", "contributor"]) ? [...base, "action"] : base;
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const availableColumns = React.useMemo(() => {
        let cols = [...allColumns];
        if (canIn(access, "TMS", ["systemAdmin", "contributor"])) {
            cols = [...cols, { id: "action", title: "Action", thClass: "visitor-ind-act-filter", td: null }];
        }
        return cols;
    }, [access]);

    const toggleColumn = (id) => {
        setShowColumns(prev => {
            if (id === "nr" || id === "action") return prev;
            return prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
        });
    };
    const toggleAllColumns = (selectAll) => {
        if (selectAll) setShowColumns(availableColumns.map(c => c.id));
        else setShowColumns(canIn(access, "TMS", ["systemAdmin", "contributor"]) ? ["nr", "action"] : ["nr"]);
    };
    const areAllSelected = () => availableColumns.map(c => c.id).every(id => showColumns.includes(id));
    const visibleColumns = availableColumns.filter(c => showColumns.includes(c.id));
    const visibleCount = visibleColumns.length;
    const isWide = visibleCount > 9;


    // --- Excel Filtering Logic ---

    const getFilterValuesForCell = (file, colId) => {
        let val = "";
        switch (colId) {
            case "name": val = file.name; break;
            case "surname": val = file.surname; break;
            case "email": val = file.email; break;
            case "phone": val = extractNumbers(file.contactNr); break;
            case "idnum": val = file.idNumber; break;
            case "company": val = file.company; break;
            case "createdBy": val = file.profileCreatedBy?.username; break;
            case "validity": val = formatStatus(file.validity); break;
            case "expiry": val = formatDate(file.expiryDate); break;
            case "version": val = file.indicationVersion; break;
            default: return [];
        }
        return [String(val ?? "-").trim()];
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return { colId: null, direction: null };
            }
            return { colId, direction };
        });
    };

    function openExcelFilterPopup(colId, e) {
        if (colId === "nr" || colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = Array.from(
            new Set((files || []).flatMap(r => getFilterValuesForCell(r, colId)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        const existing = filters?.[colId]?.selected;
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
    }

    // Popup Event Listeners
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.excel-filter-popup') && !e.target.closest('th')) {
                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            }
        };
        if (excelFilter.open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [excelFilter.open]);

    // Popup Positioning
    useEffect(() => {
        if (!excelFilter.open || !excelPopupRef.current) return;
        const el = excelPopupRef.current;
        const popupRect = el.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;
        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        if (popupRect.bottom > viewportH - margin && excelFilter.anchorRect) {
            newTop = Math.max(margin, excelFilter.anchorRect.top - popupRect.height - 4);
        }
        if (popupRect.right > viewportW - margin) {
            newLeft = Math.max(margin, newLeft - (popupRect.right - (viewportW - margin)));
        }
        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            el.style.top = `${newTop}px`;
            el.style.left = `${newLeft}px`;
        }
    }, [excelFilter.open, excelSearch, excelSelected]);

    // --- Main Filtering & Sorting ---
    const filteredFiles = useMemo(() => {
        let current = [...files];

        // 1. Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(file =>
                (file.name ?? "").toLowerCase().includes(lowerQ) ||
                (file.surname ?? "").toLowerCase().includes(lowerQ)
            );
        }

        // 2. Excel Checkbox Filters
        current = current.filter(row => {
            for (const [colId, filterObj] of Object.entries(filters)) {
                const selected = filterObj?.selected;
                if (!selected || !Array.isArray(selected)) continue;
                const cellValues = getFilterValuesForCell(row, colId);
                const match = cellValues.some(v => selected.includes(v));
                if (!match) return false;
            }
            return true;
        });

        // 3. Sorting
        const { colId, direction } = sortConfig;
        if (colId) {
            const dir = direction === 'desc' ? -1 : 1;
            current.sort((a, b) => {
                const valA = getFilterValuesForCell(a, colId)[0];
                const valB = getFilterValuesForCell(b, colId)[0];
                return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
            });
        }

        return current;
    }, [files, searchQuery, filters, sortConfig]);

    const clearSearch = () => {
        setSearchQuery("");
    };

    // Legacy Handle Sort (for the separate modal, if still used)
    const handleSort = () => {
        // This is a simple fallback that modifies 'files' directly, 
        // but 'filteredFiles' is derived from 'files'. 
        // Ideally, we should unify this, but for now we keep the modal operational.
        const sortedFiles = [...files].sort((a, b) => {
            const fieldA = a[sortField]?.toString().toLowerCase() || "";
            const fieldB = b[sortField]?.toString().toLowerCase() || "";
            if (sortOrder === "ascending") return fieldA.localeCompare(fieldB);
            return fieldB.localeCompare(fieldA);
        });
        setFiles(sortedFiles);
        closeSortModal();
    };

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(filters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== null || sortConfig.direction !== null;

        console.log("Active Filters Check:", { filters, sortConfig, hasColumnFilters, hasSort });
        return hasColumnFilters || hasSort;
    }, [filters, sortConfig]);

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
        setFilters({});
        setSortConfig({ colId: null, direction: null });
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
                        <img src={`${process.env.PUBLIC_URL}/visitorInductionIcon2.svg`} alt="Logo" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">Visitor Profiles</p>
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
                <div className="top-section-um" style={{ gap: "6px" }}>
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    {canIn(access, "TMS", ["systemAdmin", "profileManager"]) && (
                        <>
                            <div className="burger-menu-icon-um">
                                <span
                                    className="fa-layers fa-fw"
                                    style={{ fontSize: "28px" }}
                                    title="Add User"
                                    onClick={openUpload}
                                >
                                    {/* Main user icon */}
                                    <FontAwesomeIcon icon={faUser} color="gray" />

                                    {/* Outer "cut-out" circle (page background color) */}
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        transform="shrink-6 down-4 right-7"
                                        color="white"   // match your page background
                                    />

                                    {/* Inner gray circle */}
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        transform="shrink-8 down-4 right-7"
                                        color="gray"
                                    />

                                    {/* Plus icon */}
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        transform="shrink-11 down-4 right-7"
                                        color="white"
                                    />
                                </span>
                            </div>

                            <div className="burger-menu-icon-um" onClick={openBatchProg}>
                                <span
                                    className="fa-layers fa-fw"
                                    style={{ fontSize: "28px", cursor: "pointer" }}
                                    title="Create Group"
                                >
                                    {/* Main group icon */}
                                    <FontAwesomeIcon icon={faUserGroup} color="gray" />

                                    {/* Outer cut-out circle (match page background) */}
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        transform="shrink-6 down-4 right-12"
                                        color="white"
                                    />

                                    {/* Inner badge circle */}
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        transform="shrink-8 down-4 right-12"
                                        color="gray"
                                    />

                                    {/* Plus icon */}
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        transform="shrink-11 down-4 right-12"
                                        color="white"
                                    />
                                </span>
                            </div>
                        </>
                    )}

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
                        <label className="risk-control-label">Visitor Profiles</label>
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
                        <table className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`}>
                            <thead>
                                <tr>
                                    {visibleColumns.map(col => {
                                        const isFilterable = col.id !== "nr" && col.id !== "action";
                                        const isActive = filters[col.id] || sortConfig.colId === col.id;

                                        return (
                                            <th
                                                key={col.id}
                                                className={`${col.thClass} col ${isActive ? "active-filter-header" : ""}`}
                                                style={{ cursor: isFilterable ? 'pointer' : 'default', position: 'relative' }}
                                                onClick={(e) => {
                                                    if (isFilterable) openExcelFilterPopup(col.id, e);
                                                }}
                                            >
                                                {col.title}
                                                {isActive && (
                                                    <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "8px" }} />
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredFiles.length === 0 ? (
                                    <tr className="empty-row">
                                        <td colSpan={visibleColumns.length} style={{ textAlign: "center" }}>
                                            <div className="empty-state">
                                                No visitor profiles found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFiles.map((file, index) => (
                                        <tr key={file._id ?? index} className="file-info-row-height vihr-expandable-row" style={{ cursor: "default" }}>
                                            {visibleColumns.map(col => {
                                                if (col.id === "action") {
                                                    return canIn(access, "TMS", ["systemAdmin", "contributor"]) ? (
                                                        <td className="col-act" key={`${file._id ?? index}-action`}>
                                                            <button
                                                                className={"flame-delete-button-fi col-but-res"}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openShareLink(file.name, file.email, file._id);
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faShareAlt} title="Share Link" />
                                                            </button>
                                                            <button
                                                                className={"flame-delete-button-fi col-but"}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDelete(file.name, file._id)
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} title="Delete Account" />
                                                            </button>
                                                        </td>
                                                    ) : null;
                                                }

                                                if (col.id === "validity") {
                                                    return (
                                                        <td key={`${file._id ?? index}-${col.id}`} className={`col ${getComplianceColor(file.validity)}`}>
                                                            {file.validity ? formatStatus(file.validity) : "-"}
                                                        </td>
                                                    );
                                                }

                                                const value = col.id === "nr" ? col.td(file, index) : (col.td ? col.td(file, index) : "-");
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
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "asc" ? "active" : ""}`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "desc" ? "active" : ""}`}
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
                        const allValues = Array.from(new Set((files || []).flatMap(r => getFilterValuesForCell(r, colId))))
                            .sort((a, b) => String(a).localeCompare(String(b)));
                        const visibleValues = allValues.filter(v => String(v).toLowerCase().includes(excelSearch.toLowerCase()));

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
                                if (next.has(v)) next.delete(v); else next.add(v);
                                return next;
                            });
                        };
                        const toggleAllVisible = (checked) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                visibleValues.forEach(v => { if (checked) next.add(v); else next.delete(v); });
                                return next;
                            });
                        };
                        const onOk = () => {
                            const selectedArr = Array.from(excelSelected);
                            const isAllSelected = allValues.length > 0 && allValues.every(v => excelSelected.has(v));
                            setFilters(prev => {
                                const next = { ...prev };
                                if (isAllSelected) delete next[colId]; else next[colId] = { selected: selectedArr };
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

            {upload && (<CreateProfilePopup onClose={closeUpload} refresh={fetchFiles} openUserLinkShare={openUserLinkShare} />)}
            {batchProg && <CreateBatchProfiles onClose={closeBatchProg} openExcel={openBatchExcel} refresh={fetchFiles} />}
            {batchExcel && (<BatchExcelUpload onClose={closeBatchExcel} refresh={fetchFiles} />)}
            {shareLink && (<CreateProfileLink onClose={closeShareLink} visitorEmail={email} visitorName={username} profileId={linkId} />)}
            {deleteVisitor && (<DeleteVisitor closeModal={closeDelete} deleteVisitor={deleteVisitorInstance} name={deleteName} />)}
            <ToastContainer />
        </div >
    );
};

export default VisitorsInductionHomePage;