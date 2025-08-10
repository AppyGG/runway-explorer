import { useState } from 'react';
import { useAirfieldStore } from '@/store/airfield-store';
import { Airfield, FlightPath } from '@/types/airfield';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  MapPin, 
  Home, 
  CheckCircle2, 
  CircleDashed, 
  Pencil, 
  Save,
  X,
  Ruler,
  Trash2,
  ChevronLeft,
  PlaneTakeoff,
  PlaneLanding
} from 'lucide-react';

interface AirfieldDetailsProps {
  airfield: Airfield | null;
  onClose?: () => void;
  isSheet?: boolean;
  className?: string;
}

const AirfieldDetails = ({ airfield, onClose, isSheet = false, className = '' }: AirfieldDetailsProps) => {
  const { updateAirfield, deleteAirfield, setHomeAirfield, homeAirfieldId, flightPaths } = useAirfieldStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(!!airfield && isSheet);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(airfield?.notes || '');
  
  // Track flights to/from this airfield
  const relatedFlights = flightPaths.filter(
    flight => flight.departure === airfield?.id || flight.arrival === airfield?.id
  );
  
  // Update sheet open state when airfield changes
  useState(() => {
    setSheetOpen(!!airfield && isSheet);
    setNotes(airfield?.notes || '');
    setIsEditing(false);
  });
  
  const handleSheetClose = () => {
    setSheetOpen(false);
    if (onClose) {
      setTimeout(onClose, 300); // Delay to allow animation
    }
  };
  
  const handleSetHomeAirfield = () => {
    if (!airfield) return;
    
    const isHome = homeAirfieldId === airfield.id;
    setHomeAirfield(isHome ? null : airfield.id);
    
    toast({
      title: isHome ? "Home airfield removed" : "Home airfield set",
      description: isHome 
        ? `${airfield.name} is no longer your home airfield.`
        : `${airfield.name} is now your home airfield.`
    });
  };
  
  const handleToggleVisited = () => {
    if (!airfield) return;
    
    updateAirfield(airfield.id, { visited: !airfield.visited });
    
    toast({
      title: airfield.visited ? "Marked as not visited" : "Marked as visited",
      description: `${airfield.name} has been updated.`
    });
  };
  
  const handleTogglePlanned = () => {
    if (!airfield) return;
    
    updateAirfield(airfield.id, { planned: !airfield.planned });
    
    toast({
      title: airfield.planned ? "Removed from planned" : "Added to planned",
      description: `${airfield.name} has been updated.`
    });
  };
  
  const handleSaveNotes = () => {
    if (!airfield) return;
    
    updateAirfield(airfield.id, { notes });
    setIsEditing(false);
    
    toast({
      title: "Notes updated",
      description: "Your notes have been saved."
    });
  };
  
  const handleDeleteAirfield = () => {
    if (!airfield) return;
    
    if (relatedFlights.length > 0) {
      toast({
        title: "Cannot delete airfield",
        description: `This airfield is used in ${relatedFlights.length} flight(s). Remove those flights first.`,
        variant: "destructive"
      });
      return;
    }
    
    deleteAirfield(airfield.id);
    
    toast({
      title: "Airfield deleted",
      description: `${airfield.name} has been removed from your collection.`
    });
    
    if (onClose) onClose();
  };
  
  // Content to render
  const content = airfield ? (
    <>
      <div className="space-y-6">
        {/* Basic airfield info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {airfield.coordinates.lat.toFixed(5)}, {airfield.coordinates.lng.toFixed(5)}
            </span>
          </div>
          
          {airfield.icao && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{airfield.icao}</Badge>
            </div>
          )}
        </div>
        
        {/* Airfield stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-primary" />
                Runway
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              {airfield.runwayLength ? (
                <div className="text-lg font-bold">{airfield.runwayLength} m</div>
              ) : (
                <div className="text-muted-foreground">Not specified</div>
              )}
              {airfield.runwaySurface && (
                <div className="text-xs text-muted-foreground mt-1">{airfield.runwaySurface}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <PlaneTakeoff className="h-4 w-4 text-primary" />
                Departures
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="text-lg font-bold">
                {flightPaths.filter(f => f.departure === airfield.id).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <PlaneLanding className="h-4 w-4 text-primary" />
                Arrivals
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="text-lg font-bold">
                {flightPaths.filter(f => f.arrival === airfield.id).length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Notes section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Notes</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </>
              )}
            </Button>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes about this airfield..."
                className="min-h-[100px]"
              />
              <Button onClick={handleSaveNotes}>
                <Save className="h-4 w-4 mr-1" />
                Save Notes
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-3">
                {airfield.notes ? (
                  <p className="whitespace-pre-line">{airfield.notes}</p>
                ) : (
                  <p className="text-muted-foreground">No notes added yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Related flights */}
        {relatedFlights.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Related Flights</h3>
            <Card>
              <CardContent className="p-3">
                <ul className="space-y-2">
                  {relatedFlights.map(flight => (
                    <li key={flight.id} className="text-sm">
                      <div className="font-medium">{flight.name}</div>
                      <div className="text-xs text-muted-foreground">{flight.date}</div>
                      <div className="text-xs">
                        {flight.departure === airfield.id ? (
                          <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
                            Departure
                          </Badge>
                        ) : null}
                        {flight.arrival === airfield.id ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Arrival
                          </Badge>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={airfield.visited ? "default" : "outline"}
            onClick={handleToggleVisited}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {airfield.visited ? "Visited" : "Mark as Visited"}
          </Button>
          
          <Button 
            variant={airfield.planned ? "default" : "outline"} 
            onClick={handleTogglePlanned}
            className="flex-1"
          >
            <CircleDashed className="h-4 w-4 mr-1" />
            {airfield.planned ? "Planned" : "Mark as Planned"}
          </Button>
          
          <Button 
            variant={homeAirfieldId === airfield.id ? "default" : "outline"} 
            onClick={handleSetHomeAirfield}
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-1" />
            {homeAirfieldId === airfield.id ? "Home Base" : "Set as Home"}
          </Button>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAirfield} 
            disabled={relatedFlights.length > 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Airfield
          </Button>
        </div>
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center text-center h-full p-4">
      <MapPin className="h-16 w-16 mb-4 opacity-20" />
      <p className="text-muted-foreground">Select an airfield to view details</p>
    </div>
  );
  
  // For mobile, render in a sheet
  if (isSheet && isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader className="mb-4">
            <SheetTitle>{airfield?.name}</SheetTitle>
            <SheetDescription>
              {airfield?.icao ? `ICAO: ${airfield.icao}` : 'Airfield details'}
              {airfield?.elevation !== undefined ? ` • Elevation: ${airfield.elevation} ft` : ''}
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
              <MapPin className="h-5 w-5 text-primary" />
              {airfield ? airfield.name : 'Airfield Details'}
            </CardTitle>
            <CardDescription>
              {airfield 
                ? `${airfield.icao || 'No ICAO'}${airfield.elevation !== undefined ? ` • Elevation: ${airfield.elevation} ft` : ''}`
                : 'Select an airfield from the list'}
            </CardDescription>
          </div>
          {airfield && (
            <div>
              {airfield.id === homeAirfieldId ? (
                <Badge variant="default">Home Base</Badge>
              ) : airfield.visited ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">Visited</Badge>
              ) : airfield.planned ? (
                <Badge variant="outline" className="border-amber-500 text-amber-700">Planned</Badge>
              ) : (
                <Badge variant="outline">Not Visited</Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {content}
      </CardContent>
    </Card>
  );
};

export default AirfieldDetails;