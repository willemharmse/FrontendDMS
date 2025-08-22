import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import './CourseTable.css';
import TrainingPopupMenu from './TrainingPopupMenu';

const CourseTable = ({ filteredCourses }) => {
    const [courseFilter, setCourseFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [hoveredCourseCode, setHoveredCourseCode] = useState(null);
    const navigate = useNavigate();

    const handleCourseFilterChange = (e) => {
        setCourseFilter(e.target.value.toLowerCase());
    };

    const filteredCourseList = filteredCourses.filter((course) =>
        course.courseName.toLowerCase().includes(courseFilter)
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${day}.${month}.${year}`;
    };

    return (
        <div className="table-container-course-management">
            <table>
                <thead>
                    <tr>
                        <th className="doc-num-course-management">Nr</th>
                        <th className="col-code-course-management">Course Code</th>
                        <th className="col-name-course-management">Course Name</th>
                        <th className="col-dept-course-management">Department</th>
                        <th className="col-auth-course-management">Author</th>
                        <th className="col-rev-course-management">Review Date</th>
                        <th className="col-action-course-management">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCourseList.map((course, index) => (
                        <tr key={index}>
                            <td className="col-um">{index + 1}</td>
                            <td className="col-um">{course.courseCode}</td>
                            <td className="col-um" style={{ textAlign: "left", position: "relative" }}
                                onClick={() => setHoveredCourseCode(hoveredCourseCode === course.courseCode ? null : course.courseCode)}
                            >
                                {course.courseName}

                                {(hoveredCourseCode === course.courseCode) && (
                                    <TrainingPopupMenu isOpen={hoveredCourseCode === course.courseCode} course={course} setHoveredCourseCode={setHoveredCourseCode} />
                                )}

                            </td>
                            <td className="col-um">{course.department}</td>
                            <td className="col-um">{course.author}</td>
                            <td className="col-um">{course.reviewDate}</td>
                            <td className="col-um">
                                <div className='inline-actions-um'>
                                    <button
                                        className={"action-button-user delete-button-user"}
                                    >
                                        <FontAwesomeIcon icon={faTrash} title="Delete Course" />
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

export default CourseTable;
