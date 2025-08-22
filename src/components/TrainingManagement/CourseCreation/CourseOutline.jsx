import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import './CourseOutline.css';

const CourseOutline = ({ formData, setFormData }) => {
    const [data, setData] = useState(formData.courseOutline);

    return (
        <div className="input-row">
            <div className={`input-box-ref`}>
                <h3 className="font-fam-labels">Course Outline</h3>

                <div className="course-outline-row-split">
                    <div className={`course-outline-type-split-1`}>
                        <h3 className="font-fam-labels">Department</h3>
                        <input
                            value={formData.courseOutline.department || ""}
                            onChange={(e) => {
                                setFormData(prev => ({
                                    ...prev,
                                    courseOutline: {
                                        ...prev.courseOutline,
                                        department: e.target.value
                                    }
                                }));
                            }}
                            type="text"
                            name="site"
                            autoComplete="off"
                            className="course-outline-input"
                            placeholder="Insert Department Name"
                        />
                    </div>
                    <div className="course-outline-type-split-2">
                        <h3 className="font-fam-labels">
                            Duration
                        </h3>
                        <input
                            value={formData.courseOutline.duration || ""}
                            onChange={(e) => {
                                setFormData(prev => ({
                                    ...prev,
                                    courseOutline: {
                                        ...prev.courseOutline,
                                        duration: e.target.value
                                    }
                                }));
                            }}
                            type="text"
                            name="site"
                            autoComplete="off"
                            className="course-outline-input"
                            placeholder="Insert Course Duration (Hours)"
                        />
                    </div>
                </div>

                <div className="course-outline-row-split">
                    <div className={`course-outline-type-row`}>
                        <h3 className="font-fam-labels">Audience</h3>
                        <input
                            value={formData.courseOutline.audience || ""}
                            onChange={(e) => {
                                setFormData(prev => ({
                                    ...prev,
                                    courseOutline: {
                                        ...prev.courseOutline,
                                        audience: e.target.value
                                    }
                                }));
                            }}
                            type="text"
                            name="site"
                            autoComplete="off"
                            className="course-outline-input"
                            placeholder="Insert Audience"
                        />
                    </div>
                </div>

                {formData.courseOutline.table.length > 0 && (
                    <div className="course-outline-table-content table-borders">
                        <table>
                            <thead>
                                <tr>
                                    <th className="col-num-course-outline-data">Nr</th>
                                    <th className="col-topic-course-outline-data">Topic</th>
                                    <th className="col-time-course-outline-data">Duration</th>
                                    <th className="col-desc-course-outline-data">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.courseOutline.table.map((topic, index) => (
                                    <tr key={index}>
                                        <td className="col-um">{index + 1}</td>
                                        <td className="col-um" style={{ textAlign: "left" }}>{topic.topic}</td>
                                        <td className="col-um" style={{ textAlign: "left" }}>
                                            <input
                                                type="text"
                                                name="site"
                                                autoComplete="off"
                                                value={topic.duration || ""}
                                                onChange={(e) => {
                                                    setFormData(prev => {
                                                        const updatedTable = [...prev.courseOutline.table];
                                                        updatedTable[index] = { ...updatedTable[index], duration: e.target.value };
                                                        return { ...prev, courseOutline: { ...prev.courseOutline, table: updatedTable } };
                                                    })
                                                }}
                                                className="course-outline-input"
                                                placeholder="Insert Duration"
                                            />
                                        </td>
                                        <td className="col-um">
                                            <input
                                                type="text"
                                                name="site"
                                                autoComplete="off"
                                                value={topic.description || ""}
                                                onChange={(e) => {
                                                    setFormData(prev => {
                                                        const updatedTable = [...prev.courseOutline.table];
                                                        updatedTable[index] = { ...updatedTable[index], description: e.target.value };
                                                        return { ...prev, courseOutline: { ...prev.courseOutline, table: updatedTable } };
                                                    })
                                                }}
                                                className="course-outline-input"
                                                placeholder="Insert Description"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div >
                )}
            </div>
        </div>
    );
};

export default CourseOutline;