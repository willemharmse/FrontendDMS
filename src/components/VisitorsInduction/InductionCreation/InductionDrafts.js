import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faCircleLeft, faPenToSquare, faRotateLeft, faArrowsRotate, faMagnifyingGlass, faCircleXmark, faX, faFilter, faSortUp, faSortDown, faArrowLeft, faCaretRight, faCaretLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import DeleteDraftPopup from "../../Popups/DeleteDraftPopup";
import TopBar from "../../Notifications/TopBar";

const InductionDrafts = () => {
    const [drafts, setDrafts] = useState([]);
    const [query, setQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, draftId: null });
    const [isLoading, setIsLoading] = useState(true);
    const [showNoDrafts, setShowNoDrafts] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [author, setAuthor] = useState(false);
    const [title, setTitle] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [isLoadingDraft, setIsLoadingDraft] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [userID, setUserID] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const toggleSort = (field) => {
        if (sortBy !== field) {
            setSortBy(field);
            setSortDir('asc');
            return;
        }
        if (sortDir === 'asc') { setSortDir('desc'); return; }
        setSortBy(null);
        setSortDir(null);
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;
        if (sortDir === 'asc') return <FontAwesomeIcon icon={faSortUp} style={{ marginLeft: 6 }} />;
        if (sortDir === 'desc') return <FontAwesomeIcon icon={faSortDown} style={{ marginLeft: 6 }} />;
        return null;
    };

    const filteredDrafts = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return drafts;
        return drafts.filter(d =>
            (d?.formData?.title || '').toLowerCase().includes(q)
        );
    }, [drafts, query]);

    const displayDrafts = useMemo(() => {
        const list = [...filteredDrafts];

        const getTime = (d) => {
            if (sortBy === 'created') return new Date(d.dateCreated).getTime();
            if (sortBy === 'modified') return d.dateUpdated ? new Date(d.dateUpdated).getTime() : null;
            return null;
        };

        return list.sort((a, b) => {
            // 1) Publishable first
            if (a.publishable && !b.publishable) return -1;
            if (!a.publishable && b.publishable) return 1;

            // 2) Then apply current sort (if any)
            if (!sortBy || !sortDir) return 0;

            const at = getTime(a);
            const bt = getTime(b);

            // Always push "Not Updated Yet" (null) to the bottom, regardless of direction
            if (at == null && bt == null) return 0;
            if (at == null) return 1;
            if (bt == null) return -1;

            return sortDir === 'asc' ? at - bt : bt - at;
        });
    }, [filteredDrafts, sortBy, sortDir]);

    const closeDelete = () => {
        setDeletePopup(false);
        setDeleteConfirm({ open: false, draftId: null });
    }

    useEffect(() => {
        const getDraftDocuments = async () => {
            setIsLoading(true);
            setShowNoDrafts(false);
            let route;
            const token = localStorage.getItem("token");

            route = `${process.env.REACT_APP_URL}/api/visitorDrafts/getDrafts/${userID}`

            try {
                const response = await fetch(route, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch drafts");
                }

                const data = await response.json();
                console.log(data);
                setDrafts(data);
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        getDraftDocuments();
    }, [userID]);

    useEffect(() => {
        if (!isLoading && drafts.length === 0) {
            const timer = setTimeout(() => setShowNoDrafts(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowNoDrafts(false);
        }
    }, [isLoading, drafts]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Johannesburg' // Change to your desired timezone
        };

        const formatter = new Intl.DateTimeFormat(undefined, options);
        const parts = formatter.formatToParts(date);

        const datePart = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
        const timePart = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value} ${parts.find(p => p.type === 'dayPeriod').value}`;

        return `${datePart} ${timePart}`;
    };

    const confirmDelete = (draftId, title, creator) => {
        setDeleteConfirm({ open: true, draftId });
        setTitle(title);

        if (creator === userID) {
            setAuthor(true);
        }
        else if (creator !== userID) {
            setAuthor(false);
        }

        setDeletePopup(true);
    };

    const handleDelete = async () => {
        const { draftId } = deleteConfirm;
        if (!draftId) return;

        let route;
        route = `${process.env.REACT_APP_URL}/api/visitorDrafts/delete/${draftId}`

        try {
            const response = await fetch(`${route}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete draft");
            }

            setDrafts(drafts.filter(draft => draft._id !== draftId));

            if (drafts.length === 0) {
                setShowNoDrafts(true);
            }
        } catch (error) {
            console.error("Failed to delete draft:", error);
        }

        setDeleteConfirm({ open: false, draftId: null });
        closeDelete();
    };

    const clearSearch = () => {
        setQuery("");
    }

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
                        <img src={`${process.env.PUBLIC_URL}/tmsSavedDrafts2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Saved Drafts"}</p>
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
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {query === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Saved Drafts"}</label>
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        {isLoadingDraft ? (
                            <div className="draft-loading" aria-live="polite">
                                <FontAwesomeIcon icon={faSpinner} className="spin" />
                                <span style={{ marginLeft: 10, fontWeight: "normal" }}>Loading draft…</span>
                            </div>
                        ) : (
                            <table className="gen-table">
                                <thead className="gen-head">
                                    <tr>
                                        <th className="gen-th ibraGenNr" style={{ width: "5%" }}>Nr</th>
                                        <th className="gen-th ibraGenFN" style={{ width: "30%" }}>Draft Visitor Induction</th>
                                        <th className="gen-th ibraGenVer" style={{ width: "15%" }}>Created By</th>
                                        <th className="gen-th ibraGenStatus" style={{ width: "15%" }}>Creation Date</th>
                                        <th className="gen-th ibraGenPB" style={{ width: "15%" }}>Last Modified By</th>
                                        <th className="gen-th ibraGenPD" style={{ width: "15%" }}>Last Modification Date</th>
                                        <th className="gen-th ibraGenType" style={{ width: "5%" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!isLoading && drafts.length > 0 && filteredDrafts.length > 0 && (
                                        displayDrafts
                                            .map((item, index) => (
                                                <tr key={item._id} style={{ backgroundColor: item.approvalState ? "#7EAC89" : "transparent", fontSize: "15px" }} className="load-draft-td" onClick={() => navigate(`/FrontendDMS/inductionCreation/${item._id}`)}>
                                                    <td style={{ color: item.approvalState ? "white" : "black", fontFamily: "Arial", textAlign: "center" }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ color: item.approvalState ? "white" : "black", fontFamily: "Arial" }}>{`${item.formData.courseTitle}`}</td>
                                                    <td className="cent-draft-class" style={{ color: item.approvalState ? "white" : "black", fontFamily: "Arial" }}>
                                                        {item.creator?.username || "Unknown"}
                                                    </td>
                                                    <td style={{ color: item.approvalState ? "white" : "black", textAlign: "center", fontFamily: "Arial" }}>
                                                        {formatDateTime(item.dateCreated)}
                                                    </td>

                                                    <td className="cent-draft-class" style={{ color: item.approvalState ? "white" : "black", fontFamily: "Arial" }}>
                                                        {item.lockActive ? item.lockOwner?.username : (item.updater?.username || "-")}
                                                    </td>
                                                    <td style={{ color: item.approvalState ? "white" : "black", textAlign: "center", fontFamily: "Arial" }}>
                                                        {item.lockActive ? "Active" : item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet"}
                                                    </td>
                                                    <td className="load-draft-delete" >
                                                        <button
                                                            className={"action-button-load-draft delete-button-load-draft"}
                                                            style={{ width: "100%" }}
                                                            onClick={() => confirmDelete(item._id, item.formData.courseTitle, item?.creator?._id)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} title="Remove Draft" style={{ color: item.approvalState ? "white" : "black" }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                    )}

                                    {isLoading && (
                                        <tr>
                                            <td colSpan="7" className="cent">
                                                Loading drafts…
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading && drafts.length === 0 && showNoDrafts && (
                                        <tr>
                                            <td colSpan="7" className="cent">
                                                No Drafts Available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {deletePopup && (<DeleteDraftPopup closeModal={closeDelete} deleteDraft={handleDelete} draftName={title} author={author} />)}
        </div>
    );
};

export default InductionDrafts;
