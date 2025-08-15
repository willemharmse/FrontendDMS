import React, { useState, useEffect } from "react";
import "./CourseTrainerTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faX, faSearch, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';

const CourseTrainerTable = ({ trainees, courseID }) => {
  return (
    <div className="input-row">
      <div className={`course-details-input-box`}>
        <h3 className="font-fam-labels">Trainers</h3>
        <table className="font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="col-course-details-nr" style={{ textAlign: "center" }}>Nr</th>
              <th className="col-course-details-trainee" style={{ textAlign: "center" }}>Trainer</th>
              <th className="col-course-details-group" style={{ textAlign: "center" }}>Group</th>
              <th className="col-course-details-comp" style={{ textAlign: "center" }}>Group Completion Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{"1"}</td>
              <td style={{ fontSize: "14px" }}>{""}</td>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{"A"}</td>
              <td style={{ fontSize: "14px", textAlign: "center" }} className="courseLow">{"0%"}</td>
            </tr>
          </tbody>
        </table>

        <button className="add-row-button-trainee-table">
          Add
        </button>
      </div>
    </div>
  );
};

export default CourseTrainerTable;
