import React, { useState, useEffect } from "react";
import "./TraineeManagementTables.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faX, faSearch, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';

const TraineeCourseTable = ({ trainees, courseID }) => {
  return (
    <div className="input-row">
      <div className={`course-details-input-box`}>
        <h3 className="font-fam-labels">Enrolled Courses</h3>
        <table className="font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="col-trainee-details-nr" style={{ textAlign: "center" }}>Nr</th>
              <th className="col-trainee-details-trainee" style={{ textAlign: "center" }}>Course Name</th>
              <th className="col-trainee-details-group" style={{ textAlign: "center" }}>Group</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{"1"}</td>
              <td style={{ fontSize: "14px" }}>{""}</td>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{""}</td>
            </tr>
          </tbody>
        </table>

        <button className="add-row-button-trainee-table">
          Add Course
        </button>
      </div>
    </div>
  );
};

export default TraineeCourseTable;
