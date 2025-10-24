import React, { useEffect } from "react";
import "./TypeSelectorPopup.css";

const TypeSelectorPopup = ({
    isOpen = true,
    title = "Select Type",
    onClose,
    onSelect,
    options = [
        { id: "TEXT", label: "Text Only", imgSrc: "/Content_Text.png", alt: "Text" },
        { id: "TEXT_MEDIA", label: "Text + Media (Split)", imgSrc: "/Content_TextMedia_Split.png", alt: "Text and Media" },
        { id: "MEDIAX2_TEXT", label: "Text + Media (Stacked)", imgSrc: "/Content_TextMedia_Stacked.png", alt: "Media" },
        { id: "TEXT_MEDIA_2X2", label: "Text + Media (Grid)", imgSrc: "/Content_TextMedia_Grid.png", alt: "Text and Media 2x2" },
        { id: "MEDIA", label: "Media Only", imgSrc: "/Content_Media.png", alt: "Media" },
        { id: "MEDIA_GALLERY", label: "Media (Collage Split)", imgSrc: "/Content_Media_CollageSplit.png", alt: "Media" },
        { id: "MEDIA_2X2", label: "Media (Collage Grid)", imgSrc: "/Content_Media_CollageGrid.png", alt: "Text and Media 2x2" },
        { id: "PDF_VIEW", label: "PDF View", imgSrc: "/Content_PDF.png", alt: "Text and Media 2x2" },
    ],
    closeOnBackdrop = true,
}) => {
    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdrop = (e) => {
        if (!closeOnBackdrop) return;
        if (e.target.classList.contains("type-selector-overlay")) {
            onClose?.();
        }
    };

    return (
        <div className="type-selector-overlay" onMouseDown={handleBackdrop}>
            <div className="type-selector-modal" role="dialog" aria-modal="true" aria-labelledby="type-selector-title">
                <div className="type-selector-header">
                    <h2 id="type-selector-title" className="type-selector-title">{title}</h2>
                    <button className="type-selector-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                {/* Content group (no middle text, no footer buttons) */}
                <div className="type-selector-group">
                    <div className="type-selector-tiles">
                        {options.slice(0, 8).map(({ id, label, imgSrc, alt }) => (
                            <button
                                key={id}
                                type="button"
                                className="type-selector-tile"
                                onClick={() => onSelect?.(id)}
                                aria-label={label || id}
                            >
                                <img className="type-selector-img" src={imgSrc} alt={alt || label || id} />
                                {label ? <span className="type-selector-label">{label}</span> : null}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TypeSelectorPopup;