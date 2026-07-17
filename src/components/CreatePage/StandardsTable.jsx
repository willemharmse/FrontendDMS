import React, { useEffect, useState, useRef, useMemo } from "react";
import './StandardsTable.css';
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle, faMagicWandSparkles, faCopy, faArrowsUpDown, faFilter } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import RiskAssessmentDeletePopup from "../RiskRelated/RiskAssessmentDeletePopup";

const StandardsTable = ({ collapsible = false, formData, setFormData, error, title, documentType, setErrors, readOnly = false }) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    // --- EXCEL FILTER & SORT STATE ---
    const excelPopupRef = useRef(null);
    const initialOrderRef = useRef(new Map());
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ colId: "nr", direction: "asc" });
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const BLANK = "(Blanks)";

    const containerRef = useRef(null);
    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowId, setDraggedRowId] = useState(null);
    const [dragOverRowId, setDragOverRowId] = useState(null);
    const draggedElRef = useRef(null);
    const [rowPendingDelete, setRowPendingDelete] = useState(null);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const requestRemoveRow = (pendingDelete) => {
        setRowPendingDelete(pendingDelete);
    };

    const closeRemoveRowPopup = () => {
        setRowPendingDelete(null);
    };

    const confirmRemoveRow = () => {
        if (!rowPendingDelete) return;

        if (rowPendingDelete.kind === "detail") {
            handleDeleteDetail(rowPendingDelete.standardId, rowPendingDelete.detailId);
        } else {
            handleDeleteMain(rowPendingDelete.standardId);
        }
        setRowPendingDelete(null);
    };

    const renumberStandards = (arr) => {
        arr.forEach((item, idx) => {
            const mainNr = idx + 1;
            item.nr = `${mainNr}`;
            item.details.forEach((d, j) => {
                d.nr = `${mainNr}.${j + 1}`;
            });
        });
    };

    const updateRows = (newStandardArray) => {
        setFormData((prev) => ({
            ...prev,
            standard: newStandardArray,
        }));
    };

    // --- FILTER HELPER FUNCTIONS ---
    const getFilterValuesForCell = (row, colId) => {
        let val;
        // Handle nested details
        if (["minRequirement", "reference", "notes"].includes(colId)) {
            const vals = (row.details || [])
                .map(d => d[colId])
                .map(v => (v == null ? "" : String(v).trim()))
                .filter(Boolean);
            return vals.length ? vals : [BLANK];
        } else {
            val = row[colId];
        }

        const s = val == null ? "" : String(val).trim();
        return s === "" ? [BLANK] : [s];
    };

    useEffect(() => {
        if (!formData.standard || formData.standard.length === 0) return;
        const map = initialOrderRef.current;
        if (map.size === 0) {
            formData.standard.forEach((r, idx) => {
                if (!map.has(r.id)) map.set(r.id, idx);
            });
        }
    }, [formData.standard]);

    const filteredRows = useMemo(() => {
        let current = [...formData.standard];

        // 2. Apply Filters
        current = current.filter(row => {
            for (const [colId, selectedValues] of Object.entries(filters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;

                const cellValues = getFilterValuesForCell(row, colId);
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        // 2. Apply Sort
        const colId = sortConfig?.colId || "nr";
        const dir = sortConfig?.direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            const order = initialOrderRef.current;
            current.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        } else {
            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? BLANK : s;
            };

            current.sort((a, b) => {
                // If sorting by nested fields (minRequirement), we check the first detail? 
                // Or join them? Standard excel sort on 1-to-many is usually by first item.
                let av, bv;
                if (["minRequirement", "reference", "notes"].includes(colId)) {
                    av = a.details?.[0]?.[colId];
                    bv = b.details?.[0]?.[colId];
                } else {
                    av = a[colId];
                    bv = b[colId];
                }

                av = normalize(av);
                bv = normalize(bv);

                const aBlank = av === BLANK;
                const bBlank = bv === BLANK;
                if (aBlank && !bBlank) return 1;
                if (!aBlank && bBlank) return -1;

                return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }

        return current;
    }, [formData.standard, filters, sortConfig]);

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return { colId: "nr", direction: "asc" };
            }
            return { colId, direction };
        });
    };

    function openExcelFilterPopup(colId, e) {
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = Array.from(
            new Set(
                (formData.standard || []).flatMap(r => getFilterValuesForCell(r, colId))
            )
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        // Direct array access
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

    const handleDragStart = (e, rowId) => {
        const isFiltered = Object.keys(filters).length > 0;
        const isSorted = sortConfig.colId !== "nr";
        if (isFiltered || isSorted) return;

        setDraggedRowId(rowId);
        draggedElRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragOver = (e, rowId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverRowId(rowId);
    };

    const handleDragLeave = () => {
        setDragOverRowId(null);
    };

    const handleDrop = (e, dropRowId) => {
        e.preventDefault();
        if (!draggedRowId || draggedRowId === dropRowId) {
            return handleDragEnd();
        }

        setFormData(prev => {
            const newArr = [...prev.standard];
            const from = newArr.findIndex(s => s.id === draggedRowId);
            const to = newArr.findIndex(s => s.id === dropRowId);
            const [moved] = newArr.splice(from, 1);
            newArr.splice(to, 0, moved);

            renumberStandards(newArr);
            return { ...prev, standard: newArr };
        });

        return handleDragEnd();
    };

    const handleDragEnd = () => {
        if (draggedElRef.current) {
            draggedElRef.current.style.opacity = '';
            draggedElRef.current = null;
        }
        setDraggedRowId(null);
        setDragOverRowId(null);
        setArmedDragRow(null);
    };

    useEffect(() => {
        const popupSelector = '.excel-filter-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            if (e.target.closest(popupSelector)) return;
            closeDropdowns();
        };

        const closeDropdowns = () => {
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [excelFilter]);

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


    const handleAddMain = (stdId) => {
        const newArr = [...formData.standard];
        const idx = newArr.findIndex((s) => s.id === stdId);
        if (idx === -1) return;

        const newStd = {
            id: uuidv4(),
            nr: "",
            mainSection: "",
            details: [
                { id: uuidv4(), nr: "", minRequirement: "", reference: "", notes: "" }
            ],
        };

        newArr.splice(idx + 1, 0, newStd);

        renumberStandards(newArr);
        updateRows(newArr);
    };

    const handleDeleteMain = (stdId) => {
        if (formData.standard.length <= 1) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warning("Cannot remove all standard rows.", {
                closeButton: false,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
            return;
        }

        const newArr = [...formData.standard];
        const idx = newArr.findIndex((s) => s.id === stdId);
        if (idx === -1) return;
        newArr.splice(idx, 1);
        renumberStandards(newArr);
        updateRows(newArr);
    };

    const handleDuplicateMain = (stdId) => {
        const newArr = [...formData.standard];
        const idx = newArr.findIndex((s) => s.id === stdId);
        if (idx === -1) return;

        const orig = newArr[idx];

        const copy = {
            id: uuidv4(),
            nr: "",
            mainSection: orig.mainSection,
            details: orig.details.map((d) => ({
                id: uuidv4(),
                nr: "",
                minRequirement: d.minRequirement,
                reference: d.reference,
                notes: d.notes,
            })),
        };

        newArr.splice(idx + 1, 0, copy);

        renumberStandards(newArr);
        updateRows(newArr);
    };

    const handleAddDetail = (stdId, detailId = null) => {
        const newArr = [...formData.standard];
        const stdIdx = newArr.findIndex((s) => s.id === stdId);
        if (stdIdx === -1) return;

        const std = { ...newArr[stdIdx] };
        const newDetails = [...std.details];
        const dIdx = detailId
            ? newDetails.findIndex((d) => d.id === detailId)
            : -1;
        const insertAt = dIdx >= 0 ? dIdx + 1 : newDetails.length;

        newDetails.splice(insertAt, 0, {
            id: uuidv4(),
            nr: "",
            minRequirement: "",
            reference: "",
            notes: "",
        });

        newDetails.forEach((d, i) => {
            d.nr = `${std.nr}.${i + 1}`;
        });

        std.details = newDetails;
        newArr[stdIdx] = std;
        updateRows(newArr);
    };

    const handleDeleteDetail = (stdId, detailId) => {
        const newArr = [...formData.standard];
        const stdIdx = newArr.findIndex((s) => s.id === stdId);
        if (stdIdx === -1) return;

        const std = { ...newArr[stdIdx] };
        let newDetails = std.details.filter((d) => d.id !== detailId);

        if (newDetails.length === 0) {
            newDetails = [
                {
                    id: uuidv4(),
                    minRequirement: "",
                    reference: "",
                    notes: "",
                },
            ];
        }

        newDetails.forEach((d, i) => {
            d.nr = `${std.nr}.${i + 1}`;
        });

        std.details = newDetails;
        newArr[stdIdx] = std;
        updateRows(newArr);
    };

    const handleMainSectionChange = (stdId, value) => {
        const newArr = formData.standard.map(item =>
            item.id === stdId
                ? { ...item, mainSection: value }
                : item
        );

        setErrors(prev => ({
            ...prev,
            standard: false
        }));

        updateRows(newArr);
    };

    const handleDetailChange = (stdId, detailId, field, value) => {
        const newArr = formData.standard.map(item => {
            if (item.id !== stdId) return item;
            const newDetails = item.details.map(d =>
                d.id === detailId
                    ? { ...d, [field]: value }
                    : d
            );
            return { ...item, details: newDetails };
        });
        setErrors(prev => ({
            ...prev,
            standard: false
        }));

        updateRows(newArr);
    };

    const isDragEnabled = Object.keys(filters).length === 0 && sortConfig.colId === "nr";

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
        return "top-right-button-ibra2";
    };

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        // Start with all files
        let filtered = formData.standard;

        // 2. Apply filters from ALL OTHER active columns
        for (const [filterColId, selectedValues] of Object.entries(filters)) {
            if (filterColId === colId) continue; // Don't filter a column by itself
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                // Keep row if ANY of its cell values match the selection
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        // 3. Extract unique values for the requested column from the filtered subset
        return Array.from(
            new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    };

    return (
        <div className="input-row">
            <div className={`proc-box ${error ? "error-proc" : ""}`}>
                <h3 className="font-fam-labels">Standard Requirements <span className="required-field">*</span></h3>

                <button
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
                >
                    <FontAwesomeIcon
                        icon={faFilter}
                        className="icon-um-search"
                        style={{ color: hasActiveFilters ? "#002060" : "inherit" }}
                    />
                </button>

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
                    <>
                        <div
                            className="standards-class-table-container"
                            ref={containerRef}
                        >
                            <table className="vcr-table table-borders">
                                <thead className="cp-table-header">
                                    <tr>
                                        {[
                                            { id: "nr", label: "Nr", className: "procCent standNr" },
                                            { id: "mainSection", label: "Main Section", className: "procCent standMain" },
                                            { id: "minRequirement", label: "Minimum Requirement Description / Details", className: "procCent standSub" },
                                            { id: "reference", label: "Reference / Source", subLabel: "(Where Applicable)", className: "procCent standPrev" },
                                            { id: "notes", label: "Additional Notes", className: "procCent standAR" }
                                        ].map(col => (
                                            <th
                                                key={col.id}
                                                className={col.className}
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => openExcelFilterPopup(col.id, e)}
                                            >
                                                {col.label}
                                                {col.subLabel && <br />}
                                                {col.subLabel && col.subLabel}
                                                {((filters[col.id] || sortConfig.colId === col.id) && col.id !== "nr") && (
                                                    <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "10px" }} />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((row, index) => {
                                        const spanCount = Math.max(row.details.length, 1);
                                        const isDropTarget = draggedRowId && dragOverRowId === row.id && draggedRowId !== row.id;

                                        return (
                                            <React.Fragment key={index}>
                                                <tr key={index}
                                                    className={`${row.nr % 2 === 0 ? 'evenTRColour' : ''} ${isDropTarget ? 'drop-target-top' : ''}`}
                                                    draggable={isDragEnabled && armedDragRow === row.id}
                                                    onDragStart={isDragEnabled && armedDragRow === row.id ? e => handleDragStart(e, row.id) : undefined}
                                                    onDragOver={isDragEnabled ? e => handleDragOver(e, row.id) : undefined}
                                                    onDragLeave={isDragEnabled ? handleDragLeave : undefined}
                                                    onDrop={isDragEnabled ? e => handleDrop(e, row.id) : undefined}
                                                    onDragEnd={isDragEnabled ? handleDragEnd : undefined}
                                                >
                                                    <td className="procCent" style={{ fontSize: "14px" }} rowSpan={spanCount}>
                                                        {row.nr}
                                                        {!readOnly && isDragEnabled && (<FontAwesomeIcon
                                                            icon={faArrowsUpDown}
                                                            className="drag-handle-standards"
                                                            onMouseDown={() => setArmedDragRow(row.id)}
                                                            onMouseUp={() => setArmedDragRow(null)}
                                                        />)}
                                                    </td>
                                                    <td rowSpan={spanCount} className="main-cell-standards" style={{}}>
                                                        <textarea
                                                            name="mainSection"
                                                            className="aim-textarea-st font-fam"
                                                            value={row.mainSection}
                                                            style={{ fontSize: "14px", fontWeight: "bold" }}
                                                            placeholder="Main Section"
                                                            onChange={(e) => handleMainSectionChange(row.id, e.target.value)}
                                                            readOnly={readOnly}
                                                        />
                                                        {!readOnly && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="insert-mainrow-button-standards"
                                                                    title="Add Main Step Here"
                                                                    onClick={() => handleAddMain(row.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="delete-mainrow-button-standards"
                                                                    title="Delete Main Step"
                                                                    onClick={() => requestRemoveRow({ kind: "standard", standardId: row.id })}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} className="delete-mainrow-icon" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="duplicate-mainrow-button-standards"
                                                                    title="Duplicate Main Step"
                                                                    onClick={() => handleDuplicateMain(row.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faCopy} />
                                                                </button></>
                                                        )}
                                                    </td>

                                                    {row.details.length > 0 ? (
                                                        <>
                                                            <td className="sub-cell-standards">
                                                                <label className="detail-label">{row.details[0].nr}</label>
                                                                <textarea
                                                                    name="minRequirement"
                                                                    className="aim-textarea-st font-fam"
                                                                    value={row.details[0].minRequirement}
                                                                    placeholder="Detail description…"
                                                                    style={{ fontSize: "14px" }}
                                                                    onChange={(e) => handleDetailChange(row.id, row.details[0].id, "minRequirement", e.target.value)}
                                                                    readOnly={readOnly}
                                                                />

                                                                {!readOnly && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            className="add-subrow-button-standards"
                                                                            title="Add Main Step Here"
                                                                            onClick={() => handleAddDetail(row.id, row.details[0].id)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faPlus} />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            className="delete-subrow-button-standards"
                                                                            title="Delete Main Step"
                                                                            onClick={() => requestRemoveRow({ kind: "detail", standardId: row.id, detailId: row.details[0].id })}
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrash} className="delete-mainrow-icon" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <textarea
                                                                    name="reference"
                                                                    className="aim-textarea-st font-fam"
                                                                    value={row.details[0].reference}
                                                                    placeholder="Reference / Source…"
                                                                    style={{ fontSize: "14px" }}
                                                                    onChange={(e) => handleDetailChange(row.id, row.details[0].id, "reference", e.target.value)}
                                                                    readOnly={readOnly}
                                                                />
                                                            </td>
                                                            <td>
                                                                <textarea
                                                                    name="notes"
                                                                    className="aim-textarea-st font-fam"
                                                                    value={row.details[0].notes}
                                                                    placeholder="Additional notes…"
                                                                    style={{ fontSize: "14px" }}
                                                                    onChange={(e) => handleDetailChange(row.id, row.details[0].id, "notes", e.target.value)}
                                                                    readOnly={readOnly}
                                                                />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <td colSpan={3} />
                                                    )}
                                                </tr>

                                                {row.details.slice(1).map((detail, j) => (
                                                    <tr key={j} className={`${row.nr % 2 === 0 ? 'evenTRColour' : ''}`}>
                                                        <td className="sub-cell-standards">
                                                            <label className="detail-label">{row.details[j + 1].nr}</label>
                                                            <textarea
                                                                name="minRequirement"
                                                                className="aim-textarea-st font-fam"
                                                                value={detail.minRequirement}
                                                                placeholder="Detail description…"
                                                                style={{ fontSize: "14px" }}
                                                                onChange={(e) => handleDetailChange(row.id, detail.id, "minRequirement", e.target.value)}
                                                                readOnly={readOnly}
                                                            />

                                                            {!readOnly && (<>
                                                                <button
                                                                    type="button"
                                                                    className="add-subrow-button-standards"
                                                                    title="Add Main Step Here"
                                                                    onClick={() => handleAddDetail(row.id, detail.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="delete-subrow-button-standards"
                                                                    title="Delete Main Step"
                                                                    onClick={() => requestRemoveRow({ kind: "detail", standardId: row.id, detailId: detail.id })}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} className="delete-mainrow-icon" />
                                                                </button>
                                                            </>)}
                                                        </td>
                                                        <td>
                                                            <textarea
                                                                name="reference"
                                                                className="aim-textarea-st font-fam"
                                                                value={detail.reference}
                                                                placeholder="Reference / Source…"
                                                                style={{ fontSize: "14px" }}
                                                                onChange={(e) => handleDetailChange(row.id, detail.id, "reference", e.target.value)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <textarea
                                                                name="notes"
                                                                className="aim-textarea-st font-fam"
                                                                value={detail.notes}
                                                                placeholder="Additional notes…"
                                                                style={{ fontSize: "14px" }}
                                                                onChange={(e) => handleDetailChange(row.id, detail.id, "notes", e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
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
                                    onWheel={handleInnerScrollWheel}
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

                                        // Use the new helper to get context-aware options
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

                                            // If searching, only apply changes to the visible items
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
                    </>
                )}
            </div>
            {rowPendingDelete && (
                <RiskAssessmentDeletePopup
                    closeModal={closeRemoveRowPopup}
                    type={rowPendingDelete.kind === "detail" ? "Standard Detail" : "Standard"}
                    removeRow={confirmRemoveRow}
                />
            )}
        </div>
    );
};

export default StandardsTable;
