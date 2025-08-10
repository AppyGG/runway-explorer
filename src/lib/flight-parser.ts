import { FlightPath } from '@/types/airfield';
import { v4 as uuidv4 } from 'uuid';

// Determine if the file is KML or GPX based on content
export const determineFileType = (content: string): 'KML' | 'GPX' | null => {
  if (content.includes('<kml') || content.includes('http://www.opengis.net/kml')) {
    return 'KML';
  } else if (content.includes('<gpx') || content.includes('http://www.topografix.com/GPX')) {
    return 'GPX';
  }
  return null;
};

// Parse KML file content
export const parseKML = (content: string, fileName: string): FlightPath | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Extract name from the KML file (use Placemark name or filename)
    let name = fileName.replace(/\.[^/.]+$/, ""); // Default to filename without extension
    const placemarkName = xmlDoc.querySelector('Placemark > name');
    if (placemarkName && placemarkName.textContent) {
      name = placemarkName.textContent.trim();
    }
    
    // Extract coordinates from LineString or Track
    let coordinatesString = '';
    const lineStringCoordinates = xmlDoc.querySelector('LineString > coordinates');
    const gxTrack = xmlDoc.querySelector('gx\\:Track');
    
    const traceDate = extractDateFromFileName(fileName) ?? new Date().toISOString().split('T')[0];

    if (lineStringCoordinates && lineStringCoordinates.textContent) {
      coordinatesString = lineStringCoordinates.textContent.trim();
    } else if (gxTrack) {
      // Handle gx:Track format with separate coordinate elements
      const coords: Array<[number, number]> = [];
      const coordNodes = gxTrack.querySelectorAll('gx\\:coord');
      
      coordNodes.forEach(node => {
        if (node.textContent) {
          const parts = node.textContent.trim().split(' ');
          if (parts.length >= 2) {
            // KML format is longitude, latitude, [altitude]
            coords.push([parseFloat(parts[1]), parseFloat(parts[0])]);
          }
        }
      });

      return {
        id: uuidv4(),
        name,
        date: traceDate,
        coordinates: coords,
        fileType: 'KML',
        fileName
      };
    }
    
    if (!coordinatesString) {
      console.error('No coordinates found in KML file');
      return null;
    }
    
    // Parse coordinates from KML format (lon,lat,alt lon,lat,alt ...)
    const coordinates = coordinatesString
      .split(/\s+/)
      .filter(coord => coord.trim())
      .map(coord => {
        const parts = coord.split(',');
        if (parts.length < 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) {
          return null;
        }
        const [lon, lat] = parts;
        return [parseFloat(lat), parseFloat(lon)] as [number, number];
      })
      .filter(Boolean) as [number, number][];
    
    if (coordinates.length < 2) {
      console.error('Not enough coordinates found in KML file');
      return null;
    }
    
    return {
      id: uuidv4(),
      name,
      date: traceDate,
      coordinates,
      fileType: 'KML',
      fileName
    };
    
  } catch (error) {
    console.error('Error parsing KML file:', error);
    return null;
  }
};

// Parse GPX file content
export const parseGPX = (content: string, fileName: string): FlightPath | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Extract name from the GPX file (use track name or filename)
    let name = fileName.replace(/\.[^/.]+$/, ""); // Default to filename without extension
    const trackName = xmlDoc.querySelector('trk > name');
    if (trackName && trackName.textContent) {
      name = trackName.textContent.trim();
    }
    
    // Get all track points
    const trackPoints = xmlDoc.querySelectorAll('trkpt');
    if (trackPoints.length === 0) {
      console.error('No track points found in GPX file');
      return null;
    }
    
    // Extract coordinates from track points
    const coordinates = Array.from(trackPoints).map(point => {
      const lat = point.getAttribute('lat');
      const lon = point.getAttribute('lon');
      if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) return null;
      return [parseFloat(lat), parseFloat(lon)] as [number, number];
    }).filter(Boolean) as Array<[number, number]>;
    
    if (coordinates.length < 2) {
      console.error('Not enough valid coordinates found in GPX file');
      return null;
    }
    
    // Extract date from metadata if available
    let date = new Date().toISOString().split('T')[0]; // Default to today
    const timeElement = xmlDoc.querySelector('metadata > time');
    if (timeElement && timeElement.textContent) {
      try {
        date = new Date(timeElement.textContent).toISOString().split('T')[0];
      } catch (e) {
        date = extractDateFromFileName(fileName) ?? new Date().toISOString().split('T')[0];
      }
    } else {
      date = extractDateFromFileName(fileName) ?? new Date().toISOString().split('T')[0];
    }

    return {
      id: uuidv4(),
      name,
      date,
      coordinates,
      fileType: 'GPX',
      fileName
    };
    
  } catch (error) {
    console.error('Error parsing GPX file:', error);
    return null;
  }
};

// Parse flight data from file content
export const parseFlightFile = async (file: File): Promise<FlightPath | null> => {
  try {
    const content = await file.text();
    const fileType = determineFileType(content);
    
    if (!fileType) {
      throw new Error('Unsupported file format. Please upload KML or GPX files only.');
    }
    
    if (fileType === 'KML') {
      return parseKML(content, file.name);
    } else {
      return parseGPX(content, file.name);
    }
    
  } catch (error) {
    console.error('Error parsing flight file:', error);
    return null;
  }
};

// Calculate flight statistics
export const calculateFlightStatistics = (flightPath: FlightPath) => {
  const { coordinates } = flightPath;
  
  if (coordinates.length < 2) {
    return {
      totalDistance: 0,
      maxAltitude: 0,
      avgAltitude: 0,
      maxSpeed: 0,
      avgSpeed: 0,
      duration: 0,
      waypointCount: 0
    };
  }
  
  // Calculate total distance in nautical miles
  const totalDistance = coordinates.reduce((acc, coord, idx) => {
    if (idx === 0) return 0;
    const prevCoord = coordinates[idx - 1];
    return acc + calculateDistance(prevCoord[0], prevCoord[1], coord[0], coord[1]);
  }, 0);
  
  // For demo purposes, let's create some simulated values
  // In a real app, these would come from the actual GPX/KML data
  
  // Generate some plausible altitude data based on coordinates length
  const simMaxAltitude = 1000 + Math.floor(Math.random() * 9000); // Between 1000-10000 ft
  const simAvgAltitude = Math.floor(simMaxAltitude * 0.7); // About 70% of max altitude
  
  // Generate some plausible speed data
  const simMaxSpeed = 90 + Math.floor(Math.random() * 110); // Between 90-200 knots
  const simAvgSpeed = Math.floor(simMaxSpeed * 0.75); // About 75% of max speed
  
  // Calculate approximate duration based on distance and average speed (in hours)
  const simDuration = totalDistance / Math.max(simAvgSpeed, 1);
  const durationHours = Math.floor(simDuration);
  const durationMinutes = Math.floor((simDuration - durationHours) * 60);
  
  return {
    totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal place
    maxAltitude: simMaxAltitude,
    avgAltitude: simAvgAltitude,
    maxSpeed: simMaxSpeed,
    avgSpeed: simAvgSpeed,
    duration: simDuration,
    durationFormatted: `${durationHours}h ${durationMinutes}m`,
    waypointCount: coordinates.length
  };
};

// Calculate distance between two points using Haversine formula (in nautical miles)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Try to match departure and arrival airfields based on coordinates
export const matchAirfields = (flightPath: FlightPath, airfields: Array<{ id: string, name: string, coordinates: { lat: number, lng: number } }>) => {
  if (flightPath.coordinates.length < 2) return { departure: undefined, arrival: undefined };
  
  const startCoord = flightPath.coordinates[0];
  const endCoord = flightPath.coordinates[flightPath.coordinates.length - 1];
  
  // Find closest airfield to departure point (within 5nm)
  const departureAirfield = findClosestAirfield(startCoord[0], startCoord[1], airfields, 5);
  
  // Find closest airfield to arrival point (within 5nm)
  const arrivalAirfield = findClosestAirfield(endCoord[0], endCoord[1], airfields, 5);
  
  return {
    departure: departureAirfield?.id,
    arrival: arrivalAirfield?.id
  };
};

// Find closest airfield within a given distance (in nautical miles)
const findClosestAirfield = (lat: number, lng: number, airfields: Array<{ id: string, name: string, coordinates: { lat: number, lng: number } }>, maxDistance: number) => {
  let closestAirfield = null;
  let closestDistance = maxDistance;
  
  for (const airfield of airfields) {
    const distance = calculateDistance(lat, lng, airfield.coordinates.lat, airfield.coordinates.lng);
    if (distance < closestDistance) {
      closestAirfield = airfield;
      closestDistance = distance;
    }
  }
  
  return closestAirfield;
};

// Extract date from filename if available
const extractDateFromFileName = (input: string): string | null => {
  console.log(input)
  // Expression régulière pour matcher un format strict YYYY-MM-DD
  const dateRegex = /(19|20[1-9][1-9])-?(0[1-9]|1[0-2])-?(0[1-9]|[12]\d|3[01])/;

  let match = input.match(dateRegex);
  
  console.log(match)

  if (!match) {
    return null;
  }

  // Vérification que c’est bien une date valide (ex: pas 2023-02-30)
  const date = new Date(match[1] + '-' + match[2] + '-' +match[3]);
  let [year, month, day] = [0, 0, 0];
  if (match[0].includes('-')) {
    [year, month, day] = match[0].split("-").map(Number);
  } else {
    [year, month, day] = [parseInt(match[0].substring(0,4)), parseInt(match[0].substring(4,6)), parseInt(match[0].substring(6,8))];
  }
  
  if (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  ) {
    return year + '-' + month + '-' + day;
  }

  console.error("DateParsing check failed.")

  return null;
}
