import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageMobileMachines.css";

const ManageMobileMachines = ({ closePopup, onClose }) => {
    const [machines, setMachines] = useState([]);
    const [selectedMachine, setSelectedMachine] = useState("");
    const [macInp, setMacInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMachines();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchMachines = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/mac`);
            setMachines(response.data.macs);
        } catch (err) {
            setError("Failed to load machines.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedMachine(selected);
        const mac = machines.find((machine) => machine.machine === selected);
        if (mac) {
            setMacInp(mac.machine || "");
        } else {
            setMacInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedMachine) {
            setError("Please select a machine.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/mac/update/${selectedMachine}`, {
                machine: macInp,
            });

            setMessage("Machine updated successfully.");
            setError("");
            setSelectedMachine("");
            setMacInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
            fetchMachines();
        } catch (err) {
            setError("Failed to update machine.");
        }
    };

    return (
        <div className="manMac-popup-container">
            <div className="manMac-popup-box">
                <h2>Manage Machines</h2>

                <div className="manMac-form-group-manage">
                    <label>Select Machine</label>
                    <select className="manMac-select" value={selectedMachine} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {machines.sort((a, b) => a.machine.localeCompare(b.machine)).map((machine) => (
                            <option key={machine.machine} value={machine.machine}>{machine.machine}</option>
                        ))}
                    </select>
                </div>

                <div className="manMac-form-group-manage">
                    <label>Machine</label>
                    <input spellcheck="true" className="manMac-input" type="text" value={macInp} onChange={(e) => setMacInp(e.target.value)} />
                </div>

                {message && <div className="manMac-message-manage">{message}</div>}
                {error && <div className="manMac-error-message-manage">{error}</div>}

                <div className="manMac-buttons-container">
                    <button className="manMac-update-button-manage" onClick={handleUpdate}>
                        Update Machine
                    </button>
                    <button className="manMac-close-button" onClick={closeFunction}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageMobileMachines;
