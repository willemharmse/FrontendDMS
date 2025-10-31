import React, { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faCircleLeft, faPenToSquare, faRotateLeft, faArrowsRotate, faMagnifyingGlass, faCircleXmark, faX, faFilter, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import DeleteDraftPopup from "../../Popups/DeleteDraftPopup";

const LoadIndcutionDraftPopup = ({ isOpen, onClose, setLoadedID, loadData, userID }) => {
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

    const handleLoad = async (draftId) => {
        if (isLoadingDraft) return;
        setIsLoadingDraft(true);
        try {
            await setLoadedID(draftId);
            await loadData(draftId);
            onClose();
        } finally {
            // usually closes, but keep this for safety
            setIsLoadingDraft(false);
        }
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

    if (!isOpen) return null;

    return (
        <div className="draftLoad-popup-overlay">
            <div className="draftLoad-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Load Draft</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>
                <div className="draft-table-group">
                    {!isLoadingDraft && (
                        <>
                            <div className="draft-select-header">
                                <div className="draft-select-text">Select draft to load</div>
                            </div>
                            <div className="draft-searchbar draft-searchbar--full">
                                <input
                                    type="text"
                                    className="draft-search-input"
                                    placeholder="Search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
                                />
                                <div className="draft-search-icons">
                                    {query && (
                                        <span className="icon-static" title="Clear Search" onClick={() => setQuery('')}>
                                            <FontAwesomeIcon icon={faX} />
                                        </span>
                                    )}
                                    {!query && (
                                        <span className="icon-static" title="Search">
                                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    <div className="popup-table-wrapper-draft">
                        {isLoadingDraft ? (
                            <div className="draft-loading" aria-live="polite">
                                <FontAwesomeIcon icon={faSpinner} className="spin" />
                                <span style={{ marginLeft: 10, fontWeight: "normal" }}>Loading draft…</span>
                            </div>
                        ) : (
                            <table className="popup-table font-fam">
                                <thead className="draft-headers">
                                    <tr>
                                        <th className="draft-nr">Nr</th>
                                        <th className="draft-name">Draft Visitor Induction {query && (<FontAwesomeIcon icon={faFilter} style={{ marginLeft: "10px" }} />)}</th>
                                        <th
                                            className="draft-created"
                                            onClick={() => toggleSort('created')}
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            Created By <SortIcon field="created" />
                                        </th>

                                        <th
                                            className="draft-updated"
                                            onClick={() => toggleSort('modified')}
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            Modified By <SortIcon field="modified" />
                                        </th>
                                        <th className="draft-actions-load">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!isLoading && drafts.length > 0 && filteredDrafts.length > 0 && (
                                        displayDrafts
                                            .map((item, index) => (
                                                <tr key={item._id} style={{ backgroundColor: item.publishable ? "#7EAC89" : "transparent" }}>
                                                    <td className="draft-nr" style={{ color: item.publishable ? "white" : "black" }}>
                                                        {index + 1}
                                                    </td>
                                                    <td onClick={() => handleLoad(item._id)} className="load-draft-td" style={{ color: item.publishable ? "white" : "black" }}>{`${item.formData.courseTitle}`}</td>
                                                    <td className="cent-draft-class" style={{ color: item.publishable ? "white" : "black" }}>
                                                        <div>{item.creator?.username || "Unknown"}</div>
                                                        <div style={{ fontSize: "12px", color: item.publishable ? "white" : "#667" }}>
                                                            {formatDateTime(item.dateCreated)}
                                                        </div>
                                                    </td>
                                                    <td className="cent-draft-class" style={{ color: item.publishable ? "white" : "black" }}>
                                                        <div>{item.lockActive ? item.lockOwner?.username : (item.updater?.username || "-")}</div>
                                                        <div style={{ fontSize: "12px", color: item.publishable ? "white" : "#667", fontWeight: item.lockActive ? "bolder" : "" }}>
                                                            {item.lockActive ? "Active" : item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet"}
                                                        </div>
                                                    </td>
                                                    <td className="load-draft-delete" >
                                                        <button
                                                            className={"action-button-load-draft delete-button-load-draft"}
                                                            onClick={() => confirmDelete(item._id, item.formData.title, item?.creator?._id)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} title="Remove Draft" style={{ color: item.publishable ? "white" : "black" }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                    )}

                                    {isLoading && (
                                        <tr>
                                            <td colSpan="5" className="cent">
                                                Loading drafts…
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading && drafts.length === 0 && showNoDrafts && (
                                        <tr>
                                            <td colSpan="5" className="cent">
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

export default LoadIndcutionDraftPopup;
