import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./UserManagement.css";
import "./FileInfoHome.css";
import "./DepartmentHome.css";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faX,
    faArrowLeft,
    faSearch,
    faCaretLeft,
    faCaretRight,
    faCirclePlus,
    faFilter,
    faPen,
    faTrash,
    faRotate,
    faEdit,
} from "@fortawesome/free-solid-svg-icons";
import AddDepartmentModal from "./UserManagement/AddDepartmentModal";
import TopBar from "./Notifications/TopBar";
import DeletePopupDM from "./UserManagement/DeletePopupDM";
import UpdateDepartmentModal from "./UserManagement/EditDepartmentModal";

const DepartmentHome = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [loggedInUserId, setLoggedInUserId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [create, setCreate] = useState(false);

    const [deletePopup, setDeletePopup] = useState(false);
    const [editPopup, setEditPopup] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const navigate = useNavigate();
    const excelPopupRef = useRef(null);

    const DEFAULT_SORT = { colId: null, direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const [columnFilters, setColumnFilters] = useState({});

    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 },
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());

    const clearSearch = () => setSearchQuery("");

    const openAdd = () => setCreate(true);
    const closeAdd = () => {
        setCreate(false);
        fetchDepartments();
    };

    const openDeletePopup = (department, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setSelectedDepartment(department);
        setDeletePopup(true);
    };

    const closeDeletePopup = () => {
        setDeletePopup(false);
        setSelectedDepartment(null);
    };

    const openEditPopup = (department, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setSelectedDepartment(department);
        setEditPopup(true);
    };

    const closeEditPopup = () => {
        setEditPopup(false);
        setSelectedDepartment(null);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setLoggedInUserId(decodedToken.userId);
        }
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/`);
            if (!response.ok) {
                throw new Error("Failed to fetch departments");
            }

            const data = await response.json();

            const filteredDepartments = (data.departments || []);

            setDepartments(filteredDepartments);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchDepartments();
        }
    }, [loggedInUserId]);

    const handleDeleteDepartment = async () => {
        if (!selectedDepartment?._id) return;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/department/delete/${selectedDepartment._id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete department");
            }

            toast.success("Department deleted successfully.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: "center",
                }
            });

            closeDeletePopup();
            fetchDepartments();
        } catch (error) {
            toast.error("Department could not be deleted.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: "center",
                }
            });
            setError(error.message);
        }
    };

    const handleEditDepartment = async (payload) => {
        if (!selectedDepartment?._id) return;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/department/update/${selectedDepartment._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update department");
            }

            toast.success("Department updated successfully.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: "center",
                }
            });

            closeEditPopup();
            fetchDepartments();
        } catch (err) {
            console.error(err);
            toast.error("Department could not be updated.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: "center",
                }
            });
            setError(err.message);
            throw err;
        }
    };

    const getFilterValuesForCell = (row, colId) => {
        if (colId === "nr") return [String(row.nr ?? "")];
        if (colId === "department") return [String(row.department || "").trim() || "(Blanks)"];
        if (colId === "departmentUsers") return [String(row.departmentUsers ?? 0)];
        return ["(Blanks)"];
    };

    const toggleSort = (colId, direction) => {
        setSortConfig((prev) => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    const openExcelFilterPopup = (colId, e) => {
        e.preventDefault();
        e.stopPropagation();

        const th = e.currentTarget.closest("th");
        const rect = th.getBoundingClientRect();

        const baseRows = departments
            .filter((d) => (d.department || "").toLowerCase().includes(searchQuery.toLowerCase()))
            .map((d, index) => ({
                ...d,
                nr: index + 1,
                departmentUsers: Array.isArray(d.departmentMembers) ? d.departmentMembers.length : 0,
            }));

        const values = Array.from(
            new Set(baseRows.flatMap((r) => getFilterValuesForCell(r, colId)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        const existing = columnFilters?.[colId];
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
            setExcelFilter((prev) => ({
                ...prev,
                pos: { ...prev.pos, top: newTop, left: newLeft },
            }));
        }
    }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (excelFilter.open && excelPopupRef.current && !excelPopupRef.current.contains(e.target)) {
                setExcelFilter((prev) => ({ ...prev, open: false }));
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [excelFilter.open]);

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

            if (goingDown && atBottom) el.scrollTop = scrollHeight - clientHeight;
            else if (!goingDown && atTop) el.scrollTop = 0;
        }
    };

    const filteredDepartments = useMemo(() => {
        let current = departments
            .filter((department) =>
                (department.department || "").toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((department, index) => ({
                ...department,
                nr: index + 1,
                departmentUsers: Array.isArray(department.departmentMembers)
                    ? department.departmentMembers.length
                    : 0,
            }));

        for (const [colId, selectedValues] of Object.entries(columnFilters)) {
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            current = current.filter((row) => {
                const cellValues = getFilterValuesForCell(row, colId);
                return cellValues.some((v) => selectedValues.includes(v));
            });
        }

        const effectiveSortCol = sortConfig?.colId ?? "department";
        const effectiveSortDir = sortConfig?.direction === "desc" ? -1 : 1;

        current.sort((a, b) => {
            if (effectiveSortCol === "nr") {
                return (Number(a.nr) - Number(b.nr)) * effectiveSortDir;
            }

            if (effectiveSortCol === "departmentUsers") {
                return (Number(a.departmentUsers) - Number(b.departmentUsers)) * effectiveSortDir;
            }

            const av = String(a[effectiveSortCol] || "").toLowerCase();
            const bv = String(b[effectiveSortCol] || "").toLowerCase();
            return av.localeCompare(bv) * effectiveSortDir;
        });

        return current.map((department, index) => ({
            ...department,
            nr: index + 1,
        }));
    }, [departments, searchQuery, columnFilters, sortConfig]);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(columnFilters).length > 0;
        const hasExplicitSort = sortConfig.colId !== null;
        return hasColumnFilters || hasExplicitSort;
    }, [columnFilters, sortConfig]);

    const handleClearFilters = () => {
        setColumnFilters({});
        setSortConfig(DEFAULT_SORT);
        setExcelFilter({
            open: false,
            colId: null,
            anchorRect: null,
            pos: { top: 0, left: 0, width: 0 },
        });
    };

    const getAvailableOptions = (colId) => {
        let filtered = departments
            .filter((d) => (d.department || "").toLowerCase().includes(searchQuery.toLowerCase()))
            .map((d, index) => ({
                ...d,
                nr: index + 1,
                departmentUsers: Array.isArray(d.departmentMembers) ? d.departmentMembers.length : 0,
            }));

        for (const [filterColId, selectedValues] of Object.entries(columnFilters)) {
            if (filterColId === colId) continue;
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row) => {
                const cellValues = getFilterValuesForCell(row, filterColId);
                return cellValues.some((v) => selectedValues.includes(v));
            });
        }

        return Array.from(
            new Set(filtered.flatMap((r) => getFilterValuesForCell(r, colId)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    };

    const renderHeaderCell = (label, colId) => {
        const isFiltered = !!columnFilters[colId];

        return (
            <th
                className="col department-header-cell"
                onClick={(e) => openExcelFilterPopup(colId, e)}
                title="Filter / Sort"
                style={{ cursor: "pointer" }}
            >
                <div className="department-header-inner">
                    <span className="department-header-label">{label} </span>
                    {isFiltered && (
                        <FontAwesomeIcon
                            icon={faFilter}
                            className="department-header-filter-icon active"
                        />
                    )}
                </div>
            </th>
        );
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-dept">Admin Page</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/adminDepartmentsInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{`Manage Departments`}</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div
                        className="sidebar-toggle-icon"
                        title="Show Sidebar"
                        onClick={() => setIsSidebarVisible(true)}
                    >
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon icon={faCirclePlus} title="Create Department" onClick={openAdd} />
                    </div>

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" ? (
                            <i>
                                <FontAwesomeIcon
                                    icon={faX}
                                    onClick={clearSearch}
                                    className="icon-um-search"
                                    title="Clear Search"
                                />
                            </i>
                        ) : (
                            <i>
                                <FontAwesomeIcon icon={faSearch} className="icon-um-search" />
                            </i>
                        )}
                    </div>

                    <div className="info-box-fih">Number of Departments: {filteredDepartments.length}</div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">Departments</label>

                        <button
                            className="top-right-button-control-att"
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{
                                cursor: hasActiveFilters ? "pointer" : "default",
                                color: hasActiveFilters ? "#002060" : "gray",
                                userSelect: "none",
                            }}
                            onDoubleClick={handleClearFilters}
                        >
                            <FontAwesomeIcon
                                icon={faFilter}
                                className="icon-um-search"
                                style={{ color: hasActiveFilters ? "#002060" : "inherit" }}
                            />
                        </button>
                    </div>

                    <div className="table-container-user">
                        <table>
                            <thead>
                                <tr>
                                    <th className="doc-num-team" onClick={(e) => openExcelFilterPopup("nr", e)}>
                                        Nr
                                    </th>

                                    <th className="col-name-team" onClick={(e) => openExcelFilterPopup("department", e)}>
                                        Department Name
                                        {columnFilters["department"] && (
                                            <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "8px" }} />
                                        )}
                                    </th>

                                    <th className="col-role-team" onClick={(e) => openExcelFilterPopup("departmentUsers", e)}>
                                        Department Users
                                        {columnFilters["departmentUsers"] && (
                                            <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "8px" }} />
                                        )}
                                    </th>

                                    <th className="col-action-user">
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            <tbody>
                                {filteredDepartments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="col"
                                            style={{
                                                textAlign: "center",
                                                padding: "18px",
                                                color: "#666",
                                            }}
                                        >
                                            No departments found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDepartments.map((department) => (
                                        <tr
                                            key={department._id}
                                            className="department-row-clickable"
                                            onClick={() => navigate(`/FrontendDMS/department/${department._id}`)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <td className="col-um">{department.nr}</td>
                                            <td className="col-um">{department.department}</td>
                                            <td className="col-um">{department.departmentUsers}</td>
                                            <td className={"col-um"}>
                                                <button
                                                    className="action-button-user edit-button-user"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditPopup(department, e);
                                                    }}
                                                    style={{ marginRight: "10px" }}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} title="Edit Department" />
                                                </button>
                                                <button className="action-button-user delete-button-user"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeletePopup(department, e);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} title="Delete Department" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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
                    onWheel={handleInnerScrollWheel}
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "asc"
                                ? "active"
                                : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>

                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "desc"
                                ? "active"
                                : ""
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

                        const visibleValues = allValues.filter((v) =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const isAllVisibleSelected =
                            visibleValues.length > 0 && visibleValues.every((v) => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected((prev) => {
                                const next = new Set(prev);
                                if (checked) visibleValues.forEach((v) => next.add(v));
                                else visibleValues.forEach((v) => next.delete(v));
                                return next;
                            });
                        };

                        const toggleValue = (v) => {
                            setExcelSelected((prev) => {
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
                                    Array.from(excelSelected).filter((v) => visibleSet.has(v))
                                );
                            }

                            const selectedArr = Array.from(finalSelection);

                            const isTotalReset =
                                allValues.length > 0 &&
                                allValues.length === selectedArr.length &&
                                selectedArr.every((v) => finalSelection.has(v));

                            setColumnFilters((prev) => {
                                const next = { ...prev };
                                if (isTotalReset) {
                                    delete next[colId];
                                } else {
                                    next[colId] = selectedArr;
                                }
                                return next;
                            });

                            setExcelFilter({
                                open: false,
                                colId: null,
                                anchorRect: null,
                                pos: { top: 0, left: 0, width: 0 },
                            });
                        };

                        const onCancel = () => {
                            setExcelFilter({
                                open: false,
                                colId: null,
                                anchorRect: null,
                                pos: { top: 0, left: 0, width: 0 },
                            });
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
                                        {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                                    </label>

                                    {visibleValues.map((v) => (
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
                                        <div
                                            style={{
                                                padding: "8px",
                                                color: "#888",
                                                fontStyle: "italic",
                                                fontSize: "12px",
                                            }}
                                        >
                                            No matches found
                                        </div>
                                    )}
                                </div>

                                <div className="excel-filter-actions">
                                    <button type="button" className="excel-filter-btn" onClick={onOk}>
                                        Apply
                                    </button>
                                    <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>
                                        Cancel
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {create && <AddDepartmentModal show={create} onClose={closeAdd} />}

            {editPopup && selectedDepartment && (
                <UpdateDepartmentModal
                    show={editPopup}
                    onClose={closeEditPopup}
                    departmentData={selectedDepartment}
                    onSubmit={handleEditDepartment}
                />
            )}

            {deletePopup && selectedDepartment && (
                <DeletePopupDM
                    setIsDeleteModalOpen={setDeletePopup}
                    handleDelete={handleDeleteDepartment}
                    departmentName={selectedDepartment.department}
                />
            )}

            <ToastContainer />
        </div>
    );
};

export default DepartmentHome;