import React, { useState } from "react";
import "./PreviewWord.css";

function PreviewWord() {
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            setExtractedText(data.text); // Display extracted text
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <div className="App">
            <h1>Upload a Word Document</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Submit</button>
            </form>
            <div className="output">
                <h2>Extracted Text</h2>
                <textarea value={extractedText} readOnly rows="10" cols="50"></textarea>
            </div>
        </div>
    );
}

export default PreviewWord;
