import { FlightPath, Waypoint } from '@/types/airfield';
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
      const waypoints: Waypoint[] = [];
      const coordNodes = gxTrack.querySelectorAll('gx\\:coord');
      const whenNodes = gxTrack.querySelectorAll('when');
      
      coordNodes.forEach((node, idx) => {
        if (node.textContent) {
          const parts = node.textContent.trim().split(' ');
          if (parts.length >= 2) {
            // KML format is longitude, latitude, [altitude]
            const lng = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            const altitude = parts.length >= 3 ? parseFloat(parts[2]) * 3.28084 : undefined; // Convert meters to feet
            
            coords.push([lat, lng]);
            
            const waypoint: Waypoint = {
              lat,
              lng,
              altitude,
              timestamp: whenNodes[idx]?.textContent || undefined,
            };
            
            waypoints.push(waypoint);
          }
        }
      });
      
      // Calculate speeds between waypoints
      enrichWaypointsWithSpeed(waypoints);

      return {
        id: uuidv4(),
        name,
        date: traceDate,
        coordinates: coords,
        waypoints,
        fileType: 'KML',
        fileName
      };
    }
    
    if (!coordinatesString) {
      console.error('No coordinates found in KML file');
      return null;
    }
    
    // Parse coordinates from KML format (lon,lat,alt lon,lat,alt ...)
    const coordinates: Array<[number, number]> = [];
    const waypoints: Waypoint[] = [];
    
    coordinatesString
      .split(/\s+/)
      .filter(coord => coord.trim())
      .forEach(coord => {
        const parts = coord.split(',');
        if (parts.length >= 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const altitude = parts.length >= 3 ? parseFloat(parts[2]) * 3.28084 : undefined; // Convert meters to feet
          
          coordinates.push([lat, lon]);
          
          waypoints.push({
            lat,
            lng: lon,
            altitude,
          });
        }
      });
    
    if (coordinates.length < 2) {
      console.error('Not enough coordinates found in KML file');
      return null;
    }
    
    // Calculate speeds between waypoints
    enrichWaypointsWithSpeed(waypoints);
    
    return {
      id: uuidv4(),
      name,
      date: traceDate,
      coordinates,
      waypoints,
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
    
    // Extract coordinates and waypoints from track points
    const coordinates: Array<[number, number]> = [];
    const waypoints: Waypoint[] = [];
    
    Array.from(trackPoints).forEach(point => {
      const lat = point.getAttribute('lat');
      const lon = point.getAttribute('lon');
      
      if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) return;
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      // Extract elevation (altitude)
      const eleElement = point.querySelector('ele');
      const altitude = eleElement?.textContent ? parseFloat(eleElement.textContent) * 3.28084 : undefined; // Convert meters to feet
      
      // Extract timestamp
      const timeElement = point.querySelector('time');
      const timestamp = timeElement?.textContent || undefined;
      
      coordinates.push([latitude, longitude]);
      
      waypoints.push({
        lat: latitude,
        lng: longitude,
        altitude,
        timestamp,
      });
    });
    
    if (coordinates.length < 2) {
      console.error('Not enough valid coordinates found in GPX file');
      return null;
    }
    
    // Calculate speeds between waypoints
    enrichWaypointsWithSpeed(waypoints);
    
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
      waypoints,
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
  const { coordinates, waypoints } = flightPath;
  
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
  
  let maxAltitude = 0;
  let avgAltitude = 0;
  let maxSpeed = 0;
  let avgSpeed = 0;
  let duration = 0;
  
  // Use actual waypoint data if available
  if (waypoints && waypoints.length > 0) {
    // Calculate altitude statistics
    const altitudes = waypoints.filter(w => w.altitude).map(w => w.altitude!);
    if (altitudes.length > 0) {
      maxAltitude = Math.max(...altitudes);
      avgAltitude = Math.round(altitudes.reduce((a, b) => a + b, 0) / altitudes.length);
    }
    
    // Calculate speed statistics
    const speeds = waypoints.filter(w => w.speed).map(w => w.speed!);
    if (speeds.length > 0) {
      maxSpeed = Math.max(...speeds);
      avgSpeed = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);
    }
    
    // Calculate duration from timestamps if available
    const firstWaypoint = waypoints[0];
    const lastWaypoint = waypoints[waypoints.length - 1];
    if (firstWaypoint.timestamp && lastWaypoint.timestamp) {
      const startTime = new Date(firstWaypoint.timestamp).getTime();
      const endTime = new Date(lastWaypoint.timestamp).getTime();
      duration = (endTime - startTime) / (1000 * 60 * 60); // in hours
    }
  }
  
  // Fallback to simulated values if no waypoint data
  if (maxAltitude === 0) {
    maxAltitude = 1000 + Math.floor(Math.random() * 9000); // Between 1000-10000 ft
    avgAltitude = Math.floor(maxAltitude * 0.7); // About 70% of max altitude
  }
  
  if (maxSpeed === 0) {
    maxSpeed = 90 + Math.floor(Math.random() * 110); // Between 90-200 knots
    avgSpeed = Math.floor(maxSpeed * 0.75); // About 75% of max speed
  }
  
  // Calculate approximate duration based on distance and average speed if not calculated from timestamps
  if (duration === 0 && avgSpeed > 0) {
    duration = totalDistance / avgSpeed;
  }
  
  const durationHours = Math.floor(duration);
  const durationMinutes = Math.floor((duration - durationHours) * 60);
  
  return {
    totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal place
    maxAltitude: Math.round(maxAltitude),
    avgAltitude: Math.round(avgAltitude),
    maxSpeed: Math.round(maxSpeed),
    avgSpeed: Math.round(avgSpeed),
    duration,
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

// Enrich waypoints with calculated speed based on distance and time
const enrichWaypointsWithSpeed = (waypoints: Waypoint[]) => {
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    
    // If we have timestamps, calculate speed
    if (prev.timestamp && curr.timestamp) {
      const prevTime = new Date(prev.timestamp).getTime();
      const currTime = new Date(curr.timestamp).getTime();
      const timeDiffHours = (currTime - prevTime) / (1000 * 60 * 60); // in hours
      
      if (timeDiffHours > 0) {
        const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng); // in NM
        const speed = distance / timeDiffHours; // in knots
        
        // Assign speed to current waypoint
        curr.speed = Math.round(speed);
      }
    } else {
      // If no timestamps, generate simulated speed data
      // This creates realistic variation around a base speed
      const baseSpeed = 100; // Average cruise speed in knots
      const variation = 20; // Speed variation
      curr.speed = Math.round(baseSpeed + (Math.random() - 0.5) * variation);
    }
  }
  
  // Set first waypoint speed to second waypoint speed if available
  if (waypoints.length > 1 && waypoints[1].speed) {
    waypoints[0].speed = waypoints[1].speed;
  }
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
