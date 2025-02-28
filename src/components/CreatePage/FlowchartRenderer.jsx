import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import axios from "axios";
import { toast } from "react-toastify";

cytoscape.use(dagre);

const FlowchartRenderer = ({ procedureRows }) => {
    const cyRef = useRef(null);
    const [cy, setCy] = useState(null);

    useEffect(() => {
        if (!procedureRows || procedureRows.length === 0) return;

        axios.post(`${process.env.REACT_APP_URL}/api/flowIMG/generate`, { procedureRows })
            .then(response => {
                const { elements } = response.data;

                // Create a hidden div for rendering the graph
                const hiddenDiv = document.createElement("div");
                hiddenDiv.style.width = "1400px";
                hiddenDiv.style.height = "1000px";
                hiddenDiv.style.position = "absolute";
                hiddenDiv.style.left = "-9999px"; // Hide it off-screen
                hiddenDiv.style.backgroundColor = "#fff"; // Ensure white background
                document.body.appendChild(hiddenDiv);

                const cyInstance = cytoscape({
                    container: hiddenDiv,
                    elements,
                    style: [
                        {
                            selector: "node",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#007bff",
                                "color": "#fff",
                                "border-width": 2,
                                "border-color": "#0056b3",
                                "text-wrap": "wrap",
                                "text-max-width": "180px",
                                "width": "mapData(label.length, 5, 50, 100, 300)",
                                "height": "mapData(label.length, 5, 50, 50, 120)"
                            }
                        },
                        {
                            selector: "edge",
                            style: {
                                "width": 2,
                                "line-color": "#555",
                                "target-arrow-shape": "triangle",
                                "target-arrow-color": "#555",
                                "curve-style": "bezier"
                            }
                        }
                    ],
                    layout: { name: "dagre", rankDir: "TB", nodeSep: 50 },
                    styleEnabled: true,
                    zoom: 1, // Ensure full image capture
                    pan: { x: 180, y: 180 },
                });

                setCy(cyInstance);
            })
            .catch(error => console.error("Error fetching flowchart data:", error));
    }, [procedureRows]);

    const exportImage = () => {
        if (procedureRows.length < 2) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("There should be at least two procedure steps or more.", {
                closeButton: false,
                style: { textAlign: 'center' }
            });
            return;
        }

        if (procedureRows.some(row => !row.mainStep.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All procedure main steps must have a value.", {
                closeButton: false,
                style: { textAlign: 'center' }
            });
            return;
        }

        if (cy) {
            cy.zoomingEnabled(false); // Disable zoom for better image consistency
            cy.style().selector("core").css({ "background-color": "#fff" }).update(); // Force white background
            const pngData = cy.png({
                full: true,
                bg: "#ffffff",
                scale: 2, // Increases resolution
                maxWidth: 1200, // Matches the div width including padding
                maxHeight: 960, // Matches the div height including padding
                padding: 180, // Ensures 180px blank space on all sides
            }); // Ensure background stays white
            const a = document.createElement("a");
            a.href = pngData;
            a.download = "flowchart.png";
            a.click();
        }
    };

    return (
        <button
            onClick={exportImage}
            className="top-right-button-proc" >
            Download Flowchart
        </button>
    );
};

export default FlowchartRenderer;
