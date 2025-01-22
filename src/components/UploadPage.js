import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadPage.css";
import { jwtDecode } from "jwt-decode";

const UploadPage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [discipline, setDiscipline] = useState('');
  const [owner, setOwner] = useState('');
  const [champ, setChamp] = useState('');
  const [docNumSOP, setDocNumSOP] = useState('');
  const [docNumJRA, setDocNumJRA] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [users, setUsers] = useState([]); // State to hold the list of users
  const [champs, setChamps] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const adminRoles = ['admin', 'teamleader'];

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decodedToken = jwtDecode(storedToken);
      if (!(adminRoles.includes(decodedToken.role))) {
        navigate("/403");
      }
    }
  }, [navigate]);

  useEffect(() => {
    // Function to fetch users
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_URL}/api/file/`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();

        const uniqueOwners = [...new Set(data.files.map(file => file.owner))];
        const uniqueTau5Champs = [...new Set(data.files.map(file => file.Champion))];
        const uniqueDisciplines = [...new Set(data.files.map(file => file.discipline))];

        setDisciplines(uniqueDisciplines);
        setUsers(uniqueOwners); // Set users from the fetched data
        setChamps(uniqueTau5Champs);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchUsers();
  }, []); // Run only once on component mount

  const isFormValid = () => {
    return selectedFile && discipline && champ && owner && docNumJRA && docNumSOP && status;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('Champion', champ);
    formData.append('owner', owner);
    formData.append('documentNumberJRA', docNumJRA);
    formData.append('documentNumberSOP', docNumSOP);
    formData.append('discipline', discipline);
    formData.append('status', status);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(response.error || 'Failed to upload file');
      }
      await response.json();
      setSelectedFile(null);
      setDiscipline('');
      setOwner('');
      setChamp('');
      setDocNumJRA('');
      setDocNumSOP('');
      setStatus('');
      setSuccessMessage('File uploaded successfully!');
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccessMessage('');
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div className="upload-page-container">
      <button className="logo-button" onClick={() => navigate('/documentManage')}>
        <img src="/logo.webp" alt="Home" />
      </button>
      <button className="log-button" onClick={() => navigate('/')}>
        Log Out
      </button>
      <div className="upload-box">
        <h2>Upload Document</h2>
        <form onSubmit={handleFileUpload}>
          <div className="form-group">
            <label>File</label>
            <div className="custom-file-input">
              <input type="file" id="file" onChange={handleFileChange} />
              <label htmlFor="file">Choose File</label>
              {selectedFile && <span className="file-name">{selectedFile.name}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Discipline</label>
              <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                <option value="">Select Discipline</option>
                {disciplines.map((discipline, index) => (
                  <option key={index} value={discipline}>
                    {discipline}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Owner</label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option value="">Select Owner</option>
                {users.map((user, index) => (
                  <option key={index} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Champion</label>
              <select value={champ} onChange={(e) => setChamp(e.target.value)}>
                <option value="">Select Champion</option>
                {champs.map((champ, index) => (
                  <option key={index} value={champ}>
                    {champ}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Document Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select Status</option>
                <option value="in_review">In Review</option>
                <option value="in_approval">In Approval</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Document Number (JRA)</label>
              <input type="text" value={docNumJRA} onChange={(e) => setDocNumJRA(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Document Number (SOP)</label>
              <input value={docNumSOP} onChange={(e) => setDocNumSOP(e.target.value)}></input>
            </div>
          </div>
          <button type="submit" disabled={!isFormValid()}>Submit</button>
        </form>
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
      </div>
    </div>
  );
};

export default UploadPage;
