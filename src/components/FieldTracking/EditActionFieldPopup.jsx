import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FIELD_TYPES, FIELD_TYPE_MAP } from "./WorkOrderActionFieldTypes";
import { DropdownSelect, removeFileExtension } from "./AddActionFieldPopup";

// ---------------------------------------------------------------------------
// EditActionFieldPopup
//
// Same form as AddActionFieldPopup, but pre-populated from an existing
// action field and used to modify that field in place rather than create a
// new one. Shares DropdownSelect and removeFileExtension with
// AddActionFieldPopup instead of duplicating them.
//
// `field` is the action field being edited (the same shape
// WorkOrderActionFields stores on formData.actionFields - see the comment
// block at the top of that file). The popup should only be rendered/opened
// once `field` is set; while `isOpen` is true it re-syncs its local state
// from `field` any time a different field is passed in, so re-opening it on
// a new row doesn't leak the previous row's edits.
//
// Calls onSave({ id, title, type, options, expectedValue, expectedMin,
// expectedMax, relatedDocuments }) once the edit is confirmed as valid -
// WorkOrderActionFields is responsible for merging that back into
// formData.actionFields by id.
// ---------------------------------------------------------------------------
const EditActionFieldPopup = ({ isOpen, onClose, onSave, field }) => {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("text");
    const [optionsText, setOptionsText] = useState("");
    const [expectedValue, setExpectedValue] = useState("");
    const [expectedMin, setExpectedMin] = useState("");
    const [expectedMax, setExpectedMax] = useState("");
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    const [availableFiles, setAvailableFiles] = useState([]);

    const typeDef = FIELD_TYPE_MAP[type] || FIELD_TYPE_MAP.text;
    const showRelatedDocuments = !!(typeDef.hasExpectedValue || typeDef.hasExpectedRange);

    // Populate the form from the field being edited every time the popup is
    // opened (or the target field changes while it's open), so switching
    // which row is being edited doesn't carry over stale state from the
    // previous one.
    useEffect(() => {
        if (!isOpen || !field) return;
        const fieldTypeDef = FIELD_TYPE_MAP[field.type] || FIELD_TYPE_MAP.text;
        setTitle(field.title || "");
        setType(field.type || "text");
        setOptionsText(
            fieldTypeDef.hasOptions
                ? (field.options && field.options.length ? field.options : fieldTypeDef.defaultOptions || []).join(", ")
                : ""
        );
        setExpectedValue(field.expectedValue || "");
        setExpectedMin(field.expectedMin === null || field.expectedMin === undefined ? "" : String(field.expectedMin));
        setExpectedMax(field.expectedMax === null || field.expectedMax === undefined ? "" : String(field.expectedMax));
        setRelatedDocuments(field.relatedDocuments ? field.relatedDocuments.map((d) => ({ ...d })) : []);
    }, [isOpen, field]);

    // Load the same file list ReferenceTable / AddActionFieldPopup use, so
    // the same documents can be linked to an action field's expected
    // outcome while editing it.
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
        const nextOptions = value.split(",").map((o) => o.trim()).filter(Boolean);
        if (expectedValue && !nextOptions.includes(expectedValue)) {
            setExpectedValue("");
        }
    };

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            toast.error("Give the field a title before saving it.");
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

        let updatedField = { ...field, title: trimmedTitle, type, options };

        if (typeDef.hasExpectedValue) {
            const validExpectedOptions = typeDef.fixedOptions || options;
            if (!expectedValue || !validExpectedOptions.includes(expectedValue)) {
                toast.error(`Choose the expected value for "${typeDef.label}".`);
                return;
            }
            updatedField.expectedValue = expectedValue;
        } else {
            updatedField.expectedValue = null;
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

            updatedField.expectedMin = min;
            updatedField.expectedMax = max;
        } else {
            updatedField.expectedMin = null;
            updatedField.expectedMax = null;
        }

        if (showRelatedDocuments) {
            updatedField.relatedDocuments = relatedDocuments.filter((d) => d.id);
        } else {
            updatedField.relatedDocuments = [];
        }

        onSave(updatedField);
        onClose();
    };

    if (!isOpen || !field) return null;

    return (
        <div className="term-popup-overlay">
            <div className="term-popup-content">
                <div className="term-popup-header">
                    <h2 className="term-popup-title">Edit Action Field</h2>
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
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditActionFieldPopup;
