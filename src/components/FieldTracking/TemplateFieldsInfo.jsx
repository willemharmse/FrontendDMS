import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { MANDATORY_TEMPLATE_FIELDS } from "./TemplateFieldsTable";

const TemplateFieldsInfo = ({ collapsible = false, formData, setFormData, usedTemplateFields, error, setErrors, readOnly = false }) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    // Keep formData.templateFieldDetails in sync with whatever fields are
    // currently selected in usedTemplateFields. Existing values are
    // preserved, newly added fields get an empty value, and fields that were
    // removed are dropped.
    useEffect(() => {
        setFormData(prev => {
            const existing = prev.templateFieldDetails || [];
            const existingMap = new Map(existing.map(item => [item.field, item.value]));

            const updated = (usedTemplateFields || []).map(field => ({
                field,
                value: existingMap.get(field) ?? ""
            }));

            return {
                ...prev,
                templateFieldDetails: updated
            };
        });
    }, [usedTemplateFields]);

    const handleValueChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            templateFieldDetails: (prev.templateFieldDetails || []).map(item =>
                item.field === field ? { ...item, value } : item
            )
        }));
    };

    const rows = formData.templateFieldDetails || [];

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`}>
                <h3 className="font-fam-labels">Template Field Information <span className="required-field">*</span></h3>

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
                            <table className="table-borders-jra-info">
                                <tbody>
                                    {rows.map((item) => (
                                        <tr key={item.field}>
                                            <th scope="row" className="jra-info-table-header">
                                                {item.field}
                                                {MANDATORY_TEMPLATE_FIELDS.includes(item.field) && (
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
                                                            setErrors(prev => ({ ...prev, templateFieldDetails: false }));
                                                        }
                                                    }}
                                                    readOnly={readOnly}
                                                    style={{ resize: "none" }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="font-fam" style={{ margin: "10px 0" }}>
                                No template fields have been selected yet.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TemplateFieldsInfo;