import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faUser, faFilter, faFolder, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from "react-toastify";
import TopBarDD from "../../Notifications/TopBarDD";
// Assuming the CSS for the popup is shared or imported globally like in IBRATable
// import './IBRATable.css'; 

const OTChatCourses = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);

    // --- Excel Filter State & Refs ---
    const excelPopupRef = useRef(null);
    const [filters, setFilters] = useState({});
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    // Store original load order to restore when sorting by "Nr"
    const initialOrderRef = useRef(new Map());

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        const loadCoursesWithChats = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${process.env.REACT_APP_URL}/api/chatBoxOnlineTraining/courses-with-chats`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setCourses(data);
            } catch (e) {
                setError(e.message);
            }
        };

        loadCoursesWithChats();
    }, []);

    // Capture initial order when courses are loaded
    useEffect(() => {
        if (!courses || courses.length === 0) return;
        const map = initialOrderRef.current;
        // Using courseId as the stable key
        const hasAll = courses.every(c => map.has(c.courseId));
        if (hasAll) return;

        courses.forEach((c, idx) => {
            if (!map.has(c.courseId)) map.set(c.courseId, map.size + idx);
        });
    }, [courses]);

    // --- Helper Functions ---

    const BLANK = "(Blanks)";

    const getFilterValuesForCell = (row, colId) => {
        let val;
        if (colId === "courseTitle") val = row.courseTitle;
        if (colId === "chatCount") val = row.chatCount;

        const s = val == null ? "" : String(val).trim();
        return s === "" ? [BLANK] : [s];
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT; // click same sort again -> reset
            }
            return { colId, direction };
        });
    };

    const handleInnerScrollWheel = (e) => {
        const el = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const delta = e.deltaY;
        const goingDown = delta > 0;

        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

        if ((goingDown && atBottom) || (!goingDown && atTop)) {
            e.preventDefault();
            e.stopPropagation();
            if (goingDown && atBottom) {
                el.scrollTop = scrollHeight - clientHeight;
            } else if (!goingDown && atTop) {
                el.scrollTop = 0;
            }
        }
    };

    // --- Filtering & Sorting Logic ---

    const filteredCourses = useMemo(() => {
        let current = [...courses];

        // 1) Apply Filtering
        // 3. Excel Column Filters
        for (const [colId, selectedValues] of Object.entries(filters)) {
            if (!selectedValues || !Array.isArray(selectedValues)) continue;
            current = current.filter(row => {
                const cellValues = getFilterValuesForCell(row, colId);
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        // 2) Sorting
        const colId = sortConfig?.colId || "nr";

        if (colId === "nr") {
            const order = initialOrderRef.current;
            current.sort((a, b) => (order.get(a.courseId) ?? 0) - (order.get(b.courseId) ?? 0));
            return current;
        }

        const dir = sortConfig?.direction === "desc" ? -1 : 1;

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

        current.sort((a, b) => {
            let av, bv;

            if (colId === "courseTitle") {
                av = a.courseTitle;
                bv = b.courseTitle;
            } else if (colId === "chatCount") {
                av = a.chatCount;
                bv = b.chatCount;
            } else {
                return 0;
            }

            av = normalize(av);
            bv = normalize(bv);

            // Blanks last
            const aBlank = av === BLANK;
            const bBlank = bv === BLANK;
            if (aBlank && !bBlank) return 1;
            if (!aBlank && bBlank) return -1;

            // Numeric sort
            const an = tryNumber(av);
            const bn = tryNumber(bv);
            if (an != null && bn != null) return (an - bn) * dir;

            // String sort
            return String(av).localeCompare(String(bv), undefined, {
                sensitivity: "base",
                numeric: true,
            }) * dir;
        });

        return current;
    }, [courses, filters, sortConfig]);

    // --- Popup Logic ---

    function openExcelFilterPopup(colId, e) {
        if (colId === "nr") return; // No filtering on index column, usually just sorting/reset

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Build unique values from ALL rows (not just currently filtered ones)
        const values = Array.from(
            new Set(
                (courses || []).flatMap(r => getFilterValuesForCell(r, colId))
            )
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        const existing = filters?.[colId];
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
    }

    // Handle clicks outside to close
    useEffect(() => {
        const popupSelector = '.excel-filter-popup';

        const handleClickOutside = (e) => {
            const outside = !e.target.closest(popupSelector);
            if (outside && excelFilter.open) {
                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            }
        };

        const handleScroll = (e) => {
            // Close on scroll outside
            const isInsidePopup = e.target.closest(popupSelector);
            if (!isInsidePopup && excelFilter.open) {
                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
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

    // Update popup position if screen resizes or logic requires it
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
    }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(filters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== "nr" || sortConfig.direction !== "asc";
        return hasColumnFilters || hasSort;
    }, [filters, sortConfig]);

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
        setFilters({});
        setSortConfig({ colId: "nr", direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        return "top-right-button-control-att";
    };

    const getAvailableOptions = (colId) => {
        let current = courses; // Assuming 'files' is your data state

        // 2. Other Column Filters
        for (const [filterColId, selectedValues] of Object.entries(filters)) {
            if (filterColId === colId) continue;
            if (!selectedValues || !Array.isArray(selectedValues)) continue;
            current = current.filter(row => {
                const cellValues = getFilterValuesForCell(row, filterColId);
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        return Array.from(
            new Set(current.flatMap(r => getFilterValuesForCell(r, colId)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    };

    return (
        <div className="dc-version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>
                    <div className="filter-dm-fi-2">
                        <div className="button-container-dm-fi">
                            <button className="but-dm-fi" onClick={() => { navigate('/FrontendDMS/claimedChats') }}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                                    <span className="button-text">Claimed Chats</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/chatBox1.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Chat Box"}</p>
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

                    <TopBarDD />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">Course Chats</label>
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
                    <div className="table-container-file">
                        <table className="dc-version-history-file-info-table" style={{ tableLayout: "fixed", width: "100%" }}>
                            <thead className="dc-version-history-file-info-head">
                                <tr>
                                    {/* Nr Column - Click to reset sort */}
                                    <th
                                        style={{ width: "5%", textAlign: "center", cursor: "pointer" }}
                                        onClick={() => toggleSort("nr", "asc")}
                                    >
                                        Nr
                                    </th>

                                    {/* Course Name Column */}
                                    <th
                                        style={{ width: "65%", textAlign: "center", cursor: "pointer" }}
                                        onClick={(e) => openExcelFilterPopup("courseTitle", e)}
                                    >
                                        Course Name
                                        {(filters["courseTitle"] || sortConfig.colId === "courseTitle") && (
                                            <FontAwesomeIcon
                                                icon={faFilter}
                                                className="active-filter-icon"
                                                style={{ marginLeft: "10px", color: filters["courseTitle"] ? "#2196F3" : "inherit" }}
                                            />
                                        )}
                                    </th>

                                    {/* Unclaimed Chats Column */}
                                    <th
                                        style={{ width: "30%", textAlign: "center", cursor: "pointer" }}
                                        onClick={(e) => openExcelFilterPopup("chatCount", e)}
                                    >
                                        Unclaimed Chats
                                        {(filters["chatCount"] || sortConfig.colId === "chatCount") && (
                                            <FontAwesomeIcon
                                                icon={faFilter}
                                                className="active-filter-icon"
                                                style={{ marginLeft: "10px", color: filters["chatCount"] ? "#2196F3" : "inherit" }}
                                            />
                                        )}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.map((c, index) => (
                                    <tr
                                        key={c.courseId}
                                        style={{ cursor: "pointer", textAlign: "center" }}
                                        onClick={() => navigate(`/FrontendDMS/unclaimedChats/${c.courseId}`)}
                                    >
                                        <td style={{ textAlign: "center" }}>{index + 1}</td>
                                        <td style={{ textAlign: "center" }}>{c.courseTitle}</td>
                                        <td style={{ textAlign: "center" }}>{c.chatCount}</td>
                                    </tr>
                                ))}

                                {filteredCourses.length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: "center", padding: 12 }}>
                                            No courses found with unclaimed chats.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ToastContainer />

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
                                if (checked) visibleValues.forEach(v => next.add(v));
                                else visibleValues.forEach(v => next.delete(v));
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
                                if (isTotalReset) delete next[colId];
                                else next[colId] = selectedArr;
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

export default OTChatCourses;