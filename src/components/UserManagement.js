import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import AddUserModal from './UserManagement/AddUserModal';
import DeleteUserModal from './UserManagement/DeleteUserModal';
import EditUserModal from './UserManagement/EditUserModal';
import TeamManagement from "./UserManagement/TeamManagement";
import UserTable from "./UserManagement/UserTable";

const UserManagement = () => {
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [users, setUsers] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [role, setRole] = useState('');
    const [newUser, setNewUser] = useState({ username: '', password: '', role: '' });
    const [formError, setFormError] = useState('');
    const adminRoles = ['admin', 'developer'];
    const leaderRoles = ['teamleader'];
    const [departments, setDepartments] = useState([]);
    const [showTeamManagement, setShowTeamManagement] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            console.log(decodedToken);
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
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

            setUsers(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchUsers();
            fetchTeams();
        }
    }, [loggedInUserId]);

    const createUser = async () => {
        if (!newUser.username || !newUser.password || !newUser.role) {
            setFormError('All fields are required.');
            return;
        }

        if (newUser.password.length < 8 || newUser.password.length > 30) {
            setFormError('Password must be between 8 and 30 characters.');
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

            setIsModalOpen(false);
            setNewUser({ username: '', password: '', role: '' });
            setFormError('');
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            setFormError('Failed to create user.');
        }
    };

    const deleteUser = async (userId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/delete/${userId}`, {
                method: 'DELETE',
                headers: {
                    //'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to delete user');
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
        setIsDeleteModalOpen(false);
    };

    const fetchTeams = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/`);
            if (!response.ok) {
                throw new Error('Failed to fetch teams');
            }

            const data = await response.json();
            setDepartments(data.departments);
        } catch (error) {
            setError(error.message);
        }
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
                    'Content-Type': 'application/json'
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

    const filteredUsers = users.filter((user) => {
        const isTeamLeader = leaderRoles.includes(role);

        // Team leaders should only see standard users, guests, and auditors
        const matchesRole = isTeamLeader
            ? !(adminRoles.includes(user.role) || leaderRoles.includes(user.role))
            : true;

        return matchesRole;
    });


    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            <div className="sidebar-um">
                <div className="sidebar-logo">
                    <img src="logo.webp" alt="Logo" className="logo-img" onClick={() => navigate('/FrontendDMS/home')} />
                </div>
                {role === 'admin' && (
                    <button className="sidebar-button-add sidebar-item-um" onClick={() => setShowTeamManagement(!showTeamManagement)}>
                        {showTeamManagement ? "User Management" : "Department Management"}
                    </button>
                )}
                <button
                    className="sidebar-button-add sidebar-item-um"
                    onClick={openModal}// Disable when Team Management is selected
                >
                    Add User
                </button>
                <div className="button-container-um">
                    <button className="text-format-log but-upload" onClick={() => navigate('/FrontendDMS/documentManage')}>Back</button>
                    <button className="text-format-log but-upload" onClick={handleLogout}>Log Out</button>
                </div>
            </div>

            <div className="main-box-user">
                {showTeamManagement ? (
                    <TeamManagement
                        departments={departments}
                        users={users}
                        formatRole={formatRole}
                        fetchDepartments={fetchTeams}
                    />
                ) : (
                    <UserTable
                        filteredUsers={users}
                        openEditModal={openEditModal}
                        setUserToDelete={setUserToDelete}
                        setIsDeleteModalOpen={setIsDeleteModalOpen}
                        formatRole={formatRole}
                        loggedInUserId={loggedInUserId}
                    />
                )}
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

            <DeleteUserModal
                isDeleteModalOpen={isDeleteModalOpen}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                deleteUser={deleteUser}
                userToDelete={userToDelete}
            />

            <EditUserModal
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                updateUser={updateUser}
                formError={formError}
                userToEdit={userToEdit}
                setUserToEdit={setUserToEdit}
            />
        </div>
    );
};

export default UserManagement;