import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import './TraineesDetailTable.css';

const TraineesDetailTable = ({ filteredTrainees }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${day}.${month}.${year}`;
    };

    const getClass = (val) => {
        switch (val) {
            case "0 - 30%":
                return "courseLow";

            case "31 - 60%":
                return "courseMed";

            case "61 - 99%":
                return "courseGreen";

            case "100%":
                return "courseDone"
        }
    };

    return (
        <div className="table-container-course-management">
            <table>
                <thead>
                    <tr>
                        <th className="doc-num-trainer-management">Nr</th>
                        <th className="col-name-trainer-management">Trainee Name</th>
                        <th className="col-name-trainer-management">Email</th>
                        <th className="col-rev-trainer-management">Date Added</th>
                        <th className="col-action-trainer-management">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTrainees.map((trainee, index) => (
                        <tr key={index} onClick={() => navigate(`/traineeDetails/${trainee.trainerName}`)}>
                            <td className="col-um">{index + 1}</td>
                            <td className="col-um">{trainee.trainerName}</td>
                            <td className="col-um">{trainee.email}</td>
                            <td className="col-um">{trainee.dateAdded}</td>
                            <td className='col-um'>
                                <div className='inline-actions-um'>
                                    <button
                                        className={"action-button-user delete-button-user"}
                                    >
                                        <FontAwesomeIcon icon={faTrash} title="Delete Trainee" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
};

export default TraineesDetailTable;
