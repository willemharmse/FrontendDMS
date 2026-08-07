import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronDown,
    faChevronUp,
    faPlusCircle,
    faTrash,
    faArrowUp,
    faArrowDown,
    faEye,
    faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { FIELD_TYPES, FIELD_TYPE_MAP } from "./WorkOrderActionFieldTypes";
import ActionFieldControl from "./ActionFieldControl";

// ---------------------------------------------------------------------------
// WorkOrderActionFields
//
// This is the field-capture builder for a Work Order template. It is where
// the template creator decides what the technician will actually have to
// fill in when the work order is executed: a title for each field ("CPS
// warning test passed?"), and which of the 12 capture types it links to
// (Text, Number, Dropdown, Yes/No, Pass/Fail, Buttons, Date/Time, Photo
// Capture, Signature, Barcode/QR Scan, GPS/Location Stamp, File Attachment).
//
// Everything the creator adds here is stored on formData.actionFields as:
//   {
//     id: string,
//     title: string,
//     type: one of FIELD_TYPES[].value,
//     required: boolean,
//     options: string[]   // only meaningful for "dropdown" and "buttons"
//   }
//
// This array *is* the field-capture structure of the work order - whatever
// order these rows are in, in that order, with those types, is what the
// live Work Order execution screen should render using ActionFieldControl
// (imported here for the "Preview" column, so what the creator sees while
// building matches exactly what the technician sees while executing).
//
// Props follow the same shape as the other *InfoBox / *Table components in
// this folder so it can be dropped straight into FTSCreatePageTemplate.js:
//   collapsible, formData, setFormData, error, setErrors, readOnly
// ---------------------------------------------------------------------------
const WorkOrderActionFields = ({
    collapsible = false,
    formData,
    setFormData,
    error,
    setErrors,
    readOnly = false,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const toggleCollapse = () => setCollapsed(!collapsed);

    const actionFields = formData.actionFields || [];

    // --- "Add a new field" mini-form state ---
    const [newTitle, setNewTitle] = useState("");
    const [newType, setNewType] = useState("text");
    const [newOptionsText, setNewOptionsText] = useState(
        (FIELD_TYPE_MAP.text.defaultOptions || []).join(", ")
    );
    const [previewOpen, setPreviewOpen] = useState({});
    const [previewValues, setPreviewValues] = useState({});

    const selectedTypeDef = FIELD_TYPE_MAP[newType];

    const handleTypeChange = (value) => {
        setNewType(value);
        const typeDef = FIELD_TYPE_MAP[value];
        setNewOptionsText(typeDef.hasOptions ? (typeDef.defaultOptions || []).join(", ") : "");
    };

    const clearErrorOnFocus = () => {
        if (error) setErrors(prev => ({ ...prev, actionFields: false }));
    };

    const handleAddField = () => {
        const title = newTitle.trim();
        if (!title) {
            toast.error("Give the field a title before adding it.");
            return;
        }

        const typeDef = FIELD_TYPE_MAP[newType];
        let options = [];
        if (typeDef.hasOptions) {
            options = newOptionsText
                .split(",")
                .map(o => o.trim())
                .filter(Boolean);

            if (options.length < 2) {
                toast.error(`Give "${typeDef.label}" at least two options, separated by commas.`);
                return;
            }
        }

        const newField = {
            id: uuidv4(),
            title,
            type: newType,
            required: false,
            options,
        };

        setFormData({ ...formData, actionFields: [...actionFields, newField] });
        clearErrorOnFocus();

        // Reset the mini-form, ready for the next field.
        setNewTitle("");
        setNewType("text");
        setNewOptionsText((FIELD_TYPE_MAP.text.defaultOptions || []).join(", "));
    };

    const handleRemoveField = (id) => {
        setFormData({ ...formData, actionFields: actionFields.filter(f => f.id !== id) });
    };

    const handleToggleRequired = (id) => {
        setFormData({
            ...formData,
            actionFields: actionFields.map(f => f.id === id ? { ...f, required: !f.required } : f),
        });
    };

    const handleMove = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= actionFields.length) return;
        const next = [...actionFields];
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        setFormData({ ...formData, actionFields: next });
    };

    const togglePreview = (id) => {
        setPreviewOpen(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const setPreviewValue = (id, value) => {
        setPreviewValues(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                    Work Order Action Fields <span className="required-field">*</span>
                </h3>

                {collapsible && (
                    <button
                        className="top-right-button-ibra"
                        title={collapsed ? "Expand Section" : "Collapse Section"}
                        onClick={toggleCollapse}
                        style={{ color: "gray" }}
                        type="button"
                    >
                        <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                    </button>
                )}

                {!isCollapsed && (
                    <>
                        {!readOnly && (
                            <div className="waf-add-field-row">
                                <div className="waf-add-field-cell waf-add-field-title">
                                    <label className="waf-mini-label">Field Title</label>
                                    <input
                                        type="text"
                                        className="waf-control waf-input"
                                        placeholder="e.g. CPS warning test passed?"
                                        value={newTitle}
                                        onFocus={clearErrorOnFocus}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                    />
                                </div>

                                <div className="waf-add-field-cell">
                                    <label className="waf-mini-label">Field Type</label>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={newType}
                                            style={{ height: "39px" }}
                                            onChange={(e) => handleTypeChange(e.target.value)}
                                        >
                                            {FIELD_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {selectedTypeDef.hasOptions && (
                                    <div className="waf-add-field-cell waf-add-field-title">
                                        <label className="waf-mini-label">Options (comma-separated)</label>
                                        <input
                                            type="text"
                                            className="waf-control waf-input"
                                            placeholder="Option 1, Option 2, Option 3"
                                            value={newOptionsText}
                                            onChange={(e) => setNewOptionsText(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="waf-add-field-cell waf-add-field-btn-cell">
                                    <button type="button" className="add-row-button-actionfield-plus" title="Add Action Field" onClick={handleAddField}>
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <table className="font-fam table-borders waf-fields-table">
                            <thead className="cp-table-header">
                                <tr>
                                    <th style={{ textAlign: "center", width: "10%" }}>Nr</th>
                                    <th style={{ textAlign: "center", width: "40%" }}>Field Title</th>
                                    <th style={{ textAlign: "center", width: "40%" }}>Field Type</th>
                                    {!readOnly && <th style={{ textAlign: "center", width: "10%" }}>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {actionFields.length === 0 && (
                                    <tr>
                                        <td colSpan={readOnly ? 3 : 4} className="font-fam" style={{ textAlign: "center", padding: "10px", color: "#888" }}>
                                            No action fields have been added yet.
                                        </td>
                                    </tr>
                                )}
                                {actionFields.map((field, index) => {
                                    const typeDef = FIELD_TYPE_MAP[field.type] || {};
                                    const isPreviewOpen = !!previewOpen[field.id];
                                    return (
                                        <React.Fragment key={field.id}>
                                            <tr>
                                                <td style={{ textAlign: "center", fontSize: "14px" }}>{index + 1}</td>
                                                <td style={{ fontSize: "14px" }}>
                                                    {field.title}
                                                </td>
                                                <td style={{ fontSize: "14px", textAlign: "center" }}>
                                                    {typeDef.label}
                                                </td>
                                                {!readOnly && (
                                                    <td className="procCent">
                                                        <div className="term-action-buttons waf-row-actions">
                                                            <button
                                                                type="button"
                                                                className="waf-preview-toggle"
                                                                onClick={() => togglePreview(field.id)}
                                                                title={isPreviewOpen ? "Hide preview" : "Show live preview"}
                                                            >
                                                                <FontAwesomeIcon icon={isPreviewOpen ? faEyeSlash : faEye} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="remove-row-button"
                                                                title="Remove field"
                                                                onClick={() => handleRemoveField(field.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                            {isPreviewOpen && (
                                                <tr className="waf-preview-row">
                                                    <td colSpan={readOnly ? 3 : 4}>
                                                        <div className="waf-preview-panel">
                                                            <ActionFieldControl
                                                                field={field}
                                                                value={previewValues[field.id]}
                                                                onChange={(val) => setPreviewValue(field.id, val)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
};

export default WorkOrderActionFields;