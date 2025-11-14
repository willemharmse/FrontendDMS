import { useNavigate } from "react-router-dom";

const BurgerMenuCertifiers = ({ isOpen, setIsOpen, toggleTrashView, isTrashView, canIn, access }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/FrontendDMS/");
    };

    return (
        <div className="burger-menu-container-FI-main">
            {isOpen && (
                <div className="menu-content-FI-main" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={() => navigate("/FrontendDMS/userProfile")}>My Profile</li>
                        {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<li onClick={toggleTrashView}>{isTrashView ? "All Certification Bodies" : "Deleted Certification Bodies"}</li>)}
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuCertifiers;