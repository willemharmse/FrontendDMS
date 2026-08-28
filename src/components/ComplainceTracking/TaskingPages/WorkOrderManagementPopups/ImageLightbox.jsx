import React, { useEffect } from "react";

// ---------------------------------------------------------------------------
// ImageLightbox
//
// Full-screen popup for viewing a single already-loaded image (an object
// URL / blob URL, or any other <img>-able src) at a larger size. Shared by
// any component that shows a small inline image and wants a "click to view
// bigger" affordance - e.g. ActionFieldFileValue's photo preview and
// CorrectiveActionPreview's corrective action photo.
//
// Usage:
//   const [isOpen, setIsOpen] = useState(false);
//   <img onClick={() => setIsOpen(true)} ... />
//   <ImageLightbox
//     isOpen={isOpen}
//     imageUrl={imageUrl}
//     altText={file.fileName}
//     onClose={() => setIsOpen(false)}
//   />
//
// Closes on backdrop click, the X button, or Escape.
// ---------------------------------------------------------------------------
const ImageLightbox = ({ isOpen, imageUrl, altText, onClose }) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !imageUrl) return null;

    return (
        <div
            role="presentation"
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                cursor: "zoom-out",
            }}
        >
            <button
                type="button"
                title="Close"
                onClick={onClose}
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "30px",
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    fontSize: "32px",
                    lineHeight: 1,
                    cursor: "pointer",
                }}
            >
                &times;
            </button>

            <img
                src={imageUrl}
                alt={altText}
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    width: "auto",
                    height: "auto",
                    borderRadius: "4px",
                    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
                }}
            />
        </div>
    );
};

export default ImageLightbox;
