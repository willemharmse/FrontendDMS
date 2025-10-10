import React, { useEffect } from "react";
import "./TypeSelectorPopup.css";

const TypeSelectorPopup = ({
    isOpen = true,
    title = "Select Type",
    onClose,
    onSelect,
    options = [
        // Expecting THREE options; can pass your own via props
        { id: "TEXT", label: "Text", imgSrc: `${process.env.PUBLIC_URL}/txt.png`, alt: "Text" },
        { id: "TEXT_MEDIA", label: "Text + Media", imgSrc: `${process.env.PUBLIC_URL}/txtMed.png`, alt: "Text and Media" },
        { id: "MEDIA", label: "Media", imgSrc: `${process.env.PUBLIC_URL}/Med.png`, alt: "Media" },
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
                        {options.slice(0, 3).map(({ id, label, imgSrc, alt }) => (
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