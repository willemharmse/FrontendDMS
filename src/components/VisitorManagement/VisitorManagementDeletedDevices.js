import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faX, faFileCirclePlus, faSearch, faArrowLeft, faEdit, faTrash, faShare, faShareAlt, faCirclePlay, faCirclePlus, faBookOpen, faDownload, faBook, faUser, faUserGroup, faColumns, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../utils/auth";
import SortPopupVisitors from "../VisitorsInduction/Popups/SortPopupVisitors";
import TopBar from "../Notifications/TopBar";
import DatePicker from "react-multi-date-picker";
import DeleteVisitorDevice from "./DeleteVisitorDevice";
import SortPopupVisitorDeletedDevices from "./SortPopupVisitorDeletedDevices";

const VisitorManagementDeletedDevices = () => {
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
    const [sortField, setSortField] = useState("");
    const [sortOrder, setSortOrder] = useState("ascending");
    const navigate = useNavigate();
    const [deleteContext, setDeleteContext] = useState(null); // { deviceId, name }
    const [deleting, setDeleting] = useState(false);

    // Excel Filter States
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const excelPopupRef = useRef(null);

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
        if (type === "requiresRetake") return "Requires Retake"
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    const extractNumbers = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        return cleaned.startsWith('+')
            ? '+' + cleaned.slice(1).replace(/\+/g, '')
            : cleaned.replace(/\+/g, '');
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
        const route = `/api/visitorDevices/getDeletedDevices/${visitorID}/devices`;
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
                    // 'Authorization': `Bearer ${token}`
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

    const handleSort = () => {
        // Original manual sort modal logic
        const sortedFiles = [...files].sort((a, b) => {
            const fieldA = getRawValue(a, sortField);
            const fieldB = getRawValue(b, sortField);
            if (sortOrder === "ascending") return String(fieldA).localeCompare(String(fieldB));
            return String(fieldB).localeCompare(String(fieldA));
        });
        setFiles(sortedFiles);
        closeSortModal();
    };

    // Helper to get raw values for sorting/filtering
    const getRawValue = (item, colId) => {
        switch (colId) {
            case "nr": return ""; // handled by index
            case "type": return item.deviceType || "";
            case "name": return item.deviceName || "";
            case "serialNumber": return item.serialNumber || "-";
            case "deletionDate": return formatDate(item.deletedDate) || "-";
            case "deletionReason": return item.deletedReason || "-";
            default: return "";
        }
    };

    // Excel Sort Logic
    const toggleExcelSort = (colId, direction) => {
        if (sortField === colId && sortOrder === direction) {
            setSortField("");
            setSortOrder("");
        } else {
            setSortField(colId);
            setSortOrder(direction);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const allColumns = [
        { id: "nr", title: "Nr", thClass: "visitor-ind-num-filter", td: (f, i) => i + 1 },
        { id: "type", title: "Device Type", thClass: "visitor-ind-name-filter", td: (f) => f.deviceType },
        { id: "name", title: "Device Name", thClass: "visitor-ind-surname-filter", td: (f) => f.deviceName },
        { id: "serialNumber", title: "Serial Number", thClass: "visitor-ind-company-filter", td: (f) => f.serialNumber ?? "-" },
        { id: "deletionDate", title: "Deletion Date", thClass: "visitor-ind-company-filter", td: (f) => formatDate(f.deletedDate) ?? "-" },
        { id: "deletionReason", title: "Reason for Deletion", thClass: "visitor-ind-company-filter", td: (f) => f.deletedReason ?? "-" },
    ];

    const [showColumns, setShowColumns] = useState(() => {
        const base = ["nr", "type", "name", "serialNumber", "deletionDate", "deletionReason", "action"];
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
    const [openHeader, setOpenHeader] = useState(null);

    const [colFilters, setColFilters] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '',
        idnum: '',
        company: '',
        createdBy: '',
        validity: '',
        version: '',
        expiryFrom: '',
        expiryTo: ''
    });

    const setFilter = (field, val) => setColFilters(f => ({ ...f, [field]: val }));

    // Apply Filters & Sort
    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery =
            (file.deviceName ?? "").toLowerCase().includes(searchQuery.toLowerCase())

        const fileExpiry = file.expiryDate ? new Date(file.expiryDate) : null;
        const fromOK = colFilters.expiryFrom ? (fileExpiry && fileExpiry >= new Date(colFilters.expiryFrom)) : true;
        const toOK = colFilters.expiryTo ? (fileExpiry && fileExpiry <= new Date(colFilters.expiryTo)) : true;

        // Excel Filters
        let excelMatch = true;
        for (const [colId, selectedSet] of Object.entries(activeExcelFilters)) {
            if (!selectedSet) continue;
            const val = getRawValue(file, colId);
            if (!selectedSet.has(val)) {
                excelMatch = false;
                break;
            }
        }

        return fromOK && toOK && matchesSearchQuery && excelMatch;
    }).sort((a, b) => {
        if (!sortField) return 0;
        const fieldA = getRawValue(a, sortField);
        const fieldB = getRawValue(b, sortField);
        const dir = sortOrder === "ascending" ? 1 : -1;
        return String(fieldA).localeCompare(String(fieldB), undefined, { sensitivity: "base", numeric: true }) * dir;
    });

    const handleDeleteClick = (device) => {
        if (!device?._id) return;
        setDeleteContext({
            deviceId: device._id,
            name: device.deviceName || device.deviceType || device.serialNumber || "Device",
        });
    };

    const confirmDeleteDevice = async () => {
        if (!deleteContext || !deleteContext.deviceId) return;
        setDeleting(true);
        try {
            const adminToken = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/visitorDevices/deleteDevicePermanently/${visitorID}/${deleteContext.deviceId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${adminToken}`,
                    },
                }
            );
            const result = await response.json();
            if (response.ok && result.ok) {
                toast.success("Device permanently deleted", { autoClose: 2000, closeButton: false });
                await fetchFiles();
                setDeleteContext(null);
            } else {
                toast.error(result.message || "Failed to permanently delete device", { autoClose: 2000, closeButton: false });
            }
        } catch (err) {
            console.error("Error permanently deleting device:", err);
            toast.error("An error occurred while permanently deleting the device", { autoClose: 2000, closeButton: false });
        } finally {
            setDeleting(false);
        }
    };

    // --- Excel Filter Logic ---
    function openExcelFilterPopup(colId, e) {
        if (colId === "nr" || colId === "action") return;

        // Prevent opening if clicking on input or date picker
        if (e.target.closest('input') || e.target.closest('.react-date-picker')) return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const allValues = Array.from(new Set(files.map(f => getRawValue(f, colId)))).sort();

        const currentFilter = activeExcelFilters[colId];
        const initialSelected = currentFilter ? new Set(currentFilter) : new Set(allValues);

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

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (excelPopupRef.current && !excelPopupRef.current.contains(e.target) && !e.target.closest('th')) {
                setExcelFilter(prev => ({ ...prev, open: false }));
            }
        };
        if (excelFilter.open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [excelFilter.open]);

    const handleInnerScrollWheel = (e) => {
        e.stopPropagation();
    };

    // --- Clear Filter & Sort Logic ---
    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    // Check if any filters or sorts are active
    const hasActiveFilters = React.useMemo(() => {
        const hasExcelFilters = Object.keys(activeExcelFilters).length > 0;
        const hasSort = sortField !== "";
        return hasExcelFilters || hasSort;
    }, [activeExcelFilters, sortField]);

    const handleClearFilters = () => {
        setActiveExcelFilters({}); // Clear Excel filters
        setSortField("");          // Clear Sort Field
        setSortOrder("");          // Clear Sort Order
        setExcelSelected(new Set()); // Reset internal selection set
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

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
                        <label className="risk-control-label">{visitorInfo.name} {visitorInfo.surname}’s Deleted Devices</label>
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
                                <tr className="trashed">
                                    {visibleColumns.map(col => {
                                        const isText = ["name", "type", "serialNumber", "deletionReason"].includes(col.id);
                                        const isDate = ["deletionDate"].includes(col.id);
                                        const isStatic = ["nr", "action"].includes(col.id);

                                        const hasExcelFilter = Object.prototype.hasOwnProperty.call(activeExcelFilters, col.id);
                                        const hasSort = sortField === col.id && (sortOrder === "ascending" || sortOrder === "descending");

                                        return (
                                            <th
                                                key={col.id}
                                                className={`${col.thClass} col`}
                                                onClick={(e) => openExcelFilterPopup(col.id, e)}
                                                style={{ cursor: isStatic ? 'default' : 'pointer' }}
                                            >
                                                {isStatic && <span className="fileinfo-title-filter-1">{col.title}</span>}

                                                {isText && (
                                                    <div className="fileinfo-container-filter">
                                                        <span
                                                            className="fileinfo-title-filter"
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            {col.title}
                                                            {(hasExcelFilter || hasSort) && (
                                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />
                                                            )}
                                                        </span>
                                                    </div>
                                                )}

                                                {isDate && (
                                                    <div className="fileinfo-container-filter">
                                                        <span
                                                            className="fileinfo-title-filter"
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            {col.title}
                                                            {(hasExcelFilter || hasSort) && (
                                                                <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />
                                                            )}
                                                        </span>
                                                    </div>
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
                                                No deleted visitor devices found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFiles.map((file, index) => (
                                        <tr key={file._id ?? index} className="file-info-row-height vihr-expandable-row" style={{ cursor: "pointer" }}>
                                            {visibleColumns.map(col => {
                                                if (col.id === "action") {
                                                    return canIn(access, "TMS", ["systemAdmin", "contributor"]) ? (
                                                        <td className="col-act" key={`${file._id ?? index}-action`}>
                                                            <button
                                                                className={"flame-delete-button-fi col-but"}
                                                                onClick={() => handleDeleteClick(file)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} title="Delete Device" />
                                                            </button>
                                                        </td>
                                                    ) : null;
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

            {deleteContext && (
                <DeleteVisitorDevice
                    closeModal={() => setDeleteContext(null)}
                    deleteVisitor={confirmDeleteDevice}
                    name={deleteContext.name}
                    loading={deleting}
                />
            )}

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
                    onWheel={handleInnerScrollWheel}
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortField === excelFilter.colId && sortOrder === "ascending" ? "active" : ""}`}
                            onClick={() => toggleExcelSort(excelFilter.colId, "ascending")}
                        >
                            Sort Acsending
                        </button>
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortField === excelFilter.colId && sortOrder === "descending" ? "active" : ""}`}
                            onClick={() => toggleExcelSort(excelFilter.colId, "descending")}
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
                        const allValues = Array.from(new Set(files.map(f => getRawValue(f, colId)))).sort();
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
                                if (next.has(v)) next.delete(v);
                                else next.add(v);
                                return next;
                            });
                        };

                        const onOk = () => {
                            const isAllSelected = excelSelected.size === allValues.length;

                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isAllSelected) delete next[colId];   // <- important
                                else next[colId] = excelSelected;
                                return next;
                            });

                            setExcelFilter(prev => ({ ...prev, open: false }));
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
                                    <button type="button" className="excel-filter-btn-cnc" onClick={() => setExcelFilter(prev => ({ ...prev, open: false }))}>Cancel</button>
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

export default VisitorManagementDeletedDevices;