import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plane, Helicopter, MapPin, Loader2, Search } from 'lucide-react';
import { usePreferencesStore, AircraftType } from '@/store/preferences-store';
import { useAirfieldStore } from '@/store/airfield-store';
import { searchAirfieldsByPosition, searchAirfields } from '@/services/openAIP';
import { Input } from '@/components/ui/input';
import { Airfield } from '@/types/airfield';

interface OnboardingGuideProps {
  open: boolean;
  onClose: () => void;
}

const OnboardingGuide = ({ open, onClose }: OnboardingGuideProps) => {
  const { t } = useTranslation();
  const { user, updateUserPreferences, setOnboardingComplete } = usePreferencesStore();
  const { addAirfield, setHomeAirfield } = useAirfieldStore();
  
  const [step, setStep] = useState<'aircraft' | 'location' | 'homebase'>('aircraft');
  const [aircraftType, setAircraftType] = useState<AircraftType>(user.aircraftType);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyAirfields, setNearbyAirfields] = useState<Airfield[]>([]);
  const [selectedHomeBase, setSelectedHomeBase] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualSearching, setIsManualSearching] = useState(false);

  // Request geolocation when moving to location step
  useEffect(() => {
    if (step === 'location' && open) {
      requestLocation();
    }
  }, [step, open]);

  const requestLocation = () => {
    setIsSearching(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('geolocation_not_supported');
      setIsSearching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        try {
          // Search for nearby airfields within 50 NM
          const airfields = await searchAirfieldsByPosition(latitude, longitude, 50, 20, aircraftType);
          setNearbyAirfields(airfields);
          
          if (airfields.length === 0) {
            setLocationError('no_airfields_found');
          } else {
            setStep('homebase');
          }
        } catch (error) {
          console.error('Error searching nearby airfields:', error);
          setLocationError('search_error');
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('permission_denied');
        setShowManualSearch(true);
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleAircraftTypeNext = () => {
    if (aircraftType) {
      updateUserPreferences({ aircraftType });
      setStep('location');
    }
  };

  const handleComplete = () => {
    if (selectedHomeBase) {
      const homebaseAirfield = nearbyAirfields.find(a => a.id === selectedHomeBase);
      if (homebaseAirfield) {
        // Add airfield to collection and set as home
        const { id, ...airfieldWithoutId } = homebaseAirfield;
        const newAirfieldId = addAirfield({
          ...airfieldWithoutId,
          visited: true, // Mark as visited since it's the home base
        });
        // Set the newly added airfield as home base
        setHomeAirfield(newAirfieldId);
      }
    }
    
    setOnboardingComplete(true);
    onClose();
  };

  const handleSkipHomebase = () => {
    setOnboardingComplete(true);
    onClose();
  };

  const handleSkipLocation = () => {
    setOnboardingComplete(true);
    onClose();
  };

  const handleManualSearch = async () => {
    if (searchQuery.length < 3) return;
    
    setIsManualSearching(true);
    try {
      const airfields = await searchAirfields(searchQuery, 10);
      setNearbyAirfields(airfields);
      
      if (airfields.length === 0) {
        setLocationError('no_airfields_found');
      } else {
        setLocationError(null);
        setStep('homebase');
      }
    } catch (error) {
      console.error('Error searching airfields:', error);
      setLocationError('search_error');
    } finally {
      setIsManualSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            {t('onboarding.title')}
          </DialogTitle>
          <DialogDescription>
            {t('onboarding.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Step 1: Aircraft Type */}
          {step === 'aircraft' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft-type" className="text-base font-semibold">
                  {t('onboarding.aircraftType.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.aircraftType.description')}
                </p>
              </div>
              
              <Select value={aircraftType || undefined} onValueChange={(value) => setAircraftType(value as AircraftType)}>
                <SelectTrigger id="aircraft-type" className="w-full">
                  <SelectValue placeholder={t('onboarding.aircraftType.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airplane">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      {t('onboarding.aircraftType.airplane')}
                    </div>
                  </SelectItem>
                  <SelectItem value="ultralight">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      {t('onboarding.aircraftType.ultralight')}
                    </div>
                  </SelectItem>
                  <SelectItem value="glider">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      {t('onboarding.aircraftType.glider')}
                    </div>
                  </SelectItem>
                  <SelectItem value="heli">
                    <div className="flex items-center gap-2">
                      <Helicopter className="h-4 w-4" />
                      {t('onboarding.aircraftType.heli')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: Location Request */}
          {step === 'location' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {t('onboarding.location.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.location.description')}
                </p>
              </div>

              {isSearching && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.location.searching')}
                  </p>
                </div>
              )}

              {locationError && !showManualSearch && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">
                    {t(`onboarding.location.error.${locationError}`)}
                  </p>
                </div>
              )}

              {showManualSearch && (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('onboarding.location.manualSearch.description')}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('onboarding.location.manualSearch.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        disabled={isManualSearching}
                      />
                      <Button
                        onClick={handleManualSearch}
                        disabled={searchQuery.length < 3 || isManualSearching}
                        size="icon"
                      >
                        {isManualSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {searchQuery.length > 0 && searchQuery.length < 3 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('onboarding.location.manualSearch.minChars')}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestLocation}
                    >
                      {t('onboarding.location.retry')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Home Base Selection */}
          {step === 'homebase' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="homebase" className="text-base font-semibold">
                  {t('onboarding.homebase.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.homebase.description')}
                </p>
              </div>

              <Select value={selectedHomeBase || undefined} onValueChange={setSelectedHomeBase}>
                <SelectTrigger id="homebase" className="w-full">
                  <SelectValue placeholder={t('onboarding.homebase.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {nearbyAirfields.map((airfield) => (
                    <SelectItem key={airfield.id} value={airfield.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{airfield.icao || airfield.name}</span>
                        <span className="text-muted-foreground">- {airfield.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {nearbyAirfields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.homebase.foundCount', { count: nearbyAirfields.length })}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step === 'location' && locationError && (
              <Button variant="ghost" onClick={handleSkipLocation}>
                {t('onboarding.skip')}
              </Button>
            )}
            {step === 'homebase' && (
              <Button variant="ghost" onClick={handleSkipHomebase}>
                {t('onboarding.skip')}
              </Button>
            )}
          </div>
          <div>
            {step === 'aircraft' && (
              <Button onClick={handleAircraftTypeNext} disabled={!aircraftType}>
                {t('onboarding.next')}
              </Button>
            )}
            {step === 'homebase' && (
              <Button onClick={handleComplete} disabled={!selectedHomeBase}>
                {t('onboarding.complete')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingGuide;
