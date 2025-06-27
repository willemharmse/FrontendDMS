import "./SavePopup.css";

const SavePopup = ({ openSaveAs, save, isOpen, closeSaveMenu }) => {
    return (
        <div className="burger-menu-container-save-as-popup">
            {isOpen && (
                <div className="menu-content-save-as-popup" onMouseLeave={() => closeSaveMenu()}>
                    <ul>
                        <li onClick={save}>Save</li>
                        <li onClick={openSaveAs}>Save As</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SavePopup;