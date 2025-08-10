import { useState } from 'react';
import { 
  Plane, 
  Map as MapIcon, 
  Home,
  Settings,
  FileSymlink,
  CircleHelp,
  Route,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MapView from '@/components/map/MapView';
import AirfieldList from '@/components/airfield/AirfieldList';
import AirfieldDetails from '@/components/airfield/AirfieldDetails';
import FlightList from '@/components/flight/FlightList';
import FlightDetails from '@/components/flight/FlightDetails';
import FlightUploadDialog from '@/components/flight/FlightUploadDialog';
import { Airfield, FlightPath } from '@/types/airfield';
import { useAirfieldStore } from '@/store/airfield-store';
import { useIsMobile } from '@/hooks/use-mobile';

function HomePage() {
  const isMobile = useIsMobile();
  const { homeAirfieldId, airfields } = useAirfieldStore();
  const [selectedAirfield, setSelectedAirfield] = useState<Airfield | null>(null);
  const [selectedFlightPath, setSelectedFlightPath] = useState<FlightPath | null>(null);
  const [activeTab, setActiveTab] = useState<string>("map");
  
  // Find home airfield
  const homeAirfield = airfields.find(a => a.id === homeAirfieldId) || null;
  
  const handleAirfieldSelect = (airfield: Airfield) => {
    setSelectedAirfield(airfield);
    setSelectedFlightPath(null);
  };
  
  const handleFlightSelect = (flight: FlightPath) => {
    setSelectedFlightPath(flight);
    setSelectedAirfield(null);
    
    if (isMobile) {
      setActiveTab("map");
    }
  };
  
  const handleFlightUploadComplete = (flight: FlightPath) => {
    setSelectedFlightPath(flight);
    setActiveTab("map");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Runway Explorer</h1>
        </div>
        <div className="flex gap-2">
          <FlightUploadDialog 
            trigger={
              <Button variant="outline" size="sm">
                <Route className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Upload Flight</span>
              </Button>
            } 
            onUploadComplete={handleFlightUploadComplete}
          />
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content - responsive layout */}
      {isMobile ? (
        // Mobile view with tabs
        <Tabs 
          defaultValue="map" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 flex flex-col"
        >
          <div className="bg-muted/50 p-2 border-b">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="map" className="flex items-center gap-1">
                <MapIcon className="h-4 w-4" /> Map
              </TabsTrigger>
              <TabsTrigger value="airfields" className="flex items-center gap-1">
                <FileSymlink className="h-4 w-4" /> Airfields
              </TabsTrigger>
              <TabsTrigger value="flights" className="flex items-center gap-1">
                <Plane className="h-4 w-4" /> Flights
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="map" className="flex-1 p-0 m-0">
            <div className="h-full">
              <MapView 
                onMarkerClick={handleAirfieldSelect} 
                onFlightPathClick={handleFlightSelect}
                selectedFlightPath={selectedFlightPath}
                className="h-full"
              />
              
              {selectedFlightPath && (
                <FlightDetails 
                  flight={selectedFlightPath} 
                  onClose={() => setSelectedFlightPath(null)} 
                  isSheet={true} 
                />
              )}
              
              {selectedAirfield && (
                <AirfieldDetails
                  airfield={selectedAirfield}
                  onClose={() => setSelectedAirfield(null)}
                  isSheet={true}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="airfields" className="flex-1 p-0 m-0">
            <div className="h-full p-2">
              {selectedAirfield ? (
                <AirfieldDetails
                  airfield={selectedAirfield}
                  onClose={() => setSelectedAirfield(null)}
                  isSheet={false}
                  className="h-full"
                />
              ) : (
                <AirfieldList 
                  onSelectAirfield={handleAirfieldSelect} 
                  className="h-full"
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="flights" className="flex-1 p-0 m-0">
            <div className="h-full p-2">
              <div className="flex mb-2 justify-between">
                <h2 className="text-lg font-semibold">Flight Logs</h2>
                <FlightUploadDialog onUploadComplete={handleFlightUploadComplete} />
              </div>
              <FlightList
                onSelectFlight={handleFlightSelect}
                className="h-[calc(100%-40px)]"
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Desktop view with side-by-side panels
        <div className="flex-1 grid grid-cols-3 gap-4 p-4">
          <div className="col-span-2 h-[calc(100vh-120px)]">
            <MapView 
              onMarkerClick={handleAirfieldSelect}
              onFlightPathClick={handleFlightSelect}
              selectedFlightPath={selectedFlightPath}
              className="h-full shadow-sm"
            />
          </div>
          <div className="col-span-1 h-[calc(100vh-120px)]">
            <Tabs defaultValue="airfields" className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="airfields" className="flex items-center gap-1">
                  <FileSymlink className="h-4 w-4" /> Airfields
                </TabsTrigger>
                <TabsTrigger value="flights" className="flex items-center gap-1">
                  <Plane className="h-4 w-4" /> Flights
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="airfields" className="flex-1 p-0 m-0 mt-2">
                {selectedAirfield ? (
                  <AirfieldDetails
                    airfield={selectedAirfield}
                    onClose={() => setSelectedAirfield(null)}
                    className="h-full"
                  />
                ) : (
                  <AirfieldList 
                    onSelectAirfield={handleAirfieldSelect}
                    className="h-full shadow-sm"
                  />
                )}
              </TabsContent>
              
              <TabsContent value="flights" className="flex-1 p-0 m-0 mt-2">
                {selectedFlightPath ? (
                  <FlightDetails
                    flight={selectedFlightPath}
                    onClose={() => setSelectedFlightPath(null)}
                    className="h-full"
                  />
                ) : (
                  <div className="h-full">
                    <div className="flex mb-2 justify-between items-center">
                      <h3 className="text-sm font-medium">Flight Logs</h3>
                      <FlightUploadDialog onUploadComplete={handleFlightUploadComplete} />
                    </div>
                    <FlightList
                      onSelectFlight={handleFlightSelect}
                      className="h-[calc(100%-40px)]"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      
      {/* Footer with home airfield info */}
      <footer className="bg-muted/50 border-t p-3 text-sm text-muted-foreground">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>Home Base: {homeAirfield ? `${homeAirfield.name} (${homeAirfield.icao})` : 'None set'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleHelp className="h-4 w-4" />
            <span className="hidden sm:inline">
              {selectedFlightPath 
                ? `Showing flight: ${selectedFlightPath.name} (${selectedFlightPath.date})`
                : 'Upload KML/GPX flight traces to visualize your flights'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;