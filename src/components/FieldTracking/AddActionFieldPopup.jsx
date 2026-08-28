import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlusCircle, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FIELD_TYPES, FIELD_TYPE_MAP } from "./WorkOrderActionFieldTypes";

// Strips the extension off a file name for display, e.g. "manual.pdf" -> "manual"
export const removeFileExtension = (fileName) => (fileName || "").replace(/\.[^/.]+$/, "");

// ---------------------------------------------------------------------------
// DropdownSelect
//
// A select-like control for the related-document rows below: it looks and
// sits like a text input but can't be typed into - clicking it opens a
// floating option list and the value can only be set by picking an item
// from that list.
//
// The list is rendered through a portal (straight onto document.body) and
// flips to open upward instead of downward if there isn't enough room below
// the trigger, so it's never clipped or pushed offscreen.
// ---------------------------------------------------------------------------
export const DropdownSelect = ({ value, onChange, options, placeholder = "Select an option", searchPlaceholder = "Search...", style }) => {
    const [open, setOpen] = useState(false);
    // What's currently typed into the search box. Cleared whenever the
    // dropdown closes so the next time it's opened it starts showing the
    // full option list again.
    const [search, setSearch] = useState("");
    // Kept off-screen and hidden until the layout effect below measures the
    // trigger and computes a real position - this way, if it's ever briefly
    // unpositioned, it can't flash into the page's normal flow.
    const [menuStyle, setMenuStyle] = useState({ position: "fixed", top: -9999, left: -9999, visibility: "hidden" });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Only the options whose label matches what's typed in the search box.
    // Matching is case-insensitive and just needs the search text to appear
    // anywhere in the label, so "inv" matches "Invoice Template".
    const filteredOptions = search.trim()
        ? options.filter((opt) => opt.label.toLowerCase().includes(search.trim().toLowerCase()))
        : options;

    // Autofocus the search box as soon as the dropdown opens, so the user
    // can start typing immediately instead of having to click into it.
    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        if (!open) {
            setSearch("");
        }
    }, [open]);

    // Close on outside click or Escape.
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            const clickedTrigger = triggerRef.current && triggerRef.current.contains(e.target);
            const clickedMenu = menuRef.current && menuRef.current.contains(e.target);
            if (!clickedTrigger && !clickedMenu) setOpen(false);
        };
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    // Position the menu so it's always fully visible - below the trigger if
    // there's room, otherwise above it. Only listens on the actual scrollable
    // ancestor of the trigger (plus window resize) instead of capturing every
    // scroll event on the document, so it doesn't collide with any other
    // scroll handling elsewhere on the page.
    useLayoutEffect(() => {
        if (!open) return;

        const updatePosition = () => {
            const trigger = triggerRef.current;
            const menu = menuRef.current;
            if (!trigger || !menu) return;

            const rect = trigger.getBoundingClientRect();
            const margin = 6;
            const spaceBelow = window.innerHeight - rect.bottom - margin;
            const spaceAbove = rect.top - margin;
            const desiredHeight = Math.min(240, menu.scrollHeight);
            const openUpward = desiredHeight > spaceBelow && spaceAbove > spaceBelow;

            setMenuStyle({
                position: "fixed",
                left: rect.left,
                width: rect.width,
                top: openUpward ? undefined : rect.bottom + margin,
                bottom: openUpward ? window.innerHeight - rect.top + margin : undefined,
                maxHeight: Math.min(240, Math.max(80, openUpward ? spaceAbove : spaceBelow)),
                visibility: "visible",
            });
        };

        // Find the nearest scrollable ancestor (e.g. the popup's own
        // scrollable body) so repositioning tracks whatever container can
        // actually move the trigger, without adding a document-level
        // listener that other code on the page may not expect.
        const getScrollParent = (node) => {
            let parent = node ? node.parentElement : null;
            while (parent) {
                const { overflow, overflowY } = window.getComputedStyle(parent);
                if (/(auto|scroll)/.test(overflow + overflowY)) return parent;
                parent = parent.parentElement;
            }
            return null;
        };

        updatePosition();
        const scrollParent = getScrollParent(triggerRef.current);
        scrollParent && scrollParent.addEventListener("scroll", updatePosition);
        window.addEventListener("scroll", updatePosition);
        window.addEventListener("resize", updatePosition);
        return () => {
            scrollParent && scrollParent.removeEventListener("scroll", updatePosition);
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [open, filteredOptions.length]);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setOpen(false);
        setSearch("");
    };


    return (
        <>
            <div className="jra-info-popup-page-select-container-nt" style={{ flex: 1, minWidth: 0 }}>
                <div
                    ref={triggerRef}
                    className="table-control font-fam remove-default-styling"
                    role="button"
                    tabIndex={0}
                    title={selectedOption ? selectedOption.label : placeholder}
                    onClick={() => setOpen((prev) => !prev)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpen((prev) => !prev);
                        }
                    }}
                    style={{
                        minHeight: "40px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        cursor: "pointer",
                        userSelect: "none",
                        boxSizing: "border-box",
                        minWidth: 0,
                        maxWidth: "100%",
                        textAlign: "left",
                        ...style,
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            color: selectedOption ? "inherit" : "#888",
                        }}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: "12px", marginLeft: "8px", flexShrink: 0, opacity: 0.6 }} />
                </div>
            </div>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="dropdown-select-menu"
                        style={{
                            ...menuStyle,
                            zIndex: 10000,
                            display: "flex",
                            flexDirection: "column",
                            padding: 0,
                            background: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ padding: "6px", borderBottom: "1px solid #eee", flexShrink: 0 }}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    // Don't let Enter submit the form this dropdown
                                    // lives inside - it should just keep filtering.
                                    if (e.key === "Enter") e.preventDefault();
                                }}
                                placeholder={searchPlaceholder}
                                className="term-popup-text-area"
                                style={{ minHeight: "18px", borderWidth: "1px", width: "100%", boxSizing: "border-box" }}
                            />
                        </div>
                        <ul
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: "auto",
                                listStyle: "none",
                                margin: 0,
                                padding: "4px 0",
                            }}
                        >
                            {options.length === 0 ? (
                                <li style={{ padding: "8px 12px", color: "#888", fontSize: "14px" }}>No options available</li>
                            ) : filteredOptions.length === 0 ? (
                                <li style={{ padding: "8px 12px", color: "#888", fontSize: "14px" }}>No matches for "{search}"</li>
                            ) : (
                                filteredOptions.map((opt) => (
                                    <li
                                        key={opt.value === "" ? "__empty__" : opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        title={opt.label}
                                        style={{
                                            padding: "8px 12px",
                                            fontSize: "14px",
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            background: opt.value === value ? "#f0f0f0" : "transparent",
                                            color: opt.value === "" ? "#888" : "inherit",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = opt.value === value ? "#f0f0f0" : "transparent")}
                                    >
                                        {opt.label}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>,
                    document.body
                )}
        </>
    );
};

// ---------------------------------------------------------------------------
// AddActionFieldPopup
//
// The "add a new field" mini-form used to live inline at the top of
// WorkOrderActionFields. It's been pulled out into this popup (styled the
// same way as WorkOrderSuggestion's popup) and is opened via the "+" button
// at the bottom of the fields table instead.
//
// Calls onAdd({ title, type, options, expectedValue, expectedMin, expectedMax,
// relatedDocuments }) once the creator submits a valid field;
// WorkOrderActionFields is responsible for turning that into an actual row
// (assigning an id, appending it to formData.actionFields, etc).
//
// expectedValue is only present for types with a fixed or custom option
// list (Dropdown, Yes/No, Pass/Fail, Buttons) - it's the option the
// technician is expected to pick. expectedMin/expectedMax are only present
// for Number fields. relatedDocuments is only present for types with either
// an expected value or expected range (Number, Dropdown, Yes/No, Pass/Fail,
// Buttons) - it's an array of { id, name } pulled from the same file list
// ReferenceTable uses (id = file's _id, name = file title without extension).
// ---------------------------------------------------------------------------
const AddActionFieldPopup = ({ isOpen, onClose, onAdd }) => {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("text");
    const [optionsText, setOptionsText] = useState(
        (FIELD_TYPE_MAP.text.defaultOptions || []).join(", ")
    );
    // The value the technician is expected to select/enter for this field to
    // "pass" - only meaningful for types with a fixed or custom option list
    // (Dropdown, Yes/No, Pass/Fail, Buttons).
    const [expectedValue, setExpectedValue] = useState("");
    // Expected min/max - only meaningful for Number fields.
    const [expectedMin, setExpectedMin] = useState("");
    const [expectedMax, setExpectedMax] = useState("");

    // Related documents - only meaningful for types that have a defined
    // "expected" outcome (Number, Dropdown, Yes/No, Pass/Fail, Buttons).
    // Each entry is { id, name } where id is the file's _id and name is
    // its display title (without extension).
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    const [availableFiles, setAvailableFiles] = useState([]);

    const typeDef = FIELD_TYPE_MAP[type];
    const showRelatedDocuments = !!(typeDef.hasExpectedValue || typeDef.hasExpectedRange);

    // Load the same file list ReferenceTable uses, so the same documents can
    // be linked to an action field's expected outcome.
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/file/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch files");
                }
                const data = await response.json();
                setAvailableFiles(data.files || []);
                localStorage.setItem("cachedRefOptions", JSON.stringify(data.files || []));
            } catch (err) {
                console.log(err);
                const cached = localStorage.getItem("cachedRefOptions");
                if (cached) {
                    setAvailableFiles(JSON.parse(cached));
                }
            }
        };
        fetchFiles();
    }, []);

    const handleInsertRelatedDocAt = (insertIndex) => {
        setRelatedDocuments((prev) => {
            const next = [...prev];
            next.splice(insertIndex, 0, { id: "", name: "" });
            return next;
        });
    };

    const handleRemoveRelatedDocAt = (index) => {
        setRelatedDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSelectRelatedDoc = (index, fileID) => {
        const selectedFile = availableFiles.find((f) => f._id === fileID);
        setRelatedDocuments((prev) =>
            prev.map((d, i) =>
                i === index
                    ? { id: fileID, name: selectedFile ? removeFileExtension(selectedFile.fileName) : "" }
                    : d
            )
        );
    };

    // The option list currently available to be picked as the "expected"
    // value: fixed for Yes/No and Pass/Fail, or whatever the creator has
    // typed into the options box for Dropdown / Buttons.
    const expectedValueOptions = typeDef.hasOptions
        ? optionsText.split(",").map((o) => o.trim()).filter(Boolean)
        : (typeDef.fixedOptions || []);

    const handleTypeChange = (value) => {
        setType(value);
        const nextTypeDef = FIELD_TYPE_MAP[value];
        setOptionsText(nextTypeDef.hasOptions ? (nextTypeDef.defaultOptions || []).join(", ") : "");
        setExpectedValue("");
        setExpectedMin("");
        setExpectedMax("");
        setRelatedDocuments([]);
    };

    const handleOptionsTextChange = (value) => {
        setOptionsText(value);
        // If the currently selected expected value fell out of the option
        // list because the creator edited it, clear the stale selection.
        const nextOptions = value.split(",").map((o) => o.trim()).filter(Boolean);
        if (expectedValue && !nextOptions.includes(expectedValue)) {
            setExpectedValue("");
        }
    };

    const resetForm = () => {
        setTitle("");
        setType("text");
        setOptionsText((FIELD_TYPE_MAP.text.defaultOptions || []).join(", "));
        setExpectedValue("");
        setExpectedMin("");
        setExpectedMax("");
        setRelatedDocuments([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            toast.error("Give the field a title before adding it.");
            return;
        }

        let options = [];
        if (typeDef.hasOptions) {
            options = optionsText
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean);

            if (options.length < 2) {
                toast.error(`Give "${typeDef.label}" at least two options, separated by commas.`);
                return;
            }
        }

        let newField = { title: trimmedTitle, type, options };

        if (typeDef.hasExpectedValue) {
            const validExpectedOptions = typeDef.fixedOptions || options;
            if (!expectedValue || !validExpectedOptions.includes(expectedValue)) {
                toast.error(`Choose the expected value for "${typeDef.label}".`);
                return;
            }
            newField.expectedValue = expectedValue;
        }

        if (typeDef.hasExpectedRange) {
            const trimmedMin = String(expectedMin).trim();
            const trimmedMax = String(expectedMax).trim();
            const min = trimmedMin === "" ? null : Number(trimmedMin);
            const max = trimmedMax === "" ? null : Number(trimmedMax);

            if (trimmedMin !== "" && Number.isNaN(min)) {
                toast.error("Expected min value must be a number.");
                return;
            }
            if (trimmedMax !== "" && Number.isNaN(max)) {
                toast.error("Expected max value must be a number.");
                return;
            }
            if (min !== null && max !== null && min > max) {
                toast.error("Expected min value can't be greater than the expected max value.");
                return;
            }

            newField.expectedMin = min;
            newField.expectedMax = max;
        }

        if (showRelatedDocuments) {
            newField.relatedDocuments = relatedDocuments.filter((d) => d.id);
        }

        onAdd(newField);
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="term-popup-overlay">
            <div className="term-popup-content">
                <div className="term-popup-header">
                    <h2 className="term-popup-title">Add Action Field</h2>
                    <button className="term-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="term-popup-scrollable" style={{ marginBottom: "5px" }}>
                        <div className="term-popup-group">
                            <label className="term-popup-label">Field Title</label>
                            <textarea
                                spellcheck="true"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="term-popup-text-area"
                                style={{ resize: "none", minHeight: "18px", borderWidth: "1px" }}
                                required
                                placeholder="e.g. CPS warning test passed?"
                            />
                        </div>

                        <div className="term-popup-group">
                            <label className="term-popup-label">Field Type</label>
                            <div className="jra-info-popup-page-select-container" style={{ width: "calc(100% - 28px)", marginRight: "auto", marginLeft: "auto" }}>
                                <select
                                    className="table-control font-fam remove-default-styling"
                                    value={type}
                                    style={{ height: "40px", fontSize: "14px" }}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                >
                                    {FIELD_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {typeDef.hasOptions && (
                            <div className="term-popup-group">
                                <label className="term-popup-label">Options (comma-separated)</label>
                                <textarea
                                    spellcheck="true"
                                    rows="3"
                                    value={optionsText}
                                    onChange={(e) => handleOptionsTextChange(e.target.value)}
                                    className="term-popup-text-area"
                                    style={{ resize: "vertical", borderWidth: "1px" }}
                                    required
                                    placeholder="Option 1, Option 2, Option 3"
                                />
                            </div>
                        )}

                        {typeDef.hasExpectedValue && (
                            <div className="term-popup-group">
                                <label className="term-popup-label">Expected Value</label>
                                <div className="jra-info-popup-page-select-container" style={{ width: "calc(100% - 28px)", marginRight: "auto", marginLeft: "auto" }}>
                                    <select
                                        className="table-control font-fam remove-default-styling"
                                        value={expectedValue}
                                        style={{ height: "40px", fontSize: "14px" }}
                                        onChange={(e) => setExpectedValue(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select expected value</option>
                                        {expectedValueOptions.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {typeDef.hasExpectedRange && (
                            <div className="term-popup-group">
                                <label className="term-popup-label">Expected Value Range</label>
                                <div style={{ display: "flex", gap: "10px", width: "calc(100% - 28px)", marginRight: "auto", marginLeft: "auto" }}>
                                    <input
                                        type="number"
                                        value={expectedMin}
                                        onChange={(e) => setExpectedMin(e.target.value)}
                                        className="term-popup-text-area"
                                        style={{ minHeight: "18px", borderWidth: "1px", width: "50%" }}
                                        placeholder="Min"
                                    />
                                    <input
                                        type="number"
                                        value={expectedMax}
                                        onChange={(e) => setExpectedMax(e.target.value)}
                                        className="term-popup-text-area"
                                        style={{ minHeight: "18px", borderWidth: "1px", width: "50%" }}
                                        placeholder="Max"
                                    />
                                </div>
                            </div>
                        )}

                        {showRelatedDocuments && (
                            <div className="term-popup-group">
                                <label className="term-popup-label">Related Documents</label>
                                {relatedDocuments.length === 0 && (
                                    <button
                                        type="button"
                                        className="add-row-button-ref"
                                        style={{ width: "60%" }}
                                        onClick={() => handleInsertRelatedDocAt(0)}
                                    >
                                        Add Document
                                    </button>
                                )}
                                {relatedDocuments.map((doc, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            width: "calc(100% - 28px)",
                                            marginRight: "auto",
                                            marginLeft: "auto",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        <DropdownSelect
                                            value={doc.id}
                                            onChange={(fileID) => handleSelectRelatedDoc(index, fileID)}
                                            placeholder="Select a document"
                                            style={{ width: "100%" }}
                                            options={[
                                                { value: "", label: "Select a document" },
                                                ...availableFiles
                                                    .filter(
                                                        (file) =>
                                                            file._id === doc.id ||
                                                            !relatedDocuments.some(
                                                                (d, i) => i !== index && d.id === file._id
                                                            )
                                                    )
                                                    .map((file) => ({
                                                        value: file._id,
                                                        label: removeFileExtension(file.fileName),
                                                    }))
                                                    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" })),
                                            ]}
                                        />
                                        <button
                                            type="button"
                                            className="ibra-add-row-button"
                                            title="Insert document here"
                                            onClick={() => handleInsertRelatedDocAt(index + 1)}
                                            style={{ alignSelf: "center", flexShrink: 0 }}
                                        >
                                            <FontAwesomeIcon icon={faPlusCircle} />
                                        </button>
                                        <button
                                            type="button"
                                            className="remove-row-button"
                                            title="Remove document"
                                            onClick={() => handleRemoveRelatedDocAt(index)}
                                            style={{ alignSelf: "center", flexShrink: 0 }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="term-popup-buttons">
                        <button type="submit" className="term-popup-button">
                            Add
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddActionFieldPopup;