import React, { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// AdditionalCommentsPreview
//
// Read-only display shown alongside a field's normal value in
// ActionFieldsPreviewBox whenever that field has a free-text comment
// attached to it (field.comment on the WorkOrderTask document - see the
// schema comment on actionFieldSchema.comment, populated only when
// isExperimentalComments/isExperimentalCommentsDropdown was on for that
// field on the Populate Work Order screen).
//
// Styled to match CorrectiveActionPreview's box so the two read as the same
// kind of "extra detail beneath the value" block. Renders nothing at all
// (not an empty box) when there's no comment to show. Independent of
// CorrectiveActionPreview - a field can have either, both, or neither, and
// this always renders below it when both are present.
//
// The comment itself renders in a disabled textarea (matching the new
// "textarea" field type - see WorkOrderActionFieldTypes.js) rather than a
// plain text block, so multi-line comments read the same way here as they
// would in the live capture form. It's disabled (not merely readOnly) so it
// can't be focused/edited/tabbed into from this permanently-read-only
// preview, and it auto-grows to fit its content on mount/whenever the
// comment changes, since a fixed row count would either clip long comments
// or leave dead space under short ones.
// ---------------------------------------------------------------------------
const AdditionalCommentsPreview = ({ field }) => {
    const comment = field?.comment?.trim();
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [comment]);

    if (!comment) return null;

    return (
        <div
            style={{
                marginTop: "8px",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "6px",
            }}
        >
            <div className="font-fam" style={{ fontSize: "14px", fontWeight: 600, color: "#000", marginBottom: "6px" }}>
                Additional Comments
            </div>
            <textarea
                ref={textareaRef}
                className="waf-control waf-textarea"
                value={comment}
                disabled
                readOnly
                style={{ resize: "none", minHeight: 0 }}
            />
        </div>
    );
};

export default AdditionalCommentsPreview;