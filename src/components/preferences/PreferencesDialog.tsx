import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Slider
} from "@/components/ui/slider";
import { Label } from '@/components/ui/label';
import { usePreferencesStore, MapPreferences } from '@/store/preferences-store';
import { Settings } from 'lucide-react';

interface PreferencesDialogProps {
  trigger?: React.ReactNode;
}

interface ColorOption {
  value: string;
  label: string;
  translateKey: string;
}

const colorOptions: ColorOption[] = [
  { value: '#3388ff', label: 'Blue', translateKey: 'preferences.colors.blue' },
  { value: '#ff0000', label: 'Red', translateKey: 'preferences.colors.red' },
  { value: '#00cc00', label: 'Green', translateKey: 'preferences.colors.green' },
  { value: '#ff9900', label: 'Orange', translateKey: 'preferences.colors.orange' },
  { value: '#d53f94', label: 'Purple', translateKey: 'preferences.colors.purple' },
  { value: '#000000', label: 'Black', translateKey: 'preferences.colors.black' }
];

const PreferencesDialog = ({ trigger }: PreferencesDialogProps) => {
  const { t } = useTranslation();
  const { map: mapPreferences, updateMapPreferences, resetMapPreferences } = usePreferencesStore();

  // Local state for preferences that will only be applied when saved
  const [localPreferences, setLocalPreferences] = useState<MapPreferences>(mapPreferences);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    updateMapPreferences(localPreferences);
    setOpen(false);
  };

  const handleReset = () => {
    resetMapPreferences();
    setLocalPreferences({
      flightPathColor: '#d53f94',
      flightPathWidth: 3,
      selectedFlightPathWidth: 5
    });
  };

  // Update local preferences when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalPreferences(mapPreferences);
    }
    setOpen(isOpen);
  };

  const getColorDisplay = (colorValue: string) => {
    const color = colorOptions.find(c => c.value === colorValue);
    return color ? t(color.translateKey) : colorValue;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
            <span className="sr-only">{t('preferences.title')}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('preferences.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="flightPathColor" className="text-right">
              {t('preferences.flightPathColor')}
            </Label>
            <Select 
              value={localPreferences.flightPathColor} 
              onValueChange={(value) => setLocalPreferences({...localPreferences, flightPathColor: value})}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder={getColorDisplay(localPreferences.flightPathColor)}>
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{backgroundColor: localPreferences.flightPathColor}} 
                    />
                    {getColorDisplay(localPreferences.flightPathColor)}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{backgroundColor: color.value}} 
                      />
                      {t(color.translateKey)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="flightPathWidth" className="text-right">
              {t('preferences.flightPathWidth')}
            </Label>
            <div className="col-span-2 flex items-center gap-4">
              <Slider 
                id="flightPathWidth"
                defaultValue={[localPreferences.flightPathWidth]} 
                max={10} 
                min={1} 
                step={1}
                value={[localPreferences.flightPathWidth]}
                onValueChange={(values) => setLocalPreferences({...localPreferences, flightPathWidth: values[0]})}
                className="flex-1"
              />
              <span className="w-8 text-center">{localPreferences.flightPathWidth}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="selectedFlightPathWidth" className="text-right">
              {t('preferences.selectedPathWidth')}
            </Label>
            <div className="col-span-2 flex items-center gap-4">
              <Slider 
                id="selectedFlightPathWidth"
                defaultValue={[localPreferences.selectedFlightPathWidth]} 
                max={10} 
                min={1} 
                step={1}
                value={[localPreferences.selectedFlightPathWidth]}
                onValueChange={(values) => setLocalPreferences({...localPreferences, selectedFlightPathWidth: values[0]})}
                className="flex-1"
              />
              <span className="w-8 text-center">{localPreferences.selectedFlightPathWidth}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            {t('preferences.reset')}
          </Button>
          <Button onClick={handleSave}>
            {t('preferences.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreferencesDialog;