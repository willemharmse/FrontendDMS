import React, { useEffect, useState } from "react";
import axios from "axios";
import ImageLightbox from "./ImageLightbox";

// ---------------------------------------------------------------------------
// CorrectiveActionPreview
//
// Read-only display shown alongside a field's normal value in
// ActionFieldsPreviewBox whenever that field had a corrective action logged
// against it (its submitted answer didn't match the expected value/range,
// so the responsible person attached a before/after fix - see
// field.correctiveAction on the WorkOrderTask document). Not limited to
// "photo"/"file" type fields - a corrective action can be attached to any
// field type, so this renders independently of ActionFieldFileValue /
// ActionFieldControl.
//
// Fetches each image the same way ActionFieldFileValue does (auth header +
// blob -> object URL, since the download endpoint requires a bearer token
// and a plain <img src="..."> can't send one). Each column still spans half
// the row (so the box uses its full width instead of leaving a dead gap on
// one side), but the image itself is capped to half of that column - i.e.
// 25% of the total width - and centered, so it renders noticeably smaller
// and shorter without needing much vertical scroll.
// ---------------------------------------------------------------------------
const CorrectiveActionImage = ({ taskId, fieldId, attachment, label }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [imageFailed, setImageFailed] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const downloadUrl = (attachment && taskId && fieldId)
        ? `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}/action-fields/${fieldId}/files/${attachment._id}/download`
        : null;

    useEffect(() => {
        if (!downloadUrl) return;

        let cancelled = false;
        let objectUrl = null;

        const loadImage = async () => {
            try {
                const storedToken = localStorage.getItem("token");
                const response = await axios.get(downloadUrl, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    responseType: "blob",
                });
                if (cancelled) return;
                objectUrl = URL.createObjectURL(response.data);
                setImageUrl(objectUrl);
            } catch {
                if (!cancelled) setImageFailed(true);
            }
        };

        loadImage();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [downloadUrl]);

    return (
        <div style={{ width: "50%", padding: "0 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
                className="font-fam"
                style={{ fontSize: "11px", fontWeight: 600, color: "#000", marginBottom: "4px" }}
            >
                {label}
            </span>

            {!attachment ? (
                <span className="font-fam" style={{ fontSize: "12px", color: "#000" }}>-</span>
            ) : imageFailed ? (
                <span className="font-fam" style={{ fontSize: "12px", color: "#000", textAlign: "center" }}>
                    Preview unavailable
                </span>
            ) : imageUrl ? (
                <img
                    src={imageUrl}
                    alt={attachment.fileName || label}
                    title="Click to view larger"
                    onClick={() => setIsPreviewOpen(true)}
                    style={{ width: "50%", height: "auto", display: "block", borderRadius: "4px", cursor: "zoom-in" }}
                />
            ) : (
                <span className="font-fam" style={{ fontSize: "12px", color: "#000" }}>Loading...</span>
            )}

            {imageUrl && isPreviewOpen && (
                <ImageLightbox
                    isOpen={isPreviewOpen}
                    imageUrl={imageUrl}
                    altText={attachment.fileName || label}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </div>
    );
};

const CorrectiveActionPreview = ({ taskId, field }) => {
    const correctiveAction = field?.correctiveAction;
    if (!correctiveAction) return null;

    const { beforeImage, afterImage } = correctiveAction;
    if (!beforeImage && !afterImage) return null;

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
                Implemented Corrective Action
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <CorrectiveActionImage
                    taskId={taskId}
                    fieldId={field?.id}
                    attachment={beforeImage}
                    label="Before"
                />
                <CorrectiveActionImage
                    taskId={taskId}
                    fieldId={field?.id}
                    attachment={afterImage}
                    label="After"
                />
            </div>
        </div>
    );
};

export default CorrectiveActionPreview;