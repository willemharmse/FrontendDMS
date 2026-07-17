import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import './ProcedureTable.css';
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle, faMagicWandSparkles, faArrowsUpDown, faCopy, faUndo, faFilter } from '@fortawesome/free-solid-svg-icons';
import FlowchartRenderer from "./FlowchartRenderer";
import { aiRewrite } from "../../utils/jraAI";
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import RiskAssessmentDeletePopup from "../RiskRelated/RiskAssessmentDeletePopup";

const ProcedureTable = forwardRef(({ collapsible = false, procedureRows, addRow, removeRow, updateRow, error, title, documentType, updateProcRows, readOnly = false, setErrors, setFormData, formData }, ref) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const [designationOptions, setDesignationOptions] = useState([]);
    const [showARDropdown, setShowARDropdown] = useState({ index: null, field: "" });
    const [dropdownOptions, setDropdownOptions] = useState([]);
    const [activeRewriteIndex, setActiveRewriteIndex] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const inputRefs = useRef([]);
    const [mainHistory, setMainHistory] = useState({});
    const [subHistory, setSubHistory] = useState({});
    const [loadingMainKey, setLoadingMainKey] = useState(null);
    const [loadingSubKey, setLoadingSubKey] = useState(null);
    const mainInputRefs = useRef({});
    const subInputRefs = useRef({});
    const [rowPendingDelete, setRowPendingDelete] = useState(null);

    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowNr, setDraggedRowNr] = useState(null);
    const [dragOverRowNr, setDragOverRowNr] = useState(null);
    const draggedElRef = useRef(null);
    const flowchartRef = useRef(null);

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

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const requestRemoveRow = (index) => {
        setRowPendingDelete({ index });
    };

    const closeRemoveRowPopup = () => {
        setRowPendingDelete(null);
    };

    const confirmRemoveRow = () => {
        if (!rowPendingDelete) return;

        removeProRow(rowPendingDelete.index);
        setRowPendingDelete(null);
    };

    useImperativeHandle(ref, () => ({
        getFlowchartImages: async () => {
            if (flowchartRef.current) {
                return await flowchartRef.current.getImages();
            }
            return [];
        }
    }));

    // --- FILTER HELPER FUNCTIONS ---
    const getFilterValuesForCell = (row, colId) => {
        let val;
        if (colId === "prevStep") {
            // Handle semicolon separated list
            const raw = row.prevStep || "";
            const parts = raw.split(';').map(s => s.trim()).filter(s => s !== "");
            return parts.length > 0 ? parts : [BLANK];
        } else {
            val = row[colId];
        }

        const s = val == null ? "" : String(val).trim();
        return s === "" ? [BLANK] : [s];
    };

    // Capture initial order for stable sort reset
    useEffect(() => {
        if (!procedureRows || procedureRows.length === 0) return;
        const map = initialOrderRef.current;
        // procedureRows usually have 'nr' which might change, so we rely on index during initial load if no ID
        // Assuming pure index based initial load:
        if (map.size === 0 && procedureRows.length > 0) {
            procedureRows.forEach((r, idx) => {
                // If rows don't have unique IDs, we map by initial index or use nr if unique
                // Using a combination key or just index if strictly sequential on load
                const key = r.nr; // fallback to nr
                if (!map.has(key)) map.set(key, idx);
            });
        }
    }, [procedureRows]);

    const filteredRows = useMemo(() => {
        // 1. Map rows to include their ORIGINAL index so editing works correctly
        let current = procedureRows.map((row, index) => ({ ...row, originalIndex: index }));

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

        // 3. Apply Sort
        const colId = sortConfig?.colId || "nr";
        const dir = sortConfig?.direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            // Reset to roughly original order (using nr as proxy for order)
            current.sort((a, b) => {
                const aNr = parseFloat(a.nr) || 0;
                const bNr = parseFloat(b.nr) || 0;
                return (aNr - bNr) * dir;
            });
        } else {
            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? BLANK : s;
            };

            current.sort((a, b) => {
                const av = normalize(a[colId]);
                const bv = normalize(b[colId]);

                const aBlank = av === BLANK;
                const bBlank = bv === BLANK;
                if (aBlank && !bBlank) return 1;
                if (!aBlank && bBlank) return -1;

                // Simple string compare for standard text fields
                return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }

        return current;
    }, [procedureRows, filters, sortConfig]);

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return { colId: "nr", direction: "asc" }; // reset
            }
            return { colId, direction };
        });
    };

    function openExcelFilterPopup(colId, e) {
        // Prevent sorting/filtering on Action column
        if (colId === "Action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = Array.from(
            new Set(
                (procedureRows || []).flatMap(r => getFilterValuesForCell(r, colId))
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

    // --- END FILTER LOGIC ---

    const handleAiRewriteMain = async (idx) => {
        const control = procedureRows[idx].mainStep;
        const key = `${idx}`;
        setMainHistory(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), control]
        }));
        setLoadingMainKey(key);

        try {
            const newText = await aiRewrite(control, "chatProcedure/main");
            setFormData(prev => ({
                ...prev,
                procedureRows: prev.procedureRows.map((row, i) =>
                    i === idx ? { ...row, mainStep: newText } : row
                )
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMainKey(null);
        }
    };

    const handleAiRewriteSub = async (idx) => {
        const control = procedureRows[idx].SubStep;
        const key = `${idx}`;
        setSubHistory(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), control]
        }));
        setLoadingSubKey(key);

        try {
            const newText = await aiRewrite(control, "chatProcedure/sub");
            setFormData(prev => ({
                ...prev,
                procedureRows: prev.procedureRows.map((row, i) =>
                    i === idx ? { ...row, SubStep: newText } : row
                )
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSubKey(null);
        }
    };

    const handleUndoMain = (idx) => {
        const key = `${idx}`;
        const history = mainHistory[key] || [];
        if (history.length === 0) return;

        const previousMainStep = history[history.length - 1];

        setFormData(prev => ({
            ...prev,
            procedureRows: prev.procedureRows.map((row, i) =>
                i === idx ? { ...row, mainStep: previousMainStep } : row
            )
        }));

        setMainHistory(prev => {
            const next = [...history.slice(0, -1)];
            const out = { ...prev };
            if (next.length) out[key] = next;
            else delete out[key];
            return out;
        });
    };

    const handleUndoSub = (idx) => {
        const key = `${idx}`;
        const history = subHistory[key] || [];
        if (history.length === 0) return;

        const previousSubStep = history[history.length - 1];

        setFormData(prev => ({
            ...prev,
            procedureRows: prev.procedureRows.map((row, i) =>
                i === idx ? { ...row, SubStep: previousSubStep } : row
            )
        }));

        setSubHistory(prev => {
            const next = [...history.slice(0, -1)];
            const out = { ...prev };
            if (next.length) out[key] = next;
            else delete out[key];
            return out;
        });
    };

    useEffect(() => {
        const fetchDesignations = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/des`);
                const data = await response.json();

                if (response.ok && data.designations) {
                    const names = data.designations.map(d => d.designation).sort();
                    setDesignationOptions(names);
                } else {
                    console.error("Failed to load designations");
                }
            } catch (error) {
                console.error("Error fetching designations:", error);
            }
        };

        fetchDesignations();
    }, []);

    const accountableOptions = designationOptions;
    const responsibleOptions = designationOptions;

    const [invalidRows, setInvalidRows] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log(procedureRows);
    }, [procedureRows]);

    const handleDuplicateRow = (index) => {
        const newArr = [...formData.procedureRows];
        const idx = newArr.findIndex((s) => s.nr === index);
        if (idx === -1) return;

        const orig = newArr[idx];

        const copy = {
            nr: idx + 1,
            mainStep: orig.mainStep,
            SubStep: orig.SubStep,
            accountable: orig.accountable,
            responsible: orig.responsible,
            prevStep: orig.prevStep
        };

        newArr.splice(idx + 1, 0, copy);

        renumberProcedure(newArr);
        setFormData((prev) => ({
            ...prev,
            procedureRows: newArr,
        }));
    };

    const renumberProcedure = (arr) => {
        arr.forEach((item, idx) => {
            const mainNr = idx + 1;
            item.nr = `${mainNr}`;
        });
    };

    const handleDragStart = (e, rowNr) => {
        // Disable drag if filtered/sorted
        const isFiltered = Object.keys(filters).length > 0;
        const isSorted = sortConfig.colId !== "nr";
        if (isFiltered || isSorted) return;

        setDraggedRowNr(rowNr);
        draggedElRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const addDesignationIfNew = (raw) => {
        const v = (raw || "").trim();
        if (!v) return;

        setDesignationOptions(prev => {
            const exists = prev.some(opt => opt.toLowerCase() === v.toLowerCase());
            if (exists) return prev;
            const next = [...prev, v].sort((a, b) => a.localeCompare(b));
            return next;
        });
    };

    const handleDragOver = (e, rowNr) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverRowNr(rowNr);
    };

    const handleDragLeave = () => {
        setDragOverRowNr(null);
    };

    const handleDrop = (e, dropRowNr) => {
        e.preventDefault();
        if (!draggedRowNr || draggedRowNr === dropRowNr) {
            return handleDragEnd();
        }

        setFormData(prev => {
            const newArr = [...prev.procedureRows];
            const from = newArr.findIndex(s => s.nr === draggedRowNr);
            const to = newArr.findIndex(s => s.nr === dropRowNr);
            const [moved] = newArr.splice(from, 1);
            newArr.splice(to, 0, moved);

            renumberProcedure(newArr);
            return { ...prev, procedureRows: newArr };
        });

        return handleDragEnd();
    };

    const handleDragEnd = () => {
        if (draggedElRef.current) {
            draggedElRef.current.style.opacity = '';
            draggedElRef.current = null;
        }
        setDraggedRowNr(null);
        setDragOverRowNr(null);
        setArmedDragRow(null);
    };

    const parsePrevList = (prevStep) => {
        if (!prevStep || prevStep.trim() === "" || prevStep.trim() === "-") return ["-"];
        return prevStep
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0);
    };

    const stringifyPrevList = (arr) => {
        if (!arr || arr.length === 0) return "-";
        const cleaned = arr.filter(s => s && s !== "-");
        return cleaned.length ? cleaned.join(";") : "-";
    };

    const remapPrevForInsert = (prevStep, newNr) => {
        const preds = parsePrevList(prevStep);
        if (preds.length === 1 && preds[0] === "-") return "-";

        const predecessor = newNr - 1;

        const mapped = preds.map(token => {
            const n = Number(token);
            if (!Number.isFinite(n)) return token;
            if (n >= newNr) return String(n + 1);
            if (n === predecessor) return String(newNr);
            return String(n);
        });

        return stringifyPrevList(mapped);
    };

    const insertRowAt = (insertIndex) => {
        const newNr = insertIndex + 1;

        const newRow = {
            nr: newNr,
            mainStep: "",
            SubStep: "",
            discipline: "Engineering",
            accountable: "",
            responsible: "",
            prevStep: newNr > 1 ? String(newNr - 1) : "-"
        };

        const withInsert = [
            ...procedureRows.slice(0, insertIndex),
            newRow,
            ...procedureRows.slice(insertIndex),
        ];

        const updatedPrevApplied = withInsert.map((row, idx) => {
            if (idx === insertIndex) return row;

            return {
                ...row,
                prevStep: remapPrevForInsert(row.prevStep, newNr),
            };
        });

        const renumbered = updatedPrevApplied.map((row, idx) => ({
            ...row,
            nr: idx + 1,
        }));

        updateProcRows(renumbered);
    };

    const uniqKeepOrder = (arr) => {
        const seen = new Set();
        const out = [];
        for (const x of arr) {
            if (!seen.has(x)) {
                seen.add(x);
                out.push(x);
            }
        }
        return out;
    };

    const remapPrevForRemoval = (prevStep, removedNr, removedPrevList) => {
        const preds = parsePrevList(prevStep);
        if (preds.length === 1 && preds[0] === "-") return "-";

        const replacement = (removedPrevList || [])
            .map(String)
            .filter(t => t !== "-");

        const remapped = [];
        for (const token of preds) {
            const n = Number(token);
            if (Number.isFinite(n)) {
                if (n === removedNr) {
                    remapped.push(...replacement);
                } else if (n > removedNr) {
                    remapped.push(String(n - 1));
                } else {
                    remapped.push(String(n));
                }
            } else {
                remapped.push(token);
            }
        }

        const deduped = uniqKeepOrder(remapped).filter(Boolean);
        return stringifyPrevList(deduped);
    };

    const removeProRow = (indexToRemove) => {
        const rows = formData.procedureRows;
        if (rows.length <= 1) {
            toast.warn("At least one procedure step is required.", {
                autoClose: 1200,
                closeButton: true,
                style: { textAlign: "center" },
            });
            return;
        }

        const removedRow = rows[indexToRemove];
        const removedNr = removedRow.nr ?? (indexToRemove + 1);
        const removedPrevList = parsePrevList(removedRow.prevStep);

        const withoutRow = rows.filter((_, idx) => idx !== indexToRemove);

        const prevFixed = withoutRow.map(r => ({
            ...r,
            prevStep: remapPrevForRemoval(r.prevStep, removedNr, removedPrevList),
        }));

        const renumbered = prevFixed.map((r, idx) => ({ ...r, nr: idx + 1 }));

        setFormData({
            ...formData,
            procedureRows: renumbered,
        });
    };

    const add = () => {
        setInvalidRows([]);
        addRow();
    };

    // Note: index here refers to the original array index
    const handleInputChange = (index, field, value) => {
        const updatedRow = { ...procedureRows[index], [field]: value };

        if (field === "responsible" && value === updatedRow.accountable) {
            updatedRow.accountable = "";
        } else if (field === "accountable" && value === updatedRow.responsible) {
            updatedRow.responsible = "";
        }

        updateRow(index, field, value);
        setErrors(prev => ({
            ...prev,
            procedureRows: false
        }));
    };

    useEffect(() => {
        const popupSelector = '.floating-dropdown';
        const excelSelector = '.excel-filter-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(excelSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(excelSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowARDropdown({ index: null, field: "" });
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
    }, [showARDropdown, excelFilter]);

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

    // Check if drag should be enabled
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
        return "top-right-button-ibra4";
    };

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        // Start with all files
        let filtered = procedureRows;

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
                <h3 className="font-fam-labels">Procedure <span className="required-field">*</span></h3>
                {true && (<FlowchartRenderer ref={flowchartRef} procedureRows={procedureRows} title={title} documentType={documentType} />)}


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
                        {procedureRows.length > 0 && (
                            <table className="vcr-table table-borders">
                                <thead className="cp-table-header">
                                    <tr>
                                        {/* Helper function to render headers with filter/sort icons */}
                                        {[
                                            { id: "nr", label: "Nr", className: "procCent procNr" },
                                            { id: "mainStep", label: "Procedure Main Steps", className: "procCent procMain" },
                                            { id: "SubStep", label: "Procedure Sub Steps", className: "procCent procSub" },
                                            { id: "prevStep", label: "Predecessor", subLabel: "(Immediate Prior Steps)", className: "procCent procPrev" },
                                            { id: "responsible", label: "Responsible and Accountable", className: "procCent procAR" }, // responsible/accountable share a cell visually but handle filtering separately if needed. Currently responsible is the primary filter key for this cell if clicked? Or we need two? The original table has ONE header for R&A. Let's make it clickable for "Responsible" or maybe just disable filtering here since it's a composite? I will map it to 'responsible' for now.
                                            { id: "Action", label: "Action", className: "procCent procAct", noFilter: true }
                                        ].map((col) => (
                                            !readOnly && col.id === "Action" ? (
                                                <th key={col.id} className={col.className} style={{ backgroundColor: "#002060", color: "white" }}>{col.label}</th>
                                            ) : (col.id !== "Action") && (
                                                <th
                                                    key={col.id}
                                                    className={col.className}
                                                    style={{ backgroundColor: "#002060", color: "white", cursor: col.noFilter ? "default" : "pointer" }}
                                                    onClick={(e) => !col.noFilter && openExcelFilterPopup(col.id, e)}
                                                >
                                                    {col.label}
                                                    {col.subLabel && <div className="procFineText" style={{ color: "white" }}>{col.subLabel}</div>}
                                                    {(!col.noFilter && (filters[col.id] || sortConfig.colId === col.id) && col.id !== "nr") && (
                                                        <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "10px" }} />
                                                    )}
                                                </th>
                                            )
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((row) => {
                                        // Use originalIndex for data manipulation
                                        const index = row.originalIndex;
                                        return (
                                            <React.Fragment key={index}>
                                                <tr key={index}
                                                    draggable={isDragEnabled && armedDragRow === row.nr}
                                                    onDragStart={isDragEnabled && armedDragRow === row.nr ? e => handleDragStart(e, row.nr) : undefined}
                                                    onDragOver={isDragEnabled ? e => handleDragOver(e, row.nr) : undefined}
                                                    onDragLeave={isDragEnabled ? handleDragLeave : undefined}
                                                    onDrop={isDragEnabled ? e => handleDrop(e, row.nr) : undefined}
                                                    onDragEnd={isDragEnabled ? handleDragEnd : undefined}
                                                    className={`${row.nr % 2 === 0 ? 'evenTRColour' : ''} ${dragOverRowNr === row.nr ? 'drag-over-top' : ''}`}
                                                >
                                                    <td className="procCent" style={{ fontSize: "14px" }}>
                                                        {row.nr}
                                                        {!readOnly && isDragEnabled && (<FontAwesomeIcon
                                                            icon={faArrowsUpDown}
                                                            className="drag-handle-standards"
                                                            onMouseDown={() => setArmedDragRow(row.nr)}
                                                            onMouseUp={() => setArmedDragRow(null)}
                                                        />)}
                                                    </td>
                                                    <td>
                                                        <div className="textarea-wrapper-proc">
                                                            <textarea
                                                                name="mainStep"
                                                                className={`${mainHistory[`${index}`]?.length > 0 ? `aim-textarea-pt-2` : `aim-textarea-pt`} font-fam`}
                                                                value={row.mainStep}
                                                                ref={el => {
                                                                    const key = `${index}`;
                                                                    if (el) {
                                                                        mainInputRefs.current[key] = el;
                                                                    } else {
                                                                        delete mainInputRefs.current[key];
                                                                    }
                                                                }}
                                                                readOnly={readOnly}
                                                                style={{ fontSize: "14px" }}
                                                                onChange={(e) => handleInputChange(index, "mainStep", e.target.value)}
                                                                placeholder="Insert the main step of the procedure here..."
                                                            />
                                                            {loadingMainKey === `${index}` && (<FontAwesomeIcon icon={faSpinner} spin className="textarea-icon-proc-spin-main spin-animation-proc" />)}
                                                            {mainHistory[`${index}`]?.length > 0 && (<FontAwesomeIcon icon={faUndo} title={"Undo AI Rewrite"} className="textarea-icon-proc-2" onClick={() => handleUndoMain(index)} />)}
                                                            {(loadingMainKey !== `${index}` && !readOnly) && (<FontAwesomeIcon icon={faMagicWandSparkles} title={"AI Rewrite Main Step"} className="textarea-icon-proc" onClick={() => handleAiRewriteMain(index)} />)}

                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="textarea-wrapper-proc">
                                                            <textarea
                                                                name="SubStep"
                                                                className={`${subHistory[`${index}`]?.length > 0 ? `aim-textarea-pt-2` : `aim-textarea-pt`} font-fam`}
                                                                value={row.SubStep}
                                                                ref={el => {
                                                                    const key = `${index}`;
                                                                    if (el) {
                                                                        subInputRefs.current[key] = el;
                                                                    } else {
                                                                        delete subInputRefs.current[key];
                                                                    }
                                                                }}
                                                                readOnly={readOnly}
                                                                onChange={(e) => handleInputChange(index, "SubStep", e.target.value)}
                                                                style={{ fontSize: "14px" }}
                                                                placeholder="Insert the sub steps of the procedure here..."
                                                            />
                                                            {loadingSubKey === `${index}` && (<FontAwesomeIcon icon={faSpinner} spin className="textarea-icon-proc-spin spin-animation-proc" />)}
                                                            {subHistory[`${index}`]?.length > 0 && (<FontAwesomeIcon icon={faUndo} title={"Undo AI Rewrite"} className="textarea-icon-proc-2" onClick={() => handleUndoSub(index)} />)}
                                                            {(loadingSubKey !== `${index}` && !readOnly) && (<FontAwesomeIcon icon={faMagicWandSparkles} title={"AI Rewrite Sub Step"} className="textarea-icon-proc" onClick={() => handleAiRewriteSub(index)} />)}

                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="prev-step-container-ref">
                                                            {(row.prevStep && row.prevStep.trim() !== "" ? row.prevStep.split(";") : [""]).map((step, stepIndex, arr) => (
                                                                <div key={stepIndex} className="prev-step-input-ref">
                                                                    <input
                                                                        type="text"
                                                                        style={{ fontSize: "14px", width: readOnly ? "100%" : "" }}
                                                                        className="aim-input-pt font-fam"
                                                                        value={step}
                                                                        onChange={(e) => {
                                                                            let updatedSteps = row.prevStep ? row.prevStep.split(";") : [];

                                                                            if (stepIndex < updatedSteps.length) {
                                                                                updatedSteps[stepIndex] = e.target.value;
                                                                            } else {
                                                                                updatedSteps.push(e.target.value);
                                                                            }

                                                                            updateRow(index, "prevStep", updatedSteps.join(";"));
                                                                        }}
                                                                        placeholder="Insert step"
                                                                        readOnly={readOnly}
                                                                    />
                                                                    {!readOnly && (<button
                                                                        className="remove-step-button-ref"
                                                                        onClick={() => {
                                                                            const updatedSteps = row.prevStep ? row.prevStep.split(";") : [];
                                                                            if (updatedSteps.length > 1) {
                                                                                updateRow(index, "prevStep", updatedSteps.filter((_, i) => i !== stepIndex).join(";"));
                                                                            } else {
                                                                                toast.warn("At least one predecessor is required.", { autoClose: 1000, closeButton: true });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} title="Remove Predecessor" />
                                                                    </button>)}
                                                                    {(stepIndex === arr.length - 1 && !readOnly) && (
                                                                        <button
                                                                            className="add-row-button-pred"
                                                                            style={{ fontSize: "15px" }}
                                                                            onClick={() => {
                                                                                const updatedSteps = row.prevStep ? row.prevStep.split(";") : [""];
                                                                                updatedSteps.push("");
                                                                                updateRow(index, "prevStep", updatedSteps.join(";"));
                                                                            }}
                                                                        >
                                                                            <FontAwesomeIcon icon={faPlusCircle} title="Add Step" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="select-container-proc">
                                                            <div className="select-wrapper">
                                                                <label className={`select-label-proc ${invalidRows.includes(index) && !row.responsible ? "label-error-pt" : ""}`}>R:</label>
                                                                <textarea
                                                                    type="text"
                                                                    className="table-control-proc-text-area-ar"
                                                                    value={row.responsible}
                                                                    style={{ fontSize: "14px" }}
                                                                    placeholder="Select Responsible"
                                                                    ref={(el) => (inputRefs.current[`responsible-${index}`] = el)}
                                                                    onChange={(e) => {
                                                                        handleInputChange(index, "responsible", e.target.value);
                                                                        const filtered = designationOptions.filter(opt =>
                                                                            opt.toLowerCase().includes(e.target.value.toLowerCase()) &&
                                                                            opt !== row.accountable
                                                                        );
                                                                        setDropdownOptions(filtered);
                                                                    }}
                                                                    onFocus={() => {
                                                                        if (readOnly) return;
                                                                        const rect = inputRefs.current[`responsible-${index}`].getBoundingClientRect();
                                                                        setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                                                                        setDropdownOptions(designationOptions.filter(opt => opt !== row.accountable));
                                                                        setShowARDropdown({ index, field: "responsible" });
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        addDesignationIfNew(e.target.value);
                                                                    }}
                                                                    readOnly={readOnly}
                                                                />
                                                            </div>

                                                            <div className="select-wrapper">
                                                                <label className={`select-label-proc ${invalidRows.includes(index) && !row.accountable ? "label-error-pt" : ""}`}>A:</label>
                                                                <textarea
                                                                    type="text"
                                                                    className="table-control-proc-text-area-ar"
                                                                    value={row.accountable}
                                                                    style={{ fontSize: "14px" }}
                                                                    placeholder="Select Accountable"
                                                                    ref={(el) => (inputRefs.current[`accountable-${index}`] = el)}
                                                                    onChange={(e) => {
                                                                        handleInputChange(index, "accountable", e.target.value);
                                                                        const filtered = designationOptions.filter(opt =>
                                                                            opt.toLowerCase().includes(e.target.value.toLowerCase()) &&
                                                                            opt !== row.responsible
                                                                        );
                                                                        setDropdownOptions(filtered);
                                                                    }}
                                                                    onFocus={() => {
                                                                        if (readOnly) return;
                                                                        const rect = inputRefs.current[`accountable-${index}`].getBoundingClientRect();
                                                                        setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                                                                        setDropdownOptions(designationOptions.filter(opt => opt !== row.responsible));
                                                                        setShowARDropdown({ index, field: "accountable" });
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        addDesignationIfNew(e.target.value);
                                                                    }}
                                                                    readOnly={readOnly}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {!readOnly && (<td className="procCent">
                                                        <button
                                                            className="remove-row-button"
                                                            onClick={() => requestRemoveRow(index)}
                                                            title="Delete step"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                                        </button>
                                                        {index < procedureRows.length - 1 && (
                                                            <button
                                                                className="insert-row-button-sig"
                                                                onClick={() => insertRowAt(index + 1)}
                                                                style={{ fontSize: "15px" }}
                                                                title="Insert step"
                                                            >
                                                                <FontAwesomeIcon icon={faPlusCircle} />
                                                            </button>
                                                        )}
                                                        {true && (<button
                                                            className="remove-row-button"
                                                            onClick={() => handleDuplicateRow(row.nr)}
                                                            title="Duplicate step"
                                                        >
                                                            <FontAwesomeIcon icon={faCopy} title="Duplicate Row" />
                                                        </button>)}

                                                    </td>)}
                                                </tr>
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}

                        {!readOnly && (<button className="add-row-button-ds font-fam" onClick={add}>
                            <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                        </button>)}

                    </>
                )}
            </div>

            {showARDropdown.index !== null && dropdownOptions.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        zIndex: 10,
                    }}
                >
                    {dropdownOptions.map((opt, i) => (
                        <li
                            key={i}
                            onMouseDown={() => {
                                handleInputChange(showARDropdown.index, showARDropdown.field, opt);
                                setShowARDropdown({ index: null, field: "" });
                            }}
                        >
                            {opt}
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
            {rowPendingDelete && (
                <RiskAssessmentDeletePopup
                    closeModal={closeRemoveRowPopup}
                    type="Procedure"
                    removeRow={confirmRemoveRow}
                />
            )}
        </div>
    );
});

export default ProcedureTable;