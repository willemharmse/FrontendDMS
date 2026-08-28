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
    faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FIELD_TYPE_MAP } from "./WorkOrderActionFieldTypes";
import AddActionFieldPopup from "./AddActionFieldPopup";
import EditActionFieldPopup from "./EditActionFieldPopup";

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
//     options: string[],   // only meaningful for "dropdown" and "buttons"
//     hazardClass: "Class A" | "Class B" | "Class C" | undefined,
//     expectedValue: string | null,  // the option the technician is
//                                     // expected to pick - only meaningful
//                                     // for "dropdown", "yesno", "passfail",
//                                     // and "buttons"
//     expectedMin: number | null,    // only meaningful for "number"
//     expectedMax: number | null,    // only meaningful for "number"
//     relatedDocuments: { id, name }[],  // reference documents linked to
//                                         // this field's expected outcome -
//                                         // only meaningful for "number",
//                                         // "dropdown", "yesno", "passfail",
//                                         // and "buttons". id is the file's
//                                         // docID, name is its display title.
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

    // --- "Add a new field" popup ---
    const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
    // Where the next field from the popup should be inserted:
    // null = append at the end (bottom "+" button), a number = insert at
    // that index (row-level "+" button), pushing everything from that row
    // down by one.
    const [insertIndex, setInsertIndex] = useState(null);

    // --- "Edit an existing field" popup ---
    const [isEditFieldOpen, setIsEditFieldOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);

    const clearErrorOnFocus = () => {
        if (error) setErrors(prev => ({ ...prev, actionFields: false }));
    };

    const openAddFieldPopup = (index = null) => {
        if (readOnly) return;
        clearErrorOnFocus();
        setInsertIndex(index);
        setIsAddFieldOpen(true);
    };

    const handleAddField = ({ title, type, options, expectedValue, expectedMin, expectedMax, relatedDocuments }) => {
        const newField = {
            id: uuidv4(),
            title,
            type,
            required: false,
            options,
            expectedValue: expectedValue ?? null,
            expectedMin: expectedMin ?? null,
            expectedMax: expectedMax ?? null,
            relatedDocuments: relatedDocuments || [],
        };

        if (insertIndex === null) {
            setFormData({ ...formData, actionFields: [...actionFields, newField] });
        } else {
            const next = [...actionFields];
            next.splice(insertIndex + 1, 0, newField);
            setFormData({ ...formData, actionFields: next });
        }

        setInsertIndex(null);
        clearErrorOnFocus();
    };

    const handleEditField = (field) => {
        if (readOnly) return;
        clearErrorOnFocus();
        setEditingField(field);
        setIsEditFieldOpen(true);
    };

    const handleSaveEditedField = (updatedField) => {
        setFormData({
            ...formData,
            actionFields: actionFields.map((f) => (f.id === updatedField.id ? { ...f, ...updatedField } : f)),
        });
        clearErrorOnFocus();
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

    const handleHazardClassChange = (id, hazardClass) => {
        setFormData({
            ...formData,
            actionFields: actionFields.map(f => f.id === id ? { ...f, hazardClass } : f),
        });
    };

    const handleMove = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= actionFields.length) return;
        const next = [...actionFields];
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        setFormData({ ...formData, actionFields: next });
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
                        <table className="font-fam table-borders waf-fields-table">
                            <thead className="cp-table-header">
                                <tr>
                                    <th style={{ textAlign: "center", width: "5%" }}>Nr</th>
                                    <th style={{ textAlign: "center", width: "25%" }}>Field Title</th>
                                    <th style={{ textAlign: "center", width: "15%" }}>Field Type</th>
                                    <th style={{ textAlign: "center", width: "20%" }}>Related Documents</th>
                                    <th style={{ textAlign: "center", width: "15%" }}>Hazard Class</th>
                                    <th style={{ textAlign: "center", width: "15%" }}>Mandatory Field</th>
                                    {!readOnly && <th style={{ textAlign: "center", width: "5%" }}>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {actionFields.length === 0 && (
                                    <tr>
                                        <td colSpan={readOnly ? 6 : 7} className="font-fam" style={{ textAlign: "center", padding: "10px", color: "#888" }}>
                                            No action fields have been added yet.
                                        </td>
                                    </tr>
                                )}
                                {actionFields.map((field, index) => {
                                    const typeDef = FIELD_TYPE_MAP[field.type] || {};
                                    return (
                                        <tr key={field.id}>
                                            <td style={{ textAlign: "center", fontSize: "14px" }}>{index + 1}</td>
                                            <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>
                                                {field.title}
                                                {field.required && (
                                                    <span className="required-field" title="Required"> *</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: "14px", textAlign: "center" }}>
                                                {typeDef.label}
                                            </td>
                                            <td style={{ fontSize: "14px" }}>
                                                {field.relatedDocuments && field.relatedDocuments.length > 0 ? (
                                                    <ul style={{ margin: 0, paddingLeft: "18px", textAlign: "left" }}>
                                                        {field.relatedDocuments.map((doc, docIndex) => (
                                                            <li key={doc.id || docIndex}>{doc.name}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span style={{ color: "#888" }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <div className="jra-info-popup-page-select-container">
                                                    <select
                                                        className="table-control font-fam remove-default-styling"
                                                        value={field.hazardClass || ""}
                                                        disabled={readOnly}
                                                        onChange={(e) => handleHazardClassChange(field.id, e.target.value)}
                                                        title="Hazard Class"
                                                    >
                                                        <option value="">Select Hazard Class</option>
                                                        <option value="Class A">Class A</option>
                                                        <option value="Class B">Class B</option>
                                                        <option value="Class C">Class C</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!field.required}
                                                    disabled={readOnly}
                                                    onChange={() => handleToggleRequired(field.id)}
                                                    title="Require this field before the work order can be closed out"
                                                    className="checkbox-inp-abbr"
                                                />
                                            </td>
                                            {!readOnly && (
                                                <td className="procCent">
                                                    <div className="term-action-buttons waf-row-actions" style={{ flexDirection: "column" }}>
                                                        <button
                                                            type="button"
                                                            className="waf-preview-toggle"
                                                            onClick={() => handleEditField(field)}
                                                            title="Edit field"
                                                            style={{ color: "black", padding: "6px 10px" }}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="waf-preview-toggle"
                                                            onClick={() => openAddFieldPopup(index)}
                                                            title="Insert field here"
                                                            style={{ color: "black", padding: "6px 10px" }}
                                                        >
                                                            <FontAwesomeIcon icon={faPlusCircle} />
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
                                    );
                                })}
                            </tbody>
                        </table>

                        {!readOnly && (
                            <button
                                className="add-row-button-abbrs-plus"
                                onClick={() => openAddFieldPopup(null)}
                                title="Add Action Field"
                                type="button"
                            >
                                <FontAwesomeIcon icon={faPlusCircle} />
                            </button>
                        )}
                    </>
                )}
            </div>

            <AddActionFieldPopup
                isOpen={isAddFieldOpen}
                onClose={() => {
                    setIsAddFieldOpen(false);
                    setInsertIndex(null);
                }}
                onAdd={handleAddField}
            />

            <EditActionFieldPopup
                isOpen={isEditFieldOpen}
                field={editingField}
                onClose={() => {
                    setIsEditFieldOpen(false);
                    setEditingField(null);
                }}
                onSave={handleSaveEditedField}
            />
        </div>
    );
};

export default WorkOrderActionFields;