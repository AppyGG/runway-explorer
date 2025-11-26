import { useEffect, useState } from 'react';
import { useAirfieldStore } from '@/store/airfield-store';
import { FlightPath } from '@/types/airfield';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Calendar, 
  FileType2,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Ruler,
  Clock,
  ChevronLeft,
  TrashIcon,
  Download,
  CloudSun,
  Mountain,
  Route
} from 'lucide-react';
import { calculateFlightStatistics } from '@/lib/flight-parser';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface FlightDetailsProps {
  flight: FlightPath | null;
  onClose?: () => void;
  isSheet?: boolean;
  className?: string;
  readOnly?: boolean; // Read-only mode for shared view
}

const FlightDetails = ({
   flight, 
   onClose,
   isSheet = false,
   className = '',
   readOnly = false
}: FlightDetailsProps) => {
  const { airfields, deleteFlightPath } = useAirfieldStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  useEffect(() => {
    setSheetOpen(!!flight && isSheet);
  }, [flight, isSheet]);
  
  // Handle sheet close
  const handleSheetClose = () => {
    setSheetOpen(false);
    if (onClose) setTimeout(onClose, 300); // Delay to allow animation
  };
  
  // Get statistics
  const stats = flight ? calculateFlightStatistics(flight) : { 
    totalDistance: 0, 
    maxAltitude: 0, 
    avgAltitude: 0,
    maxSpeed: 0,
    avgSpeed: 0,
    duration: 0,
    waypointCount: 0
  };
  
  // Find airfield details
  const departureAirfield = flight?.departure 
    ? airfields.find(a => a.id === flight.departure) 
    : undefined;
    
  const arrivalAirfield = flight?.arrival
    ? airfields.find(a => a.id === flight.arrival)
    : undefined;
  
  // Handle flight deletion
  const handleDeleteFlight = () => {
    if (!flight) return;
    
    deleteFlightPath(flight.id);
    
    toast({
      title: "Flight deleted",
      description: `${flight.name} has been deleted.`
    });
    
    if (onClose) onClose();
  };
  
  // Export flight data as GPX
  const exportFlightGPX = () => {
    if (!flight) return;
    
    // Create GPX content
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="PilotLogbook">
  <metadata>
    <name>${flight.name}</name>
    <time>${flight.date}T00:00:00Z</time>
  </metadata>
  <trk>
    <name>${flight.name}</name>
    <trkseg>`;
    
    // Add track points
    const trackpoints = flight.coordinates.map(coord => {
      return `      <trkpt lat="${coord[0]}" lon="${coord[1]}"></trkpt>`;
    }).join('\n');
    
    const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;
    
    const gpxContent = gpxHeader + '\n' + trackpoints + gpxFooter;
    
    // Create downloadable file
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${flight.name.replace(/\s+/g, '_')}_${flight.date}.gpx`);
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Flight Exported',
      description: 'Flight data exported as GPX file.'
    });
  };
  
  const content = flight ? (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{flight.date}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <FileType2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{flight.fileType} file: {flight.fileName}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-primary" />
                Distance
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="text-2xl font-bold">{stats.totalDistance} NM</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                Departure
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              {departureAirfield ? (
                <div className="text-base font-semibold truncate">
                  {departureAirfield.name}
                  {departureAirfield.icao && ` (${departureAirfield.icao})`}
                </div>
              ) : (
                <div className="text-muted-foreground text-base">Not specified</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <ArrowDownRight className="h-4 w-4 text-primary" />
                Arrival
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              {arrivalAirfield ? (
                <div className="text-base font-semibold truncate">
                  {arrivalAirfield.name}
                  {arrivalAirfield.icao && ` (${arrivalAirfield.icao})`}
                </div>
              ) : (
                <div className="text-muted-foreground text-base">Not specified</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced flight statistics */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Flight Statistics</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                    <Route className="h-4 w-4" />
                    Waypoints
                  </div>
                  <div className="text-lg font-semibold">
                    {flight?.coordinates.length || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {stats.maxAltitude > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                      <Mountain className="h-4 w-4" />
                      Max Altitude
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.maxAltitude} ft
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {stats.avgAltitude > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                      <CloudSun className="h-4 w-4" />
                      Avg Altitude
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.avgAltitude} ft
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {stats.maxSpeed > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                      <Plane className="h-4 w-4" />
                      Max Speed
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.maxSpeed} kt
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Route Details</h3>
          <Card>
            <CardContent className="p-3">
              <div className="text-sm">
                {flight.coordinates.length} waypoints recorded
                {flight.coordinates.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Start coordinates</div>
                      <div>
                        {flight.coordinates[0][0].toFixed(4)}, {flight.coordinates[0][1].toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">End coordinates</div>
                      <div>
                        {flight.coordinates[flight.coordinates.length-1][0].toFixed(4)}, 
                        {flight.coordinates[flight.coordinates.length-1][1].toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={exportFlightGPX}>
              <Download className="h-4 w-4 mr-1" />
              Export GPX
            </Button>
          {!readOnly && (
            <Button variant="destructive" onClick={handleDeleteFlight}>
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete Flight
              </Button>
          )}
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center text-center h-full p-4">
      <Plane className="h-16 w-16 mb-4 opacity-20" />
      <p className="text-muted-foreground">Select a flight to view details</p>
    </div>
  );
  
  // For mobile, render in a sheet
  if (isSheet && isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader className="mb-4">
            <SheetTitle>{flight?.name}</SheetTitle>
            <SheetDescription>
              Flight details and statistics
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }
  
  // For desktop or non-sheet mobile
  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              {flight ? flight.name : 'Flight Details'}
            </CardTitle>
            <CardDescription>
              {flight ? 'Flight details and statistics' : 'Select a flight from the list'}
            </CardDescription>
          </div>
          {flight && (
            <Badge variant="outline" className="text-xs">
              {flight.fileType}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {content}
      </CardContent>
    </Card>
  );
};

export default FlightDetails;