import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faCircleLeft, faPenToSquare, faRotateLeft, faArrowsRotate, faMagnifyingGlass, faCircleXmark, faX, faFilter, faSortUp, faSortDown, faArrowLeft, faCaretRight, faCaretLeft, faSearch, faEdit, faFile, faArrowRight, faUser } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../../Notifications/TopBar";
import TrainingDraftOwnership from "./TrainingDraftOwnership";
import { toast, ToastContainer } from "react-toastify";
import MigrateDraftOwnership from "../../DraftMigration/MigrateDraftOwnership";

const TrainingDrafts = () => {
    const [drafts, setDrafts] = useState([]);
    const [query, setQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, draftId: null });
    const [isLoading, setIsLoading] = useState(true);
    const [showNoDrafts, setShowNoDrafts] = useState(false);
    const [transferPopup, setTransferPopup] = useState(false);
    const [author, setAuthor] = useState(false);
    const [title, setTitle] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [isLoadingDraft, setIsLoadingDraft] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [userID, setUserID] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const [creatorID, setCreatorID] = useState('');
    const [draftType, setDraftType] = useState('');
    const [draftID, setDraftID] = useState(null);
    const navigate = useNavigate();
    const [batchTransfer, setBatchTransfer] = useState(false);

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

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const formatDateTime = (dateString) => {
        if (!dateString) return "Not Updated Yet";
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Johannesburg'
        };

        const formatter = new Intl.DateTimeFormat(undefined, options);
        const parts = formatter.formatToParts(date);

        const datePart = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
        const timePart = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value} ${parts.find(p => p.type === 'dayPeriod').value}`;

        return `${datePart} ${timePart}`;
    };

    const getRawValue = (item, colId) => {
        switch (colId) {
            case "name": return item.formData?.courseTitle || "";
            case "draftType": return item.draftType || "";
            case "createdBy": return item.creator?.username || "Unknown";
            case "creationDate": return formatDateTime(item.dateCreated);
            case "lastModifiedBy": return item.lockActive ? item.lockOwner?.username : (item.updater?.username || "-");
            case "lastModifiedDate": return item.lockActive ? "Active" : item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet";
            default: return "";
        }
    };

    const openBatch = () => {
        setBatchTransfer(true);
    }

    const closeBatch = () => {
        setBatchTransfer(false);
    }

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

    const toggleExcelSort = (field, dir) => {
        if (sortBy === field && sortDir === dir) {
            setSortBy(null);
            setSortDir(null);
        } else {
            setSortBy(field);
            setSortDir(dir);
        }
    };

    const filteredDrafts = useMemo(() => {
        const q = query.trim().toLowerCase();

        return drafts.filter(d => {
            const matchesQuery = !q || (d?.formData?.courseTitle || '').toLowerCase().includes(q);

            // Excel Filters
            let excelMatch = true;
            for (const [colId, selectedSet] of Object.entries(activeExcelFilters)) {
                if (!selectedSet) continue;
                const val = getRawValue(d, colId);
                if (!selectedSet.has(val)) {
                    excelMatch = false;
                    break;
                }
            }

            return matchesQuery && excelMatch;
        });
    }, [drafts, query, activeExcelFilters]);

    const displayDrafts = useMemo(() => {
        const list = [...filteredDrafts];

        return list.sort((a, b) => {
            // 1) Publishable first
            if (a.publishable && !b.publishable) return -1;
            if (!a.publishable && b.publishable) return 1;

            // 2) Then apply current sort (if any)
            if (!sortBy || !sortDir) return 0;

            const valA = getRawValue(a, sortBy);
            const valB = getRawValue(b, sortBy);

            const dir = sortDir === 'asc' ? 1 : -1;
            return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
        });
    }, [filteredDrafts, sortBy, sortDir]);

    const closeTransfer = () => {
        setTransferPopup(false);
        setCreatorID('');
        setCreatorName('');
        setDraftType('');
        setDraftID(null);
    }

    const getDraftDocuments = async () => {
        setIsLoading(true);
        setShowNoDrafts(false);
        let route;
        const token = localStorage.getItem("token");

        route = `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/all-drafts`

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

    useEffect(() => {
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

    const transferOwnership = (draftId, title, creatorName, creatorID, draftType, draft) => {
        if (draft.lockActive) {
            toast.error("Cannot transfer ownership while draft is locked for editing.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }
        setTitle(title);
        setCreatorName(creatorName);
        setCreatorID(creatorID);
        setDraftType(draftType);
        setDraftID(draftId);
        setTransferPopup(true);
    };

    const clearSearch = () => {
        setQuery("");
    }

    // Excel Filter Popup Logic
    function openExcelFilterPopup(colId, e) {
        if (!colId) return;
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Use cross-filtering helper here
        const allValues = getAvailableOptions(colId);
        const currentFilter = activeExcelFilters[colId];

        // If there's an active filter, use it. Otherwise, default to all available cross-filtered values.
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
        if (excelFilter.open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [excelFilter.open]);

    const handleInnerScrollWheel = (e) => e.stopPropagation();

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortBy !== null || sortDir !== null;
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortBy, sortDir]);

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
        setSortBy(null);
        setSortDir(null);
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        return "top-right-button-control-att";
    };

    // Helper to calculate available options for a column (Cross-Filtering)
    const getAvailableOptions = (targetColId) => {
        const q = query.trim().toLowerCase();
        let filtered = drafts;

        // 1. Apply the main table search query
        if (q) {
            filtered = filtered.filter(d => (d?.formData?.courseTitle || '').toLowerCase().includes(q));
        }

        // 2. Apply all Excel filters EXCEPT the target column
        for (const [colId, selectedSet] of Object.entries(activeExcelFilters)) {
            if (colId === targetColId) continue;
            if (!selectedSet) continue;

            filtered = filtered.filter(d => selectedSet.has(getRawValue(d, colId)));
        }

        // Return unique, sorted options
        return Array.from(new Set(filtered.map(d => getRawValue(d, targetColId)))).sort();
    };

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
                    {false && (<div className="button-container-create">
                        <button className="but-um" onClick={() => openBatch()}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFile} className="button-logo-custom" />
                                <span className="button-text">Batch Migrate</span>
                            </div>
                        </button>
                    </div>)}

                    <div className="button-container-rm-home">
                        <button className="but-um" onClick={openBatch}>
                            <div className="button-content">
                                <span
                                    className="fa-layers fa-fw user-migrate-icon"
                                    style={{ left: "-15px" }}
                                >
                                    <FontAwesomeIcon icon={faUser} transform="left-7 shrink-3" />
                                    <FontAwesomeIcon icon={faUser} transform="right-7 shrink-3" />

                                    {/* White outline */}
                                    <FontAwesomeIcon
                                        icon={faArrowRight}
                                        transform="shrink-7 down-1"
                                        style={{ color: "white" }}
                                    />

                                    {/* Arrow */}
                                    <FontAwesomeIcon
                                        icon={faArrowRight}
                                        transform="shrink-8 down-1"
                                    />
                                </span>
                                <span className="button-text">Batch Migrate Drafts</span>
                            </div>
                        </button>
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
                        <label className="risk-control-label">{"Migrate TMS Drafts"}</label>
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
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        {isLoadingDraft ? (
                            <div className="draft-loading" aria-live="polite">
                                <FontAwesomeIcon icon={faSpinner} className="spin" />
                                <span style={{ marginLeft: 10, fontWeight: "normal" }}>Loading Drafts</span>
                            </div>
                        ) : (
                            <table className="gen-table">
                                <thead className="gen-head" style={{ fontSize: "14px" }}>
                                    <tr>
                                        <th className="gen-th ibraGenNr" style={{ width: "5%" }}>Nr</th>
                                        <th className="gen-th ibraGenFN" style={{ width: "30%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("name", e)}>
                                            Draft Title
                                            {(sortBy === "name" || activeExcelFilters["name"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenPB" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("draftType", e)}>
                                            Module
                                            {(sortBy === "draftType" || activeExcelFilters["draftType"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenVer" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("createdBy", e)}>
                                            Draft Owner
                                            {(sortBy === "createdBy" || activeExcelFilters["createdBy"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenStatus" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("creationDate", e)}>
                                            Creation Date
                                            {(sortBy === "creationDate" || activeExcelFilters["creationDate"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenPD" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("lastModifiedDate", e)}>
                                            Last Modification Date
                                            {(sortBy === "lastModifiedDate" || activeExcelFilters["lastModifiedDate"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenType" style={{ width: "5%" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!isLoading && drafts.length > 0 && filteredDrafts.length > 0 && (
                                        displayDrafts
                                            .map((item, index) => (
                                                <tr key={item._id} style={{ fontSize: "14px", cursor: "default" }} className="load-draft-td">
                                                    <td style={{ color: item.approvalState ? "black" : "black", fontFamily: "Arial", textAlign: "center" }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ color: item.approvalState ? "black" : "black", fontFamily: "Arial" }}>{`${item.formData.courseTitle}`}</td>

                                                    <td className="cent-draft-class" style={{ color: item.approvalState ? "black" : "black", fontFamily: "Arial" }}>
                                                        {item.draftType}
                                                    </td>
                                                    <td className="cent-draft-class" style={{ color: item.approvalState ? "black" : "black", fontFamily: "Arial" }}>
                                                        {item.creator?.username || "Unknown"}
                                                    </td>
                                                    <td style={{ color: item.approvalState ? "black" : "black", textAlign: "center", fontFamily: "Arial" }}>
                                                        {formatDateTime(item.dateCreated)}
                                                    </td>
                                                    <td style={{ color: item.approvalState ? "black" : "black", textAlign: "center", fontFamily: "Arial" }}>
                                                        {item.lockActive ? "Active" : item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet"}
                                                    </td>
                                                    <td className="load-draft-delete" >
                                                        <button
                                                            className={"action-button-load-draft delete-button-load-draft"}
                                                            style={{ width: "100%" }}
                                                            onClick={(e) => { e.stopPropagation(); transferOwnership(item._id, item.formData.courseTitle, item?.creator?.username, item?.creator?._id, item.draftType, item) }}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} title="Manage Ownership" style={{ color: item.approvalState ? "black" : "black" }} />
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

            {transferPopup && (
                <TrainingDraftOwnership
                    onClose={closeTransfer}
                    creatorName={creatorName}
                    creatorID={creatorID}
                    draftType={draftType}
                    draftTitle={title}
                    draftID={draftID}
                    refresh={getDraftDocuments}
                />
            )}

            {excelFilter.open && (
                <div className="excel-filter-popup" ref={excelPopupRef} style={{ position: "fixed", top: excelFilter.pos.top, left: excelFilter.pos.left, width: excelFilter.pos.width, zIndex: 9999 }} onWheel={handleInnerScrollWheel}>
                    <div className="excel-filter-sortbar">
                        <button type="button" className={`excel-sort-btn ${sortBy === excelFilter.colId && sortDir === "asc" ? "active" : ""}`} onClick={() => toggleExcelSort(excelFilter.colId, "asc")}>Sort Acsending</button>
                        <button type="button" className={`excel-sort-btn ${sortBy === excelFilter.colId && sortDir === "desc" ? "active" : ""}`} onClick={() => toggleExcelSort(excelFilter.colId, "desc")}>Sort Descending </button>
                    </div>

                    <input type="text" className="excel-filter-search" placeholder="Search" value={excelSearch} onChange={(e) => setExcelSearch(e.target.value)} />

                    {(() => {
                        const colId = excelFilter.colId;

                        // Grab context-aware values for this column
                        const allValues = getAvailableOptions(colId);

                        // Filter items down by the popup's search bar
                        const visibleValues = allValues.filter(v => String(v).toLowerCase().includes(excelSearch.toLowerCase()));

                        // Check if all *currently visible* items are selected
                        const isAllVisibleSelected = visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (checked) {
                                    visibleValues.forEach(v => next.add(v)); // Select all visible
                                } else {
                                    visibleValues.forEach(v => next.delete(v)); // Deselect all visible
                                }
                                return next;
                            });
                        };

                        const toggleValue = (v) => setExcelSelected(prev => {
                            const next = new Set(prev);
                            if (next.has(v)) next.delete(v);
                            else next.add(v);
                            return next;
                        });

                        const onOk = () => {
                            let finalSelection = new Set(excelSelected);

                            // If the user typed a search, ONLY apply changes to the visible items
                            // This drops any hidden items from the selection.
                            if (excelSearch.trim() !== "") {
                                const visibleSet = new Set(visibleValues);
                                finalSelection = new Set(
                                    Array.from(excelSelected).filter(v => visibleSet.has(v))
                                );
                            }

                            const selectedArr = Array.from(finalSelection);

                            // Check if this is a "Select All" (Reset) scenario
                            const isTotalReset = allValues.length > 0 &&
                                allValues.length === selectedArr.length &&
                                selectedArr.every(v => finalSelection.has(v));

                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isTotalReset) {
                                    delete next[colId]; // Clear filter entirely
                                } else {
                                    next[colId] = finalSelection; // Save targeted selection
                                }
                                return next;
                            });

                            setExcelFilter(prev => ({ ...prev, open: false }));
                        };

                        const onCancel = () => {
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
                                                checked={isAllVisibleSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                            />
                                        </span>
                                        <span className="excel-filter-text">
                                            {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                                        </span>
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

                                    {visibleValues.length === 0 && (
                                        <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                                            No matches found
                                        </div>
                                    )}
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

            {batchTransfer && (<MigrateDraftOwnership onClose={closeBatch} draftType="TMS" />)}
            <ToastContainer />
        </div>
    );
};

export default TrainingDrafts;