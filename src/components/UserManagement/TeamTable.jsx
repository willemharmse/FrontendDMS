import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faFilter } from '@fortawesome/free-solid-svg-icons';
import './UserTable.css';
import './TeamTable.css';

const TeamTable = ({
    team,
    setUserToDelete,
    setIsDeleteModalOpen,
    formatRole,
    loggedInUserId,
    onDeleteDepartment
}) => {
    const getFilterBtnClass = () => {
        return "top-right-button-control-att";
    };

    const excelPopupRef = useRef(null);

    const BLANK = "(Blanks)";

    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());

    const DEFAULT_SORT = { colId: null, direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const [filters, setFilters] = useState({});

    const columns = [
        { id: "nr", title: "Nr" },
        { id: "username", title: "Username" },
        { id: "role", title: "Role" },
        { id: "dateAdded", title: "Date Added" },
        { id: "action", title: "Action" }
    ];

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}.${month}.${year}`;
    };

    const getCellValue = (user, colId) => {
        switch (colId) {
            case "nr":
                return "";
            case "username":
                return user.username || "";
            case "role":
                return formatRole(user.role) || "";
            case "dateAdded":
                return user.dateAdded ? formatDate(user.dateAdded) : "";
            default:
                return "";
        }
    };

    const normalizeValue = (value) => {
        const s = value == null ? "" : String(value).trim();
        return s === "" ? BLANK : s;
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    const getAvailableOptions = (targetColId) => {
        const rowsAfterOtherFilters = team.filter((user) => {
            for (const [colId, selected] of Object.entries(filters)) {
                if (colId === targetColId) continue;
                if (!Array.isArray(selected) || selected.length === 0) continue;

                const cellValue = normalizeValue(getCellValue(user, colId));
                if (!selected.includes(cellValue)) return false;
            }
            return true;
        });

        const uniqueValues = Array.from(
            new Set(
                rowsAfterOtherFilters.map((user) =>
                    normalizeValue(getCellValue(user, targetColId))
                )
            )
        );

        return uniqueValues.sort((a, b) =>
            String(a).localeCompare(String(b), undefined, {
                sensitivity: "base",
                numeric: true
            })
        );
    };

    const openExcelFilter = (colId, e) => {
        if (colId === "nr" || colId === "action") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const allValues = getAvailableOptions(colId);
        const existing = filters[colId];

        setExcelSelected(new Set(Array.isArray(existing) ? existing : allValues));
        setExcelSearch("");
        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(rect.width, 220)
            }
        });
    };

    useEffect(() => {
        if (!excelFilter.open) return;

        const handleClickOutside = (e) => {
            if (excelPopupRef.current && !excelPopupRef.current.contains(e.target)) {
                setExcelFilter({
                    open: false,
                    colId: null,
                    anchorRect: null,
                    pos: { top: 0, left: 0, width: 0 }
                });
            }
        };

        const handleScroll = () => {
            setExcelFilter({
                open: false,
                colId: null,
                anchorRect: null,
                pos: { top: 0, left: 0, width: 0 }
            });
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [excelFilter.open]);

    const displayedTeam = useMemo(() => {
        let current = [...team];

        current = current.filter((user) => {
            for (const [colId, selected] of Object.entries(filters)) {
                if (!Array.isArray(selected) || selected.length === 0) continue;

                const cellValue = normalizeValue(getCellValue(user, colId));
                if (!selected.includes(cellValue)) return false;
            }
            return true;
        });

        const colId = sortConfig?.colId ?? "username";
        const dir = sortConfig?.direction === "desc" ? -1 : 1;

        current.sort((a, b) => {
            const av = normalizeValue(getCellValue(a, colId));
            const bv = normalizeValue(getCellValue(b, colId));

            const aBlank = av === BLANK;
            const bBlank = bv === BLANK;
            if (aBlank && !bBlank) return 1;
            if (!aBlank && bBlank) return -1;

            return String(av).localeCompare(String(bv), undefined, {
                sensitivity: "base",
                numeric: true,
            }) * dir;
        });

        return current;
    }, [team, filters, sortConfig]);

    const isSortActive = (colId) => sortConfig?.colId === colId;

    const isFilterActive = (colId) =>
        Array.isArray(filters[colId]) && filters[colId].length > 0;

    const isHeaderIconVisible = (colId) =>
        isSortActive(colId) || isFilterActive(colId);

    return (
        <div className="table-flameproof-card">
            <div className="flameproof-table-header-label-wrapper">
                <label className="risk-control-label">Manage Department</label>

                {false && (<button
                    className={getFilterBtnClass()}
                    title="Delete Department"
                    onClick={onDeleteDepartment}
                    style={{
                        cursor: "pointer",
                        color: "#8B0000",
                        userSelect: "none"
                    }}
                >
                    <FontAwesomeIcon icon={faTrash} className="icon-um-search" />
                </button>)}
            </div>
            <div className="table-container-user">
                <table>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.id}
                                    className={
                                        col.id === "nr" ? "doc-num-team" :
                                            col.id === "username" ? "col-name-team" :
                                                col.id === "role" ? "col-role-team" :
                                                    col.id === "dateAdded" ? "col-day-team" :
                                                        "col-action-user"
                                    }
                                    onClick={(e) => {
                                        if (col.id !== "nr" && col.id !== "action") {
                                            openExcelFilter(col.id, e);
                                        }
                                    }}
                                    style={{
                                        cursor: col.id !== "nr" && col.id !== "action" ? "pointer" : "default",
                                        position: "relative"
                                    }}
                                >
                                    {col.title}

                                    {col.id !== "nr" && col.id !== "action" && isHeaderIconVisible(col.id) && (
                                        <FontAwesomeIcon
                                            icon={faFilter}
                                            style={{
                                                marginLeft: "8px",
                                                pointerEvents: "none"
                                            }}
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTeam.map((user, index) => (
                            <tr key={user._id}>
                                <td className="col-um">{index + 1}</td>
                                <td className="col-um">{user.username}</td>
                                <td className="col-um">{formatRole(user.role)}</td>
                                <td className="col-um">{user.dateAdded ? formatDate(user.dateAdded) : ""}</td>
                                <td className="col-um">
                                    <button
                                        className={"action-button-user delete-button-user"}
                                        onClick={() => {
                                            setUserToDelete(user);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        disabled={!(user._id !== loggedInUserId)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} title="Remove User" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

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
                                visibleValues.length > 0 &&
                                visibleValues.every(v => excelSelected.has(v));

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

                                const isTotalReset =
                                    allValues.length > 0 &&
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

                                setExcelFilter({
                                    open: false,
                                    colId: null,
                                    anchorRect: null,
                                    pos: { top: 0, left: 0, width: 0 }
                                });
                            };

                            const onCancel = () => {
                                setExcelFilter({
                                    open: false,
                                    colId: null,
                                    anchorRect: null,
                                    pos: { top: 0, left: 0, width: 0 }
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
                                            <div
                                                style={{
                                                    padding: "8px",
                                                    color: "#888",
                                                    fontStyle: "italic",
                                                    fontSize: "12px"
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
            </div>
        </div>
    );
};

export default TeamTable;