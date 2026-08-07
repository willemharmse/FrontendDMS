import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import "./AdminApprovalPage.css";
import ApprovalPopupAbbreviation from "../SuggestionApprovalPopups/ApprovalPopupAbbreviation";
import AdminApprovalHeader from "../AdminAprovalHeaders/AdminApprovalHeader";
import TopBar from "../Notifications/TopBar";
import ApprovalPopupTerm from "../SuggestionApprovalPopups/ApprovalPopupTerm";
import ApprovalPopupEquipment from "../SuggestionApprovalPopups/ApprovalPopupEquipment";
import ApprovalPopupPPE from "../SuggestionApprovalPopups/ApprovalPopupPPE";
import ApprovalPopupTool from "../SuggestionApprovalPopups/ApprovalPopupTool";
import ApprovalPopupMaterial from "../SuggestionApprovalPopups/ApprovalPopupMaterial";
import ApprovalPopupMachine from "../SuggestionApprovalPopups/ApprovalPopupMachine";
import ApprovalPopupWorkOrder from "../SuggestionApprovalPopups/ApprovalPopupWorkOrder";

const AdminApprovalPage = () => {
    const [drafts, setDrafts] = useState([]);
    const { id: draftID } = useParams();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [userID, setUserID] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [comment, setComment] = useState("");
    const [profilePic, setProfilePic] = useState(null);

    const [statusTab, setStatusTab] = useState("In Review");

    // Normalize a status string (case/spacing/punctuation tolerant)
    const norm = (s = "") => s.toString().toLowerCase().replace(/[\s_-]+/g, "");

    // Buckets for tolerant matching
    const isReviewLike = (s) => ["review", "inreview", "pending", "awaitingreview"].includes(norm(s));
    const isApprovedLike = (s) => ["approved", "accept", "accepted", "ok", "passed"].includes(norm(s));
    const isDeclinedLike = (s) => ["declined", "rejected", "reject", "denied", "failed"].includes(norm(s));

    // Does a draft fall into the currently selected tab?
    const tabMatches = (draft) => {
        const st = draft?.status ?? "";
        if (norm(statusTab) === "all") return true;
        if (norm(statusTab) === "inreview") return isReviewLike(st);
        if (norm(statusTab) === "approved") return isApprovedLike(st);
        if (norm(statusTab) === "declined") return isDeclinedLike(st);
        return true;
    };

    useEffect(() => {
        // Load from sessionStorage on mount
        const cached = sessionStorage.getItem('profilePic');
        setProfilePic(cached || null);
    }, []);

    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    const handleRowClick = (draft) => {
        if (draft.status !== "Review") return;
        setSelectedDraft(draft); // Store the clicked draft in state
        setShowPopup(true); // Show the popup
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    useEffect(() => {
        if (userID) {
            fetchDrafts();
        }
    }, [userID]);

    const fetchDrafts = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/drafts/${userID}`);
            if (!response.ok) throw new Error("Failed to fetch drafts");
            const data = await response.json();
            setDrafts(data.drafts);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleApprove = async (draft) => {
        const data = draft.data;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/${draft._id}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userID,
                    data
                })
            });

            if (!response.ok) throw new Error("Failed to approve draft");

            setShowPopup(false);
            setComment("");
            fetchDrafts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDecline = async (draft) => {
        const data = draft.data;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/${draft._id}/decline`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userID,
                    data
                })
            });

            if (!response.ok) throw new Error("Failed to delete draft");

            setShowPopup(false);
            setComment("");
            fetchDrafts();
        } catch (err) {
            setError(err.message);
        }
    };

    const formatType = (type) => {
        switch (type) {
            case 'Abbreviation':
                return "Abbreviation"
                break;

            case 'Mobile':
                return "Mobile Machine"
                break;

            case 'Equipment':
                return "Equipment";
                break;

            case 'Tool':
                return "Hand Tool"
                break;

            case 'PPE':
                return "PPE"
                break;

            case 'Definition':
                return "Term";
                break;

            case 'Material':
                return "Material";
                break;

            case 'WorkOrder':
                return "Work Order Type";
                break;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    const getFilterValuesForCell = (draft, colId) => {
        let val = "";
        switch (colId) {
            case "type": val = formatType(draft.type); break;
            case "item": val = Object.values(draft.data || {})[0]; break;
            case "description": val = Object.values(draft.data || {})[1]; break;
            case "suggestedBy": val = draft.suggestedBy?.username; break;
            case "suggestedDate": val = formatDate(draft.suggestedDate); break;
            case "status": val = draft.status; break;
            case "reviewDate": val = draft.reviewDate ? formatDate(draft.reviewDate) : "N/A"; break;
            default: val = ""; break;
        }
        const s = val == null ? "" : String(val).trim();
        return s === "" ? [BLANK] : [s];
    };

    const getAvailableOptions = (colId) => {
        let filtered = drafts.filter(tabMatches);

        for (const [filterColId, selectedValues] of Object.entries(filters)) {
            if (filterColId === colId) continue;

            const selected = Array.isArray(selectedValues) ? selectedValues : selectedValues?.selected;
            if (!Array.isArray(selected)) continue;

            filtered = filtered.filter(draft => {
                const cellValues = getFilterValuesForCell(draft, filterColId);
                return cellValues.some(v => selected.includes(v));
            });
        }

        return Array.from(
            new Set(filtered.flatMap(r => getFilterValuesForCell(r, colId)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) return null; // reset if same
            return { colId, direction };
        });
    };

    function openExcelFilterPopup(colId, e) {
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = getAvailableOptions(colId);
        const existing = filters[colId];
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : (existing?.selected || values));

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

    const applyFilters = (rows) => {
        let current = rows.filter(tabMatches);

        // 1) Apply Excel filters
        current = current.filter(row => {
            for (const [colId, filterObj] of Object.entries(filters)) {
                const selected = Array.isArray(filterObj) ? filterObj : filterObj?.selected;
                if (!Array.isArray(selected) || selected.length === 0) continue;

                const cellValues = getFilterValuesForCell(row, colId);
                const match = cellValues.some(v => selected.includes(v));
                if (!match) return false;
            }
            return true;
        });

        // 2) Sorting (if active)
        if (sortConfig && sortConfig.colId) {
            const colId = sortConfig.colId;
            const dir = sortConfig.direction === "desc" ? -1 : 1;

            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? BLANK : s;
            };

            const tryNumber = (v) => {
                const s = String(v).replace(/,/g, "").trim();
                if (!/^[-+]?\d*(?:\.\d+)?$/.test(s) || s === "" || s === "." || s === "+" || s === "-") return null;
                const n = Number(s);
                return Number.isFinite(n) ? n : null;
            };

            const tryDate = (v) => {
                const t = Date.parse(String(v));
                return Number.isFinite(t) ? t : null;
            };

            current.sort((a, b) => {
                const av = normalize(getFilterValuesForCell(a, colId)[0]);
                const bv = normalize(getFilterValuesForCell(b, colId)[0]);

                const aBlank = av === BLANK;
                const bBlank = bv === BLANK;
                if (aBlank && !bBlank) return 1;
                if (!aBlank && bBlank) return -1;

                const an = tryNumber(av);
                const bn = tryNumber(bv);
                if (an != null && bn != null) return (an - bn) * dir;

                const ad = tryDate(av);
                const bd = tryDate(bv);
                if (ad != null && bd != null) return (ad - bd) * dir;

                return String(av).localeCompare(String(bv), undefined, {
                    sensitivity: "base",
                    numeric: true,
                }) * dir;
            });
        }
        return current;
    };

    const BLANK = "(Blanks)";
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState(null); // Null by default as requested

    const excelPopupRef = useRef(null);
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());

    // --- Click Outside & Scroll Logic for Popup ---
    useEffect(() => {
        const excelSelector = '.excel-filter-popup';

        const handleClickOutside = (e) => {
            const outside = !e.target.closest(excelSelector) && !e.target.closest('input');
            if (outside) {
                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(excelSelector);
            if (!isInsidePopup) {
                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            }
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [excelFilter.open]);

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
            setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top: newTop, left: newLeft } }));
        }
    }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

    // helpers that match how you render the table
    const getTypeText = (r) => (formatType(r.type) || "").toString();
    const getItemText = (r) => {
        const first = Object.values(r?.data || {})[0];
        return (first ?? "").toString();
    };
    const getDescText = (r) => {
        const second = Object.values(r?.data || {})[1];
        return (second ?? "").toString();
    };
    const getSuggestedByText = (r) => (r?.suggestedBy?.username || "").toString();
    const getStatusText = (r) => (r?.status || "").toString();

    const toISODate = (d) => {
        if (!d) return "";
        const dt = typeof d === "string" ? new Date(d) : d;
        if (Number.isNaN(dt.getTime())) return "";
        return dt.toISOString().slice(0, 10); // yyyy-mm-dd
    };

    const filteredFiles = applyFilters(drafts);

    const getComplianceColor = (status) => {
        if (status.toLowerCase() === "approved") return "status-good-admin";
        if (status.toLowerCase() === "declined") return "status-bad-admin";
    };

    // When drafts are loaded, use the URL id to select/open a draft
    useEffect(() => {
        // no id in URL -> do nothing
        if (!draftID) return;

        // if the id is literally "new", just return (do nothing)
        if (draftID === "new") return;

        // wait until drafts are loaded
        if (!drafts || drafts.length === 0) return;

        // find the draft with this id
        const draft = drafts.find(d => d._id === draftID);
        if (!draft) return; // id doesn't match any draft -> do nothing

        // only open if it's in Review (same rule as handleRowClick)
        if (draft.status !== "Review") return;

        setSelectedDraft(draft);
        setShowPopup(true);
    }, [draftID, drafts]);

    return (
        <div className="admin-draft-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">User Suggestions</p>
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
                        <thead className="risk-admin-approve-head">
                            <AdminApprovalHeader
                                filters={filters}
                                sortConfig={sortConfig}
                                openExcelFilterPopup={openExcelFilterPopup}
                            />
                        </thead>
                        <tbody>
                            {filteredFiles.map((draft, index) => (
                                <tr key={draft._id} className={`file-info-row-height risk-admin-approve-tr`}>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-index">{index + 1}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-type">{formatType(draft.type)}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-item">{Object.values(draft.data)[0]}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-desc">
                                        {Object.values(draft.data)[1] ? Object.values(draft.data)[1] : "No description"}
                                    </td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-user">{draft.suggestedBy ? draft.suggestedBy.username : "Unknown"}</td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-date">{formatDate(draft.suggestedDate)}</td>
                                    <td onClick={() => handleRowClick(draft)} className={`risk-admin-approve-th-status ${getComplianceColor(draft.status)}`}>{draft.status}</td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-date">{draft.reviewDate ? formatDate(draft.reviewDate) : "N/A"}</td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(showPopup && selectedDraft.type === "Abbreviation") && (<ApprovalPopupAbbreviation approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Definition") && (<ApprovalPopupTerm approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "PPE") && (<ApprovalPopupPPE approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Tool") && (<ApprovalPopupTool approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Material") && (<ApprovalPopupMaterial approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Mobile") && (<ApprovalPopupMachine approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Equipment") && (<ApprovalPopupEquipment approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "WorkOrder") && (<ApprovalPopupWorkOrder approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}

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
                            className={`excel-sort-btn ${sortConfig?.colId === excelFilter.colId &&
                                sortConfig?.direction === "asc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>

                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig?.colId === excelFilter.colId &&
                                sortConfig?.direction === "desc" ? "active" : ""
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

                            setFilters(prev => {
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
        </div>
    );
};

export default AdminApprovalPage;
