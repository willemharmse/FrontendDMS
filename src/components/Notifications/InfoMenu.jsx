import React from "react";

const InfoMenu = ({ isOpen, setIsOpen, onProductPresentation, onProductTraining, trainingEnabled = true }) => {
    if (!isOpen) return null;

    return (
        <div className="burger-menu-container-FI">
            <div className="menu-content-FI" onMouseLeave={() => setIsOpen(false)}>
                <ul>
                    <li onClick={() => { onProductPresentation(); setIsOpen(false); }}>
                        Product Overview
                    </li>
                    {trainingEnabled && (<li onClick={() => { onProductTraining(); setIsOpen(false); }}>
                        Training Material
                    </li>)}
                </ul>
            </div>
        </div>
    );
};

export default InfoMenu;
