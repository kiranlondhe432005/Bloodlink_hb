import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";

// 📍 Click handler
const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, 15); // 🔥 smooth zoom + move
        },
    });

    return position ? <Marker position={position} /> : null;
};

// 📍 Auto center when GPS / position changes
const RecenterMap = ({ position }) => {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 15);
        }
    }, [position, map]);

    return null;
};

const RegisterMap = ({ position, setPosition }) => {
    return (
        <MapContainer
            center={position || [20.5937, 78.9629]}
            zoom={position ? 14 : 5}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
        >
            {/* 🌕 CLEAN WHITE MAP */}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* 🔄 auto center */}
            <RecenterMap position={position} />

            {/* 📍 click marker */}
            <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
    );
};

export default RegisterMap;