import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Polyline } from 'react-leaflet';
import { Icon, latLngBounds } from 'leaflet';
import { useAirfieldStore } from '@/store/airfield-store';
import { Airfield, FlightPath } from '@/types/airfield';
import 'leaflet/dist/leaflet.css';

// const iconSize: Point(26, 38, false);
// const iconAnchor = [16, 41];
// const popupAnchor = [1, -34];
// const shadowSize = [38, 38];

// Fix for default icon issue in Leaflet with bundlers
const defaultIcon = new Icon({
  iconUrl: '/pin_icon_blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 38], 
  iconAnchor: [13, 38],
  popupAnchor: [1, -34],
  shadowSize: [38, 38]
});

const visitedIcon = new Icon({
  iconUrl: '/pin_icon_green.png',
  shadowUrl: '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 38], 
  iconAnchor: [13, 38],
  popupAnchor: [1, -34],
  shadowSize: [38, 38]
});

const plannedIcon = new Icon({
  iconUrl: '/pin_icon_yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 38], 
  iconAnchor: [13, 38],
  popupAnchor: [1, -34],
  shadowSize: [38, 38]
});

const homeIcon = new Icon({
  iconUrl: '/pin_icon_red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 38], 
  iconAnchor: [13, 38],
  popupAnchor: [1, -34],
  shadowSize: [38, 38]
});

// Component to recenter map when home airfield changes
const MapRecenter = ({ airfield }: { airfield: Airfield | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (airfield) {
      map.setView([airfield.coordinates.lat, airfield.coordinates.lng], 9);
    }
  }, [map, airfield]);
  
  return null;
};

interface MapViewProps {
  onMarkerClick?: (airfield: Airfield) => void;
  onFlightPathClick?: (flightPath: FlightPath) => void;
  selectedFlightPath?: FlightPath | null;
  className?: string;
}

const MapClickHandler = ({ resetSelectedFlightPath }: { resetSelectedFlightPath: () => void }) => {
  const map = useMap();
  useEffect(() => {
    const handleClick = (e: any) => {
      // Prevent default click behavior
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      resetSelectedFlightPath();
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map]);
  
  return null;
}

const MapView = ({ onMarkerClick, onFlightPathClick, selectedFlightPath, className = '' }: MapViewProps) => {
  const { airfields, flightPaths, homeAirfieldId } = useAirfieldStore();
  const [selectedAirfieldId, setSelectedAirfieldId] = useState<string | null>(null);
  
  // Find home airfield if it exists
  const homeAirfield = useMemo(() => 
    homeAirfieldId ? airfields.find(a => a.id === homeAirfieldId) || null : null, 
    [airfields, homeAirfieldId]
  );
  
  // Default center coordinates - use home airfield or first airfield or fallback
  const defaultCenter = useMemo(() => {
    if (homeAirfield) return [homeAirfield.coordinates.lat, homeAirfield.coordinates.lng];
    if (airfields.length > 0) return [airfields[0].coordinates.lat, airfields[0].coordinates.lng];
    return [50.32389, 2.80278];
  }, [airfields, homeAirfield]);
  
  const handleMarkerClick = (airfield: Airfield) => {
    setSelectedAirfieldId(airfield.id);
    if (onMarkerClick) onMarkerClick(airfield);
  };
  
  // Determine which icon to use for each marker
  const getMarkerIcon = (airfield: Airfield) => {
    if (airfield.id === homeAirfieldId) return homeIcon;
    if (airfield.visited) return visitedIcon;
    if (airfield.planned) return plannedIcon;
    return defaultIcon;
  };
  
  // Auto-fit map to flight path if selected
  const FlightPathFit = ({ flightPath }: { flightPath: FlightPath | null }) => {
    const map = useMap();
    
    useEffect(() => {
      if (flightPath && flightPath.coordinates.length > 0) {
        const bounds = latLngBounds(flightPath.coordinates.map(coord => [coord[0], coord[1]]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [map, flightPath]);
    
    return null;
  };

  // Get departure and arrival airfields for a flight path
  const getFlightEndpoints = (flightPath: FlightPath) => {
    const departure = flightPath.departure ? airfields.find(a => a.id === flightPath.departure) : undefined;
    const arrival = flightPath.arrival ? airfields.find(a => a.id === flightPath.arrival) : undefined;
    return { departure, arrival };
  };

  // Handle flight path click
  const handleFlightPathClick = (flightPath: FlightPath) => {
    onFlightPathClick(flightPath);
  };

  // Clear the selected flight path
  const resetSelectedFlightPath = () => {
    onFlightPathClick(null);
  };

  return (
    <div className={`w-full h-full rounded-md overflow-hidden ${className}`}>
      <MapContainer
        center={[defaultCenter[0], defaultCenter[1]]} 
        zoom={9} 
        style={{ height: '100%', width: '100%' }}
        className='z-5'
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {homeAirfield && <MapRecenter airfield={homeAirfield} />}
        
        {/* Display flight paths */}
        {flightPaths.map(flightPath => (
          <Polyline
            key={flightPath.id}
            positions={flightPath.coordinates}
            pathOptions={{
              color: '#d53f94ff',
              weight: 4,
              opacity: selectedFlightPath === null ? 0.9 : selectedFlightPath?.id === flightPath.id ? 1 : 0.4
            }}
            eventHandlers={{
              click: () => handleFlightPathClick(flightPath)
            }}
          >
            <Tooltip direction="top">
              {flightPath.name} ({flightPath.date})
            </Tooltip>
          </Polyline>
        ))}
        
        {/* Display all airfields */}
        {airfields.map(airfield => (
          <Marker
            key={airfield.id}
            position={[airfield.coordinates.lat, airfield.coordinates.lng]}
            icon={getMarkerIcon(airfield)}
            eventHandlers={{
              click: () => handleMarkerClick(airfield)
            }}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={1}>
              {airfield.id === homeAirfieldId ? '🏠 ' : ''}
              {airfield.name} {airfield.icao ? `(${airfield.icao})` : ''}
            </Tooltip>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold">{airfield.name}</h3>
                {airfield.icao && <p className="text-sm">ICAO: {airfield.icao}</p>}
                {airfield.elevation !== undefined && <p className="text-sm">Elevation: {airfield.elevation} ft</p>}
                {airfield.runwayLength && <p className="text-sm">Runway: {airfield.runwayLength}m {airfield.runwaySurface ? ', ' + airfield.runwaySurface + 'm' : '' }</p>}
                <p className="text-sm">Status: {airfield.visited ? 'Visited' : airfield.planned ? 'Planned' : 'Not Visited'}</p>
                {airfield.id === homeAirfieldId && <p className="text-sm font-bold text-primary">Home Airfield</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Auto fit to selected flight path */}
        {selectedFlightPath && <FlightPathFit flightPath={selectedFlightPath} />}

        {/* Click handler to reset selected flight path */}
        {selectedFlightPath && <MapClickHandler resetSelectedFlightPath={resetSelectedFlightPath} />}
      </MapContainer>
    </div>
  );
};

export default MapView;