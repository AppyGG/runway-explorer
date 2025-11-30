import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Polyline } from 'react-leaflet';
import { Icon, latLngBounds, LatLng } from 'leaflet';
import { useAirfieldStore } from '@/store/airfield-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { Airfield, FlightPath } from '@/types/airfield';
import { Button } from '@/components/ui/button';
import { Layers, Maximize2, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeatmapLayer from './HeatmapLayer';
import '@/lib/smoothWheelZoom'
import 'leaflet/dist/leaflet.css';

// Define available map styles
interface MapStyle {
  name: string;
  url: string;
  attribution: string;
  id?: string; // For translation purposes
  apiKey?: string; // For services requiring API keys
}

const mapStyles: MapStyle[] = [
  {
    id: 'openStreetMap',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    id: 'openTopoMap',
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>'
  },
  // {
  //   id: 'openAIP',
  //   name: 'OpenAIP Aviation',
  //   url: 'https://api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png',
  //   attribution: '&copy; <a href="https://www.openaip.net/">OpenAIP</a> contributors',
  //   apiKey: OPENAIP_API_KEY
  // }
];

// Fix for default icon issue in Leaflet with bundlers
const defaultIcon = new Icon({
  iconUrl: '/pins/pin_icon_blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 38], 
  iconAnchor: [13, 38],
  popupAnchor: [1, -34],
  shadowSize: [38, 38]
});

const visitedIcon = new Icon({
  iconUrl: '/pins/pin_icon_green.png',
  shadowUrl: '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 38], 
  iconAnchor: [13, 38],
  popupAnchor: [1, -34],
  shadowSize: [38, 38]
});

const plannedIcon = new Icon({
  iconUrl: '/pins/pin_icon_yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 38], 
  iconAnchor: [13, 38],
  popupAnchor: [1, -34],
  shadowSize: [38, 38]
});

const homeIcon = new Icon({
  iconUrl: '/pins/pin_icon_red.png',
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
  airfields?: Airfield[]; // Optional: for shared view
  flightPaths?: FlightPath[]; // Optional: for shared view
  onMarkerClick?: (airfield: Airfield) => void;
  onFlightPathClick?: (flightPath: FlightPath) => void;
  selectedFlightPath?: FlightPath | null;
  className?: string;
  readOnly?: boolean; // Read-only mode for shared view
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

const MapView = ({ 
  airfields: propsAirfields, 
  flightPaths: propsFlightPaths,
  onMarkerClick, 
  onFlightPathClick, 
  selectedFlightPath, 
  className = '',
  readOnly = false
}: MapViewProps) => {
  const storeData = useAirfieldStore();
  const { map: mapPreferences } = usePreferencesStore();
  
  // Use props if provided (shared view), otherwise use store (normal view)
  const airfields = propsAirfields || storeData.airfields;
  const flightPaths = propsFlightPaths || storeData.flightPaths;
  const homeAirfieldId = readOnly ? null : storeData.homeAirfieldId;
  const [selectedAirfieldId, setSelectedAirfieldId] = useState<string | null>(null);
  const [currentMapStyleIndex, setCurrentMapStyleIndex] = useState(0);
  const stylePopupRef = useRef<HTMLDivElement | null>(null);

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
        // Use double requestAnimationFrame to ensure the Polyline is fully rendered
        // First RAF: ensures React has committed the changes to the DOM
        // Second RAF: ensures the browser has painted the changes
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const bounds = latLngBounds(flightPath.coordinates.map(coord => [coord[0], coord[1]]));
            map.fitBounds(bounds, { padding: [50, 50] });
          });
        });
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

  // Get current map style
  const currentMapStyle = mapStyles[currentMapStyleIndex]; 
  
  // State for map style popup visibility
  const [stylePopupVisible, setStylePopupVisible] = useState(false);

  // Function to change map style
  const changeMapStyle = (index: number) => {
    setCurrentMapStyleIndex(index);
    setStylePopupVisible(false);
  };

  // Handle click outside to close the popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stylePopupRef.current && !stylePopupRef.current.contains(event.target as Node)) {
        setStylePopupVisible(false);
      }
    };

    if (stylePopupVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [stylePopupVisible]);

  // Map Style selector component that updates the TileLayer
  const MapStyleControl = () => {
    const map = useMap();
    
    useEffect(() => {
      // This effect is just to handle map initialization
      // The actual style changes happen through the TileLayer props
    }, [map]);
    
    return null;
  };

  // Auto-zoom modes
  type AutoZoomMode = 'airfields' | 'flightPaths' | null;
  const [autoZoomMode, setAutoZoomMode] = useState<AutoZoomMode>(null);

  // Auto-zoom component that fits the map to the selected mode
  const AutoZoomControl = ({ mode }: { mode: AutoZoomMode }) => {
    const map = useMap();
    
    useEffect(() => {
      if (!mode) return;
      
      let bounds: any = null;
      
      if (mode === 'airfields' && airfields.length > 0) {
        // Fit to all airfields
        const coords = airfields.map(a => new LatLng(a.coordinates.lat, a.coordinates.lng));
        bounds = latLngBounds(coords);
      } else if (mode === 'flightPaths' && flightPaths.length > 0) {
        // Fit to all flight paths
        const allCoords: [number, number][] = [];
        flightPaths.forEach(fp => {
          allCoords.push(...fp.coordinates);
        });
        if (allCoords.length > 0) {
          bounds = latLngBounds(allCoords);
        }
      }
      
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [map, mode]);
    
    return null;
  };

  // Toggle auto-zoom mode
  const toggleAutoZoom = () => {
    if (autoZoomMode === null) {
      setAutoZoomMode('airfields');
    } else if (autoZoomMode === 'airfields') {
      setAutoZoomMode('flightPaths');
    } else {
      setAutoZoomMode(null);
    }
  };

  // Get button label for auto-zoom
  const { t } = useTranslation();
  const getAutoZoomLabel = () => {
    if (autoZoomMode === null) return t('map.autoZoom.off');
    if (autoZoomMode === 'airfields') return t('map.autoZoom.airfields');
    return t('map.autoZoom.flightPaths');
  };

  // Toggle heatmap
  const toggleHeatmap = () => {
    usePreferencesStore.getState().updateMapPreferences({
      showHeatmap: !mapPreferences.showHeatmap
    });
  };

  return (
    <div className={`w-full h-full rounded-md overflow-hidden relative ${className}`}>
       {/* Map Controls - positioned absolutely over the map */}
        <div className="absolute top-2 right-2 z-[500] flex flex-col gap-2">
          {/* Heatmap toggle button */}
          <Button 
            variant={mapPreferences.showHeatmap ? "default" : "secondary"}
            size="sm" 
            onClick={toggleHeatmap}
            title={t('map.heatmap.tooltip')}
          >
            <Flame className="h-4 w-4 mr-1" />
            {t('map.heatmap.label')}
          </Button>
          
          {/* Auto-zoom button */}
          <Button 
            variant={autoZoomMode !== null ? "default" : "secondary"}
            size="sm" 
            onClick={toggleAutoZoom}
            title={t('map.autoZoom.tooltip')}
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            {getAutoZoomLabel()}
          </Button>
          
          {/* Map Style Selector */}
          <div className="relative" ref={stylePopupRef}>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setStylePopupVisible(!stylePopupVisible)}
            >
              <Layers className="h-4 w-4 mr-1" />
              {currentMapStyle.name}
            </Button>
            
            {/* Style selector popup */}
            {stylePopupVisible && (
              <div className="absolute top-full right-0 mt-1 rounded-md bg-secondary shadow-md p-2 z-[600] min-w-[180px] border">
                <div className="space-y-1">
                  {mapStyles.map((style, index) => (
                    <div 
                      key={style.name}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer ${
                        index === currentMapStyleIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-primary'
                      }`}
                      onClick={() => changeMapStyle(index)}
                    >
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                        index === currentMapStyleIndex ? 'border-primary border-2' : 'border border-muted-foreground'
                      }`}>
                        {index === currentMapStyleIndex && 
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        }
                      </div>
                     <span className="text-sm">{style.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      
      <MapContainer
        center={[defaultCenter[0], defaultCenter[1]]} 
        zoom={9} 
        style={{ height: '100%', width: '100%' }}
        className='z-5'
        scrollWheelZoom={false}
        smoothWheelZoom={true} // Smooth scroll plugin
        smoothSensitivity={1}
      >
        <TileLayer
            attribution={currentMapStyle.attribution}
            url={currentMapStyle.url + (currentMapStyle.apiKey ? `?apikey=${currentMapStyle.apiKey}` : '')}
        />
        
        {homeAirfield && <MapRecenter airfield={homeAirfield} />}
        
        {/* Heatmap layer */}
        {mapPreferences.showHeatmap && (
          <HeatmapLayer 
            flightPaths={flightPaths}
            intensity={mapPreferences.heatmapIntensity}
            radius={mapPreferences.heatmapRadius}
            maxIntensity={1}
          />
        )}
        
        {/* Display flight paths */}
        {!mapPreferences.showHeatmap && flightPaths.map(flightPath => {
          const isSelected = selectedFlightPath?.id === flightPath.id;
          const hasSelection = selectedFlightPath !== null;
          
          // Determine if this path should be hidden
          const shouldHide = hasSelection && !isSelected && mapPreferences.hideOtherFlightPaths;
          
          // Skip rendering if should be hidden
          if (shouldHide) return null;
          
          // Determine opacity
          let opacity = 0.9;
          if (hasSelection) {
            if (isSelected) {
              opacity = 1;
            } else if (mapPreferences.fadeOtherFlightPaths) {
              opacity = mapPreferences.otherFlightPathsOpacity;
            }
          }
          
          // Determine color and weight
          const color = isSelected ? mapPreferences.selectedFlightPathColor : mapPreferences.flightPathColor;
          const weight = isSelected ? mapPreferences.selectedFlightPathWidth : mapPreferences.flightPathWidth;
          
          return (
            <Polyline
              key={flightPath.id}
              positions={flightPath.coordinates}
              pathOptions={{
                color: color,
                weight: weight,
                opacity: opacity
              }}
              eventHandlers={{
                click: () => handleFlightPathClick(flightPath)
              }}
            >
              <Tooltip direction="top">
                {flightPath.name} ({flightPath.date})
              </Tooltip>
            </Polyline>
          );
        })}
        
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

        {/* Auto-zoom control */}
        <AutoZoomControl mode={autoZoomMode} />

        {/* Click handler to reset selected flight path */}
        {selectedFlightPath && <MapClickHandler resetSelectedFlightPath={resetSelectedFlightPath} />}
      </MapContainer>
    </div>
  );
};

export default MapView;