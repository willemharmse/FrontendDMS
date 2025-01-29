import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./CreatePage.css";
import DocumentSignaturesTable from "./CreatePage/DocumentSignaturesTable";
import TermTable from "./CreatePage/TermTable";
import AbbreviationTable from "./CreatePage/Abbreviation";
import ChapterTable from "./CreatePage/ChapterTable";
import ProcedureTable from "./CreatePage/ProcedureTable";
import ReferenceTable from "./CreatePage/ReferenceTable";

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
  const adminRoles = ['admin', 'teamleader', 'developer'];
  const normalRoles = ['guest', 'standarduser', 'auditor'];

  const updateRow = (index, field, value) => {
    const updatedProcedureRows = [...formData.procedureRows];
    updatedProcedureRows[index][field] = value;  // Update the specific field in the row

    setFormData({
      ...formData,
      procedureRows: updatedProcedureRows,  // Update the procedure rows in state
    });
  };

  const capitalizeWords = (text) =>
    text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const updateRefRow = (index, field, value) => {
    const updatedRefRows = [...formData.references];
    updatedRefRows[index][field] = value;  // Update the specific field in the row

    setFormData({
      ...formData,
      references: updatedRefRows,  // Update the procedure rows in state
    });
  };

  const [formData, setFormData] = useState({
    title: "",
    documentType: "Procedure",
    aim: "",
    scope: "",
    date: new Date().toLocaleDateString(),
    version: "",
    rows: [
      { auth: "Author", name: "Willem Harmse", pos: "Software Developer", num: 1 },
      { auth: "Reviewer", name: "Abel Moetji", pos: "Engineer", num: 2 },
      { auth: "Approved By", name: "Rossouw Snyders", pos: "Operations Manager", num: 3 },
    ],
    procedureRows: [],
    abbrRows: [],
    termRows: [],
    chapters: [],
    references: []
  });

  const validateForm = () => {
    const { title, documentType, aim, references } = formData;
    return (
      title &&
      documentType &&
      aim &&
      references &&
      usedAbbrCodes.length > 0 &&
      usedTermCodes.length > 0
    );
  };

  // Authentication check
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decodedToken = jwtDecode(storedToken);
      if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
        navigate("/FrontendDMS/403");
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
    const rowToRemove = formData.rows[index];
    const newRows = [...formData.rows];
    const rowToChange = newRows[index];

    // Prevent removal of the initial required rows
    const initialRequiredRows = ["Author", "Reviewer", "Approved By"];
    if (
      initialRequiredRows.includes(rowToRemove.auth) &&
      formData.rows.filter((row) => row.auth === rowToRemove.auth).length === 1
    ) {
      alert(`You must keep at least one ${rowToRemove.auth}.`);
      return;
    }

    // If the field being changed is "name", update the position based on the selected name
    if (field === "name") {
      const selectedName = e.target.value;
      newRows[index].pos = nameToPositionMap[selectedName] || ""; // Set position based on name
    }

    newRows[index][field] = e.target.value;

    if (rowToChange.auth === 'Author') {
      newRows[index].num = 1;
    }
    else if (rowToChange.auth === 'Reviewer') {
      newRows[index].num = 2;
    }
    else if (rowToChange.auth === 'Approved By') {
      newRows[index].num = 3;
    }

    setFormData((prevFormData) => ({
      ...prevFormData, rows: newRows
    }));
  };

  // Add a new row to the table
  const addRow = () => {
    const today = new Date().toISOString().split("T")[0]; // Format the date to yyyy-mm-dd
    setFormData({
      ...formData,
      rows: [
        ...formData.rows,
        { auth: "Author", name: "Abel Moetji", pos: "Engineer", num: 1 }
      ]
    });
  };

  const addProRow = () => {
    const lastNr = formData.procedureRows.length > 0 && typeof formData.procedureRows[formData.procedureRows.length - 1].nr === 'number'
      ? formData.procedureRows[formData.procedureRows.length - 1].nr
      : 0; // Safely get the last nr value or 0 if no rows exist or nr is not a number

    setFormData({
      ...formData,
      procedureRows: [
        ...formData.procedureRows,
        {
          nr: lastNr + 1,
          mainStep: "",
          SubStep: "",
          discipline: "Engineering",       // Default value for discipline
          accountable: "Abel Moetji",      // Default value for accountable
          responsible: "Abel Moetji"
        }
      ]
    });
  };

  const removeProRow = (indexToRemove) => {
    setFormData({
      ...formData,
      procedureRows: formData.procedureRows.filter((_, index) => index !== indexToRemove),
    });
  };

  const addRefRow = () => {
    const lastNr = formData.references.length > 0 && typeof formData.references[formData.references.length - 1].nr === 'number'
      ? formData.references[formData.references.length - 1].nr
      : 0; // Safely get the last nr value or 0 if no rows exist or nr is not a number

    setFormData({
      ...formData,
      references: [
        ...formData.references,
        {
          nr: lastNr + 1,
          ref: '',
          refDesc: ''
        }
      ]
    });
  };

  const removeRefRow = (indexToRemove) => {
    setFormData({
      ...formData,
      references: formData.references.filter((_, index) => index !== indexToRemove),
    });
  };

  const removeRow = (indexToRemove) => {
    const rowToRemove = formData.rows[indexToRemove];

    // Prevent removal of the initial required rows
    const initialRequiredRows = ["Author", "Reviewer", "Approved By"];
    if (
      initialRequiredRows.includes(rowToRemove.auth) &&
      formData.rows.filter((row) => row.auth === rowToRemove.auth).length === 1
    ) {
      alert(`You must keep at least one ${rowToRemove.auth}.`);
      return;
    }

    // Proceed with removal if conditions are met
    setFormData({
      ...formData,
      rows: formData.rows.filter((_, index) => index !== indexToRemove),
    });
  };

  // Send data to backend to generate a Word document
  const handleGeneratePDF = async () => {
    const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      const blob = await response.blob();
      saveAs(blob, `${documentName}.docx`);
    } catch (error) {
      console.error("Error generating document:", error);
    }
  };

  return (
    <div className="file-create-container">
      {/* Sidebar */}
      <header className="create-header">
        <div className="header-left">
          <img src="logo.webp" alt="Left Icon" onClick={() => navigate('/FrontendDMS/home')} />
        </div>
        <button className="logout-button-cp" onClick={() => navigate('/FrontendDMS/')}>Logout</button>
      </header>

      {/* Main content */}
      <div className="main-box">
        <div className="scrollable-box">
          <h2 className="scrollable-box-title font-fam">Create Document</h2>

          <div className="input-box">
            <label className="font-fam-labels">Document Type</label>
            <select
              className="table-control font-fam"
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
            >
              <option value="Policy">Policy</option>
              <option value="Procedure">Procedure</option>
              <option value="Standard">Standard</option>
            </select>
          </div>

          <div className="input-box">
            <label className="font-fam-labels">Document Title</label>
            <div className="input-group-cpt">
              <input
                type="text"
                name="title"
                className="font-fam title-input"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={`Title of your document (e.g. Safety And Security)`}
              />
              <input
                type="text"
                className="font-fam document-type-input"
                value={formData.documentType}
                onChange={handleInputChange}
                disabled
              />
            </div>
          </div>

          <div className="input-box">
            <label className="font-fam-labels">Version</label>
            <input type="text" name="version" className="font-fam" value={formData.version} onChange={handleInputChange} />
          </div>

          <DocumentSignaturesTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} />

          <div className="input-box">
            <label className="font-fam-labels">Aim</label>
            <textarea
              name="aim"
              className="aim-textarea font-fam"
              value={formData.aim}
              onChange={handleInputChange}
              rows="4"   // Adjust the number of rows for initial height
              placeholder="Enter the aim of the document here..." // Optional placeholder text
            />
          </div>

          <AbbreviationTable formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} />
          <TermTable formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} />
          <ChapterTable formData={formData} setFormData={setFormData} />
          <ProcedureTable procedureRows={formData.procedureRows} addRow={addProRow} removeRow={removeProRow} updateRow={updateRow} />
          <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} />

          {/* Generate File Button */}
          <button
            className="generate-button font-fam"
            onClick={handleGeneratePDF}
            disabled={!validateForm()}
          >
            Generate File
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;