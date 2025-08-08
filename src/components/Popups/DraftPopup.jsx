import "./DraftPopup.css";

const DraftPopup = ({ closeModal }) => {
    return (
        <div className="warn-draft-draft-popup-overlay">
            <div className="warn-draft-draft-popup-content">
                <button className="warn-draft-draft-close" onClick={closeModal} title="Close Popup">×</button>
                <div className="warn-draft-warning-container">
                    <div className="warn-draft-warning-icon">!</div>
                    <div className="warn-draft-warning-text">
                        <strong>Warning!</strong><br />
                        You have generated a document based on a draft or review version. This document is not valid for sign-off purposes. To generate a sign-off ready version, please first publish the final document in the application and then download the published version.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DraftPopup;
