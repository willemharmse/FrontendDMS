import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const TeamManagement = ({ departments, users, fetchDepartments, addTeamMember, formatRole }) => {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [newDeptName, setNewDeptName] = useState({ department: '' });
    const [selectedUser, setSelectedUser] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const adminRoles = ['admin'];

    // Load team members when a team is selected
    const loadTeamMembers = async (deptID) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/members/${deptID}`);
            const text = await response.text();  // Read the response as text first
            console.log(text);  // Log the response text for debugging
            const data = JSON.parse(text);  // Manually parse if it's valid JSON
            setTeamMembers(data.members);
        } catch (error) {
            console.error('Error loading team members:', error);
        }
    };

    const createTeam = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newDeptName)
            });
            if (!response.ok) throw new Error('Failed to create team');

            fetchDepartments();
        } catch (error) {
            console.error('Error creating team:', error);
        }
    };

    const handleCreateDept = () => {
        createTeam(newDeptName);
        setNewDeptName({ department: '' });
        setIsAddTeamModalOpen(false);
    };

    const handleAddMember = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    departmentId: selectedTeam,
                    userId: selectedUser
                })
            });
            if (response.ok) {
                loadTeamMembers(selectedTeam);
                setIsAddMemberModalOpen(false);
                setSelectedUser('');
            } else {
                console.error('Failed to add member');
            }
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleDeleteMember = async () => {
        if (!userToDelete) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departmentId: selectedTeam, userId: userToDelete._id })
            });

            if (response.ok) {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                loadTeamMembers(selectedTeam); // Refresh the list
            } else {
                console.error('Failed to remove member');
            }
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        // Exclude users already in the department
        const isAlreadyMember = teamMembers.some(member => member._id === user._id);

        // If department has a leader, exclude team leaders
        const hasLeader = selectedTeam && departments.find(dept => dept._id === selectedTeam)?.departmentLeader;
        const isTeamLeader = user.role === 'teamleader';

        // Exclude admins
        const isAdmin = user.role === 'admin';

        return !isAlreadyMember && !isAdmin && (!hasLeader || !isTeamLeader);
    });

    return (
        <div className="tm-container">
            <div className="tm-header">
                <h1>Department Management</h1>
                <button className="tm-create-team-btn" onClick={() => setIsAddTeamModalOpen(true)}>
                    Create Department
                </button>
            </div>
            <div className="tm-select-container">
                <select
                    className="tm-team-select"
                    value={selectedTeam || ''}
                    onChange={(e) => {
                        setSelectedTeam(e.target.value);
                        loadTeamMembers(e.target.value);
                    }}
                >
                    <option value="" disabled>Select a Department</option>
                    {departments.map((department) => (
                        <option key={department._id} value={department._id}>{department.department}</option>
                    ))}
                </select>
            </div>
            <div className="tm-table-container">
                <table>
                    <thead>
                        <tr>
                            <th className="doc-num-user">Nr.</th>
                            <th className="col-name-user">Username</th>
                            <th className='col-name-user'>Role</th>
                            <th className='col-name-user'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamMembers.map((member, index) => (
                            <tr key={member._id}>
                                <td className="col">{index + 1}</td>
                                <td className="col">{member.username}</td>
                                <td className='col'>{formatRole(member.role)}</td>
                                <td>
                                    <button
                                        className="action-button-user delete-button-user"
                                        onClick={() => {
                                            setUserToDelete(member);
                                            setIsDeleteModalOpen(true);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button
                    className="tm-add-member-btn"
                    onClick={() => setIsAddMemberModalOpen(true)}
                    disabled={!selectedTeam}
                >
                    Add Member
                </button>
            </div>

            {/* Add Team Modal */}
            {isAddTeamModalOpen && (
                <div className="tm-modal-overlay">
                    <div className="tm-modal">
                        <h2>Create Department</h2>
                        <input
                            type="text"
                            className="tm-team-name-input"
                            placeholder="Department Name"
                            value={newDeptName.department}
                            onChange={(e) => setNewDeptName({ ...newDeptName, department: e.target.value })}
                        />
                        <button onClick={handleCreateDept}>Create</button>
                        <button onClick={() => setIsAddTeamModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddMemberModalOpen && (
                <div className="tm-modal-overlay">
                    <div className="tm-modal">
                        <h2>Add Member</h2>
                        <select
                            className="tm-user-select"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="" disabled>Select a User</option>
                            {filteredUsers.map((user) => (
                                <option key={user._id} value={user._id}>{user.username}</option>
                            ))}
                        </select>
                        <button onClick={handleAddMember} disabled={!selectedUser}>Add</button>
                        <button onClick={() => setIsAddMemberModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Delete Member Modal */}
            {isDeleteModalOpen && userToDelete && (
                <div className="tm-modal-overlay">
                    <div className="tm-modal">
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to remove <strong>{userToDelete.username}</strong> from the department?</p>
                        <button onClick={handleDeleteMember}>Confirm</button>
                        <button onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
