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

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [token, setToken] = useState('');
    const access = getCurrentUser();
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    const [sortField, setSortField] = useState("");
    const [sortOrder, setSortOrder] = useState("ascending");
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
    const [trainees, setTrainees] = useState([]);
    const [visitorInfo, setVisitorInfo] = useState([]);

    const getCompletionDate = (visitorId) => {
        const t = trainees.find(tr => tr.user?._id === visitorId);
        return t?.completionDate || null;
    };

    const getExpiryDate = (visitorId) => {
        const t = trainees.find(tr => tr.user?._id === visitorId);
        return t?.expiryDate || null;
    };

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
            console.log(data);
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
            console.log(data)
            console.log(data);
            setVisitorInfo(data.user);
        } catch (error) {
        }
    };

    useEffect(() => {
        fetchFiles();
        fetchVisitorInfo();
    }, [token]);

    const handleSort = () => {
        const sortedFiles = [...files].sort((a, b) => {
            const fieldA = a[sortField]?.toString().toLowerCase() || "";
            const fieldB = b[sortField]?.toString().toLowerCase() || "";
            if (sortOrder === "ascending") return fieldA.localeCompare(fieldB);
            return fieldB.localeCompare(fieldA);
        });
        setFiles(sortedFiles);
        closeSortModal();
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    // Which columns exist and how to render them
    const allColumns = [
        { id: "nr", title: "Nr", thClass: "visitor-ind-num-filter", td: (f, i) => i + 1 },
        { id: "type", title: "Device Type", thClass: "visitor-ind-name-filter", td: (f) => f.deviceType },
        { id: "name", title: "Device Name", thClass: "visitor-ind-surname-filter", td: (f) => f.deviceName },
        { id: "serialNumber", title: "Serial Number", thClass: "visitor-ind-company-filter", td: (f) => f.serialNumber ?? "-" },
        { id: "arrivalDate", title: "Arrival Date", thClass: "visitor-ind-company-filter", td: (f) => formatDate(f.arrivalDate) ?? "-" },
        { id: "exitDate", title: "Exit Date", thClass: "visitor-ind-company-filter", td: (f) => formatDate(f.exitDate) ?? "-" },
    ];

    const [showColumns, setShowColumns] = useState(() => {
        const base = ["nr", "type", "name", "serialNumber", "arrivalDate", "exitDate", "action"];
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
            // nr + action are pinned (like IBRA’s nr/action)
            if (id === "nr" || id === "action") return prev;
            return prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            const allIds = availableColumns.map(c => c.id);
            setShowColumns(allIds);
        } else {
            // minimal: only Nr (and Action if allowed)
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
    // Wide-mode when more than 9 columns (as requested)
    const isWide = visibleCount > 9;

    // which header popup is open
    const [openHeader, setOpenHeader] = useState(null);

    // column filters (text + date)
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
        expiryFrom: '', // yyyy-mm-dd
        expiryTo: ''    // yyyy-mm-dd
    });

    const setFilter = (field, val) => setColFilters(f => ({ ...f, [field]: val }));

    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery =
            (file.deviceName ?? "").toLowerCase().includes(searchQuery.toLowerCase())

        // Date range filter (expiry)
        const fileExpiry = file.expiryDate ? new Date(file.expiryDate) : null;
        const fromOK = colFilters.expiryFrom ? (fileExpiry && fileExpiry >= new Date(colFilters.expiryFrom)) : true;
        const toOK = colFilters.expiryTo ? (fileExpiry && fileExpiry <= new Date(colFilters.expiryTo)) : true;

        return fromOK && toOK && matchesSearchQuery;
    });

    const handleEditDevice = (device) => {
        setModifyDevice({
            visitorId: visitorID,
            device,        // full device doc
        });
    };

    const handleDeleteClick = (device) => {
        // Open the confirm dialog first
        setDeleteContext({
            deviceId: device._id,
            name: device.deviceName || device.deviceType || device.serialNumber || "Device",
        });
    };

    // Called when user clicks "Yes" in the confirm popup
    const handleConfirmDeleteYes = () => {
        if (!deleteContext) return;

        setReasonContext({
            deviceId: deleteContext.deviceId,
            name: deleteContext.name,
        });
        setDeleteContext(null); // close confirm popup
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
                            icon={faSort}
                            title="Select Columns to Display"
                            className="top-right-button-control-att-2"
                            onClick={openSortModal}
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
                                        const isText = ["name", "type", "serialNumber"].includes(col.id);
                                        const isDate = ["arrivalDate", "exitDate"].includes(col.id);
                                        const isStatic = ["nr", "action"].includes(col.id);

                                        const textActive = isText && !!colFilters[col.id];
                                        const dateActive = isDate && (!!colFilters.expiryFrom || !!colFilters.expiryTo);
                                        const thActive = textActive || dateActive;

                                        return (
                                            <th key={col.id} className={`${col.thClass} col ${thActive ? "th-filter-active" : ""}`}>
                                                {isStatic && <span className="fileinfo-title-filter-1">{col.title}</span>}

                                                {isText && (
                                                    <div className="fileinfo-container-filter">
                                                        <span
                                                            className="fileinfo-title-filter"
                                                            style={{ cursor: "default" }}
                                                        >
                                                            {col.title} {textActive && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                                        </span>

                                                        {openHeader === col.id && (
                                                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Filter by ${col.title.toLowerCase()}`}
                                                                    className="filter-input-file"
                                                                    value={colFilters[col.id] ?? ""}
                                                                    onChange={(e) => setFilter(col.id, e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {isDate && (
                                                    <div className="fileinfo-container-filter">
                                                        <span
                                                            className="fileinfo-title-filter"
                                                            style={{ cursor: "default" }}
                                                        >
                                                            {col.title} {dateActive && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                                        </span>

                                                        {openHeader === "expiry" && (
                                                            <div className="date-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                                                                <div className="date-filter-row">
                                                                    <label className="date-label">From</label>

                                                                    <DatePicker
                                                                        value={colFilters.expiryFrom || ""}
                                                                        format="YYYY-MM-DD"
                                                                        onChange={(val) =>
                                                                            setFilter("expiryFrom", val?.format("YYYY-MM-DD"))
                                                                        }
                                                                        rangeHover={false}
                                                                        highlightToday={false}
                                                                        editable={false}
                                                                        inputClass="filter-input-date"
                                                                        placeholder="YYYY-MM-DD"
                                                                        hideIcon={false}
                                                                    />

                                                                    {/* 👇 Clear button resets the filter */}
                                                                    {colFilters.expiryFrom && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setFilter("expiryFrom", "")}
                                                                            style={{
                                                                                background: "none",
                                                                                border: "none",
                                                                                color: "#666",
                                                                                cursor: "pointer",
                                                                                fontSize: "14px",
                                                                                padding: "2px 6px",
                                                                            }}
                                                                            title="Clear date"
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrash} title='Clear Filter' />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="date-filter-row">
                                                                    <label className="date-label">To:</label>

                                                                    <DatePicker
                                                                        value={colFilters.expiryTo || ""}
                                                                        format="YYYY-MM-DD"
                                                                        onChange={(val) =>
                                                                            setFilter("expiryTo", val?.format("YYYY-MM-DD"))
                                                                        }
                                                                        rangeHover={false}
                                                                        highlightToday={false}
                                                                        editable={false}
                                                                        inputClass="filter-input-date"
                                                                        placeholder="YYYY-MM-DD"
                                                                        hideIcon={false}
                                                                    />

                                                                    {/* 👇 Clear button resets the filter */}
                                                                    {colFilters.expiryTo && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setFilter("expiryTo", "")}
                                                                            style={{
                                                                                background: "none",
                                                                                border: "none",
                                                                                color: "#666",
                                                                                cursor: "pointer",
                                                                                fontSize: "14px",
                                                                                padding: "2px 6px",
                                                                            }}
                                                                            title="Clear date"
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrash} title='Clear Filter' />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
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
                                                No active visitor devices found.
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
                    loading={false}  // no async here; async happens in reason popup
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
            {isSortModalOpen && (<SortPopupVisitorDevices closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
            <ToastContainer />
        </div >
    );
};

export default VisitorManagementDevices;