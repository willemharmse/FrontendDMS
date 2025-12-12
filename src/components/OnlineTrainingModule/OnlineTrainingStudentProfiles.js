import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faX, faFileCirclePlus, faSearch, faArrowLeft, faEdit, faTrash, faShare, faShareAlt, faCirclePlay, faCirclePlus, faBookOpen, faDownload, faBook, faUser, faUserGroup, faColumns, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from "react-multi-date-picker";
import { canIn, getCurrentUser } from "../../utils/auth";
import TopBar from "../Notifications/TopBar";
import SortPopupVisitors from "../VisitorsInduction/Popups/SortPopupVisitors";

const OnlineTrainingStudentProfiles = () => {
    const [expandedRow, setExpandedRow] = useState(null);
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

    const deleteVisitorInstance = async () => {
        if (!deleteId) return;
        try {

            const response = await fetch(`${process.env.REACT_APP_URL}/api/visitors/deleteVisitor/${deleteId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete the file');
            setDeleteVisitor(false);
            setDeleteId(null);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
        }
    };

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

    const openUpload = () => {
        setUpload(true);
    }

    const closeUpload = () => {
        setUpload(!upload);
    }

    const openDelete = (name, id) => {
        setDeleteName(name);
        setDeleteId(id);
        setDeleteVisitor(true);
    }

    const closeDelete = () => {
        setDeleteName("");
        setDeleteId("");
        setDeleteVisitor(!deleteVisitor);
    }

    const openBatchProg = () => {
        setBatchProg(true);
    }

    const closeBatchProg = () => {
        setBatchProg(!batchProg);
    }

    const openBatchExcel = () => {
        setBatchExcel(true);
        setBatchProg(false);
    }

    const closeBatchExcel = () => {
        setBatchExcel(!batchExcel);
    }

    const openShareLink = (name, email, id) => {
        setUsername(name);
        setEmail(email);
        setShareLink(true);
        setLinkId(id);
    }

    const closeShareLink = () => {
        setUsername("");
        setEmail("");
        setLinkId("");
        setShareLink(false);
    }

    const openUserLinkShare = (user) => {
        setUsername(user.name);
        setEmail(user.email);
        setShareLink(true);
        setLinkId(user._id);
    }

    const [files, setFiles] = useState([]);

    const fetchFiles = async () => {
        return;
        const route = `/api/visitors/getVisitors`;
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
            console.log(data);
            setFiles(data.visitors);
        } catch (error) {
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

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
        { id: "name", title: "Name", thClass: "visitor-ind-name-filter", td: (f) => f.name },
        { id: "surname", title: "Surname", thClass: "visitor-ind-surname-filter", td: (f) => f.surname },
        { id: "company", title: "Company", thClass: "visitor-ind-company-filter", td: (f) => f.company ?? "-" },
        { id: "createdBy", title: "Profile Created By", thClass: "visitor-ind-profileBy-filter", td: (f) => f.profileCreatedBy.username ?? "-" },
        { id: "courses", title: "Enroled Courses", thClass: "visitor-ind-email-filter", td: (f) => f.email ?? "-" },
        { id: "completed", title: "Completed Courses", thClass: "visitor-ind-company-filter", td: (f) => extractNumbers(f.contactNr) ?? "-" },
        { id: "lastDate", title: "Last Completion Date", thClass: "visitor-ind-vers-filter", td: (f) => f.indicationVersion ?? "-" },
        // "action" column is permission-based, we add it dynamically below
    ];

    const [showColumns, setShowColumns] = useState(() => {
        // default starter set
        const base = ["nr", "name", "surname", "company", "createdBy", "courses", "completed", "lastDate"];
        // include action for contributors/admins
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
            file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.surname.toLowerCase().includes(searchQuery.toLowerCase());

        // Text filters (case-insensitive, guard nulls)
        const matchesText =
            (colFilters.name ? (file.name ?? "").toLowerCase().includes(colFilters.name.toLowerCase()) : true) &&
            (colFilters.surname ? (file.surname ?? "").toLowerCase().includes(colFilters.surname.toLowerCase()) : true) &&
            (colFilters.email ? (file.email ?? "").toLowerCase().includes(colFilters.email.toLowerCase()) : true) &&
            (colFilters.phone ? (file.contactNr ?? "").toLowerCase().includes(colFilters.phone.toLowerCase()) : true) &&
            (colFilters.idnum ? (file.idNumber ?? "").toLowerCase().includes(colFilters.idnum.toLowerCase()) : true) &&
            (colFilters.company ? (file.company ?? "").toLowerCase().includes(colFilters.company.toLowerCase()) : true) &&
            (colFilters.createdBy ? ((file.profileCreatedBy?.username) ?? "").toLowerCase().includes(colFilters.createdBy.toLowerCase()) : true) &&
            (colFilters.validity ? (formatStatus(file.validity) ?? "").toLowerCase().includes(colFilters.validity.toLowerCase()) : true) &&
            (colFilters.version ? (file.indicationVersion ?? "").toLowerCase().includes(colFilters.version.toLowerCase()) : true);

        // Date range filter (expiry)
        const fileExpiry = file.expiryDate ? new Date(file.expiryDate) : null;
        const fromOK = colFilters.expiryFrom ? (fileExpiry && fileExpiry >= new Date(colFilters.expiryFrom)) : true;
        const toOK = colFilters.expiryTo ? (fileExpiry && fileExpiry <= new Date(colFilters.expiryTo)) : true;

        return matchesSearchQuery && matchesText && fromOK && toOK;
    });

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
                                <button className="but-dm-fi">
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faUser} className="button-icon" />
                                        <span className="button-text">Create Profile</span>
                                    </div>
                                </button>
                                <button className="but-dm-fi">
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faUserGroup} className="button-icon" />
                                        <span className="button-text">Create Group</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/visitorInductionIcon2.svg`} alt="Logo" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">Student Profiles</p>
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
                        <label className="risk-control-label">Student Profiles</label>
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
                        <table className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`}>
                            <thead>
                                <tr>
                                    {visibleColumns.map(col => {
                                        const isText = ["name", "surname", "email", "phone", "idnum", "company", "createdBy", "courses", "completed", "lastDate"].includes(col.id);
                                        const isDate = col.id === "expiry";
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
                                                            onClick={() => setOpenHeader(prev => prev === col.id ? null : col.id)}
                                                            title={`Filter by ${col.title}`}
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
                                                            onClick={() => setOpenHeader(prev => prev === "expiry" ? null : "expiry")}
                                                            title="Filter by expiry date"
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
                                                No profiles found.
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

            {isSortModalOpen && (<SortPopupVisitors closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
            <ToastContainer />
        </div >
    );
};

export default OnlineTrainingStudentProfiles;