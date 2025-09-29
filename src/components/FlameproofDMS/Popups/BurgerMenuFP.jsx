import { useNavigate } from "react-router-dom";

const BurgerMenuFP = ({ isOpen, setIsOpen, toggleTrashView, isTrashView, canIn, access }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="burger-menu-container-FI-main">
            {isOpen && (
                <div className="menu-content-FI-main" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={() => navigate("/userProfile")}>My Profile</li>
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuFP;