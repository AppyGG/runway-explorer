import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Airfield } from '@/types/airfield';
import { searchAirfieldsByPosition } from '@/services/openAIP';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2, MapPin, Plane } from 'lucide-react';

interface AirfieldDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordinates: [number, number];
  type: 'departure' | 'arrival';
  onAirfieldSelected: (airfield: Airfield) => void;
  onSkip: () => void;
}

const AirfieldDiscoveryDialog = ({
  open,
  onOpenChange,
  coordinates,
  type,
  onAirfieldSelected,
  onSkip
}: AirfieldDiscoveryDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredAirfields, setDiscoveredAirfields] = useState<Airfield[]>([]);
  const [selectedAirfieldId, setSelectedAirfieldId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      searchNearbyAirfields();
    }
  }, [open, coordinates]);

  const searchNearbyAirfields = async () => {
    setIsSearching(true);
    try {
      const airfields = await searchAirfieldsByPosition(
        coordinates[0],
        coordinates[1],
        5, // Search within 5nm
        10 // Get up to 10 results
      );
      
      setDiscoveredAirfields(airfields);
      
      if (airfields.length === 0) {
        toast({
          title: t('airfield.discovery.noResults'),
          description: t('airfield.discovery.noResultsDescription'),
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error searching nearby airfields:', error);
      toast({
        title: t('airfield.discovery.error'),
        description: t('airfield.discovery.errorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedAirfieldId) {
      onSkip();
      return;
    }

    const selectedAirfield = discoveredAirfields.find(a => a.id === selectedAirfieldId);
    if (selectedAirfield) {
      onAirfieldSelected(selectedAirfield);
    }
  };

  const getDistance = (airfield: Airfield): number => {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (airfield.coordinates.lat - coordinates[0]) * Math.PI / 180;
    const dLon = (airfield.coordinates.lng - coordinates[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coordinates[0] * Math.PI / 180) * Math.cos(airfield.coordinates.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md z-[1002]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'departure' ? <Plane className="h-5 w-5 rotate-45" /> : <Plane className="h-5 w-5 -rotate-45" />}
            {t(`airfield.discovery.${type}Title`)}
          </DialogTitle>
          <DialogDescription>
            {t(`airfield.discovery.${type}Description`)}
          </DialogDescription>
        </DialogHeader>

        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('airfield.discovery.searching')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discoveredAirfields.length > 0 ? (
              <>
                <div className="text-sm text-muted-foreground">
                  {t('airfield.discovery.foundCount', { count: discoveredAirfields.length })}
                </div>
                <Select value={selectedAirfieldId || undefined} onValueChange={setSelectedAirfieldId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('airfield.discovery.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="z-[1003]">
                    {discoveredAirfields.map((airfield) => {
                      const distance = getDistance(airfield);
                      return (
                        <SelectItem key={airfield.id} value={airfield.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {airfield.name}
                              {airfield.icao && <span className="text-muted-foreground">({airfield.icao})</span>}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {distance.toFixed(1)} NM
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('airfield.discovery.willBeAdded')}
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {t('airfield.discovery.noAirfieldsFound')}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onSkip}>
            {t('airfield.discovery.skip')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSearching || !selectedAirfieldId}
          >
            {selectedAirfieldId ? t('airfield.discovery.addAndContinue') : t('airfield.discovery.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AirfieldDiscoveryDialog;
