import React, { useState, useEffect, useRef } from "react";
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
import PPETable from "./CreatePage/PPETable";
import HandToolTable from "./CreatePage/HandToolsTable";
import EquipmentTable from "./CreatePage/EquipmentTable";
import MaterialsTable from "./CreatePage/MaterialsTable";
import MobileMachineTable from "./CreatePage/MobileMachineTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import LoadDraftPopup from "./CreatePage/LoadDraftPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const CreatePage = () => {
  const navigate = useNavigate();
  const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
  const [usedTermCodes, setUsedTermCodes] = useState([]);
  const [usedPPEOptions, setUsedPPEOptions] = useState([]);
  const [role, setRole] = useState("");
  const [usedHandTools, setUsedHandTools] = useState([]);
  const [usedEquipment, setUsedEquipment] = useState([]);
  const [usedMobileMachine, setUsedMobileMachines] = useState([]);
  const [usedMaterials, setUsedMaterials] = useState([]);
  const [loadedID, setLoadedID] = useState('');
  const [isLoadPopupOpen, setLoadPopupOpen] = useState(false);
  const [titleSet, setTitleSet] = useState(false);
  const [userID, setUserID] = useState('');
  const autoSaveInterval = useRef(null);
  const adminRoles = ['admin', 'teamleader', 'developer'];
  const normalRoles = ['guest', 'standarduser', 'auditor'];
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    navigate('/FrontendDMS/');
  };

  const updateRow = (index, field, value) => {
    const updatedProcedureRows = [...formData.procedureRows];
    updatedProcedureRows[index][field] = value;  // Update the specific field in the row

    setFormData({
      ...formData,
      procedureRows: updatedProcedureRows,  // Update the procedure rows in state
    });
  };

  const openLoadPopup = () => setLoadPopupOpen(true);
  const closeLoadPopup = () => setLoadPopupOpen(false);

  useEffect(() => {
    if (titleSet && !autoSaveInterval.current) {
      autoSaveInterval.current = setInterval(() => {
        handleSave();
      }, 120000); // Auto-save every 1 min
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
        autoSaveInterval.current = null;
      }
    };
  }, [titleSet]);

  const handleSave = () => {
    if (formData.title !== "") {
      if (loadedID === '') {
        saveData();

        toast.success("Draft has been successfully saved", {
          closeButton: false,
          style: {
            textAlign: 'center'
          }
        })
      }
      else if (loadedID !== '') {
        updateData();

        toast.success("Draft has been successfully updated", {
          closeButton: false,
          style: {
            textAlign: 'center'
          }
        })
      }
    }
    else {
      toast.error("Please fill in at least the title field before saving.", {
        closeButton: false,
        style: {
          textAlign: 'center'
        }
      })
    }
  };

  const saveData = async () => {
    const dataToStore = {
      usedAbbrCodes,       // your current state values
      usedTermCodes,
      usedPPEOptions,
      usedHandTools,
      usedEquipment,
      usedMobileMachine,
      usedMaterials,
      formData,
      userID
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/safe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToStore),
      });
      const result = await response.json();

      if (result.id) {  // Ensure we receive an ID from the backend
        setLoadedID(result.id);  // Update loadedID to track the saved document
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const updateData = async () => {
    const dataToStore = {
      usedAbbrCodes,       // your current state values
      usedTermCodes,
      usedPPEOptions,
      usedHandTools,
      usedEquipment,
      usedMobileMachine,
      usedMaterials,
      formData,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/modifySafe/${loadedID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToStore),
      });
      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleClick = () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields marked by a *", {
        closeButton: false,
        style: {
          textAlign: 'center'
        }
      })
    } else {
      handleGeneratePDF();  // Call your function when the form is valid
    }
  };

  const loadData = async (loadID) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/getDraft/${loadID}`);
      const storedData = await response.json();
      // Update your states as needed:
      setUsedAbbrCodes(storedData.usedAbbrCodes || []);
      setUsedTermCodes(storedData.usedTermCodes || []);
      setUsedPPEOptions(storedData.usedPPEOptions || []);
      setUsedHandTools(storedData.usedHandTools || []);
      setUsedEquipment(storedData.usedEquipment || []);
      setUsedMobileMachines(storedData.usedMobileMachine || []);
      setUsedMaterials(storedData.usedMaterials || []);
      setFormData(storedData.formData || {});
      setFormData(prev => ({ ...prev }));
    } catch (error) {
      console.error('Error loading data:', error);
    }
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
    version: "1",
    rows: [
      { auth: "Author", name: "", pos: "", num: 1 },
      { auth: "Reviewer", name: "", pos: "", num: 2 },
      { auth: "Approver", name: "", pos: "", num: 3 },
    ],
    procedureRows: [],
    abbrRows: [],
    termRows: [],
    chapters: [],
    references: [],
    PPEItems: [],
    HandTools: [],
    Equipment: [],
    MobileMachine: [],
    Materials: [],
    reviewDate: 0
  });

  const validateForm = () => {
    const { title, documentType, aim, references, reviewDate } = formData;
    return (
      title &&
      documentType &&
      aim &&
      references &&
      usedAbbrCodes.length > 0 &&
      usedTermCodes.length > 0 &&
      //procedureRows.length > 0 &&
      //referenceRows.length > 0 &&
      reviewDate
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

      setUserID(decodedToken.userId);
      setRole(decodedToken.role);
    }
  }, [navigate]);

  // Handle input changes for normal fields
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    console.log(formData)

    if (e.target.name === "title" && e.target.value.trim() !== "") {
      setTitleSet(true); // Enable auto-save only after title is entered
    }
  };

  useEffect(() => {
    if (userID) {
      console.log("User ID is set:", userID);
      // Perform actions that depend on userID here
    }
  }, [userID]);

  // Handle input changes for the table rows
  const handleRowChange = (e, index, field) => {
    const newRows = [...formData.rows];
    const rowToChange = newRows[index];

    // Save the previous value of 'auth' before change for validation
    const previousAuth = rowToChange.auth;

    // Update the field value
    rowToChange[field] = e.target.value;

    // Automatically set num based on the auth type
    if (rowToChange.auth === "Author") {
      rowToChange.num = 1;
    } else if (rowToChange.auth === "Reviewer") {
      rowToChange.num = 2;
    } else if (rowToChange.auth === "Approver") {
      rowToChange.num = 3;
    }

    // Only perform validation if the 'auth' field was modified
    if (field === "auth") {
      // Check if the current 'Author', 'Reviewer', or 'Approved By' is being removed or modified
      const requiredRoles = ["Author", "Reviewer", "Approver"];

      // Check if there is at least one row with each required auth type
      const isValid = requiredRoles.every(role => {
        return formData.rows.filter((row) => row.auth === role).length > 0 || rowToChange.auth === role;
      });

      if (!isValid) {
        toast.error(`You must have at least one ${requiredRoles.find(role => formData.rows.filter((row) => row.auth === role).length === 0)}.`, {
          closeButton: false,
          style: {
            textAlign: 'center'
          }
        })

        // Revert the change if invalid
        rowToChange.auth = previousAuth;  // Revert to previous auth
        rowToChange[field] = previousAuth; // Revert the field to its previous value

        setFormData((prevFormData) => ({
          ...prevFormData,
          rows: newRows,
        }));
        return; // Prevent the update if invalid
      }
    }

    // Update formData with the new rows
    setFormData((prevFormData) => ({
      ...prevFormData,
      rows: newRows,
    }));
  };


  // Add a new row to the table
  const addRow = () => {
    setFormData({
      ...formData,
      rows: [
        ...formData.rows,
        { auth: "Author", name: "", pos: "", num: 1 }
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
          accountable: "",      // Default value for accountable
          responsible: ""
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
    const initialRequiredRows = ["Author", "Reviewer", "Approver"];
    if (
      initialRequiredRows.includes(rowToRemove.auth) &&
      formData.rows.filter((row) => row.auth === rowToRemove.auth).length === 1
    ) {
      toast.error(`You must keep at least one ${rowToRemove.auth}.`, {
        closeButton: false,
        style: {
          textAlign: 'center'
        }
      })
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
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      const blob = await response.blob();
      saveAs(blob, `${documentName}.docm`);
      setLoading(false);
      //saveAs(blob, `${documentName}.pdf`);
    } catch (error) {
      console.error("Error generating document:", error);
      setLoading(false);
    }
  };

  return (
    <div className="file-create-container">
      <button className="logo-button-create" onClick={() => navigate('/FrontendDMS/home')}>
        <img src="logo.webp" alt="Home" />
      </button>
      <h1 className="create-page-title">Create New Document</h1>
      <button className="log-button-create" onClick={handleLogout}>
        Log Out
      </button>
      <button className="import-button-create" onClick={() => navigate('/FrontendDMS/importValues')}>
        Import Values
      </button>
      <button className="load-button-create" onClick={openLoadPopup}>
        Load Draft
      </button>
      {isLoadPopupOpen && <LoadDraftPopup isOpen={isLoadPopupOpen} onClose={closeLoadPopup} setLoadedID={setLoadedID} loadData={loadData} userID={userID} />}
      <button className="save-button-create" onClick={handleSave}>
        {loadedID === '' ? "Save Draft" : "Update Draft"}
      </button>

      {/* Main content */}
      <div className="main-box">
        <div className="scrollable-box">
          <div className="input-row">
            <div className="input-box-type">
              <h3 className="font-fam-labels">Document Type <span className="required-field">*</span></h3>
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

            <div className="input-box-title">
              <h3 className="font-fam-labels">Document Title <span className="required-field">*</span></h3>
              <div className="input-group-cpt">
                <input
                  spellcheck="true"
                  type="text"
                  name="title"
                  className="font-fam title-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Title of your document (e.g. Safety And Security)"
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
          </div>

          <DocumentSignaturesTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} />

          <div className="input-box-aim-cp">
            <h3 className="font-fam-labels">Aim <span className="required-field">*</span></h3>
            <textarea
              spellcheck="true"
              name="aim"
              className="aim-textarea font-fam"
              value={formData.aim}
              onChange={handleInputChange}
              rows="4"   // Adjust the number of rows for initial height
              placeholder="Enter the aim of the document here..." // Optional placeholder text
            />
          </div>

          <PPETable formData={formData} setFormData={setFormData} usedPPEOptions={usedPPEOptions} setUsedPPEOptions={setUsedPPEOptions} role={role} />
          <HandToolTable formData={formData} setFormData={setFormData} usedHandTools={usedHandTools} setUsedHandTools={setUsedHandTools} role={role} />
          <EquipmentTable formData={formData} setFormData={setFormData} usedEquipment={usedEquipment} setUsedEquipment={setUsedEquipment} role={role} />
          <MobileMachineTable formData={formData} setFormData={setFormData} usedMobileMachine={usedMobileMachine} setUsedMobileMachine={setUsedMobileMachines} role={role} />
          <MaterialsTable formData={formData} setFormData={setFormData} usedMaterials={usedMaterials} setUsedMaterials={setUsedMaterials} role={role} />
          <AbbreviationTable formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} role={role} />
          <TermTable formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} role={role} />
          <ProcedureTable procedureRows={formData.procedureRows} addRow={addProRow} removeRow={removeProRow} updateRow={updateRow} />
          <ChapterTable formData={formData} setFormData={setFormData} />
          <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} />

          <div className="input-row-but-review">
            <div className="input-box-3">
              <h3 className="font-fam-labels">Review Period (Months) <span className="required-field">*</span></h3>
              <input
                type="number"
                name="reviewDate"
                className="aim-textarea font-fam"
                value={formData.reviewDate}
                onChange={handleInputChange}
                placeholder="Enter the review period in months" // Optional placeholder text
              />
            </div>

            {/* Generate File Button */}
            <button
              className="generate-button font-fam"
              onClick={handleClick}
              title={validateForm() ? "" : "Fill in all fields marked by a * before generating the file"}
            >
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Generate File'}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default CreatePage;