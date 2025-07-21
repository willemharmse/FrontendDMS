import "./DeleteDraftPopup.css";

const DeleteDraftPopup = ({ closeModal, deleteDraft, draftName, author = false }) => {
    return (
        <div className="delete-draft-popup-overlay">
            <div className="delete-draft-popup-content">
                <div className="delete-draft-header">
                    <h2 className="delete-draft-title">Delete Draft</h2>
                    <button className="delete-draft-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-draft-group">
                    <div className="delete-draft-text">{author ? "Are you sure you want to delete this draft?" : "Are you sure you want to stop collaborating on this draft?"}</div>
                    <div>{draftName}</div>
                </div>

                <div className="delete-draft-buttons">
                    <button className="delete-draft-button-delete" onClick={deleteDraft}>
                        {author ? 'Delete' : "Remove"}
                    </button>
                    <button className="delete-draft-button-cancel" onClick={closeModal}>
                        {"Keep"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteDraftPopup;