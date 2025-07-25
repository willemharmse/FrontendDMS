import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import AddUserModal from './UserManagement/AddUserModal';
import EditUserModal from './UserManagement/EditUserModal';
import UserTable from "./UserManagement/UserTable";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import DeletePopupUM from "./UserManagement/DeletePopupUM";
import TopBar from "./Notifications/TopBar";

const UserManagement = () => {
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [users, setUsers] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");
    const [userToDelete, setUserToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [role, setRole] = useState('');
    const [newUser, setNewUser] = useState({ username: '', password: '', role: '' });
    const [formError, setFormError] = useState('');
    const adminRoles = ['admin', 'developer'];
    const leaderRoles = ['teamleader'];
    const [roles, setRoles] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const navigate = useNavigate();

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/');
    };

    useEffect(() => {
        if (formError) {
            toast.error(formError, {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
            setFormError('');
        }
    }, [formError]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            console.log(decodedToken);
            setRole(decodedToken.role);
            setloggedInUserId(decodedToken.userId);

            if (!(adminRoles.includes(decodedToken.role)) && !(leaderRoles.includes(decodedToken.role))) {
                navigate("/403");
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {

                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            // Sort users by a specific property, e.g., 'name'
            const sortedUsers = data.users.sort((a, b) => {
                // Replace 'name' with the property you want to sort by
                return a.username.localeCompare(b.username);
            });

            const uniqueRoles = [...new Set(data.users.map(user => user.role))].sort();
            setRoles(uniqueRoles);
            setUsers(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchUsers();
        }
    }, [loggedInUserId]);

    const createUser = async () => {
        if (!newUser.username || !newUser.email || !newUser.role) {
            setFormError('All fields are required.');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });
            if (!response.ok) throw new Error('Failed to create user');

            toast.success("User account created.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })

            setIsModalOpen(false);
            setNewUser({ username: '', email: '', role: '' });
            setFormError('');
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            setFormError('Failed to create user.');
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearchQuery = (
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const matchesFilters = !selectedRole || selectedRole === user.role;

        return matchesSearchQuery && matchesFilters;
    });

    const deleteUser = async (userId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/delete/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('Failed to delete user');
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
        setIsDeleteModalOpen(false);
    };

    const updateUser = async () => {
        if (!userToEdit.username || !userToEdit.role) {
            setFormError('All fields except password are required.');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/update/${userToEdit._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userToEdit),
            });
            if (!response.ok) throw new Error('Failed to update user');

            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error) {
            setFormError('Failed to update user.');
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormError('');
    };

    const openEditModal = (user) => {
        setUserToEdit({ ...user, password: '' }); // Do not pre-fill the password
        setIsEditModalOpen(true);
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Admin Page</p>
                    </div>

                    <div className="filter-um">
                        <p className="filter-text-um" style={{ marginBottom: "5px" }}>Filter</p>
                        <div className="um-info-popup-page-select-container">
                            <select className="select-filter-um remove-default-styling" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                <option value="">Role</option>
                                {roles
                                    .map((role, index) => (
                                        <option key={index} value={role}>
                                            {formatRole(role)}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="button-container-um">
                        <button className="but-um" onClick={openModal}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faUser} className="button-icon" />
                                <span className="button-text">Add User</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/adminUsersInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{`Manage Users`}</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="info-box-um">Number of Users: {filteredUsers.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>
                <UserTable
                    filteredUsers={filteredUsers}
                    openEditModal={openEditModal}
                    setUserToDelete={setUserToDelete}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    formatRole={formatRole}
                    loggedInUserId={loggedInUserId}
                />
            </div>

            <AddUserModal
                isModalOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                createUser={createUser}
                formError={formError}
                newUser={newUser}
                setNewUser={setNewUser}
                role={role}
            />

            {isDeleteModalOpen && (
                <DeletePopupUM
                    deleteUser={deleteUser}
                    department={"none"}
                    form={"user"}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    userToDelete={userToDelete}
                />
            )}

            <EditUserModal
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                updateUser={updateUser}
                formError={formError}
                userToEdit={userToEdit}
                setUserToEdit={setUserToEdit}
            />
            <ToastContainer />
        </div>
    );
};

export default UserManagement;