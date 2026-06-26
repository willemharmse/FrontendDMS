import React from "react";

const TRIGGER_CONFIG = {
    back: {
        title: "Save Draft",
        message: "Do you want to save this draft before going back?",
    },
    home: {
        title: "Save Draft",
        message: "Do you want to save this draft before going to the home page?",
    },
    refresh: {
        title: "Save Draft",
        message: "Do you want to save this draft before refreshing the page?",
    },
    close: {
        title: "Save Draft",
        message: "Do you want to save this draft before closing the application?",
    },
};

const SaveConfirmationPopup = ({
    setIsSaveModalOpen,
    onConfirmSave,
    onDiscard,
    onCancel,
    draftTitle,
    triggerType = "back",
}) => {
    const config = TRIGGER_CONFIG[triggerType] || TRIGGER_CONFIG.back;

    return (
        <div className="delete-popup-overlay-um">
            <div className="delete-popup-content-um">
                <div className="delete-file-header-um">
                    <h2 className="delete-file-title-um">{config.title}</h2>
                    <button
                        className="delete-file-close-um"
                        onClick={onCancel}
                        title="Close Popup"
                    >
                        ×
                    </button>
                </div>

                <div className="delete-file-group-um">
                    <div className="delete-file-text-um">
                        {config.message}
                    </div>
                    <div>
                        <strong>{draftTitle || "Untitled Draft"}</strong>
                    </div>
                </div>

                <div className="delete-file-buttons-um">
                    <button
                        style={{ marginRight: "10px", marginLeft: "auto" }}
                        className="delete-file-button-cancel-um"
                        onClick={onConfirmSave}
                    >
                        Save
                    </button>
                    <button
                        style={{ marginLeft: "10px", marginRight: "auto" }}
                        className="delete-file-button-delete-um"
                        onClick={onDiscard}
                    >
                        Don't Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaveConfirmationPopup;