import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faDownload, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faFilter } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import DownloadPopup from "../FileInfo/DownloadPopup";
import TopBar from "../Notifications/TopBar";
import FTSSuggestionApproval from "./FTSSuggestionApproval";

const SuggestedStandardFieldsFTS = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { id: pageParam } = useParams();
    const [fields, setFields] = useState([]);

    // --- Status Pill Tabs (same logic as AdminApprovalPage) ---
    const [statusTab, setStatusTab] = useState("In Review");

    // Normalize a status string (case/spacing/punctuation tolerant)
    const norm = (s = "") => s.toString().toLowerCase().replace(/[\s_-]+/g, "");

    // Buckets for tolerant matching
    const isReviewLike = (s) => ["review", "inreview", "pending", "awaitingreview"].includes(norm(s));
    const isApprovedLike = (s) => ["approved", "accept", "accepted", "ok", "passed"].includes(norm(s));
    const isDeclinedLike = (s) => ["declined", "rejected", "reject", "denied", "failed"].includes(norm(s));

    // Does a row fall into the currently selected tab?
    const tabMatches = (row) => {
        const st = row?.status ?? "";
        if (norm(statusTab) === "all") return true;
        if (norm(statusTab) === "inreview") return isReviewLike(st);
        if (norm(statusTab) === "approved") return isApprovedLike(st);
        if (norm(statusTab) === "declined") return isDeclinedLike(st);
        return true;
    };

    // --- Row-click Approve Popup (placeholder for now) ---
    const [selectedField, setSelectedField] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const handleRowClick = (row) => {
        if (!isReviewLike(row.status)) return; // only rows pending review are actionable
        setSelectedField(row);
        setShowPopup(true);
    };

    const closePopup = () => {
        setShowPopup(false);
        setSelectedField(null);
    };

    // Consistent date formatting (matches AdminApprovalPage)
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "N/A";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Status -> colour class (matches AdminApprovalPage's getComplianceColor)
    const getComplianceColor = (status) => {
        if (isApprovedLike(status)) return "status-good-admin";
        if (isDeclinedLike(status)) return "status-bad-admin";
        return "";
    };

    // --- Excel Filter States ---
    const DEFAULT_SORT = { colId: null, direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        fetchStandardFields();
    }, [token]);

    // Fetch the standard field / definition pairs from the API
    const fetchStandardFields = async () => {
        const route = `/api/ftsGenerate/drafts/`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch standard fields');
            }
            const data = await response.json();

            setFields(data.drafts);
        } catch (error) {
            setError(error.message);
        }
    };

    // --- Excel Filtering Logic Helpers ---

    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        if (colId === "field") return [row.field ? String(row.field).trim() : "-"];
        if (colId === "definition") return [row.definition ? String(row.definition).trim() : "-"];
        if (colId === "suggestedBy") {
            const val = row.suggestedBy?.username || row.suggestedBy;
            return [val ? String(val).trim() : "-"];
        }
        if (colId === "suggestedDate") return [formatDate(row.suggestedDate)];
        if (colId === "reviewDate") return [formatDate(row.reviewDate)];
        if (colId === "status") return [row.status ? String(row.status).trim() : "-"];

        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    // Helper to get options filtered by OTHER columns (cross-filtering)
    const getAvailableOptions = (colId) => {
        let filtered = fields.filter(tabMatches);

        for (const [filterColId, selectedValues] of Object.entries(activeExcelFilters)) {
            if (filterColId === colId) continue;
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        const uniqueValues = Array.from(
            new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
        ).sort((a, b) =>
            String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
        );

        return uniqueValues;
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = getAvailableOptions(colId);

        const existing = activeExcelFilters[colId];
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
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    // --- Main Processing: Filter -> Sort ---

    const processedFields = useMemo(() => {
        let current = [...fields];

        // Status Pill Tab
        current = current.filter(tabMatches);

        // Excel Column Filters
        current = current.filter((row, originalIndex) => {
            for (const [colId, selectedValues] of Object.entries(activeExcelFilters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;

                const cellValues = getFilterValuesForCell(row, colId, originalIndex);
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        const normalize = (v) => {
            const s = v == null ? "" : String(v).trim();
            return s === "" ? "(Blanks)" : s;
        };

        const compareText = (a, b) =>
            String(a).localeCompare(String(b), undefined, {
                numeric: true,
                sensitivity: "base"
            });

        current.sort((a, b) => {
            if (!sortConfig?.colId) {
                const nameA = normalize(a?.field);
                const nameB = normalize(b?.field);
                return compareText(nameA, nameB);
            }

            const { colId, direction } = sortConfig;
            const dir = direction === "desc" ? -1 : 1;

            const valA = normalize(a?.[colId]);
            const valB = normalize(b?.[colId]);

            if (valA === "(Blanks)" && valB !== "(Blanks)") return 1;
            if (valA !== "(Blanks)" && valB === "(Blanks)") return -1;

            return compareText(valA, valB) * dir;
        });

        return current;
    }, [fields, activeExcelFilters, sortConfig, statusTab]);

    // Cleanup Popup Listeners
    useEffect(() => {
        if (!excelFilter.open) return;

        const handleClickOutside = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        const handleScroll = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [excelFilter.open]);

    // Popup Positioning (keep popup on-screen)
    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;

        const popupRect = el.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;

        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) {
                const desiredTop = anchor.top - popupRect.height - 4;
                newTop = Math.max(margin, desiredTop);
            }
        }

        if (popupRect.right > viewportW - margin) {
            const overflow = popupRect.right - (viewportW - margin);
            newLeft = Math.max(margin, newLeft - overflow);
        }
        if (popupRect.left < margin) newLeft = margin;

        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({
                ...prev,
                pos: { ...prev.pos, top: newTop, left: newLeft }
            }));
        }
    }, [excelFilter.open, excelFilter.pos, excelSearch]);

    // --- Top filter icon (active state + double-click to clear) ---
    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        const hasSort = sortConfig.colId !== null || sortConfig.direction !== "asc";
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortConfig]);

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig(DEFAULT_SORT);
    };

    const handleApprove = async (draft) => {
        const data = draft.data;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsGenerate/${draft._id}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to approve draft");

            setShowPopup(false);
            fetchStandardFields();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDecline = async (draft) => {
        const data = draft.data;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsGenerate/${draft._id}/decline`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to delete draft");

            setShowPopup(false);
            fetchStandardFields();
        } catch (err) {
            setError(err.message);
        }
    };

    // If we've landed on this page for a specific suggestion (not the "new"
    // state), auto-open the review popup for that row - but only while it's
    // still pending, since an already approved/declined row can't be actioned.
    useEffect(() => {
        if (!pageParam || pageParam === "new") return;
        if (!fields.length) return;

        const match = fields.find(row => String(row._id) === String(pageParam));
        if (match && isReviewLike(match.status)) {
            setSelectedField(match);
            setShowPopup(true);
        }
    }, [pageParam, fields]);

    return (
        <div className="dc-version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Standard Fields</p>
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
            <div className="main-box-dc-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="admin-approval-pill-bar">
                    {["In Review", "Approved", "Declined", "All"].map((pill) => (
                        <div
                            key={pill}
                            className={`admin-approval-pill ${statusTab === pill ? "active" : ""}`}
                            onClick={() => setStatusTab(pill)}
                        >
                            {pill}
                        </div>
                    ))}
                </div>
                <div className="admin-approve-table-area">
                    <table className="risk-admin-approve-table">
                        <thead className="dc-version-history-file-info-head">
                            <tr style={{ fontSize: "14px" }}>
                                <th
                                    style={{ width: "5%", position: "relative", cursor: "pointer", textAlign: "center" }}
                                    onClick={(e) => openExcelFilterPopup("nr", e)}
                                >
                                    <span>Nr</span>
                                    {(activeExcelFilters["nr"] || sortConfig.colId === "nr") && (
                                        <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                    )}
                                </th>
                                <th
                                    style={{ width: "15%", position: "relative", cursor: "pointer", textAlign: "center" }}
                                    onClick={(e) => openExcelFilterPopup("field", e)}
                                >
                                    <span>Field Name</span>
                                    {(activeExcelFilters["field"] || sortConfig.colId === "field") && (
                                        <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                    )}
                                </th>
                                <th
                                    style={{ width: "40%", position: "relative", cursor: "pointer", textAlign: "center" }}
                                    onClick={(e) => openExcelFilterPopup("definition", e)}
                                >
                                    <span>Field Description</span>
                                    {(activeExcelFilters["definition"] || sortConfig.colId === "definition") && (
                                        <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                    )}
                                </th>
                                <th
                                    style={{ width: "10%", textAlign: "center" }}
                                    onClick={(e) => openExcelFilterPopup("suggestedBy", e)}
                                >
                                    <span>Suggested By</span>
                                    {(activeExcelFilters["suggestedBy"] || sortConfig.colId === "suggestedBy") && (
                                        <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                    )}
                                </th>
                                <th
                                    style={{ width: "10%", textAlign: "center" }}
                                    onClick={(e) => openExcelFilterPopup("suggestedDate", e)}
                                >
                                    <span>Suggested Date</span>
                                    {(activeExcelFilters["suggestedDate"] || sortConfig.colId === "suggestedDate") && (
                                        <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                    )}
                                </th>
                                <th
                                    style={{ width: "10%", textAlign: "center" }}
                                    onClick={(e) => openExcelFilterPopup("status", e)}
                                >
                                    <span>Status</span>
                                    {(activeExcelFilters["status"] || sortConfig.colId === "status") && (
                                        <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                    )}
                                </th>
                                <th
                                    style={{ width: "10%", textAlign: "center" }}
                                    onClick={(e) => openExcelFilterPopup("reviewDate", e)}
                                >
                                    <span>Review Date</span>
                                    {(activeExcelFilters["reviewDate"] || sortConfig.colId === "reviewDate") && (
                                        <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedFields.length > 0 ? (
                                processedFields.map((row, index) => {
                                    const clickable = isReviewLike(row.status);
                                    return (
                                        <tr
                                            key={row._id ?? index}
                                            className={`file-info-row-height dc-version-history-file-info-tr`}
                                            style={{ cursor: clickable ? "pointer" : "default", fontSize: "14px" }}
                                        >
                                            <td onClick={() => handleRowClick(row)} style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{index + 1}</td>
                                            <td onClick={() => handleRowClick(row)} style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{row.field}</td>
                                            <td onClick={() => handleRowClick(row)} style={{ textAlign: "left", fontFamily: "Arial", fontSize: "14px" }}>{row.definition}</td>
                                            <td onClick={() => handleRowClick(row)} style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{row.suggestedBy?.username || row.suggestedBy || "Unknown"}</td>
                                            <td onClick={() => handleRowClick(row)} style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{formatDate(row.suggestedDate)}</td>
                                            <td onClick={() => handleRowClick(row)} className={getComplianceColor(row.status)} style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{row.status}</td>
                                            <td onClick={() => handleRowClick(row)} style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{formatDate(row.reviewDate)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", fontSize: "14px" }}>No Suggested Fields</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approve Popup (placeholder - swap for a real ApprovalPopup component later) */}
            {showPopup && selectedField && (
                <FTSSuggestionApproval approve={handleApprove} decline={handleDecline} closeModal={closePopup} setSuggestion={setSelectedField} suggestion={selectedField} />
            )}

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
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "asc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>

                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "desc" ? "active" : ""
                                }`}
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

                        const allValues = getAvailableOptions(colId);

                        const visibleValues = allValues.filter(v =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const isAllVisibleSelected =
                            visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (checked) {
                                    visibleValues.forEach(v => next.add(v));
                                } else {
                                    visibleValues.forEach(v => next.delete(v));
                                }
                                return next;
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
                            let finalSelection = new Set(excelSelected);
                            if (excelSearch.trim() !== "") {
                                const visibleSet = new Set(visibleValues);
                                finalSelection = new Set(
                                    Array.from(excelSelected).filter(v => visibleSet.has(v))
                                );
                            }

                            const selectedArr = Array.from(finalSelection);
                            const isTotalReset = allValues.length > 0 &&
                                allValues.length === selectedArr.length &&
                                selectedArr.every(v => finalSelection.has(v));

                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isTotalReset) {
                                    delete next[colId];
                                } else {
                                    next[colId] = selectedArr;
                                }
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
        </div >
    );
};

export default SuggestedStandardFieldsFTS;