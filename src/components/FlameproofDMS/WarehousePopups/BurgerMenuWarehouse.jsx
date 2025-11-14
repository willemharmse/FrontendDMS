import { useNavigate } from "react-router-dom";

const BurgerMenuWarehouse = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/FrontendDMS/");
    };

    return (
        <div className="burger-menu-container-FI">
            {isOpen && (
                <div className="menu-content-FI" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={() => navigate("/FrontendDMS/userProfile")}>My Profile</li>
                        <li onClick={handleLogout}>Logout</li>

                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuWarehouse;