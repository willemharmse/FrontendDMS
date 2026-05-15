import React, { useState, useEffect, useRef } from "react";
import "./AttendanceTable.css";
import "../CreatePage/ReferenceTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFilter, faInfoCircle, faPlusCircle, faTableColumns, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";

const AttendanceTable = ({ collapsible = false, rows = [], addRow, removeRow, error, updateRows, generateAR, setErrors, readOnly = false, title, documentType }) => {
    const [collapsed, setCollapsed] = useState(true);
    const isCollapsed = collapsible ? collapsed : false;
    const [designations, setDesignations] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [filteredAuthorOptions, setFilteredAuthorOptions] = useState({});
    const [filteredDesignationOptions, setFilteredDesignationOptions] = useState({});
    const [filteredCompanyOptions, setFilteredCompanyOptions] = useState({});
    const [showDropdown, setShowDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [activeField, setActiveField] = useState(null); // Track which field (name or designation)
    const inputRefs = useRef({});
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const popupRef = useRef(null);
    const [nameToPositionMap, setNameToPositionMap] = useState({});
    const [loading, setLoading] = useState(false);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const availableColumns = [
        { id: "nr", title: "Nr" },
        { id: "name", title: "Name & Surname" },
        { id: "site", title: "Company/Site" },
        { id: "attendance", title: "Attendance" },
        { id: "designation", title: "Position" },
        { id: "num", title: "Company/ ID Number" },
        { id: "action", title: "Action" },
    ];

    useEffect(() => {
        const popupSelector = '.floating-dropdown';
        const columnSelector = '.column-selector-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(columnSelector) &&
                !e.target.closest('.excel-filter-popup') && // <--- ADD THIS LINE
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(columnSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }
        };

        const closeDropdowns = () => {
            setShowDropdown(null);
            setShowColumnSelector(null);
            setExcelFilter(prev => ({ ...prev, open: false }));

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showDropdown, showColumnSelector]);

    const toggleColumn = (columnId) => {
        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                if (columnId === 'action' || columnId === 'nr') return prev;
                return prev.filter(id => id !== columnId);
            } else {
                const actionIndex = prev.indexOf('action');
                if (actionIndex !== -1) {
                    return [...prev.slice(0, actionIndex), columnId, ...prev.slice(actionIndex)];
                } else {
                    return [...prev, columnId];
                }
            }
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            const allColumns = availableColumns
                .map(col => col.id)
                .filter(id => id !== 'action');
            setShowColumns([...allColumns, 'action',]);
        } else {
            setShowColumns(['nr', 'action', 'attendance', 'name', 'site', 'designation']);
        }
    };

    const areAllColumnsSelected = () => {
        const selectableColumns = availableColumns
            .filter(col => col.id !== 'action')
            .map(col => col.id);

        return selectableColumns.every(colId =>
            showColumns.includes(colId) || colId === 'nr'
        );
    };

    const [showColumns, setShowColumns] = useState([
        "nr", "name", "site", "designation", "attendance",
        ...(!readOnly ? ["action"] : []),
    ]);

    const fetchAttendees = async () => {
        try {
            const [stkRes, userRes] = await Promise.all([
                fetch(`${process.env.REACT_APP_URL}/api/riskInfo/stk`),
                fetch(`${process.env.REACT_APP_URL}/api/user/`),
            ]);

            if (!stkRes.ok) throw new Error("Failed to fetch stakeholders");
            if (!userRes.ok) throw new Error("Failed to fetch users");

            const stkData = await stkRes.json();
            const userData = await userRes.json();

            const stakeholderAttendees = (stkData.stakeholders || []).map(s => ({
                kind: "stakeholder",
                id: s._id,
                name: s.name || "",
                position: s.pos || "",
            }));

            const userAttendees = (userData.users || []).map(u => ({
                kind: "user",
                id: u._id,
                // Use username (always present). If you prefer first+last when available, you can swap later.
                name: u.username || "",
                position: u.designation || "",
            }));

            const combined = [...userAttendees, ...stakeholderAttendees]
                .filter(a => a.name.trim() !== "")
                .sort((a, b) => a.name.localeCompare(b.name));

            setAttendees(combined);

            // optional: build designation dropdown values from BOTH sources
            const positions = Array.from(
                new Set(combined.map(a => a.position).filter(p => (p || "").trim() !== ""))
            ).sort((a, b) => a.localeCompare(b));
            setDesignations(positions);
        } catch (error) {
            console.error("Error fetching attendees:", error);
        }
    };

    /*
    const fetchAuthors = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/stk`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();

            const positionMap = {};
            data.stakeholders.forEach(({ name, pos }) => {
                positionMap[name] = pos;
            });
            setNameToPositionMap(positionMap);

            const positions = Array.from(new Set(data.stakeholders.map(d => d.pos))).sort();
            setDesignations(positions);
            setAuthors(data.stakeholders);
        } catch (error) {
            console.error("Error fetching authors:", error);
        }
    };
    */

    const fetchSites = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/sites`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();
            setCompanies(data.sites.map(s => s.site));
        } catch (error) {
            console.error("Error fetching designations:", error);
        }
    };

    useEffect(() => {
        fetchAttendees();
        fetchSites();
    }, []);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown !== null &&
                !event.target.closest('.floating-dropdown') &&
                !event.target.closest('input')) {
                setTimeout(() => setShowDropdown(null), 200);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    const handleInputChange = (index, field, e) => {
        const value = e.target.value;

        // Update the row data
        const updatedRow = { ...rows[index], [field]: value };
        const newRows = [...rows];
        newRows[index] = updatedRow;
        updateRows(newRows);

        // Update filtered options and show dropdown
        if (field === "name") {
            const filtered = attendees.filter(a =>
                a.name.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredAuthorOptions(prev => ({ ...prev, [index]: filtered }));
            setActiveField("name");

            if (inputRefs.current[`name-${index}`]) {
                const rect = inputRefs.current[`name-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "designation") {
            const filtered = designations.filter(designation =>
                designation.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredDesignationOptions(prev => ({ ...prev, [index]: filtered }));
            setActiveField("designation");

            if (inputRefs.current[`designation-${index}`]) {
                const rect = inputRefs.current[`designation-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "site") { // For company/site field
            const filtered = companies.filter(company =>
                company.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredCompanyOptions(prev => ({ ...prev, [index]: filtered }));
            setActiveField("site");

            if (inputRefs.current[`site-${index}`]) {
                const rect = inputRefs.current[`site-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }
    };

    const handleFocus = (index, field) => {
        if (readOnly) return;
        if (error) {
            setErrors(prev => ({ ...prev, attend: false })); // Clear attendance error on focus
        }
        setActiveField(field);

        if (field === "name") {
            // Show all authors or filtered options on focus
            const value = rows[index].name || "";
            const filtered = attendees.filter(a =>
                a.name.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredAuthorOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[`name-${index}`]) {
                const rect = inputRefs.current[`name-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "designation") {
            // Show all designations or filtered options on focus
            const value = rows[index].designation || "";
            const filtered = designations.filter(designation =>
                designation.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredDesignationOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[`designation-${index}`]) {
                const rect = inputRefs.current[`designation-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "site") { // For company/site field
            const value = rows[index].site || "";
            const filtered = companies.filter(company =>
                company.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredCompanyOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[`site-${index}`]) {
                const rect = inputRefs.current[`site-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }
    };

    const handleSelectOption = (index, field, value) => {
        // start with whatever was in the row before...
        const updatedRow = { ...rows[index], [field]: value };

        // if the user just picked a name, auto‐populate designation
        if (field === "name") {
            // look up the title; if no match, fall back to empty string
            const title = nameToPositionMap[value] || "";

            if (index !== 0)
                updatedRow.designation = title;
        }

        const newRows = [...rows];
        newRows[index] = updatedRow;
        updateRows(newRows);
        setShowDropdown(null);
    };

    const insertRowAt = (insertIndex) => {
        const newRows = [...rows];
        const newRow = {
            name: "",
            site: "",
            num: "",
            designation: "",
        };
        newRows.splice(insertIndex, 0, newRow);
        updateRows(newRows);
    };

    // --- START: Excel Filter & Sort State ---
    const [filters, setFilters] = useState({});
    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);
    const BLANK = "(Blanks)";

    // Helper to get values for filtering
    const getFilterValuesForCell = (row, colId) => {
        const raw = row?.[colId];
        const s = raw == null ? "" : String(raw).trim();
        return s === "" ? [BLANK] : [s];
    };

    // Calculate Filtered & Sorted Rows
    const filteredRows = React.useMemo(() => {
        // 1. Attach original index to keep track of data for editing
        let current = rows.map((r, i) => ({ ...r, _originalIndex: i }));

        // 2. Apply Filters
        if (Array.isArray(filters.site)) {
            // If user applied with nothing selected -> show nothing (Excel behavior)
            if (filters.site.length === 0) {
                current = [];
            } else {
                current = current.filter(row => {
                    const cellValues = getFilterValuesForCell(row, "site");
                    return cellValues.some(v => filters.site.includes(v));
                });
            }
        }

        // 3. Apply Sorting
        const { colId, direction } = sortConfig;

        // If sort is default (nr), we rely on original index order (effectively no sort)
        if (colId !== "nr") {
            const dir = direction === "desc" ? -1 : 1;

            current.sort((a, b) => {
                const valA = getFilterValuesForCell(a, colId)[0];
                const valB = getFilterValuesForCell(b, colId)[0];

                if (valA === BLANK && valB !== BLANK) return 1;
                if (valA !== BLANK && valB === BLANK) return -1;
                if (valA === BLANK && valB === BLANK) return 0;

                return String(valA).localeCompare(String(valB)) * dir;
            });
        }

        return current;
    }, [rows, filters, sortConfig]);

    // Open Filter Menu
    const openExcelFilterPopup = (colId, e) => {
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Get unique values from ALL rows (not just visible ones)
        const values = Array.from(
            new Set(rows.flatMap(r => getFilterValuesForCell(r, colId)))
        ).sort();

        const existing = filters?.[colId];
        // Default to all selected if no filter exists
        setExcelSelected(new Set(existing || values));
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

    // Handle Popup Positioning
    useEffect(() => {
        if (!excelFilter.open || !excelPopupRef.current) return;

        const popupRect = excelPopupRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight;
        let newTop = excelFilter.pos.top;

        // Flip up if near bottom
        if (popupRect.bottom > viewportH - 10) {
            if (excelFilter.anchorRect) {
                newTop = excelFilter.anchorRect.top + window.scrollY - popupRect.height - 4;
            }
        }

        if (newTop !== excelFilter.pos.top) {
            setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top: newTop } }));
        }
    }, [excelFilter.open, excelSearch]);

    const handleGenerateARegister = async () => {
        const dataToStore = {
            attendance: filteredRows
        };

        if (rows.some(row => !row.name.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees names must have a value.", {
                closeButton: true,
                autoClose: 2000, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (rows.some(row => !row.site.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees company/site must have a value.", {
                closeButton: true,
                autoClose: 2000, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (rows.some(row => !row.designation.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees designation must have a value.", {
                closeButton: true,
                autoClose: 2000, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        const documentName = (title) + ' ' + documentType + " Attendance Register";
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-attend-xlsx`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.xlsx`);
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const getAvailableOptions = (colId) => {
        let current = rows; // Assuming 'files' is your data state

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

    const handleSelectAttendee = (index, attendee) => {
        const updatedRow = {
            ...rows[index],
            name: attendee.name,
        };

        // auto populate position for all rows except facilitator if you want to keep that rule
        if (index !== 0) {
            updatedRow.designation = attendee.position || "";
        }

        const newRows = [...rows];
        newRows[index] = updatedRow;
        updateRows(newRows);
        setShowDropdown(null);
    };

    return (
        <div className="input-row-risk-create">
            <div className={`input-box-attendance ${error ? "error-sign" : ""}`}>
                <h3 className="font-fam-labels">
                    Attendance Register <span className="required-field">*</span>
                </h3>
                <button
                    className={`${collapsible ? `top-right-button-ibra2` : `top-right-button-ibra`}`}
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>

                <button
                    className={`${collapsible ? `top-right-button-ibra3` : `top-right-button-ibra2`}`}
                    title="Generate Attendance Register"
                    onClick={handleGenerateARegister}
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                </button>

                {showColumnSelector && (
                    <div className="column-selector-popup" ref={popupRef}>
                        <div className="column-selector-header">
                            <h4>Select Columns</h4>
                            <button
                                className="close-popup-btn"
                                onClick={() => setShowColumnSelector(false)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="column-selector-content">
                            <p className="column-selector-note">Select columns to display</p>

                            <div className="select-all-container">
                                <label className="select-all-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={areAllColumnsSelected()}
                                        onChange={(e) => toggleAllColumns(e.target.checked)}
                                    />
                                    <span className="select-all-text">Select All</span>
                                </label>
                            </div>

                            <div className="column-checkbox-container">
                                {availableColumns.map(column => (
                                    <div className="column-checkbox-item" key={column.id}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={showColumns.includes(column.id)}
                                                disabled={column.id === 'action' || column.id === 'nr' || column.id === 'attendance' || column.id === 'name' || column.id === 'site' || column.id === 'designation'}
                                                onChange={() => toggleColumn(column.id)}
                                            />
                                            <span>{column.title}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="column-selector-footer">
                                <p>{showColumns.length - 1} columns selected</p>
                                <button
                                    className="apply-columns-btn"
                                    onClick={() => setShowColumnSelector(false)}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {collapsible && (<button
                    className="top-right-button-ibra"
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>)}

                {(!isCollapsed) && (
                    <table className="vcr-table-2 font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-nr` : `attend-nr`}`}>Nr</th>
                                <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-name` : `attend-name-exp`}`}>Name & Surname</th>
                                <th
                                    className={`font-fam cent ${!showColumns.includes("num") ? `attend-comp` : `attend-comp-exp`}`}
                                    style={{ cursor: "pointer", position: "relative" }}
                                    onClick={(e) => {
                                        // Only open if not clicking resizing handles (if you have them)
                                        // or just open directly
                                        openExcelFilterPopup("site", e);
                                    }}
                                >
                                    Company/Site
                                    {/* Show filter icon if filtered OR sorted by site */}
                                    {(filters["site"] || sortConfig.colId === "site") && (
                                        <FontAwesomeIcon icon={faFilter} style={{ marginLeft: "8px", color: "#002060" }} />
                                    )}
                                </th>
                                <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-desg` : `attend-desg-exp`}`}>Position</th>
                                <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-pres` : `attend-pres-exp`}`}>Attendance</th>
                                {showColumns.includes("num") && (<th className="font-fam cent attend-id">Company / ID Number</th>)}
                                {!readOnly && (<th className={`font-fam cent ${!showColumns.includes("num") ? `attend-act` : `attend-act-exp`}`}>Action</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row, visualIndex) => {
                                const index = row._originalIndex; // USE THIS for logic
                                return (
                                    <tr key={index}>
                                        {/* Display Nr based on Visual Index (1, 2, 3...) */}
                                        <td className="cent">{visualIndex + 1}</td>

                                        <td>
                                            <input
                                                type="text"
                                                className="table-control font-fam"
                                                value={row.name || ""}
                                                style={{ fontSize: "14px" }}
                                                onChange={(e) => handleInputChange(index, "name", e)}
                                                onFocus={() => handleFocus(index, "name")}
                                                placeholder="Insert or select name"
                                                ref={(el) => (inputRefs.current[`name-${index}`] = el)}
                                                readOnly={readOnly}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="table-control font-fam"
                                                value={row.site || ""}
                                                onFocus={() => handleFocus(index, "site")}
                                                style={{ fontSize: "14px" }}
                                                onChange={(e) => handleInputChange(index, "site", e)}
                                                placeholder="Insert company/site"
                                                ref={(el) => (inputRefs.current[`site-${index}`] = el)}
                                                readOnly={readOnly}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="table-control font-fam"
                                                value={row.designation || ""}
                                                onChange={(e) => handleInputChange(index, "designation", e)}
                                                onFocus={() => handleFocus(index, "designation")}
                                                placeholder="Insert or select designation"
                                                readOnly={index === 0 || readOnly}
                                                style={{ fontSize: "14px" }}
                                                ref={(el) => (inputRefs.current[`designation-${index}`] = el)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="checkbox-inp-attend"
                                                checked={row.presence === "Present"}
                                                onChange={(e) => {
                                                    const updatedRow = {
                                                        ...rows[index], // Use original index
                                                        presence: e.target.checked ? "Present" : "Absent"
                                                    };
                                                    const newRows = [...rows];
                                                    newRows[index] = updatedRow;
                                                    updateRows(newRows);
                                                }}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        {showColumns.includes("num") && (<td className="font-fam cent">
                                            <input
                                                type="text"
                                                className="table-control font-fam"
                                                value={row.num || ""}
                                                style={{ fontSize: "14px" }}
                                                onChange={(e) => handleInputChange(index, "num", e)}
                                                placeholder="Insert company / ID number"
                                                readOnly={readOnly}
                                            />
                                        </td>)}
                                        {!readOnly && (
                                            <td className="procCent action-cell-auth-risk">
                                                <button
                                                    className="remove-row-button font-fam"
                                                    onClick={() => {
                                                        if (index !== 0) {
                                                            removeRow(index); // Prevent removal of the first row
                                                        } else {
                                                            toast.dismiss();
                                                            toast.clearWaitingQueue();
                                                            toast.warn("The Facilitator cannot be removed.", {
                                                                closeButton: false,
                                                                autoClose: 2000,
                                                                style: { textAlign: 'center' }
                                                            });
                                                        }
                                                    }}
                                                    title="Remove Row"
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                                <button
                                                    className="insert-row-button-sig font-fam"
                                                    onClick={() => insertRowAt(index + 1)} // Use original index
                                                    title="Add row"
                                                    type="button"
                                                    style={{ fontSize: "15px" }}
                                                >
                                                    <FontAwesomeIcon icon={faPlusCircle} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Floating Dropdown - Rendered outside the table structure */}
            {showDropdown !== null && activeField === "name" && filteredAuthorOptions[showDropdown]?.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredAuthorOptions[showDropdown].map((a, i) => (
                        <li key={a.id || i} onMouseDown={() => handleSelectAttendee(showDropdown, a)}>
                            {a.name}
                        </li>
                    ))}
                </ul>
            )}

            {showDropdown !== null && activeField === "designation" && filteredDesignationOptions[showDropdown]?.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredDesignationOptions[showDropdown].filter(term => term && term.trim() !== "").map((designation, i) => (
                        <li key={i} onMouseDown={() => handleSelectOption(showDropdown, "designation", designation)}>
                            {designation}
                        </li>
                    ))}
                </ul>
            )}

            {showDropdown !== null && activeField === "site" && filteredCompanyOptions[showDropdown]?.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredCompanyOptions[showDropdown].sort().map((company, i) => (
                        <li key={i} onMouseDown={() => handleSelectOption(showDropdown, "site", company)}>
                            {company}
                        </li>
                    ))}
                </ul>
            )}

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
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "asc" ? "active" : ""}`}
                            onClick={() => {
                                if (sortConfig.colId === excelFilter.colId && sortConfig.direction === "asc") {
                                    setSortConfig(DEFAULT_SORT); // Revert to default if already active
                                } else {
                                    setSortConfig({ colId: excelFilter.colId, direction: "asc" });
                                }
                            }}
                        >
                            Sort Acsending
                        </button>
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "desc" ? "active" : ""}`}
                            onClick={() => {
                                if (sortConfig.colId === excelFilter.colId && sortConfig.direction === "desc") {
                                    setSortConfig(DEFAULT_SORT); // Revert to default if already active
                                } else {
                                    setSortConfig({ colId: excelFilter.colId, direction: "desc" });
                                }
                            }}
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
        </div>
    );
};

export default AttendanceTable;