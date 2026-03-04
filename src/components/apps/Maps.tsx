'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, LocateFixed, Mic } from "lucide-react";
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';

// Fix for default marker icon issue with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


function LocationMarker() {
    const map = useMap();
    
    const findLocation = () => {
        map.locate().on('locationfound', function (e) {
            map.flyTo(e.latlng, 14);
        });
    }

    return (
         <button onClick={findLocation} className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-black">
            <LocateFixed size={20} />
        </button>
    )
}

const Maps = () => {
    const { t } = useI18n();
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
    }, []);
    
    const position: L.LatLngExpression = [41.3874, 2.1686]; // Barcelona

    return (
        <div className="w-full h-full relative">
            {isClient && (
                <MapContainer center={position} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={position}>
                        <Popup>
                            Barcelona
                        </Popup>
                    </Marker>

                    <div className="leaflet-top leaflet-right p-2.5">
                        <div className="flex flex-col gap-2">
                             <LocationMarker />
                        </div>
                    </div>
                </MapContainer>
            )}
            <div className="absolute bottom-4 left-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg z-[1100]">
                <div className="flex items-center">
                    <div className="flex-1 flex items-center">
                        <Search className="w-5 h-5 text-neutral-500 mx-3" />
                        <input 
                            type="text"
                            placeholder={t('maps.searchPlaceholder')}
                            className="bg-transparent w-full focus:outline-none text-black text-lg"
                        />
                    </div>
                     <Button variant="ghost" size="icon" className="text-neutral-500">
                        <Mic />
                    </Button>
                </div>
            </div>
            <style jsx global>{`
                .leaflet-container .leaflet-pane,
                .leaflet-container .leaflet-top,
                .leaflet-container .leaflet-bottom {
                    z-index: 40;
                }
            `}</style>
        </div>
    );
};

export default Maps;
