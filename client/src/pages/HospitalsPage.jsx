import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const HospitalsPage = () => {
    const { api } = useContext(AuthContext);
    const [hospitals, setHospitals] = useState([]);

    useEffect(() => {
        console.log("PAGE LOADED");
        const fetchHospitals = async () => {
            try {
                const res = await api.get('/admin/hospitals');
                console.log("API DATA:", res.data);
                setHospitals(res.data);
            } catch (err) {
                console.error("API ERROR:", err); // 🔥 important
            }
        };

        fetchHospitals();
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h2>All Approved Hospitals</h2>

            {hospitals.map((h) => (
                <div key={h._id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>

                    <h3>{h.name}</h3>
                    <p>{h.email}</p>

                    {/* 🔥 LICENSE */}
                    {h.licenseUrl && (
                        <a href={h.licenseUrl} target="_blank" rel="noopener noreferrer">
                            View License
                        </a>
                    )}

                </div>
            ))}
        </div>
    );
};

export default HospitalsPage;