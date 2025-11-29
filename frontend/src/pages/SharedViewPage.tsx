import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plane, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PreferencesDialog from '@/components/preferences/PreferencesDialog';
import MapView from '@/components/map/MapView';
import AirfieldList from '@/components/airfield/AirfieldList';
import AirfieldDetails from '@/components/airfield/AirfieldDetails';
import FlightList from '@/components/flight/FlightList';
import FlightDetails from '@/components/flight/FlightDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Airfield, FlightPath } from '@/types/airfield';
import { ShareableData } from '@/types/share';
import { getShare } from '@/services/shareService';
import { decryptData, isValidEncryptionKey } from '@/lib/encryption';
import { useIsMobile } from '@/hooks/use-mobile';

const SharedViewPage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<ShareableData | null>(null);
  const [selectedAirfield, setSelectedAirfield] = useState<Airfield | null>(null);
  const [selectedFlightPath, setSelectedFlightPath] = useState<FlightPath | null>(null);
  const [activeTab, setActiveTab] = useState<string>("map");

  useEffect(() => {
    const loadSharedData = async () => {
      if (!shareId) {
        setError(t('share.error.invalidLink'));
        setLoading(false);
        return;
      }

      // Extract encryption key from URL fragment (anchor)
      const encryptionKey = location.hash.substring(1); // Remove the '#'
      
      if (!encryptionKey || !isValidEncryptionKey(encryptionKey)) {
        setError(t('share.error.invalidKey'));
        setLoading(false);
        return;
      }

      try {
        // Fetch encrypted data from backend
        const encryptedData = await getShare(shareId);
        
        // Decrypt the data
        const decrypted = await decryptData(encryptedData, encryptionKey);
        
        setSharedData(decrypted);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load shared data:', err);
        setError(err instanceof Error ? err.message : t('share.error.loading'));
        setLoading(false);
      }
    };

    loadSharedData();
  }, [shareId, location.hash, t]);

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t('share.loading')}</p>
      </div>
    );
  }

  // Error state
  if (error || !sharedData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">{t('share.error.title')}</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/')}>
            {t('share.backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  // Render shared data view (read-only)
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">
              {sharedData.metadata.title || t('share.viewTitle')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('share.readOnly')} • {sharedData.metadata.totalAirfields} {t('airfields.title').toLowerCase()} • {sharedData.metadata.totalFlights} {t('flights.title').toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <PreferencesDialog />
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            {t('share.backToMyData')}
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
                {t('map.title')}
              </TabsTrigger>
              <TabsTrigger value="airfields" className="flex items-center gap-1">
                {t('airfields.title')}
              </TabsTrigger>
              <TabsTrigger value="flights" className="flex items-center gap-1">
                {t('flights.title')}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="map" className="flex-1 p-0 m-0">
            <div className="h-full">
              <MapView 
                airfields={sharedData.airfields}
                flightPaths={sharedData.flightPaths}
                onMarkerClick={handleAirfieldSelect} 
                onFlightPathClick={handleFlightSelect}
                selectedFlightPath={selectedFlightPath}
                className="h-full"
                readOnly
              />
              
              {selectedFlightPath && (
                <FlightDetails 
                  flight={selectedFlightPath} 
                  onClose={() => setSelectedFlightPath(null)} 
                  isSheet={true}
                  readOnly
                />
              )}
              
              {selectedAirfield && (
                <AirfieldDetails
                  airfield={selectedAirfield}
                  onClose={() => setSelectedAirfield(null)}
                  isSheet={true}
                  readOnly
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
                  readOnly
                />
              ) : (
                <AirfieldList 
                  airfields={sharedData.airfields}
                  onSelectAirfield={handleAirfieldSelect} 
                  className="h-full"
                  readOnly
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="flights" className="flex-1 p-0 m-0">
            <div className="h-full p-2">
              <FlightList
                flights={sharedData.flightPaths}
                onSelectFlight={handleFlightSelect}
                className="h-full"
                readOnly
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Desktop view with side-by-side panels
        <div className="flex-1 grid grid-cols-3 gap-4 p-4">
          <div className="z-[1] col-span-2 h-[calc(100vh-100px)]">
            <MapView 
              airfields={sharedData.airfields}
              flightPaths={sharedData.flightPaths}
              onMarkerClick={handleAirfieldSelect}
              onFlightPathClick={handleFlightSelect}
              selectedFlightPath={selectedFlightPath}
              className="h-full shadow-sm"
              readOnly
            />
          </div>
          <div className="col-span-1 h-[calc(100vh-100px)]">
            <Tabs defaultValue="airfields" className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="airfields" className="flex items-center gap-1">
                  {t('airfields.title')}
                </TabsTrigger>
                <TabsTrigger value="flights" className="flex items-center gap-1">
                  {t('flights.title')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="airfields" className="flex-1 p-0 m-0 mt-2">
                {selectedAirfield ? (
                  <AirfieldDetails
                    airfield={selectedAirfield}
                    onClose={() => setSelectedAirfield(null)}
                    className="h-full"
                    readOnly
                  />
                ) : (
                  <AirfieldList 
                    airfields={sharedData.airfields}
                    homeAirfieldId={null}
                    onSelectAirfield={handleAirfieldSelect}
                    className="h-full shadow-sm"
                    readOnly
                  />
                )}
              </TabsContent>
              
              <TabsContent value="flights" className="flex-1 p-0 m-0 mt-2">
                {selectedFlightPath ? (
                  <FlightDetails
                    flight={selectedFlightPath}
                    onClose={() => setSelectedFlightPath(null)}
                    className="h-full"
                    readOnly
                  />
                ) : (
                  <FlightList
                    flights={sharedData.flightPaths}
                    airfields={sharedData.airfields}
                    onSelectFlight={handleFlightSelect}
                    className="h-full"
                    readOnly
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedViewPage;
