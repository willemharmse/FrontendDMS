import React, { useEffect, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import ImageLightbox from "./ImageLightbox";

// ---------------------------------------------------------------------------
// ActionFieldFileValue
//
// Read-only display for a single "photo" or "file" type action field, as
// captured/uploaded by the responsible person when they populated the work
// order (see PUT /:id/populate). Unlike ActionFieldControl - the
// interactive upload/capture control used by the builder and every other
// preview/assignment view - this never shows a control to change anything.
// The work order is already completed, so there's nothing left to submit;
// it only shows what was actually submitted:
//
//   - "file": just the file name, underlined and clickable. Clicking it
//     downloads the file via the action-field file download endpoint.
//   - "photo": the same clickable file name, plus the image itself,
//     rendered inline at 40% width (height auto, so it keeps its aspect
//     ratio) by fetching the image bytes and turning them into an object
//     URL. A plain <img src="..."> can't be used here because the endpoint
//     requires an auth header.
//
// field.files[0] is the only attachment an action field ever holds - each
// new capture/upload replaces the previous one, so there's never more than
// one to show.
// ---------------------------------------------------------------------------
const ActionFieldFileValue = ({ taskId, field }) => {
    const file = Array.isArray(field?.files) && field.files.length > 0 ? field.files[0] : null;
    const isPhoto = field?.type === "photo";

    const [imageUrl, setImageUrl] = useState(null);
    const [imageFailed, setImageFailed] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const downloadUrl = (file && taskId && field?.id)
        ? `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}/action-fields/${field.id}/files/${file._id}/download`
        : null;

    // Only photo-type fields need the bytes up front (to render inline);
    // file-type fields fetch on demand when the name is clicked.
    useEffect(() => {
        if (!isPhoto || !downloadUrl) return;

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
    }, [downloadUrl, isPhoto]);

    const handleDownload = async () => {
        if (!downloadUrl || !file) return;
        try {
            const storedToken = localStorage.getItem("token");
            const response = await axios.get(downloadUrl, {
                headers: { Authorization: `Bearer ${storedToken}` },
                responseType: "blob",
            });
            saveAs(response.data, file.fileName || "download");
        } catch {
            // No toast context here by design - this is a small, self-
            // contained display component. A failed download simply does
            // nothing; the user can try clicking again.
        }
    };

    if (!file) {
        return <span style={{ color: "#888" }}>-</span>;
    }

    return (
        <div>
            <button
                type="button"
                title="Click to download"
                onClick={handleDownload}
                style={{
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    color: "#0B5ED7",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "14px",
                    textAlign: "left",
                }}
            >
                {isPhoto ? "Download Image" : file.fileName}
            </button>

            {isPhoto && imageUrl && (
                <div style={{ marginTop: "8px" }}>
                    <img
                        src={imageUrl}
                        alt={file.fileName}
                        title="Click to view larger"
                        onClick={() => setIsPreviewOpen(true)}
                        style={{
                            width: "25%",
                            height: "auto",
                            display: "block",
                            borderRadius: "4px",
                            cursor: "zoom-in",
                        }}
                    />
                </div>
            )}

            {isPhoto && imageFailed && (
                <p style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
                    Preview unavailable - use the file name above to download.
                </p>
            )}

            {isPhoto && imageUrl && isPreviewOpen && (
                <ImageLightbox
                    isOpen={isPreviewOpen}
                    imageUrl={imageUrl}
                    altText={file.fileName}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </div>
    );
};

export default ActionFieldFileValue;