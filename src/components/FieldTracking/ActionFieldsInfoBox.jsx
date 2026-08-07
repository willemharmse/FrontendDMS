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
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const toggleCollapse = () => setCollapsed(!collapsed);

    const actionFields = formData.actionFields || [];
    const actionFieldValues = formData.actionFieldValues || {};

    const setPreviewValue = (id, value) => {
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
                                {actionFields.map((field) => (
                                    <tr key={field.id}>
                                        <th scope="row" className="jra-info-table-header">
                                            {field.title}
                                            {field.required && (
                                                <span className="required-field" title="Required"> *</span>
                                            )}
                                        </th>
                                        <td>
                                            <ActionFieldControl
                                                field={field}
                                                value={actionFieldValues[field.id]}
                                                onChange={(val) => setPreviewValue(field.id, val)}
                                                readOnly={readOnly}
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