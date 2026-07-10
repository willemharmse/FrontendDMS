import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
    faPlusCircle,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';
import SelectFieldsPopup from "./SelectFieldsPopup";

// Fixed, always-present fields for this section. These can never be
// removed - they're not part of the pick-additional-fields popup at all.
export const TASK_DESCRIPTION_FIELDS = [
    "Work Order Title",
    "Task Description",
    "Area",
    "Planned Start Date",
    "Priority"
];

const TaskDescriptionInfoBox = ({
    collapsible = false,
    formData,
    setFormData,
    usedTemplateFields,
    setUsedTemplateFields,
    error,
    setErrors,
    readOnly = false
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const [popupVisible, setPopupVisible] = useState(false);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    // Keep the fixed fields present in formData.taskDescriptionDetails.
    // Any other rows already present (extra fields added via the popup, e.g.
    // from a loaded draft) are left untouched. This only needs to run once
    // on mount since the base field list never changes.
    useEffect(() => {
        setFormData(prev => {
            const existing = prev.taskDescriptionDetails || [];
            const existingMap = new Map(existing.map(item => [item.field, item.value]));

            const baseRows = TASK_DESCRIPTION_FIELDS.map(field => ({
                field,
                value: existingMap.get(field) ?? ""
            }));
            const extraRows = existing.filter(item => !TASK_DESCRIPTION_FIELDS.includes(item.field));

            return {
                ...prev,
                taskDescriptionDetails: [...baseRows, ...extraRows]
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleValueChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            taskDescriptionDetails: (prev.taskDescriptionDetails || []).map(item =>
                item.field === field ? { ...item, value } : item
            )
        }));
    };

    const rows = formData.taskDescriptionDetails || [];

    // Fields in this section that were added on top of the fixed base list -
    // these are the only ones the popup and the remove button can touch.
    const currentExtraFields = rows
        .filter(item => !TASK_DESCRIPTION_FIELDS.includes(item.field))
        .map(item => item.field);

    const handlePopupSave = (newExtraFields) => {
        setFormData(prev => {
            const existingMap = new Map((prev.taskDescriptionDetails || []).map(item => [item.field, item.value]));

            const baseRows = TASK_DESCRIPTION_FIELDS.map(field => ({
                field,
                value: existingMap.get(field) ?? ""
            }));
            const extraRows = newExtraFields.map(field => ({
                field,
                value: existingMap.get(field) ?? ""
            }));

            return {
                ...prev,
                taskDescriptionDetails: [...baseRows, ...extraRows]
            };
        });

        // Free up any extras that were unchecked, and claim the new ones,
        // in the form's global "used" list so they can't be picked by
        // another section while they're in use here.
        setUsedTemplateFields(prev => {
            const withoutOldExtras = prev.filter(field => !currentExtraFields.includes(field));
            return [...new Set([...withoutOldExtras, ...newExtraFields])];
        });
    };

    const handleRemoveField = (field) => {
        if (TASK_DESCRIPTION_FIELDS.includes(field)) {
            toast.error(`"${field}" is a required field and cannot be removed.`);
            return;
        }

        setFormData(prev => ({
            ...prev,
            taskDescriptionDetails: (prev.taskDescriptionDetails || []).filter(item => item.field !== field)
        }));
        setUsedTemplateFields(prev => prev.filter(f => f !== field));
    };

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`}>
                <h3 className="font-fam-labels">Task Details <span className="required-field">*</span></h3>

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
                        {rows.length > 0 ? (
                            <table className="table-borders-jra-info" style={{ tableLayout: "fixed", width: "100%" }}>
                                <colgroup>
                                    <col style={{ width: "220px" }} />
                                    <col />
                                    {!readOnly && <col style={{ width: "40px" }} />}
                                </colgroup>
                                <tbody>
                                    {rows.map((item) => {
                                        const isMandatory = TASK_DESCRIPTION_FIELDS.includes(item.field);
                                        return (
                                            <tr key={item.field}>
                                                <th scope="row" className="jra-info-table-header">
                                                    {item.field}
                                                    {isMandatory && (
                                                        <span className="required-field" title="Required"> *</span>
                                                    )}
                                                </th>
                                                <td>
                                                    <textarea
                                                        className="jra-info-popup-page-textarea"
                                                        value={item.value}
                                                        placeholder={`Insert ${item.field}`}
                                                        onChange={e => handleValueChange(item.field, e.target.value)}
                                                        onFocus={() => {
                                                            if (error) {
                                                                setErrors(prev => ({ ...prev, taskDescriptionDetails: false }));
                                                            }
                                                        }}
                                                        readOnly={readOnly}
                                                        style={{ resize: "none" }}
                                                    />
                                                </td>
                                                {!readOnly && (
                                                    <td style={{ width: "40px", verticalAlign: "middle" }}>
                                                        {!isMandatory && (
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                                                                <button
                                                                    className="remove-row-button"
                                                                    onClick={() => handleRemoveField(item.field)}
                                                                    title="Remove Field"
                                                                    type="button"
                                                                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} title="Remove Field" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="font-fam" style={{ margin: "10px 0" }}>
                                No task description fields available.
                            </p>
                        )}

                        {!readOnly && (
                            <button
                                className="add-row-button-abbrs-plus"
                                onClick={() => setPopupVisible(true)}
                                title="Add Task Description Field"
                                type="button"
                            >
                                <FontAwesomeIcon icon={faPlusCircle} />
                            </button>
                        )}
                    </>
                )}
            </div>

            <SelectFieldsPopup
                visible={popupVisible}
                onClose={() => setPopupVisible(false)}
                title="Select Task Description Fields"
                usedTemplateFields={usedTemplateFields}
                currentFields={currentExtraFields}
                onSave={handlePopupSave}
            />
        </div>
    );
};

export default TaskDescriptionInfoBox;