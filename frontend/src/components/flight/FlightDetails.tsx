import { useEffect, useState } from 'react';
import { useAirfieldStore } from '@/store/airfield-store';
import { FlightPath } from '@/types/airfield';
import { Button } from '@/components/ui/button';
import FlightProfileChart from './FlightProfileChart';
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
  Gauge,
  ChevronLeft,
  TrashIcon,
  Download,
  Mountain,
  Clock,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { calculateFlightStatistics } from '@/lib/flight-parser';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreferencesStore } from '@/store/preferences-store';
import { formatDistance, formatSpeed } from '@/lib/unit-conversion';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';

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
  const { airfields, deleteFlightPath, updateFlightPath } = useAirfieldStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { units } = usePreferencesStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  useEffect(() => {
    setSheetOpen(!!flight && isSheet);
    if (flight) {
      setEditedName(flight.name);
      setIsEditingName(false);
    }
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
  
  // Handle name edit
  const handleStartEdit = () => {
    if (readOnly) return;
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (!flight || !editedName.trim()) return;
    
    updateFlightPath(flight.id, { name: editedName.trim() });
    
    toast({
      title: t('flights.nameUpdated.title'),
      description: t('flights.nameUpdated.description')
    });
    
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    if (flight) {
      setEditedName(flight.name);
    }
    setIsEditingName(false);
  };

  // Handle flight deletion
  const handleDeleteFlight = () => {
    if (!flight) return;
    
    deleteFlightPath(flight.id);
    
    toast({
      title: t('flights.deleted.title'),
      description: t('flights.deleted.description', { name: flight.name })
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
      title: t('flights.exported.title'),
      description: t('flights.exported.description')
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
            <span className="text-muted-foreground">{flight.fileType} {t('flights.file')}: {flight.fileName}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                <Ruler className="h-4 w-4 text-primary" />
                {t('flights.distance')}
              </div>
              <div className="text-base">{formatDistance(stats.totalDistance, units.distance)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                {t('flights.departure')}
              </div>
              {departureAirfield ? (
                <div className="text-base font-semibold truncate">
                  {departureAirfield.name}
                  {departureAirfield.icao && ` (${departureAirfield.icao})`}
                </div>
              ) : (
                <div className="text-muted-foreground text-base">{t('flights.notSpecified')}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                <ArrowDownRight className="h-4 w-4 text-primary" />
                {t('flights.arrival')}
              </div>
              {arrivalAirfield ? (
                <div className="text-base font-semibold truncate">
                  {arrivalAirfield.name}
                  {arrivalAirfield.icao && ` (${arrivalAirfield.icao})`}
                </div>
              ) : (
                <div className="text-muted-foreground text-base">{t('flights.notSpecified')}</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced flight statistics */}
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('flights.statistics')}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    {t('flights.duration')}
                  </div>
                  <div className="text-lg font-semibold">
                    {stats?.durationFormatted}
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
                      {t('flights.maxAltitude')}
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.maxAltitude} {t('units.ft')}
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
                      <Plane className="h-4 w-4" />
                      {t('flights.avgAltitude')}
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.avgAltitude} {t('units.ft')}
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
                      <Gauge className="h-4 w-4" />
                      {t('flights.maxSpeed')}
                    </div>
                    <div className="text-lg font-semibold">
                      {formatSpeed(stats.maxSpeed, units.speed)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Flight Profile Chart */}
        {flight.waypoints && flight.waypoints.length > 0 && (
          <FlightProfileChart flight={flight} />
        )}
        
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('flights.routeDetails')}</h3>
          <Card>
            <CardContent className="p-3">
              <div className="text-sm">
                {t('flights.waypointsRecorded', { count: flight.coordinates.length })}
                {flight.coordinates.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{t('flights.startCoordinates')}</div>
                      <div>
                        {flight.coordinates[0][0].toFixed(4)}, {flight.coordinates[0][1].toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{t('flights.endCoordinates')}</div>
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
        
        <div className="flex justify-between pb-6">
          <Button variant="outline" onClick={onClose}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('actions.back')}
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={exportFlightGPX}>
              <Download className="h-4 w-4 mr-1" />
              {t('flights.export')}
            </Button>
          {!readOnly && (
            <Button variant="destructive" onClick={handleDeleteFlight}>
              <TrashIcon className="h-4 w-4 mr-1" />
              {t('flights.delete')}
            </Button>
          )}
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center text-center h-full p-4">
      <Plane className="h-16 w-16 mb-4 opacity-20" />
      <p className="text-muted-foreground">{t('flights.selectFlight')}</p>
    </div>
  );
  
  // For mobile, render in a sheet
  if (isSheet && isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader className="mb-4">
            {flight && isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="text-lg font-semibold"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SheetTitle>{flight?.name}</SheetTitle>
                {!readOnly && flight && (
                  <Button size="icon" variant="ghost" onClick={handleStartEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <SheetDescription>
              {t('flights.details')}
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
          <div className="flex-1 min-w-0">
            {flight && isEditingName ? (
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-5 w-5 text-primary flex-shrink-0" />
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="text-xl font-semibold h-auto py-1"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <span className="truncate">{flight ? flight.name : t('flights.details')}</span>
                {!readOnly && flight && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={handleStartEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            )}
            <CardDescription>
              {flight ? t('flights.details') : t('flights.selectFlight')}
            </CardDescription>
          </div>
          {flight && (
            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
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