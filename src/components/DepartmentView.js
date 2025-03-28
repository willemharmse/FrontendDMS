import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import "./DepartmentView.css";
import AddUserModal from './UserManagement/AddUserModal';
import DeleteUserModal from './UserManagement/DeleteUserModal';
import EditUserModal from './UserManagement/EditUserModal';
import UserTable from "./UserManagement/UserTable";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faCirclePlus, faCalculator } from '@fortawesome/free-solid-svg-icons';
import TeamManagement from "./UserManagement/TeamManagement";
import TeamTable from "./UserManagement/TeamTable";
import RemoveUserModal from "./UserManagement/RemoveUserModal";
import AddMembersDept from "./UserManagement/AddMembersDept";
import DeletePopupUM from "./UserManagement/DeletePopupUM";
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
import {
    faBuilding,
    faBriefcase,
    faUserMd,
    faGraduationCap,
    faGavel,
    faMicrochip,
    faChartLine,
    faFlask,
    faCog,
    faPencilRuler,
    faUsers,
    faBalanceScale,
    faPalette,
    faGlobe,
    faBook,
    faHeadset,
    faHandsHelping,
    faDollarSign,
    faServer,
    faUniversity
} from "@fortawesome/free-solid-svg-icons";

const DepartmentView = () => {
    const { deptId } = useParams();
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");
    const [userToDelete, setUserToDelete] = useState(null);
    const [role, setRole] = useState('');
    const [formError, setFormError] = useState('');
    const adminRoles = ['admin', 'developer'];
    const leaderRoles = ['teamleader'];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [department, setDepartment] = useState([]);
    const [addMembersPopup, setAddMembersPopup] = useState(false);
    const navigate = useNavigate();

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    useEffect(() => {
        if (formError) {
            toast.error(formError, {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
            setFormError('');
        }
    }, [formError]);

    const showPopup = () => {
        setAddMembersPopup(true);
    }

    const hidePopup = () => {
        setAddMembersPopup(false);
        fetchUsers();
    }

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
            setloggedInUserId(decodedToken.userId);

            if (!(adminRoles.includes(decodedToken.role)) && !(leaderRoles.includes(decodedToken.role))) {
                navigate("/FrontendDMS/403");
            }
        }
    }, [navigate]);

    const roleMapping = {
        standarduser: 'Standard User',
        teamleader: 'Team Leader',
        admin: 'Admin',
        guest: 'Guest',
        auditor: 'Auditor',
        developer: 'Developer'
    };

    const formatRole = (role) => roleMapping[role] || role;

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/members/${deptId}`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            const sortedUsers = data.members.sort((a, b) => {
                // Replace 'name' with the property you want to sort by
                return a.username.localeCompare(b.username);
            });

            setUsers(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchDepartment = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/details/${deptId}`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            setDepartment(data.department);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchUsers();
            fetchDepartment();
        }
    }, [loggedInUserId]);

    const filteredUsers = users.filter((user) => {
        const matchesSearchQuery = (
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const matchesFilters = !selectedRole || selectedRole === user.role;

        return matchesSearchQuery && matchesFilters;
    });

    const removeUser = async () => {
        const dataToStore = {
            departmentId: deptId,
            userId: userToDelete._id
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/remove/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    //'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dataToStore)
            });
            if (!response.ok) throw new Error('Failed to delete user');
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
        setIsDeleteModalOpen(false);
    };

    const iconMap = {
        faSearch: faSearch,
        faCalculator: faCalculator,
        faBuilding: faBuilding, // General Office / Administration
        faBriefcase: faBriefcase, // Business / HR
        faUserMd: faUserMd, // Medical / Healthcare
        faGraduationCap: faGraduationCap, // Education / Training
        faGavel: faGavel, // Legal
        faMicrochip: faMicrochip, // Technology / IT
        faChartLine: faChartLine, // Marketing / Sales
        faFlask: faFlask, // Research / Science
        faCog: faCog, // Engineering / Manufacturing
        faPencilRuler: faPencilRuler, // Design / Architecture
        faUsers: faUsers, // Human Resources
        faBalanceScale: faBalanceScale, // Law / Compliance
        faPalette: faPalette, // Arts / Creative
        faGlobe: faGlobe, // International / Public Relations
        faBook: faBook, // Library / Documentation
        faHeadset: faHeadset, // Customer Support
        faHandsHelping: faHandsHelping, // Social Services / NGO
        faDollarSign: faDollarSign, // Finance / Accounting
        faServer: faServer, // Data / Network Management
        faUniversity: faUniversity // Academic Institution
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} />
                    <p className="logo-text-dept">Department Management</p>
                </div>

                <div className="filter-fih">
                    <div className="button-container-dept">
                        <button className="but-um" onClick={showPopup}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faCirclePlus} className="button-icon" />
                                <span className="button-text">Add Members</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="sidebar-logo-dm-fi">
                    <FontAwesomeIcon icon={iconMap[department.icon]} alt="Logo" className="logo-img-dept-view" />
                    <p className="logo-text-dm-fi">{department.department}</p>
                </div>
            </div>

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="info-box-um">Number of Users: {filteredUsers.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container">
                        {adminRoles.includes(role) && (
                            <div className="burger-menu-icon-um">
                                <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} />
                            </div>
                        )}
                        {adminRoles.includes(role) && (
                            <div className="burger-menu-icon-um">
                                <FontAwesomeIcon icon={faBell} />
                            </div>
                        )}
                        {adminRoles.includes(role) && (
                            <div className="burger-menu-icon-um">
                                <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} />
                            </div>
                        )}
                        {isMenuOpen && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
                    </div>
                </div>
                <TeamTable
                    team={users}
                    setUserToDelete={setUserToDelete}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    formatRole={formatRole}
                    loggedInUserId={loggedInUserId}
                />
            </div>
            {addMembersPopup && (
                <AddMembersDept
                    closePopup={hidePopup}
                    deptID={deptId}
                    popupVisible={addMembersPopup}
                />
            )}

            {isDeleteModalOpen && (
                <DeletePopupUM
                    deleteUser={removeUser}
                    department={department.department}
                    form={"none"}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    userToDelete={userToDelete}
                />
            )}
            <ToastContainer />
        </div>
    );
};

export default DepartmentView;