
import React, { useState, useEffect } from "react";
import "./RiskSource.css"; // Add styling here

const RiskSource = ({ setClose }) => {
    return (
        <div className="popup-overlay-rs">
            <div className="popup-content-rs">
                <div className="review-date-header">
                    <h2 className="review-date-title">Risk Source (Generic Energy Hazard)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="rs-table-group">
                    <div className="popup-table-wrapper-rs">
                        <table className="popup-table font-fam">
                            <thead className="rs-headers">
                                <tr>
                                    <th className="inp-size-rs">Term</th>
                                    <th className="desc-size-rs">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Biological
                                    </td>
                                    <td>
                                        Potential for positive or negative impacts resulting from interaction of activities with biological agents. This could be harm by exposure to biological hazards, flora and fauna including insect stings, bites, bacteria and other disease agents, viruses and natural poisons or environmental harm to biodiversity.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Chemical
                                    </td>
                                    <td>
                                        Potential for harm by chemicals. Includes acids, alkalis, organic substances (e.g.  gases, fuels, lubes, degreasers, solvents, paints), ozone depleting substances etc.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Climatic/ Natural Events
                                    </td>
                                    <td>
                                        Potential for harm by exposure to extreme natural , environmental or climatic sources and events (incl. lightening, high winds, flooding).
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Confined Spaces
                                    </td>
                                    <td>
                                        Potential for harm resulting from suffocation due to working in/being trapped in a confined space.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Dust / Inhalable particulates
                                    </td>
                                    <td>
                                        Potential for harm by exposure to fine dry particles of matter in the air. Dusts, mists, vapours and aerosols (coal dust, silica dust or environmental nuisance/community complaints)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Electrical
                                    </td>
                                    <td>
                                        Potential for harm to people, equipment/assets or the environment by exposure to electrical sources
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Ergonomics
                                    </td>
                                    <td>
                                        Potential for exposure to physical actions or forces, including poor design, thus presenting the potential for harm associated with exertion, excessive, unnatural or repetitive movement, poor posture or other undesired physical stress on the human body
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Explosives
                                    </td>
                                    <td>
                                        Potential for harm by exposure to explosive materials (e.g. unexploded detonators, tie down lines etc.)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        External Threats
                                    </td>
                                    <td>
                                        Potential for harm resulting from an external event outside of the operations direct control (e.g. legislation, government actions, community lobby groups, etc.)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Fire
                                    </td>
                                    <td>
                                        Potential for harm by exposure to a burning mass of material (e.g. building fires, spontaneous combustion)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Gravitational (Objects)
                                    </td>
                                    <td>
                                        Potential for harm by exposure to falling objects, unexpected movement (ground, slope, structures) due to uncontrolled gravitational forces
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Gravitational (People)
                                    </td>
                                    <td>
                                        Potential for harm to people caused by their being subject to falling, unexpected movement or in any other way resulting from their being exposed to uncontrolled gravitational forces (incl. slips, trips, falls)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Land
                                    </td>
                                    <td>
                                        Potential harm on the naturally occurring environment due to the use or management of land resulting from pollution, clearance or any other degradation
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Lighting
                                    </td>
                                    <td>
                                        Potential for harm resulting from excess light or inadequate lighting in the workplace
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Mechanical (Fixed)
                                    </td>
                                    <td>
                                        Potential for harm by exposure to interaction with sources of fixed mechanical energy (including those powered be electrical, hydraulic, pneumatic, combustion etc.)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Mechanical (Mobile)
                                    </td>
                                    <td>
                                        Potential for harm by exposure to interaction with sources of mobile (self-propelled) mechanical energy (including those powered be electrical, hydraulic, pneumatic, combustion etc.)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Magnetic
                                    </td>
                                    <td>
                                        Potential for harm to people, equipment/assets or the environment by exposure to magnetic sources (incl. handling metal objects in strong magnetic fields)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Noise
                                    </td>
                                    <td>
                                        Potential for harm by exposure to sudden or prolonged exposure to excessive noise or community complaints
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Personal / Behaviour
                                    </td>
                                    <td>
                                        Potential for harm associated with intentional undesired behavioural actions, stresses or stressors
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Pressure / Explosions
                                    </td>
                                    <td>
                                        Potential for harm by exposure to sudden release of pressure from a specific source (incl. pressure waves from explosions, pressurised systems, cylinders, springs, chains, flying bits, or community complaints associated with air blast overpressure etc.)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Psychological
                                    </td>
                                    <td>
                                        Potential for harm associated with stressors from situations, conditions or events that could create negative emotional, cognitive or behavioural outcomes
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Radiation
                                    </td>
                                    <td>
                                        Potential for harm by exposure to radiation waves whether natural or manufactured sources (characterised as either ionising or non-ionising sources)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Social / Cultural
                                    </td>
                                    <td>
                                        Potential for positive or negative impacts resulting from interaction of business' activities with social or cultural expectations includes social license to operate
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Thermal
                                    </td>
                                    <td>
                                        Potential for harm by exposure to or variations in temperature (hot or cold) but excludes anything that is on fire which has a separate category
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Vibration
                                    </td>
                                    <td>
                                        Potential for harm resulting from prolonged exposures to excessive vibration or blast vibration
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Waste
                                    </td>
                                    <td>
                                        Potential for harm caused by the inappropriate use of resources, inadequate management or disposal of waste material (includes pollution and Green House Gases)
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Water
                                    </td>
                                    <td>
                                        Potential for harm caused by the inappropriate use of water resources or inappropriate management or disposal of water
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Other
                                    </td>
                                    <td>
                                        Potential for harm by exposure to other hazard/aspects e.g. friction, bio-chemical
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default RiskSource;