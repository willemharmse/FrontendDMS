import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import TemplatePreviewContent from "./TemplatePreviewContent";
import { computeLockedFields, guardLockedFields } from "./lockedFieldsUtils";
import "./WorkOrderActionFields.css";
import "./TemplatePreview.css";

// Full-screen popup shown from the "Template Preview" button. It is a
// deliberately cut-down version of the create page: it reuses the exact
// same field components/props so behaviour stays in sync, and shares its
// entire body with WorkOrderAssignment (the allocator view) via
// TemplatePreviewContent - viewMode="template" is what tells that shared
// content which of the two it's being rendered as, so fields like Asset
// Number, Department, and the Management info box's accountable/responsible
// person dropdowns behave correctly for this (preview) view rather than the
// allocator view.
//
// Editing behaviour: like WorkOrderAssignment, the moment this popup opens,
// whatever formData looked like is snapshotted into initialFormDataRef and
// copied into its own local state, templateFormData. From then on,
// TemplatePreviewContent (and every box beneath it) reads from and writes
// to that local copy only - the formData/setFormData this component
// received as props are never touched again except to take that initial
// snapshot. So any edits made here are local to this viewing of the popup
// and are discarded (not written back to the parent) once it's closed;
// reopening it takes a fresh snapshot. Fields that already held a value at
// snapshot time are locked the same two ways WorkOrderAssignment locks
// them: lockedFields disables their controls, and
// handleTemplateFormDataChange reverts any that still slip through.
const TemplatePreview = ({
    formData,
    setFormData,
    errors = {},
    setErrors = () => { },
    readOnly = false,
    onClose,
}) => {
    // Component is freshly mounted every time the popup opens, so useState's
    // lazy initializer (and this ref) only ever capture formData once per
    // "open" - exactly the snapshot we want.
    const initialFormDataRef = useRef(formData);
    const [templateFormData, setTemplateFormData] = useState(() => ({ ...formData }));
    const [lockedFields] = useState(() => computeLockedFields(formData));

    const handleTemplateFormDataChange = (update) => {
        setTemplateFormData((prev) => {
            const next = typeof update === "function" ? update(prev) : update;
            return guardLockedFields(next, initialFormDataRef.current);
        });
    };

    return (
        <div className="template-preview-overlay">
            <div className="template-preview-panel">
                <div className="template-preview-header">
                    <h2 className="font-fam-labels" onClick={() => { console.log(templateFormData) }}>Template Preview</h2>
                    <FontAwesomeIcon
                        icon={faTimes}
                        className="template-preview-close"
                        onClick={onClose}
                        title="Close"
                    />
                </div>

                <div className="scrollable-box-preview template-preview-body">
                    <TemplatePreviewContent
                        formData={templateFormData}
                        setFormData={handleTemplateFormDataChange}
                        errors={errors}
                        setErrors={setErrors}
                        readOnly={readOnly}
                        viewMode="assignment"
                        lockedFields={lockedFields}
                    />
                </div>
            </div>
        </div>
    );
};

export default TemplatePreview;