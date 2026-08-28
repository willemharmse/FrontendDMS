import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-toastify";
import TemplatePreviewContent from "../../../FieldTracking/TemplatePreviewContent";
import { computeLockedFields, guardLockedFields } from "../../../FieldTracking/lockedFieldsUtils";
// NOTE: adjust this path if TemplatePreviewPopup lives somewhere else in
// your tree - it's assumed here to sit alongside WorkOrderAssignment.
import TemplatePreviewPopupWO from "./TemplatePreviewPopupWO";

const workOrderApiBase = () => `${process.env.REACT_APP_URL}/api/workOrderTasks`;

// Full-screen popup for assigning a work order. This is just the shell
// (fixed title, no close button, Submit/Cancel footer) - all the actual
// field content lives in TemplatePreviewContent, shared with TemplatePreview,
// so content changes only need to be made in one place.
//
// Locking behaviour (new): the moment this popup opens, whatever formData
// looked like is snapshotted into initialFormDataRef and copied into its
// own local state, assignmentFormData. From then on, TemplatePreviewContent
// (and every box beneath it) reads from and writes to that local copy only
// - the formData/setFormData this component received as props are never
// touched again except to take that initial snapshot.
//
// Any field that already held a value at snapshot time is locked two ways:
//   1) lockedFields (computed once via computeLockedFields) is passed all
//      the way down to each box, which disables that field's actual
//      control in the UI - so it's visibly non-interactive, not just
//      silently reverted.
//   2) handleAssignmentFormDataChange is a belt-and-suspenders backstop:
//      if an update still tries to change a locked field, that one field
//      is reverted back to its original value while every other
//      (previously-empty) field the same update touched still goes
//      through normally.
// Fields the allocator fills in during this session are only ever handed
// back to the caller once - this component itself POSTs assignmentFormData
// to POST /api/workOrderTasks/create on Submit, and onSubmit(createdTask) is
// only called afterwards, on success, purely so the caller can react (close
// itself, refresh a task list, etc). It is never used to trigger the network
// request - that happens here.
const WorkOrderAssignment = ({
    formData,
    setFormData,
    errors = {},
    setErrors = () => { },
    readOnly = false,
    onSubmit,
    onCancel,
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [showPdfPreview, setShowPdfPreview] = useState(false);

    // Component is freshly mounted every time the popup opens, so useState's
    // lazy initializer (and this ref) only ever capture formData once per
    // "open" - exactly the snapshot we want.
    const initialFormDataRef = useRef(formData);
    const [assignmentFormData, setAssignmentFormData] = useState(() => ({ ...formData }));
    const [lockedFields] = useState(() => computeLockedFields(formData));

    const handleAssignmentFormDataChange = (update) => {
        setAssignmentFormData((prev) => {
            const next = typeof update === "function" ? update(prev) : update;
            return guardLockedFields(next, initialFormDataRef.current);
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const storedToken = localStorage.getItem("token");

            const response = await axios.post(
                `${workOrderApiBase()}/create`,
                { formData: assignmentFormData },
                { headers: { Authorization: `Bearer ${storedToken}` } }
            );

            toast.success("Work order created successfully.", { autoClose: 2000, closeButton: false });
            onSubmit && onSubmit(response.data);
        } catch (error) {
            toast.error(
                error?.response?.data?.error || "Failed to create work order.",
                { autoClose: 3000, closeButton: false }
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="template-preview-overlay">
            <div className="template-preview-panel">
                <div className="template-preview-header">
                    <h2 className="font-fam-labels">Work Order Assignment</h2>
                </div>

                <div className="scrollable-box-preview template-preview-body">
                    <TemplatePreviewContent
                        formData={assignmentFormData}
                        setFormData={handleAssignmentFormDataChange}
                        errors={errors}
                        setErrors={setErrors}
                        readOnly={readOnly}
                        viewMode="assignment"
                        lockedFields={lockedFields}
                    />
                </div>

                <div className="input-row-buttons" style={{ marginBottom: "15px", marginTop: "5px" }}>
                    <button
                        type="button"
                        className="generate-button font-fam"
                        onClick={() => setShowPdfPreview(true)}
                        disabled={submitting}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                        Preview PDF
                    </button>
                    <button
                        type="button"
                        className="generate-button font-fam"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="generate-button font-fam"
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                    >
                        {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit"}
                    </button>
                </div>
            </div>

            {showPdfPreview && (
                <TemplatePreviewPopupWO
                    onClose={() => setShowPdfPreview(false)}
                    formData={assignmentFormData}
                    previewEndpoint={`${workOrderApiBase()}/preview-pdf`}
                    titleSuffix="[Approved]"
                />
            )}
        </div>
    );
};

export default WorkOrderAssignment;