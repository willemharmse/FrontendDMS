import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faCirclePlus, faTrash, faFilter } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import TopBarDD from "../Notifications/TopBarDD";
import "./OnlineTrainingCourseManagement.css";
import AddStudentPopupOT from "./AddStudentPopupOT";
import { toast, ToastContainer } from "react-toastify";
import RemoveStudentEnrollment from "./RemoveStudentEnrollment";
import PopupMenuOnlineTrainingGrading from "./PopupMenuOnlineTrainingGrading";

const OnlineTrainingCourseManagement = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseTitle, setCourseTitle] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [removePopupVisible, setRemovePopupVisible] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState(null);
    const [hoveredStudentId, setHoveredStudentId] = useState(null);
    const [selectedForMenu, setSelectedForMenu] = useState(null);
    const [popupVisible, setPopupVisible] = useState(false);
    const [userIDs, setUserIDs] = useState([]);

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
    const initialOrderRef = useRef(new Map());

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            jwtDecode(storedToken); // verify decode
        }
    }, [navigate]);

    const loadEnrolledStudents = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/published/enrollments/${id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const contentType = res.headers.get("content-type") || "";
            const raw = await res.text();
            const data = contentType.includes("application/json") ? JSON.parse(raw) : null;

            if (!res.ok) {
                throw new Error(data?.error || `Failed to load enrollments (HTTP ${res.status})`);
            }
            if (!data) throw new Error("Server did not return JSON");

            setCourseTitle(data.course?.courseTitle || "");
            const loadedStudents = Array.isArray(data.students) ? data.students : [];
            setStudents(loadedStudents);
        } catch (e) {
            console.error("Error loading enrollments:", e);
            setError(e.message || "Failed to load enrollments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadEnrolledStudents();
    }, [id]);

    // Capture initial order for sort reset
    useEffect(() => {
        if (!students || students.length === 0) return;
        const map = initialOrderRef.current;
        const hasAll = students.every(s => map.has(s._id));
        if (hasAll) return;
        students.forEach((s, idx) => {
            if (!map.has(s._id)) map.set(s._id, map.size + idx);
        });
    }, [students]);

    // Sync IDs for popup
    useEffect(() => {
        const existingUserIDs = (students || []).map((s) => s?._id).filter(Boolean);
        setUserIDs(existingUserIDs);
    }, [students]);

    // --- Helper Functions ---
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const getProgressText = (status) => {
        const isNum = typeof status === "number";
        const text = String(status ?? "").toLowerCase();
        let percent = 0;

        if (isNum && Number.isFinite(status)) {
            percent = clamp(status, 0, 100);
        } else {
            let m = text.match(/(\d+(?:\.\d+)?)\s*%/);
            if (m) {
                percent = clamp(parseFloat(m[1]), 0, 100);
            } else {
                m = text.match(/\b(\d{1,3})\b/);
                if (m) percent = clamp(parseInt(m[1], 10), 0, 100);
            }
        }

        if (text.includes("completed") || percent === 100) return "Completed 100%";
        if (text.includes("overdue")) return "Overdue";
        if (text.includes("not passed")) return "Not Passed";
        if (text.includes("in progress") || percent > 0) return `In Progress ${percent}%`;
        return `In Progress 0%`;
    };

    const BLANK = "(Blanks)";

    const getFilterValuesForCell = (row, colId) => {
        if (row.isPlaceholder) return []; // Ignore placeholder row for filtering logic

        let val;
        const enrollment = row.enrollment || {};

        if (colId === "studentName") val = `${row.name} ${row.surname}`;
        if (colId === "progress") val = getProgressText(enrollment.progress);
        if (colId === "mark") val = enrollment.mark ?? "-";
        if (colId === "dateAdded") val = enrollment.dateAdded ? formatDate(enrollment.dateAdded) : "-";
        if (colId === "completionDate") val = enrollment.completionDate ? formatDate(enrollment.completionDate) : "-";

        const s = val == null ? "" : String(val).trim();
        return s === "" ? [BLANK] : [s];
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
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
        }
    };

    // --- Filtering & Sorting Logic ---
    const filteredRows = useMemo(() => {
        // Start with real students, exclude placeholder logic from filtering/sorting base
        let current = [...students];

        // 1) Filtering
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
            current.sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0));
        } else {
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
                const ea = a.enrollment || {};
                const eb = b.enrollment || {};

                if (colId === "studentName") {
                    av = `${a.name} ${a.surname}`;
                    bv = `${b.name} ${b.surname}`;
                } else if (colId === "progress") {
                    av = getProgressText(ea.progress);
                    bv = getProgressText(eb.progress);
                } else if (colId === "mark") {
                    av = ea.mark;
                    bv = eb.mark;
                } else if (colId === "dateAdded") {
                    const da = ea.dateAdded ? new Date(ea.dateAdded).getTime() : 0;
                    const db = eb.dateAdded ? new Date(eb.dateAdded).getTime() : 0;
                    return (da - db) * dir;
                } else if (colId === "completionDate") {
                    const da = ea.completionDate ? new Date(ea.completionDate).getTime() : 0;
                    const db = eb.completionDate ? new Date(eb.completionDate).getTime() : 0;
                    return (da - db) * dir;
                }

                av = normalize(av);
                bv = normalize(bv);

                const aBlank = av === BLANK;
                const bBlank = bv === BLANK;
                if (aBlank && !bBlank) return 1;
                if (!aBlank && bBlank) return -1;

                const an = tryNumber(av);
                const bn = tryNumber(bv);
                if (an != null && bn != null) return (an - bn) * dir;

                return String(av).localeCompare(String(bv), undefined, { sensitivity: "base", numeric: true }) * dir;
            });
        }

        // If filtering/sorting leaves no rows, or originally empty, we might want to show placeholder
        // But original logic showed placeholder only if initial load was empty.
        // We will mimic: if filtered results > 0, show them. If 0, show empty state or placeholder?
        // To match exact structure: map them.

        if (current.length === 0 && students.length === 0) {
            return [{ isPlaceholder: true }];
        }

        return current.map(s => ({ ...s, isPlaceholder: false }));
    }, [students, filters, sortConfig]);

    const renderProgress = (status) => {
        const text = getProgressText(status);

        // Extract percent for width
        let percent = 0;
        let m = text.match(/(\d+)%/);
        if (m) percent = parseInt(m[1], 10);

        let fill = "#FFFF89";
        let cls = "course-home-info-progress-badge";

        if (text.includes("Completed")) {
            cls += " is-complete";
            fill = "#7EAC89";
        } else if (text.includes("Overdue")) {
            cls += " is-overdue";
            fill = "#CB6F6F";
            percent = 100;
        } else if (text.includes("Not Passed")) {
            fill = "#FFC000";
            percent = 100;
        }

        return (
            <div className="course-home-info-progress-wrap">
                <div className={cls} style={{ "--p": `${percent}%`, "--fill": fill }}>
                    <span className="label-course-info" style={{ zIndex: "1" }}>{text}</span>
                </div>
            </div>
        );
    };

    // --- Popup Logic ---
    function openExcelFilterPopup(colId, e) {
        if (colId === "nr" || colId === "act") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Build unique values from ALL rows (not just filtered)
        const values = Array.from(
            new Set(
                (students || []).flatMap(r => getFilterValuesForCell(r, colId))
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

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.excel-filter-popup') && excelFilter.open) {
                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            }
        };
        const handleScroll = (e) => {
            if (!e.target.closest('.excel-filter-popup') && excelFilter.open) {
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

    // Position adjustment
    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;

        const popupRect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const viewportW = window.innerWidth;
        const margin = 8;

        let { top, left } = excelFilter.pos;

        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) top = Math.max(margin, anchor.top - popupRect.height - 4);
        }
        if (popupRect.right > viewportW - margin) {
            left = Math.max(margin, left - (popupRect.right - (viewportW - margin)));
        }
        if (popupRect.left < margin) left = margin;

        if (top !== excelFilter.pos.top || left !== excelFilter.pos.left) {
            setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top, left } }));
        }
    }, [excelFilter.open, excelSearch, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect]);

    const saveData = async (selectedIds) => {
        if (!Array.isArray(selectedIds)) {
            setError("Invalid selection received.");
            return;
        }
        const token = localStorage.getItem("token");
        await fetch(
            `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/published/enrollments/${id}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userIDs: selectedIds }),
            }
        );
        toast.success("Students enrolled successfully.", { autoClose: 2000, closeButton: false });
        await loadEnrolledStudents();
    };

    const removeStudentEnrollmentFn = async (studentId) => {
        try {
            if (!studentId) return;
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/published/enrollments/${id}/student/${studentId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to remove student enrollment");
            toast.success("Student enrollment removed successfully.", { autoClose: 2000, closeButton: false });
            await loadEnrolledStudents();
        } catch (err) {
            console.error("Error removing student:", err);
            setError(err.message);
        }
    };

    const handleStudentClick = (student) => (e) => {
        e.stopPropagation();
        const studentId = student?._id;
        if (!studentId) return;
        const enrollment = student?.enrollment || {};
        if (enrollment?.assessmentStatus !== "PENDING_REVIEW") return;

        setHoveredStudentId(prev => (prev === studentId ? null : studentId));
        setSelectedForMenu({
            courseId: enrollment?.onlineTrainingCourse,
            studentId: studentId,
            studentName: `${student.name} ${student.surname}`.trim()
        });
    };

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
        let current = students; // Assuming 'files' is your data state

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
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/tmsCreateCourse2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Course Management"}</p>
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
                    <div className="spacer"></div>
                    <TopBarDD />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{courseTitle}</label>
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
                            <thead className="dc-version-history-file-info-head" style={{ zIndex: "10" }}>
                                <tr>
                                    <th className="course-manage-nr" onClick={() => toggleSort("nr", "asc")} style={{ cursor: "pointer" }}>
                                        Nr
                                    </th>
                                    <th className="course-manage-name" onClick={(e) => openExcelFilterPopup("studentName", e)} style={{ cursor: "pointer" }}>
                                        Student Name
                                        {(filters["studentName"] || sortConfig.colId === "studentName") && <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "6px", color: filters["studentName"] ? "white" : "inherit" }} />}
                                    </th>
                                    <th className="course-manage-status" onClick={(e) => openExcelFilterPopup("progress", e)} style={{ cursor: "pointer" }}>
                                        Completion Status
                                        {(filters["progress"] || sortConfig.colId === "progress") && <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "6px", color: filters["progress"] ? "white" : "inherit" }} />}
                                    </th>
                                    <th className="course-manage-score" onClick={(e) => openExcelFilterPopup("mark", e)} style={{ cursor: "pointer" }}>
                                        Score
                                        {(filters["mark"] || sortConfig.colId === "mark") && <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "6px", color: filters["mark"] ? "white" : "inherit" }} />}
                                    </th>
                                    <th className="course-manage-start" onClick={(e) => openExcelFilterPopup("dateAdded", e)} style={{ cursor: "pointer" }}>
                                        Enrollment Date
                                        {(filters["dateAdded"] || sortConfig.colId === "dateAdded") && <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "6px", color: filters["dateAdded"] ? "white" : "inherit" }} />}
                                    </th>
                                    <th className="course-manage-end" onClick={(e) => openExcelFilterPopup("completionDate", e)} style={{ cursor: "pointer" }}>
                                        Completion Date
                                        {(filters["completionDate"] || sortConfig.colId === "completionDate") && <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "6px", color: filters["completionDate"] ? "white" : "inherit" }} />}
                                    </th>
                                    <th className="course-manage-act">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((student, index) => {
                                    const isPlaceholder = student.isPlaceholder;
                                    const enrollment = student.enrollment || {};

                                    return (
                                        <tr
                                            key={isPlaceholder ? "placeholder" : student._id || index}
                                            style={{ textAlign: "center" }}
                                        >
                                            <td style={{ textAlign: "center" }}>{index + 1}</td>

                                            <td
                                                style={{ position: "relative", cursor: "pointer" }}
                                                onClick={isPlaceholder ? undefined : handleStudentClick(student)}
                                            >
                                                {isPlaceholder ? "" : `${student.name} ${student.surname}`}

                                                {!isPlaceholder &&
                                                    hoveredStudentId === student._id &&
                                                    selectedForMenu &&
                                                    enrollment?.assessmentStatus === "PENDING_REVIEW" && (
                                                        <PopupMenuOnlineTrainingGrading
                                                            isOpen
                                                            setHoveredStudentId={setHoveredStudentId}
                                                            courseId={selectedForMenu.courseId}
                                                            studentId={selectedForMenu.studentId}
                                                            studentName={selectedForMenu.studentName}
                                                        />
                                                    )}
                                            </td>

                                            <td style={{ textAlign: "center" }}>
                                                {isPlaceholder ? "" : (renderProgress(enrollment.progress) ?? renderProgress("0%"))}
                                            </td>

                                            <td style={{ textAlign: "center" }}>
                                                {isPlaceholder ? "" : (enrollment.mark ?? "-")}
                                            </td>

                                            <td style={{ textAlign: "center" }}>
                                                {isPlaceholder ? "" : (enrollment.dateAdded ? formatDate(enrollment.dateAdded) : "-")}
                                            </td>

                                            <td style={{ textAlign: "center" }}>
                                                {isPlaceholder ? "" : (enrollment.completionDate ? formatDate(enrollment.completionDate) : "-")}
                                            </td>

                                            <td style={{ textAlign: "center" }}>
                                                {isPlaceholder ? (
                                                    <button
                                                        className="flame-delete-button-fi col-but-res"
                                                        style={{ width: "33%" }}
                                                        onClick={() => setPopupVisible(true)}
                                                        title="Add student"
                                                    >
                                                        <FontAwesomeIcon icon={faCirclePlus} />
                                                    </button>
                                                ) : (
                                                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                                        <button
                                                            className="flame-delete-button-fi col-but-res"
                                                            style={{ width: "33%" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPopupVisible(true);
                                                            }}
                                                            title="Add students"
                                                        >
                                                            <FontAwesomeIcon icon={faCirclePlus} />
                                                        </button>
                                                        <button
                                                            className="flame-delete-button-fi col-but"
                                                            style={{ width: "33%" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setStudentToRemove(student);
                                                                setRemovePopupVisible(true);
                                                            }}
                                                            title="Delete student enrollment"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRows.length === 0 && students.length > 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "12px" }}>No students match filters</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {popupVisible && (
                <AddStudentPopupOT
                    userIDs={userIDs}
                    popupVisible={popupVisible}
                    closePopup={() => setPopupVisible(false)}
                    setUserIDs={setUserIDs}
                    saveData={saveData}
                    userID={jwtDecode(token)?.userId}
                />
            )}

            {removePopupVisible && studentToRemove && (
                <RemoveStudentEnrollment
                    studentName={`${studentToRemove.name} ${studentToRemove.surname}`}
                    closeModal={() => {
                        setRemovePopupVisible(false);
                        setStudentToRemove(null);
                    }}
                    removeEnrollement={async () => {
                        await removeStudentEnrollmentFn(studentToRemove._id);
                        setRemovePopupVisible(false);
                        setStudentToRemove(null);
                    }}
                />
            )}

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

export default OnlineTrainingCourseManagement;