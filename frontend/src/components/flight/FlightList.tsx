import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  ArrowDownRight,
  Search
} from 'lucide-react';
import { calculateFlightStatistics } from '@/lib/flight-parser';
import { usePreferencesStore } from '@/store/preferences-store';
import { formatDistance } from '@/lib/unit-conversion';

interface FlightListProps {
  flights?: FlightPath[]; // Optional: for shared view
  airfields?: any[]; // Optional: for shared view
  onSelectFlight?: (flight: FlightPath) => void;
  className?: string;
  readOnly?: boolean; // Read-only mode for shared view
}

const FlightList = ({ 
  flights: propsFlights,
  airfields: propsAirfields,
  onSelectFlight, 
  className = '',
  readOnly = false
}: FlightListProps) => {
  const storeData = useAirfieldStore();
  
  // Use props if provided (shared view), otherwise use store (normal view)
  const flightPaths = propsFlights || storeData.flightPaths;
  const airfields = propsAirfields || storeData.airfields;
  const deleteFlightPath = storeData.deleteFlightPath;
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const { units } = usePreferencesStore();
  
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
  
  return (
    <Card className={`flex flex-col h-full overflow-hidden ${className}`}>
      <div className="px-3 py-3">
        <div className='relative flex-1'>
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input 
            type="text"
            placeholder={t('flights.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            />
          </div>
      </div>
      <CardContent className="p-3 flex-grow pb-0">
        {filteredFlights.length > 0 ? (
          <ScrollArea className="overflow-hidden h-full max-h-[calc(100vh-280px)]">
            <div className="space-y-3">
              {filteredFlights.map(flight => {
                const stats = calculateFlightStatistics(flight);
                return (
                  <Card 
                    key={flight.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectFlight(flight)}
                  >
                    <div className="flex justify-between items-center p-3 pb-2">
                      <CardTitle className="text-base">{flight.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {flight.fileType} file
                      </span>
                    </div>
                    <div className="px-3 grid grid-flow-col grid-rows-2 gap1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5" /> {flight.date}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {t('flights.distance')}: {formatDistance(stats.totalDistance, units.distance)}
                        </div>
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
                    </div>
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
                <p className="mb-2">{t('flights.empty')}</p>
                <p className="text-sm">{t('flights.uploadInfo')}</p>
              </>
            ) : (
              <p>{t('flights.noFlightsMatch')}</p>
            )}
          </div>
        )}
      </CardContent>
      <div className="p-3 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
            {filteredFlights.length} flights
        </div>
      </div>
    </Card>
  );
};

export default FlightList;