import React, { useState, useEffect } from "react";
import "./TraineeManagementTables.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faX, faSearch, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';

const TraineeCompletedCoursesTable = ({ trainees, courseID }) => {
  return (
    <div className="input-row">
      <div className={`course-details-input-box`}>
        <h3 className="font-fam-labels">Completed Courses (Certificates)</h3>
        <table className="font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="col-trainee-details-nr" style={{ textAlign: "center" }}>Nr</th>
              <th className="col-trainee-details-trainee" style={{ textAlign: "center" }}>Course Name</th>
              <th className="col-trainee-details-certificates" style={{ textAlign: "center" }}>Certificates</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{"1"}</td>
              <td style={{ fontSize: "14px" }}>{""}</td>
              <td style={{ fontSize: "14px", textAlign: "center" }}>
                <button className="view-button-trainee-table">
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TraineeCompletedCoursesTable;
