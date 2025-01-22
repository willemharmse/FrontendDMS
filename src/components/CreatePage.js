import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./CreatePage.css";
import DocumentSignaturesTable from "./DocumentSignaturesTable";
import TermTable from "./TermTable";
import AbbreviationTable from "./Abbreviation";
import ChapterTable from "./ChapterTable";

const CreatePage = () => {
  const navigate = useNavigate();
  const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
  const [usedTermCodes, setUsedTermCodes] = useState([]);
  const nameToPositionMap = {
    "Willem Harmse": "Software Developer",
    "Abel Moetji": "Engineer",
    "Rossouw Snyders": "Operations Manager",
    "Anzel Swanepoel": "Workspace Manager",
    "Quintin Coetzee": "Director",
    "Andre Coetzee": "Technical Co-ordinator",
  };
  const adminRoles = ['admin', 'teamleader'];
  const normalRoles = ['guest', 'standarduser', 'auditor'];

  const [formData, setFormData] = useState({
    title: "",
    documentType: "Procedure",
    documentName: "",
    dateReviewed: "",
    authorName: "",
    reviewerName: "",
    aim: "",
    scope: "",
    abbreviations: "",
    reservedWords: "",
    date: new Date().toLocaleDateString(),
    version: "1.0",
    rows: [], // Dynamic rows
    abbrRows: [],
    termRows: [],
    chapters: []
  });

  // Authentication check
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decodedToken = jwtDecode(storedToken);
      if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
        navigate("FrontendDMS/403");
      }
    }
  }, [navigate]);

  // Handle input changes for normal fields
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    console.log(formData)
  };

  // Handle input changes for the table rows
  const handleRowChange = (e, index, field) => {
    const newRows = [...formData.rows];

    // If the field being changed is "name", update the position based on the selected name
    if (field === "name") {
      const selectedName = e.target.value;
      newRows[index].pos = nameToPositionMap[selectedName] || ""; // Set position based on name
    }

    newRows[index][field] = e.target.value;
    setFormData({ ...formData, rows: newRows });
  };

  // Add a new row to the table
  const addRow = () => {
    const today = new Date().toISOString().split("T")[0]; // Format the date to yyyy-mm-dd
    setFormData({
      ...formData,
      rows: [
        ...formData.rows,
        { auth: "Admin", name: "Willem Harmse", pos: "Software Developer", date: today }
      ]
    });
  };

  const removeRow = (indexToRemove) => {
    setFormData({
      ...formData,
      rows: formData.rows.filter((_, index) => index !== indexToRemove),
    });
  };

  // Send data to backend to generate a Word document
  const handleGeneratePDF = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      const blob = await response.blob();
      saveAs(blob, `${formData.documentName}.docx`);
    } catch (error) {
      console.error("Error generating document:", error);
    }
  };

  return (
    <div className="file-create-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.webp" alt="Logo" className="logo-img" onClick={() => navigate("FrontendDMS/home")} />
        </div>
        <button className="sidebar-item text-format-log log-but" onClick={() => navigate("FrontendDMS/")}>
          Log Out
        </button>
      </div>

      {/* Main content */}
      <div className="main-box">
        <div className="scrollable-box">
          <h2 className="scrollable-box-title">Create Document</h2>

          {/* Basic Information Fields */}
          <div className="input-box">
            <label>Document Name</label>
            <input type="text" name="documentName" value={formData.documentName} onChange={handleInputChange} />
          </div>

          <div className="input-box">
            <label>Document Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} />
          </div>

          <div className="input-box">
            <label>Document Type</label>
            <select
              className="table-control"
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
            >
              <option value="Procedure">Procedure</option>
              <option value="Standard">Standard</option>
              <option value="Policy">Policy</option>
            </select>
          </div>

          <div className="input-box">
            <label>Date Reviewed</label>
            <input type="date" name="dateReviewed" value={formData.dateReviewed} onChange={handleInputChange} />
          </div>

          <DocumentSignaturesTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} />

          <div className="input-box">
            <label>Aim</label>
            <textarea
              name="aim"
              className="aim-textarea"
              value={formData.aim}
              onChange={handleInputChange}
              rows="4"   // Adjust the number of rows for initial height
              placeholder="Enter the aim of the document here..." // Optional placeholder text
            />
          </div>

          <AbbreviationTable
            formData={formData}
            setFormData={setFormData}
            usedAbbrCodes={usedAbbrCodes}
            setUsedAbbrCodes={setUsedAbbrCodes}
          />

          <TermTable
            formData={formData}
            setFormData={setFormData}
            usedTermCodes={usedTermCodes}
            setUsedTermCodes={setUsedTermCodes}
          />

          <ChapterTable formData={formData} setFormData={setFormData} />
          {/* Generate File Button */}
          <button className="generate-button" onClick={handleGeneratePDF}>Generate File</button>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;