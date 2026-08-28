import React from "react";

// ---------------------------------------------------------------------------
// ResponsibleSignaturePreview
//
// Read-only signature content for a work order - the image (or "N/A"),
// followed by the signer's name and the date/time they signed. Rendered as
// the value cell of the "Responsible Person Signature" row
// ActionFieldsPreviewBox appends to the bottom of the action fields table -
// it isn't an action field itself, so that row carries no number, just the
// label.
//
// The image is a base64 data URI stored directly on the task document
// (task.responsibleSignature.signature) and comes back as-is from
// GET /:id - unlike ActionFieldFileValue's photos/files, no separate
// authenticated fetch is needed here.
//
// Falls back to "N/A" per piece (image / name / date) rather than hiding
// anything - same convention the generated PDF and the mobile app's
// read-only view use, so a work order with no signature on record (e.g.
// one submitted before this feature existed) still renders sensibly.
// ---------------------------------------------------------------------------
const ResponsibleSignaturePreview = ({ signature }) => {
    const image = signature?.signature || null;

    const username = signature?.username?.trim();
    const usernameText = username ? username : "N/A";

    const parsedDate = signature?.date ? new Date(signature.date) : null;
    const dateText =
        parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleString(undefined, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
            : "N/A";

    return (
        <div>
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    minHeight: "110px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px",
                    backgroundColor: "#fff",
                }}
            >
                {image ? (
                    <img
                        src={image}
                        alt="Responsible person's signature"
                        style={{ maxWidth: "220px", maxHeight: "100px", objectFit: "contain" }}
                    />
                ) : (
                    <span style={{ color: "#888" }}>N/A</span>
                )}
            </div>

            <div className="font-fam" style={{ marginTop: "6px", fontWeight: "bold", textAlign: "center" }}>
                {usernameText}
            </div>
            <div className="font-fam" style={{ color: "#888", fontSize: "13px", textAlign: "center" }}>
                {dateText}
            </div>
        </div>
    );
};

export default ResponsibleSignaturePreview;