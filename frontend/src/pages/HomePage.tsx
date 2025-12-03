import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plane, 
  Map as MapIcon, 
  Home,
  Settings,
  FileSymlink,
  CircleHelp,
  Route,
  TowerControl,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PreferencesDialog from '@/components/preferences/PreferencesDialog';
import MapView from '@/components/map/MapView';
import AirfieldList from '@/components/airfield/AirfieldList';
import AirfieldDetails from '@/components/airfield/AirfieldDetails';
import FlightList from '@/components/flight/FlightList';
import FlightDetails from '@/components/flight/FlightDetails';
import FlightUploadDialog from '@/components/flight/FlightUploadDialog';
import ShareDialog from '@/components/share/ShareDialog';
import Statistics from '@/components/statistics/Statistics';
import { Airfield, FlightPath } from '@/types/airfield';
import { useAirfieldStore } from '@/store/airfield-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { useIsMobile } from '@/hooks/use-mobile';
import OnboardingGuide from '@/components/onboarding/OnboardingGuide';

function HomePage() {
  const isMobile = useIsMobile();
  const { homeAirfieldId, airfields, flightPaths } = useAirfieldStore();
  const { user } = usePreferencesStore();
  const [selectedAirfield, setSelectedAirfield] = useState<Airfield | null>(null);
  const [selectedFlightPath, setSelectedFlightPath] = useState<FlightPath | null>(null);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { t } = useTranslation();
  
  // Show onboarding on mount if needed
  useEffect(() => {
    const shouldShowOnboarding = !user.hasCompletedOnboarding && airfields.length === 0 && flightPaths.length === 0;
    if (shouldShowOnboarding) {
      setShowOnboarding(true);
    }
  }, [user.hasCompletedOnboarding, airfields.length, flightPaths.length]);
  
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
    <>
      <OnboardingGuide 
        open={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
      
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
                <Plane className="h-4 w-4" />
                <span className="hidden sm:inline">{t('flights.upload')}</span>
              </Button>
            } 
            onUploadComplete={handleFlightUploadComplete}
          />
          <ShareDialog />
          <PreferencesDialog />
        </div>
      </header>

      {showOnboarding && 
        <OnboardingGuide
          open
          onClose={
            () => {
              console.log('Onboarding closed')
            }
          }
        >
        </OnboardingGuide>
      }

      {/* Main content - responsive layout */}
      {isMobile ? (
        // Mobile view with tabs
        <Tabs 
          defaultValue="map" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 flex flex-col"
        >
          <div className="bg-muted/50 p-2 border-b overflow-x-auto">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="map" className="flex items-center gap-1">
                {t('map.title')}
              </TabsTrigger>
              <TabsTrigger value="airfields" className="flex items-center gap-1">
                {t('airfields.title')}
              </TabsTrigger>
              <TabsTrigger value="flights" className="flex items-center gap-1">
                {t('flights.title')}
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-1">
                {t('statistics.title')}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="map" className="flex-1 p-0 m-0">
            <div className="h-[calc(100vh-110px)]">
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
                <h2 className="text-lg font-semibold">{t('flights.title')}</h2>
                <FlightUploadDialog onUploadComplete={handleFlightUploadComplete} />
              </div>
              <FlightList
                onSelectFlight={handleFlightSelect}
                className="h-[calc(100%-40px)]"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="statistics" className="flex-1 p-0 m-0">
            <div className="h-full p-2">
              <Statistics className="h-full" />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Desktop view with side-by-side panels
        <div className="flex-1 grid grid-cols-3 gap-4 p-4">
          <div className="col-span-2 h-[calc(100vh-100px)]">
            <MapView 
              onMarkerClick={handleAirfieldSelect}
              onFlightPathClick={handleFlightSelect}
              selectedFlightPath={selectedFlightPath}
              className="h-full shadow-sm"
            />
          </div>
          <div className="col-span-1 h-[calc(100vh-100px)]">
            <Tabs defaultValue="airfields" className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="airfields" className="flex items-center gap-1">
                  <TowerControl className="h-4 w-4" /> {t('airfields.title')}
                </TabsTrigger>
                <TabsTrigger value="flights" className="flex items-center gap-1">
                  <Plane className="h-4 w-4" /> {t('flights.title')}
                </TabsTrigger>
                <TabsTrigger value="statistics" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" /> {t('statistics.title')}
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
                    <FlightList
                      onSelectFlight={handleFlightSelect}
                      className="h-[calc(100%)]"
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="statistics" className="flex-1 p-0 m-0 mt-2">
                <Statistics className="h-full" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default HomePage;