import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faColumns } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from "react-toastify";
import PopupMenuPubInduction from "../VisitorsInduction/InductionCreation/PopupMenuPubInduction";
import TopBar from "../Notifications/TopBar";
import DeletePopup from "../FileInfo/DeletePopup";
import PublishedInductionPreviewPage from "../VisitorsInduction/InductionCreation/PublishedInductionPreviewPage";
import PopupMenuOnlineTraining from "./PopupMenuOnlineTraining";

const OnlineTrainingPublished = () => {
    const [files, setFiles] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();
    const [userID, setUserID] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isPreview, setIsPreview] = useState(false);
    const [previewID, setPreviewID] = useState(false);

    // ----- horizontal drag-to-scroll logic (same as VisitorsInductionHomePage) -----
    const scrollerRef = useRef(null);
    const dragRef = useRef({
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
    // ------------------------------------------------------------------------------

    const openPreview = (id) => {
        setPreviewID(id);
        setIsPreview(true);
    };

    const closePreview = () => {
        setPreviewID("");
        setIsPreview(false);
    };

    const fileDelete = (id, fileName) => {
        setFileToDelete(id);
        setIsModalOpen(true);
        setSelectedFileName(fileName);
    };

    const closeModal = () => {
        setIsModalOpen(null);
    };

    const deleteFile = async () => {
        if (!fileToDelete) return;
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/standard/trashFile/${fileToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to delete the file');

            setFileToDelete("");
            setSelectedFileName("");
            setIsModalOpen(false);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/');
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'published': return 'status-approved';
            case 'in review': return 'status-pending';
            case 'in approval': return 'status-rejected';
            default: return 'status-default';
        }
    };

    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    useEffect(() => {
        if (token) {
            fetchFiles();
        }
    }, [token]);

    // Fetch files from the API
    const fetchFiles = async () => {
        const route = `/api/onlineTrainingCourses/publishedDocs`;
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

            setFiles(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const undoRetakeChoice = async (id) => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/onlineTrainingCourses/undo-retake/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to delete the file');

            toast.success("Induction Retake Required Reverted")

            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery = (
            file.formData.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return matchesSearchQuery;
    });

    // -------- Column selector setup (mirrors VisitorsInductionHomePage, no filters) --------
    const allColumns = [
        {
            id: "nr",
            title: "Nr",
            thClass: "gen-th ibraGenNr",
            tdClass: "cent-values-gen",
            td: (file, index) => index + 1
        },
        {
            id: "name",
            title: "Course Name",
            thClass: "gen-th ibraGenFN",
            tdClass: "gen-point",
            onCellClick: (file) => {
                setHoveredFileId(hoveredFileId === file._id ? null : file._id);
            },
            td: (file) => (
                <div className="popup-anchor">
                    <span>
                        {removeFileExtension(file.formData.courseTitle)}
                    </span>

                    {(hoveredFileId === file._id) && (
                        <PopupMenuOnlineTraining
                            file={file}
                            typeDoc={"standard"}
                            risk={false}
                            isOpen={hoveredFileId === file._id}
                            setHoveredFileId={setHoveredFileId}
                            id={file._id}
                            openPreview={openPreview}
                            undoRetakeChoice={undoRetakeChoice}
                        />
                    )}
                </div>
            )
        },
        {
            id: "version",
            title: "Version",
            thClass: "gen-th ibraGenVer",
            tdClass: "cent-values-gen",
            td: (file) => file.version
        },
        {
            id: "status",
            title: "Course Status",
            thClass: `gen-th ibraGenStatus`,
            tdClass: `cent-values-gen`,
            td: (file) => (
                file.approvalState ? "In Approval" : file.documentStatus
            )
        },
        {
            id: "firstPublishedBy",
            title: "First Published By",
            thClass: "gen-th ibraGenPB",
            tdClass: "cent-values-gen",
            td: (file) => file.publisher.username
        },
        {
            id: "firstPublishedDate",
            title: "First Published Date",
            thClass: "gen-th ibraGenPD",
            tdClass: "cent-values-gen",
            td: (file) => formatDate(file.datePublished)
        },
        {
            id: "lastReviewedBy",
            title: "Last Reviewed By",
            thClass: "gen-th ibraGenRB",
            tdClass: "cent-values-gen",
            td: (file) => file.reviewer?.username ? file.reviewer.username : "N/A"
        },
        {
            id: "lastReviewDate",
            title: "Last Review Date",
            thClass: "gen-th ibraGenRD",
            tdClass: "cent-values-gen",
            td: (file) => file.dateReviewed ? formatDate(file.dateReviewed) : "N/A"
        },
        {
            id: "approvers",
            title: "Course Approvers",
            thClass: "gen-th ibraGenStatus",
            tdClass: "cent-values-gen",
            td: (file) => {
                const approvers = file.approvers || [];

                // No approvers -> show N/A
                if (!approvers.length) {
                    return "N/A";
                }

                const inApproval = !!file.approvalState;

                return (
                    <ul className="approver-list">
                        {approvers.map((appr) => {
                            const name = appr.user?.username || "Unknown";
                            const isApproved = inApproval && appr.approved; // only colour when in approval state

                            return (
                                <li
                                    key={appr._id || name}
                                    style={{ color: isApproved ? "#7EAC89" : "black" }}
                                >
                                    {name}
                                </li>
                            );
                        })}
                    </ul>
                );
            }
        },
        {
            id: "action",
            title: "Action",
            thClass: "gen-th ibraGenType",
            tdClass: "cent-values-gen",
            td: (file) => (
                <button
                    className={"delete-button-fi col-but"}
                >
                    <FontAwesomeIcon
                        icon={faTrash}
                        title="Delete Document"
                        onClick={() => fileDelete(file._id, file.formData.courseTitle)}
                    />
                </button>
            )
        }
    ];

    // main columns count = current base columns (no extras yet)
    const MAIN_COLUMNS_COUNT = 9;

    // show all columns by default
    // Do NOT show approvers by default
    const [showColumns, setShowColumns] = useState(() =>
        allColumns
            .map(c => c.id)
            .filter(id => id !== "approvers")
    );

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const availableColumns = allColumns;

    const toggleColumn = (id) => {
        // pin Nr & Action like VisitorsInductionHomePage
        if (id === "nr" || id === "action") return;

        setShowColumns(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
        );
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            setShowColumns(availableColumns.map(c => c.id));
        } else {
            // minimal: only Nr and Action
            setShowColumns(["nr", "action"]);
        }
    };

    const areAllSelected = () => {
        const selectable = availableColumns.map(c => c.id);
        return selectable.every(id => showColumns.includes(id));
    };

    const visibleColumns = availableColumns.filter(c => showColumns.includes(c.id));
    const visibleCount = visibleColumns.length;

    // when more than the main columns are visible, allow wide scroll
    const isWide = visibleCount > MAIN_COLUMNS_COUNT;
    // -------------------------------------------------------------------

    return (
        <div className="gen-file-info-container">
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
                        <img src={`${process.env.PUBLIC_URL}/tmsPublished2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Published Courses"}</p>
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

            <div className="main-box-gen-info">
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

                    <div className={`info-box-fih`}>Number of Courses: {filteredFiles.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Published Courses"}</label>

                        {/* Column selector icon (same look & feel as VisitorsInductionHomePage) */}
                        <FontAwesomeIcon
                            icon={faColumns}
                            title="Select Columns to Display"
                            className="top-right-button-control-att"
                            onClick={() => setShowColumnSelector(v => !v)}
                        />

                        {showColumnSelector && (
                            <div
                                className="column-selector-popup"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="column-selector-header">
                                    <h4>Select Columns</h4>
                                    <button
                                        className="close-popup-btn"
                                        onClick={() => setShowColumnSelector(false)}
                                    >
                                        ×
                                    </button>
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
                                        <button
                                            className="apply-columns-btn"
                                            onClick={() => setShowColumnSelector(false)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="table-container-file-flameproof-all-assets">
                        {/* Horizontal scroll wrapper (same as VisitorsInductionHomePage) */}
                        <div
                            className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} ${isWide ? 'wide' : ''}`}
                            ref={scrollerRef}
                            onPointerDown={onPointerDownX}
                            onPointerMove={onPointerMoveX}
                            onPointerUp={endDragX}
                            onPointerLeave={endDragX}
                            onDragStart={(e) => e.preventDefault()}
                            style={{ maxHeight: "calc(100% - 0px)", height: "100%" }}
                        >
                            <table className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`} style={{ height: "0" }}>
                                <thead className="gen-head">
                                    <tr>
                                        {visibleColumns.map(col => (
                                            <th key={col.id} className={col.thClass}>
                                                {col.title}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.map((file, index) => (
                                        <tr key={file._id} className={`file-info-row-height gen-tr`}>
                                            {visibleColumns.map(col => {
                                                // If this is the status column, compute the status and class
                                                const isStatusCol = col.id === "status";
                                                const statusValue = isStatusCol
                                                    ? (file.approvalState ? "In Approval" : file.documentStatus)
                                                    : null;
                                                const statusClass = isStatusCol && statusValue
                                                    ? getStatusClass(statusValue)
                                                    : "";

                                                return (
                                                    <td
                                                        key={`${file._id}-${col.id}`}
                                                        className={`${col.tdClass} ${statusClass}`}
                                                        onClick={
                                                            col.onCellClick
                                                                ? () => col.onCellClick(file)
                                                                : undefined
                                                        }
                                                    >
                                                        {col.td(file, index)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} isTrashView={false} loading={loading} selectedFileName={selectedFileName} />)}
            {isPreview && (<PublishedInductionPreviewPage draftID={previewID} closeModal={closePreview} />)}
            <ToastContainer />
        </div>
    );
};

export default OnlineTrainingPublished;
