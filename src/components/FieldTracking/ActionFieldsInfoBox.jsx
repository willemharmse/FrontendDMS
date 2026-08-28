import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import ActionFieldControl from "./ActionFieldControl";

// ---------------------------------------------------------------------------
// ActionFieldsInfoBox
//
// Read/preview-style counterpart to WorkOrderActionFields (the builder).
// Laid out the same way SiteAreaInfoBox presents its rows - a two-column
// table with the label on the left and the control on the right - except
// here each row comes from formData.actionFields: the left column is the
// title the template creator typed in the builder, and the right column
// renders whichever control matches that field's type (Text, Number,
// Dropdown, Yes/No, etc.) via ActionFieldControl, the same component the
// builder's own "live preview" toggle uses.
//
// Values entered here ARE captured, but kept separate from the field
// definitions themselves: they're written to formData.actionFieldValues,
// keyed by field.id (e.g. { [field.id]: value }), so actionFields (the
// definitions) stay untouched. This has no effect on how the box looks.
// ---------------------------------------------------------------------------
const ActionFieldsInfoBox = ({
    collapsible = false,
    formData,
    setFormData,
    readOnly = false,
    // "create" | "template" | "assignment". This box is only ever rendered
    // via TemplatePreviewContent (preview + allocator) - on "template" the
    // controls stay interactive but the values typed/selected must not be
    // written to formData.actionFieldValues; only "assignment" (and
    // "create", if this box is ever used there) commits.
    viewMode = "assignment",
    // Names of individual action fields that must stay non-interactive,
    // identified as "actionFieldValues.<field.id>". Used by
    // WorkOrderAssignment to lock fields that already had an answer when
    // the assignment popup was opened. Empty by default everywhere else,
    // so this has no effect unless a caller explicitly passes it.
    lockedFields = []
}) => {
    const commitChanges = viewMode !== "template";
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const toggleCollapse = () => setCollapsed(!collapsed);

    const actionFields = formData.actionFields || [];
    const actionFieldValues = formData.actionFieldValues || {};

    const isLocked = (fieldId) => lockedFields.includes(`actionFieldValues.${fieldId}`);

    const setPreviewValue = (id, value) => {
        if (!commitChanges || isLocked(id)) return;
        setFormData((prev) => ({
            ...prev,
            actionFieldValues: {
                ...(prev.actionFieldValues || {}),
                [id]: value,
            },
        }));
    };

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">Work Order Action Fields</h3>

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

                {(!isCollapsed) && (
                    actionFields.length > 0 ? (
                        <table className="table-borders-jra-info" style={{ tableLayout: "fixed", width: "100%" }}>
                            <colgroup>
                                <col style={{ width: "25%" }} />
                                <col />
                            </colgroup>
                            <tbody>
                                {actionFields.map((field, index) => (
                                    <tr key={field.id}>
                                        <th scope="row" className="jra-info-table-header" style={{ whiteSpace: "pre-wrap" }}>
                                            {index + 1}. {field.title}
                                            {field.required && (
                                                <span className="required-field" title="Required"> *</span>
                                            )}
                                            {field.hazardClass && (
                                                <div
                                                    className="font-fam"
                                                    style={{ color: "#888", fontStyle: "italic", fontWeight: "normal", fontSize: "12px" }}
                                                >
                                                    Hazard Class: {field.hazardClass}
                                                </div>
                                            )}
                                        </th>
                                        <td>
                                            <ActionFieldControl
                                                field={field}
                                                value={actionFieldValues[field.id]}
                                                onChange={(val) => setPreviewValue(field.id, val)}
                                                readOnly={true}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="font-fam" style={{ textAlign: "center", padding: "10px", color: "#888" }}>
                            No action fields have been added yet.
                        </p>
                    )
                )}
            </div>
        </div>
    );
};

export default ActionFieldsInfoBox;