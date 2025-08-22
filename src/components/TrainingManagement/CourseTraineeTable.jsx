import React, { useState, useEffect } from "react";
import "./CourseTraineeTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faX, faSearch, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';

const CourseTraineeTable = ({ trainees, courseID }) => {
  return (
    <div className="input-row">
      <div className={`course-details-input-box`}>
        <h3 className="font-fam-labels">Trainees</h3>
        <table className="font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="col-training-course-details-nr" style={{ textAlign: "center" }}>Nr</th>
              <th className="col-training-course-details-trainee" style={{ textAlign: "center" }}>Trainee Name</th>
              <th className="col-training-course-details-group" style={{ textAlign: "center" }}>Position</th>
              <th className="col-training-course-details-dept" style={{ textAlign: "center" }}>Department</th>
              <th className="col-training-course-details-comp" style={{ textAlign: "center" }}>Progress Status</th>
              <th className="col-training-course-details-action" style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{"1"}</td>
              <td style={{ fontSize: "14px" }}>{""}</td>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{""}</td>
              <td style={{ fontSize: "14px", textAlign: "center" }}>{""}</td>
              <td style={{ fontSize: "14px", textAlign: "center" }} className="courseLow">{"0%"}</td>
              <td className="col-um">
                <div className='col-training-course-details-inline-actions'>
                  <button
                    className={"action-button-user delete-button-user"}
                    style={{ width: "100%" }}
                  >
                    <FontAwesomeIcon icon={faTrash} title="Delete Course" />
                  </button>
                </div>
              </td>
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

export default CourseTraineeTable;
