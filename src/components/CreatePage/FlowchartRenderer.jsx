import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import axios from "axios";
import { toast } from "react-toastify";

cytoscape.use(dagre);

const FlowchartRenderer = ({ procedureRows, documentType, title }) => {
    const cyRef = useRef(null);
    const [cy, setCy] = useState(null);

    const capitalizeWords = (text) =>
        text
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    useEffect(() => {
        if (!procedureRows || procedureRows.length === 0) return;

        const numberedProcedureRows = procedureRows.map((row, index) => ({
            ...row,
            mainStep: `${index + 1}. ${row.mainStep}`, // Add numbering to steps
        }));

        axios.post(`${process.env.REACT_APP_URL}/api/flowIMG/generate`, {
            procedureRows: numberedProcedureRows,
            title: title,
            documentType: documentType
        })
            .then(response => {
                const { elements } = response.data;

                // Create a hidden div for rendering the graph
                const hiddenDiv = document.createElement("div");
                hiddenDiv.style.width = "1400px";
                hiddenDiv.style.height = "1000px";
                hiddenDiv.style.position = "absolute";
                hiddenDiv.style.left = "-9999px"; // Hide off-screen
                hiddenDiv.style.backgroundColor = "#fff";
                document.body.appendChild(hiddenDiv);

                const cyInstance = cytoscape({
                    container: hiddenDiv,
                    elements,
                    style: [
                        // Styling for the Document Title Node
                        {
                            selector: "[id='DocumentNode']",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#002060", // Dark blue
                                "color": "#fff", // White text
                                "border-width": 2,
                                "border-color": "#002850",
                                "font-weight": "bold",
                                "font-size": "18px",
                                "width": "300px",
                                "height": "60px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",

                            }
                        },
                        // Styling for Regular Nodes (Steps)
                        {
                            selector: "node",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9", // Gray background
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#8a8a8a",
                                "font-size": "14px",
                                "width": "300px",
                                "height": "50px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                                "text-max-width": "250px"
                            }
                        },
                        {
                            selector: "[id='CompletedNode']",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#008000", // Green color
                                "color": "#fff", // White text
                                "border-width": 2,
                                "border-color": "#8a8a8a", // Dark green border
                                "font-weight": "bold",
                                "font-size": "16px",
                                "width": "300px",
                                "height": "60px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                            }
                        },
                        {
                            selector: "[shape='circle']",
                            style: {
                                "shape": "ellipse",
                                "content": "",  // This makes the text a dot
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9",  // Makes the background transparent
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#7F7F7F",
                                "font-size": "16px",
                                "width": "30px",
                                "height": "30px",
                                "text-wrap": "wrap",
                            }
                        },
                        // Styling for Edges (Connections)
                        {
                            selector: "edge",
                            style: {
                                "width": 2,
                                "line-color": "#555",
                                "target-arrow-shape": "triangle",
                                "target-arrow-color": "#555",
                                "curve-style": "bezier",
                            }
                        }
                    ],
                    layout: { name: "dagre", rankDir: "TB", nodeSep: 50 },
                    styleEnabled: true,
                    zoom: 1,
                    pan: { x: 180, y: 180 },
                });

                setCy(cyInstance);

                cyInstance.ready(() => {
                    const documentNode = cyInstance.$("[id='DocumentNode']");
                    const completedNode = cyInstance.$("[id = 'CompletedNode']");

                    if (documentNode.length > 0) {
                        documentNode.style({
                            "background-color": "#002060", // Dark blue
                            "color": "#fff", // White text
                            "font-weight": "bold",
                            "border-color": "#002850",
                            "text-valign": "center",
                            "text-halign": "center",
                            "font-size": "16px",
                            "text-max-width": "300px",

                        });
                    } else {
                        console.error("DocumentNode not found");
                    }

                    if (completedNode.length > 0) {
                        completedNode.style({
                            "background-color": "#7F7F7F", // Dark blue
                            "color": "#fff", // White text
                            "font-weight": "bold",
                            "text-valign": "center",
                            "text-halign": "center",
                            "font-size": "16px",
                            "text-max-width": "300px",
                            "border-color": "#8a8a8a",
                        });
                    } else {
                        console.error("CompletedNode not found");
                    }
                });

                cyInstance.edges().forEach(edge => {
                    if (edge.source().data('shape') === 'circle') {
                        const targetPos = edge.target().position();
                        const sourcePos = edge.source().position();

                        const dx = targetPos.x - sourcePos.x;
                        const dy = targetPos.y - sourcePos.y;

                        // Determine bend direction based on target position
                        const bendDistance = dx > 0 ? 60 : -60; // Bend right if target is on the right, left otherwise

                        edge.style({
                            "curve-style": "taxi",
                            "taxi-direction": "downward", // Adjust based on flow
                            "line-color": "#000",
                            "width": 2,
                            "target-arrow-shape": "triangle",
                            "target-arrow-color": "#000",
                        });
                    }
                });

                cyInstance.edges().forEach(edge => {
                    if (edge.target().data('shape') === 'circle') {
                        const targetPos = edge.target().position();
                        const sourcePos = edge.source().position();

                        const dx = targetPos.x - sourcePos.x;
                        const dy = targetPos.y - sourcePos.y;

                        // Determine bend direction based on target position
                        const bendDistance = dx > 0 ? 60 : -60; // Bend right if target is on the right, left otherwise

                        edge.style({
                            "curve-style": "taxi",
                            "taxi-direction": "downward", // Adjust based on flow
                            "line-color": "#000",
                            "width": 2,
                            "target-arrow-shape": "none",
                            "target-arrow-color": "#000",
                        });
                    }
                });
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
            cy.zoomingEnabled(false);
            cy.style().selector("core").css({ "background-color": "#fff" }).update();

            const pngData = cy.png({
                full: true,
                bg: "#ffffff",
                scale: 2,
                maxWidth: 1200,
                maxHeight: 960,
                padding: 180,
            });

            const img = new Image();
            img.src = pngData;

            img.onload = () => {
                const maxAllowedHeight = 2000;
                const totalHeight = img.height;
                const numChunks = Math.ceil(totalHeight / maxAllowedHeight);

                if (numChunks === 1) {
                    // If the image is already within the limit, download directly
                    const a = document.createElement("a");
                    a.href = pngData;
                    a.download = `${capitalizeWords(title)} ${documentType} Flowchart.png`;
                    a.click();
                    return;
                }

                // **Splitting logic**
                const chunkHeight = Math.ceil(totalHeight / numChunks);
                let startY = 0;

                for (let i = 0; i < numChunks; i++) {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = Math.min(chunkHeight, totalHeight - startY); // Prevent overshooting height

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(
                        img,
                        0, startY, // Source start x, y
                        img.width, canvas.height, // Source width, height
                        0, 0, // Destination x, y
                        img.width, canvas.height // Destination width, height
                    );

                    // Download each chunk
                    const a = document.createElement("a");
                    a.href = canvas.toDataURL("image/png");
                    a.download = `${capitalizeWords(title)} ${documentType} Flowchart - Part ${i + 1}.png`;
                    a.click();

                    startY += chunkHeight;
                }
            };
        }
    };


    return (
        <button onClick={exportImage} className="top-right-button-proc">
            Download Flowchart
        </button>
    );
};

export default FlowchartRenderer;
