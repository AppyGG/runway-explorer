import { useState } from 'react';
import { useAirfieldStore } from '@/store/airfield-store';
import { FlightPath } from '@/types/airfield';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  Plane,
  CalendarIcon,
  MapPin,
  TrashIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { calculateFlightStatistics } from '@/lib/flight-parser';

interface FlightListProps {
  onSelectFlight?: (flight: FlightPath) => void;
  className?: string;
}

const FlightList = ({ onSelectFlight, className = '' }: FlightListProps) => {
  const { flightPaths, airfields, deleteFlightPath } = useAirfieldStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter flights based on search query
  const filteredFlights = flightPaths.filter(flight => 
    flight.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.date.includes(searchQuery)
  );
  
  // Get airfield name by ID
  const getAirfieldName = (id?: string) => {
    if (!id) return 'Unknown';
    const airfield = airfields.find(a => a.id === id);
    return airfield ? airfield.name : 'Unknown';
  };
  
  const handleSelectFlight = (flight: FlightPath) => {
    if (onSelectFlight) {
      onSelectFlight(flight);
    }
  };
  
  const handleDeleteFlight = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFlightPath(id);
  };
  
  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          Flight Logs
        </CardTitle>
        <CardDescription>
          {flightPaths.length} flight{flightPaths.length !== 1 ? 's' : ''} recorded
        </CardDescription>
        <Input 
          type="text"
          placeholder="Search flights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent className="flex-grow pb-0 overflow-hidden">
        {filteredFlights.length > 0 ? (
          <ScrollArea className="h-[calc(100%-1rem)] pr-3">
            <div className="space-y-3">
              {filteredFlights.map(flight => {
                const stats = calculateFlightStatistics(flight);
                return (
                  <Card 
                    key={flight.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectFlight(flight)}
                  >
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-base">{flight.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" /> {flight.date}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 py-0 text-sm">
                      {flight.departure && (
                        <div className="flex items-center gap-1 mb-1 text-muted-foreground">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          From: {getAirfieldName(flight.departure)}
                        </div>
                      )}
                      {flight.arrival && (
                        <div className="flex items-center gap-1 mb-1 text-muted-foreground">
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          To: {getAirfieldName(flight.arrival)}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        Distance: {stats.totalDistance} NM
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 pt-2 flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        {flight.fileType} file
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteFlight(e, flight.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
            <Plane className="h-16 w-16 mb-4 opacity-20" />
            {flightPaths.length === 0 ? (
              <>
                <p className="mb-2">No flight logs yet</p>
                <p className="text-sm">Upload KML or GPX files to visualize your flights</p>
              </>
            ) : (
              <p>No flights matching your search</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FlightList;