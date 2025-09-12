import React, { useEffect, useState, useMemo } from "react";
import "./LoadRiskDraftPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faCircleLeft, faPenToSquare, faRotateLeft, faArrowsRotate, faMagnifyingGlass, faCircleXmark, faX, faFilter, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import DeleteDraftPopup from "../Popups/DeleteDraftPopup";

const LoadRiskDraftPopup = ({ isOpen, onClose, setLoadedID, loadData, userID, riskType }) => {
    const [drafts, setDrafts] = useState([]);
    const [query, setQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, draftId: null });
    const [isLoading, setIsLoading] = useState(true);
    const [showNoDrafts, setShowNoDrafts] = useState(false);
    const [author, setAuthor] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [title, setTitle] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState(null);

    const toggleSort = (field) => {
        // clicking a different field starts fresh at asc
        if (sortBy !== field) {
            setSortBy(field);
            setSortDir('asc');
            return;
        }
        // cycle asc -> desc -> off
        if (sortDir === 'asc') { setSortDir('desc'); return; }
        // turn off
        setSortBy(null);
        setSortDir(null);
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;            // only show when active
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
        if (!sortBy || !sortDir) return list;

        const getTime = (d) => {
            if (sortBy === 'created') return new Date(d.dateCreated).getTime();
            if (sortBy === 'modified') return d.dateUpdated ? new Date(d.dateUpdated).getTime() : null;
            return null;
        };

        return list.sort((a, b) => {
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
            const route = `riskDraft/${riskType.toLowerCase()}/drafts/${userID}`;
            const token = localStorage.getItem("token");
            setIsLoading(true);
            setShowNoDrafts(false);

            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/${route}`, {
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
        await setLoadedID(draftId);
        await loadData(draftId);

        onClose();
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
        const route = `riskDraft/${riskType.toLowerCase()}/delete/${draftId}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/${route}`, {
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
                    <div className="popup-table-wrapper-draft">
                        <table className="popup-table font-fam">
                            <thead className="draft-headers">
                                <tr>
                                    <th className="draft-nr">Nr</th>
                                    <th className="draft-name">Draft Document</th>
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
                                            <tr key={item._id}>
                                                <td className="draft-nr">
                                                    {index + 1}
                                                </td>
                                                <td onClick={() => handleLoad(item._id)} className="load-draft-td">{`${item.formData.title} ${item.formData.documentType}`}</td>
                                                <td className="cent-draft-class">
                                                    <div>{item.creator?.username || "Unknown"}</div>
                                                    <div style={{ fontSize: "12px", color: "#667" }}>
                                                        {formatDateTime(item.dateCreated)}
                                                    </div>
                                                </td>
                                                <td className="cent-draft-class">
                                                    <div>{item.lockActive ? item.lockOwner?.username : (item.updater?.username || "-")}</div>
                                                    <div style={{ fontSize: "12px", color: item.lockActive ? "#7EAC89" : "#667", fontWeight: item.lockActive ? "bolder" : "" }}>
                                                        {item.lockActive ? "Active" : item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet"}
                                                    </div>
                                                </td>
                                                <td className="load-draft-delete">
                                                    <button
                                                        className={"action-button-load-draft delete-button-load-draft"}
                                                        onClick={() => confirmDelete(item._id, item.formData.title, item?.creator?._id)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} title="Remove Draft" />
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
                    </div>
                </div>
            </div>

            {deletePopup && (<DeleteDraftPopup closeModal={closeDelete} deleteDraft={handleDelete} draftName={title} author={author} />)}
        </div>
    );
};

export default LoadRiskDraftPopup;
