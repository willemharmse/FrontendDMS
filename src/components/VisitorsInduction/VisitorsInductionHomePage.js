import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faX, faFileCirclePlus, faSearch, faArrowLeft, faEdit, faTrash, faShare, faShareAlt, faCirclePlay, faCirclePlus, faBookOpen, faDownload, faBook, faUser, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../utils/auth";
import "./VisitorsInductionHomePage.css"
import SortPopupAsset from "../FlameproofDMS/Popups/SortPopupAsset";
import TopBarFP from "../FlameproofDMS/Popups/TopBarFP";
import PopupMenuOptionsAssets from "../FlameproofDMS/Popups/PopupMenuOptionsAssets";
import CreateProfilePopup from "./Popups/CreateProfilePopup";
import CreateBatchProfiles from "./Popups/CreateBatchProfiles";
import BatchExcelUpload from "./Popups/BatchExcelUpload";
import CreateProfileLink from "./Popups/CreateProfileLink";
import DeleteVisitor from "./Popups/DeleteVisitor";
import SortPopupVisitors from "./Popups/SortPopupVisitors";

const VisitorsInductionHomePage = () => {
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
        if (status === "invalid") return "status-worst";
        if (status === "-") return "status-missing"
    };

    const formatStatus = (type) => {
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
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

    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery = (
            file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.surname.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return matchesSearchQuery;
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

                    {canIn(access, "TMS", ["systemAdmin", "contributor"]) && (
                        <div className="filter-dm-fi-2">
                            <div className="button-container-dm-fi">
                                <button className="but-dm-fi" onClick={openUpload}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faUser} className="button-icon" />
                                        <span className="button-text">Create Visitor Profile</span>
                                    </div>
                                </button>
                                <button className="but-dm-fi" onClick={openBatchProg}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faUserGroup} className="button-icon" />
                                        <span className="button-text">Create Visitor Group</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="spacer"></div>

                    <TopBarFP openSort={openSortModal} />
                </div>

                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper">
                        <label className="risk-control-label">Visitor Profiles</label>
                        <FontAwesomeIcon icon={faDownload} title="Download" className="top-right-button-control-att-2" />
                        <FontAwesomeIcon icon={faBookOpen} title="Visitor" className="top-right-button-control-att" />
                    </div>
                    <div
                        className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''}`}
                        ref={scrollerRef}
                        onPointerDown={onPointerDownX}
                        onPointerMove={onPointerMoveX}
                        onPointerUp={endDragX}
                        onPointerLeave={endDragX}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        <table className="limit-table-height-visitor">
                            <thead>
                                <tr>
                                    <th className="visitor-ind-num-filter col">Nr</th>
                                    <th className="visitor-ind-name-filter col">Name</th>
                                    <th className="visitor-ind-surname-filter col">Surname</th>
                                    <th className="visitor-ind-email-filter col">Email</th>
                                    <th className="visitor-ind-company-filter col">Contact Number</th>
                                    <th className="visitor-ind-company-filter col">ID/Passport</th>
                                    <th className={`visitor-ind-company-filter col`}>Company</th>
                                    <th className={`visitor-ind-profileBy-filter col`}>Profile Created By</th>
                                    <th className={`visitor-ind-valid-filter col`}>Induction Validity</th>
                                    <th className={`visitor-ind-exp-filter col`}>Induction Expiry Date</th>
                                    <th className={`visitor-ind-vers-filter col`}>Induction Version Nr</th>
                                    {canIn(access, "TMS", ["systemAdmin", "contributor"]) && (<th className="visitor-ind-act-filter col">Action</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file, index) => {
                                    const isExpanded = expandedRow === index;

                                    return (
                                        <React.Fragment key={index}>
                                            <tr
                                                className={`file-info-row-height vihr-expandable-row ${isExpanded ? "vihr-expandable-row--open" : ""}`}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => toggleRow(index)}
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toggleRow(index);
                                                    }
                                                }}
                                                aria-expanded={isExpanded}
                                            >
                                                {/* keep your existing cells + classes exactly as they are */}
                                                <td className="col">{index + 1}</td>
                                                <td className="file-name-cell" style={{ textAlign: "center" }}>{file.name}</td>
                                                <td className="col">{file.surname}</td>
                                                <td className="col">{file.email}</td>
                                                <td className="col">{file.contactNr}</td>
                                                <td className="col">{file.idNumber}</td>
                                                <td className="col">{file.company}</td>
                                                <td className="col">{file.profileCreatedBy?.username}</td>
                                                <td className={`col ${getComplianceColor(file.validity)}`}>{formatStatus(file.validity)}</td>
                                                <td className="col">{formatDate(file.expiryDate)}</td>
                                                <td className="col">{file.indicationVersion}</td>

                                                {canIn(access, "TMS", ["systemAdmin", "contributor"]) && (
                                                    <td className="col-act">
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
                                                )}
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {upload && (<CreateProfilePopup onClose={closeUpload} refresh={fetchFiles} openUserLinkShare={openUserLinkShare} />)}
            {batchProg && <CreateBatchProfiles onClose={closeBatchProg} openExcel={openBatchExcel} refresh={fetchFiles} />}
            {batchExcel && (<BatchExcelUpload onClose={closeBatchExcel} refresh={fetchFiles} />)}
            {shareLink && (<CreateProfileLink onClose={closeShareLink} visitorEmail={email} visitorName={username} profileId={linkId} />)}
            {deleteVisitor && (<DeleteVisitor closeModal={closeDelete} deleteVisitor={deleteVisitorInstance} name={deleteName} />)}
            {isSortModalOpen && (<SortPopupVisitors closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
            <ToastContainer />
        </div >
    );
};

export default VisitorsInductionHomePage;