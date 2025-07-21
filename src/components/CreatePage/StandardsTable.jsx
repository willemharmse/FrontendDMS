import React, { useEffect, useState, useRef } from "react";
import './StandardsTable.css';
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle, faMagicWandSparkles, faCopy, faArrowsUpDown } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';

const StandardsTable = ({ formData, setFormData, error, title, documentType }) => {
    const [filters, setFilters] = useState({
        mainSection: '',
        minRequirement: '',
        reference: '',
        notes: '',
    });

    // popup state
    const [filterPopup, setFilterPopup] = useState({
        column: null,
        left: 0,
        top: 0,
        width: 0,
    });
    const containerRef = useRef(null);

    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowId, setDraggedRowId] = useState(null);
    const [dragOverRowId, setDragOverRowId] = useState(null);
    const draggedElRef = useRef(null);

    const handleDragStart = (e, rowId) => {
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

            // re-number groups exactly as in add/delete
            const groups = {};
            newArr.forEach(item => {
                const g = Math.floor(item.nr);
                (groups[g] = groups[g] || []).push(item);
            });
            Object.entries(groups).forEach(([g, items]) => {
                let c = 1;
                items.forEach(it => {
                    it.nr = `${g}.${c++}`;
                });
            });

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
        const popupSelector = '.standards-class-filter-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector);

            if (
                e.target.closest(popupSelector)
            ) {
                return;
            }

            if (!isInsidePopup) {
                closeDropdowns();
            }
        };

        const closeDropdowns = () => {
            setFilterPopup({ column: null, left: 0, top: 0, width: 0 });
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [filterPopup]);

    const updateRows = (newStandardArray) => {
        setFormData((prev) => ({
            ...prev,
            standard: newStandardArray,
        }));
    };

    const handleHeaderClick = (col, e) => {
        e.stopPropagation();
        // if clicking same header, close
        if (filterPopup.column === col) {
            setFilterPopup({ column: null, left: 0, top: 0, width: 0 });
            return;
        }
        // measure header & container
        const hdr = e.currentTarget.getBoundingClientRect();
        const container = containerRef.current.getBoundingClientRect();
        // compute popup position relative to container
        const left = hdr.left - container.left;
        const top = hdr.bottom - container.top;
        const width = e.currentTarget.offsetWidth;
        setFilterPopup({
            column: col,
            left,
            top,
            width,
        });
    };

    // apply the filter text for a column
    const applyFilter = (col, value) => {
        setFilters(f => ({ ...f, [col]: value }));
    };

    // clear a column filter
    const clearFilter = (col) => {
        setFilters(f => ({ ...f, [col]: '' }));
    };

    // filter logic per row
    const passesFilters = (row) => {
        // Nr
        if (filters.nr && !String(row.nr).includes(filters.nr)) return false;
        // Main Section
        if (filters.mainSection && !row.mainSection.toLowerCase().includes(filters.mainSection.toLowerCase())) return false;
        // Details (minRequirement)
        if (filters.minRequirement) {
            const ok = row.details.some(d =>
                d.minRequirement.toLowerCase().includes(filters.minRequirement.toLowerCase())
            );
            if (!ok) return false;
        }
        // Reference
        if (filters.reference) {
            const ok = row.details.some(d =>
                d.reference.toLowerCase().includes(filters.reference.toLowerCase())
            );
            if (!ok) return false;
        }
        // Notes
        if (filters.notes) {
            const ok = row.details.some(d =>
                d.notes.toLowerCase().includes(filters.notes.toLowerCase())
            );
            if (!ok) return false;
        }
        return true;
    };

    const handleAddMain = (stdId) => {
        // 1. Clone the array
        const newArr = [...formData.standard];

        // 2. Find the clicked-row’s index by its id
        const idx = newArr.findIndex((s) => s.id === stdId);

        if (idx === -1) return;

        // 3. Figure out which “group” you’re in (e.g. all 4.x rows)
        const groupNum = Math.floor(newArr[idx].nr);

        // 4. Create the new blank standard (nr is placeholder for now)
        const newStd = {
            id: uuidv4(),
            nr: groupNum,       // we’ll overwrite in step 6
            mainSection: "",
            details: [
                { id: uuidv4(), nr: "", minRequirement: "", reference: "", notes: "" }
            ],
        };

        // 5. **Insert** it immediately after the clicked row
        newArr.splice(idx + 1, 0, newStd);

        // 6. **Re-number** all of the group’s items in order
        let counter = 1;
        newArr.forEach(item => {
            if (Math.floor(item.nr) === groupNum) {
                // mains: "4.1", "4.2", ..., "4.10", etc.
                item.nr = `${groupNum}.${counter++}`;

                // now renumber its details: "4.1.1", "4.1.2", ...
                item.details.forEach((d, i) => {
                    d.nr = `${item.nr}.${i + 1}`;
                });
            }
        });

        // 7. Push the update back into state
        updateRows(newArr);
    };

    const handleDeleteMain = (stdId) => {
        // Don’t allow deleting the last main step
        if (formData.standard.length <= 1) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warning("Cannot remove all standard rows.", {
                closeButton: false,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });   // optional feedback
            return;
        }

        const newArr = [...formData.standard];
        const idx = newArr.findIndex((s) => s.id === stdId);
        if (idx === -1) return;

        const groupNum = Math.floor(newArr[idx].nr);
        newArr.splice(idx, 1);

        // re-number
        let counter = 1;
        newArr.forEach((item) => {
            if (Math.floor(item.nr) === groupNum) {
                item.nr = `${groupNum}.${counter}`;
                counter++;
            }
        });

        updateRows(newArr);
    };

    // DUPLICATE a main row by stdId (deep-clone details), insert below, then re-number
    const handleDuplicateMain = (stdId) => {
        // 1. Clone the array
        const newArr = [...formData.standard];

        // 2. Find the original’s index
        const idx = newArr.findIndex((s) => s.id === stdId);
        if (idx === -1) return;

        // 3. Grab the original and its group
        const orig = newArr[idx];
        const groupNum = Math.floor(orig.nr);

        // 4. Build a deep-clone (new ids for main & each detail)
        const copy = {
            id: uuidv4(),
            nr: groupNum, // placeholder, will renumber next
            mainSection: orig.mainSection,
            details: orig.details.map((d) => ({
                id: uuidv4(),
                minRequirement: d.minRequirement,
                reference: d.reference,
                notes: d.notes,
            })),
        };

        // 5. Insert the copy right after the original
        newArr.splice(idx + 1, 0, copy);

        // 6. Re-number the entire group in order
        let counter = 1;
        newArr.forEach((item) => {
            if (Math.floor(item.nr) === groupNum) {
                item.nr = `${groupNum}.${counter}`;
                counter++;
            }
        });

        // 7. Commit
        updateRows(newArr);
    };

    const handleAddDetail = (stdId, detailId = null) => {
        const newArr = [...formData.standard];
        const stdIdx = newArr.findIndex((s) => s.id === stdId);
        if (stdIdx === -1) return;

        const std = { ...newArr[stdIdx] };
        const newDetails = [...std.details];
        // find insertion point
        const dIdx = detailId
            ? newDetails.findIndex((d) => d.id === detailId)
            : -1;
        const insertAt = dIdx >= 0 ? dIdx + 1 : newDetails.length;

        // splice in one new blank detail
        newDetails.splice(insertAt, 0, {
            id: uuidv4(),
            nr: "",
            minRequirement: "",
            reference: "",
            notes: "",
        });

        newDetails.forEach((d, i) => {
            // std.nr is now a string like "4.1"
            d.nr = `${std.nr}.${i + 1}`;
        });

        std.details = newDetails;
        newArr[stdIdx] = std;
        updateRows(newArr);
    };

    /**
     * Remove the detail with detailId from standard stdId.
     * If that would leave 0 details, we reset to exactly one blank detail.
     */
    const handleDeleteDetail = (stdId, detailId) => {
        const newArr = [...formData.standard];
        const stdIdx = newArr.findIndex((s) => s.id === stdId);
        if (stdIdx === -1) return;

        const std = { ...newArr[stdIdx] };
        // filter out the one to delete
        let newDetails = std.details.filter((d) => d.id !== detailId);

        // ensure at least one
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
            // std.nr is now a string like "4.1"
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
        updateRows(newArr);
    };

    // 2️⃣ change any detail-field of detail `detailId` inside standard `stdId`
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
        updateRows(newArr);
    };

    const visibleRows = formData.standard.filter(passesFilters);

    return (
        <div className="input-row">
            <div className={`proc-box ${error ? "error-proc" : ""}`}>
                <h3 className="font-fam-labels">Standard <span className="required-field">*</span></h3>

                <div
                    className="standards-class-table-container"
                    ref={containerRef}
                >
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="procCent standNr">Nr</th>
                                <th className="procCent standMain"
                                    onClick={(e) => handleHeaderClick('mainSection', e)}>Main Section</th>
                                <th className="procCent standSub"
                                    onClick={(e) => handleHeaderClick('minRequirement', e)}>Minimum Requirement Description / Details</th>
                                <th className="procCent standPrev"
                                    onClick={(e) => handleHeaderClick('reference', e)}>Reference / Source<br />(Where Applicable)</th>
                                <th className="procCent standAR"
                                    onClick={(e) => handleHeaderClick('notes', e)}>Additional Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRows.map((row, index) => {
                                const spanCount = Math.max(row.details.length, 1);

                                return (
                                    <React.Fragment key={index}>
                                        <tr key={index}
                                            draggable={armedDragRow === row.id}
                                            onDragStart={armedDragRow === row.id ? e => handleDragStart(e, row.id) : undefined}
                                            onDragOver={e => handleDragOver(e, row.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={e => handleDrop(e, row.id)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <td className="procCent" style={{ fontSize: "14px", backgroundColor: "lightgray" }} rowSpan={spanCount}>
                                                {row.nr}
                                                <FontAwesomeIcon
                                                    icon={faArrowsUpDown}
                                                    className="drag-handle-standards"
                                                    onMouseDown={() => setArmedDragRow(row.id)}
                                                    onMouseUp={() => setArmedDragRow(null)}
                                                />
                                            </td>
                                            <td rowSpan={spanCount} className="main-cell-standards" style={{ backgroundColor: "lightgray" }}>
                                                <textarea
                                                    name="mainSection"
                                                    className="aim-textarea-st font-fam"
                                                    value={row.mainSection}
                                                    style={{ fontSize: "14px", fontWeight: "bold" }}
                                                    placeholder="Main Section" // Optional placeholder text
                                                    onChange={(e) => handleMainSectionChange(row.id, e.target.value)}
                                                />
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
                                                    onClick={() => handleDeleteMain(row.id)}
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
                                                </button>
                                            </td>

                                            {row.details.length > 0 ? (
                                                // First detail cell (detail[0])
                                                <>
                                                    <td className="main-cell-standards">
                                                        <textarea
                                                            name="minRequirement"
                                                            className="aim-textarea-st font-fam"
                                                            value={row.details[0].minRequirement}
                                                            placeholder="Detail description…"
                                                            style={{ fontSize: "14px" }}
                                                            onChange={(e) => handleDetailChange(row.id, row.details[0].id, "minRequirement", e.target.value)}
                                                        />

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
                                                            onClick={() => handleDeleteDetail(row.id, row.details[0].id)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="delete-mainrow-icon" />
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <textarea
                                                            name="reference"
                                                            className="aim-textarea-st font-fam"
                                                            value={row.details[0].reference}
                                                            placeholder="Reference / Source…"
                                                            style={{ fontSize: "14px" }}
                                                            onChange={(e) => handleDetailChange(row.id, row.details[0].id, "reference", e.target.value)}
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
                                                        />
                                                    </td>
                                                </>
                                            ) : (
                                                // No details? just span the empty space
                                                <td colSpan={3} />
                                            )}
                                        </tr>

                                        {/* — all the remaining detail rows (if any) */}
                                        {row.details.slice(1).map((detail, j) => (
                                            <tr key={j}>
                                                <td className="main-cell-standards">
                                                    <textarea
                                                        name="minRequirement"
                                                        className="aim-textarea-st font-fam"
                                                        value={detail.minRequirement}
                                                        placeholder="Detail description…"
                                                        style={{ fontSize: "14px" }}
                                                        onChange={(e) => handleDetailChange(row.id, detail.id, "minRequirement", e.target.value)}
                                                    />

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
                                                        onClick={() => handleDeleteDetail(row.id, detail.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="delete-mainrow-icon" />
                                                    </button>
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

                    {filterPopup.column && (
                        <div
                            className="standards-class-filter-popup"
                            style={{
                                top: `${filterPopup.top}px`,
                                left: `${filterPopup.left}px`,
                                width: `${filterPopup.width}px`,
                            }}
                        >
                            <input
                                type="text"
                                className="standards-class-filter-input"
                                placeholder={`Filter Value`}
                                value={filters[filterPopup.column]}
                                onChange={e =>
                                    applyFilter(filterPopup.column, e.target.value)
                                }
                            />
                            <div className="standards-filter-buttons">
                                <button
                                    className="standards-class-filter-btn"
                                    onClick={() =>
                                        setFilterPopup({ column: null, left: 0, top: 0, width: 0 })
                                    }
                                >
                                    Apply
                                </button>
                                <button
                                    className="standards-class-filter-btn"
                                    onClick={() => {
                                        clearFilter(filterPopup.column);
                                        setFilterPopup({ column: null, left: 0, top: 0, width: 0 });
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )
                    }
                </div>
            </div>
        </div>
    );
};

export default StandardsTable;
