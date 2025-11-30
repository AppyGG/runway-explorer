import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
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
import { Switch } from "@/components/ui/switch";
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePreferencesStore, MapPreferences, UnitPreferences } from '@/store/preferences-store';
import { Settings, Moon, Sun, Monitor } from 'lucide-react';

interface PreferencesDialogProps {
  trigger?: React.ReactNode;
}

const presetColors = [
  '#3388ff', // Blue
  '#ff0000', // Red
  '#00cc00', // Green
  '#ff9900', // Orange
  '#d53f94', // Purple
  '#000000', // Black
];

const PreferencesDialog = ({ trigger }: PreferencesDialogProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setLight, setDark } = useTheme();
  const { 
    map: mapPreferences, 
    units: unitPreferences,
    updateMapPreferences, 
    resetMapPreferences,
    updateUnitPreferences,
    resetUnitPreferences
  } = usePreferencesStore();

  // Local state for preferences that will only be applied when saved
  const [localPreferences, setLocalPreferences] = useState<MapPreferences>(mapPreferences);
  const [localUnitPreferences, setLocalUnitPreferences] = useState<UnitPreferences>(unitPreferences);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    updateMapPreferences(localPreferences);
    updateUnitPreferences(localUnitPreferences);
    setOpen(false);
  };

  const handleReset = () => {
    resetMapPreferences();
    resetUnitPreferences();
    setLocalPreferences({
      flightPathColor: '#d53f94',
      selectedFlightPathColor: '#ff0000',
      flightPathWidth: 4,
      selectedFlightPathWidth: 4,
      hideOtherFlightPaths: false,
      fadeOtherFlightPaths: true,
      otherFlightPathsOpacity: 0.3,
      showHeatmap: false,
      heatmapIntensity: 0.4,
      heatmapRadius: 5
    });
    setLocalUnitPreferences({
      distance: 'nm',
      speed: 'kt'
    });
  };

  // Update local preferences when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalPreferences(mapPreferences);
      setLocalUnitPreferences(unitPreferences);
    }
    setOpen(isOpen);
  };



  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
            <span className="sr-only">{t('preferences.title')}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('preferences.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* General Section */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium mb-3">{t('preferences.general.title')}</h4>
            
            <div className="grid grid-cols-3 items-center gap-4 mb-3">
              <Label htmlFor="language" className="text-right text-sm">
                {t('settings.language')}
              </Label>
              <Select 
                value={i18n.language} 
                onValueChange={(value) => i18n.changeLanguage(value)}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('settings.en')}</SelectItem>
                  <SelectItem value="fr">{t('settings.fr')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="theme" className="text-right text-sm">
                {t('preferences.general.theme')}
              </Label>
              <div className="col-span-2">
                <RadioGroup 
                  value={theme} 
                  onValueChange={(value) => value === 'dark' ? setDark() : setLight()}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-1 cursor-pointer font-normal">
                      <Sun className="h-4 w-4" />
                      {t('preferences.general.light')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-1 cursor-pointer font-normal">
                      <Moon className="h-4 w-4" />
                      {t('preferences.general.dark')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          
          {/* Units Section */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium mb-3">{t('preferences.units.title')}</h4>
            
            <div className="grid grid-cols-3 items-center gap-4 mb-3">
              <Label htmlFor="distanceUnit" className="text-right text-sm">
                {t('preferences.units.distance')}
              </Label>
              <Select 
                value={localUnitPreferences.distance} 
                onValueChange={(value) => setLocalUnitPreferences({...localUnitPreferences, distance: value as any})}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nm">{t('preferences.units.nm')}</SelectItem>
                  <SelectItem value="km">{t('preferences.units.km')}</SelectItem>
                  <SelectItem value="mi">{t('preferences.units.mi')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="speedUnit" className="text-right text-sm">
                {t('preferences.units.speed')}
              </Label>
              <Select 
                value={localUnitPreferences.speed} 
                onValueChange={(value) => setLocalUnitPreferences({...localUnitPreferences, speed: value as any})}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kt">{t('preferences.units.kt')}</SelectItem>
                  <SelectItem value="kmh">{t('preferences.units.kmh')}</SelectItem>
                  <SelectItem value="mph">{t('preferences.units.mph')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Map Section */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium mb-3">{t('preferences.map.title')}</h4>
            <div className="grid grid-cols-3 items-center gap-4 mb-3">
              <Label htmlFor="flightPathColor" className="text-right">
                {t('preferences.flightPathColor')}
              </Label>
              <div className="col-span-2">
                <ColorPicker
                  value={localPreferences.flightPathColor}
                  onChange={(color) => setLocalPreferences({...localPreferences, flightPathColor: color})}
                  presetColors={presetColors}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="selectedFlightPathColor" className="text-right">
                {t('preferences.selectedFlightPathColor')}
              </Label>
              <div className="col-span-2">
                <ColorPicker
                  value={localPreferences.selectedFlightPathColor}
                  onChange={(color) => setLocalPreferences({...localPreferences, selectedFlightPathColor: color})}
                  presetColors={presetColors}
                />
              </div>
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
          
          {/* Heatmap Section */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium mb-3">{t('preferences.heatmap.title')}</h4>
            
            <div className="grid grid-cols-3 items-center gap-4 mb-3">
              <Label htmlFor="showHeatmap" className="text-right text-sm">
                {t('preferences.heatmap.show')}
              </Label>
              <div className="col-span-2">
                <Switch 
                  id="showHeatmap"
                  checked={localPreferences.showHeatmap}
                  onCheckedChange={(checked) => setLocalPreferences({...localPreferences, showHeatmap: checked})}
                />
              </div>
            </div>
            
            {localPreferences.showHeatmap && (
              <>
                <div className="grid grid-cols-3 items-center gap-4 mb-3">
                  <Label htmlFor="heatmapIntensity" className="text-right text-sm">
                    {t('preferences.heatmap.intensity')}
                  </Label>
                  <div className="col-span-2 flex items-center gap-4">
                    <Slider 
                      id="heatmapIntensity"
                      defaultValue={[localPreferences.heatmapIntensity * 100]} 
                      max={100} 
                      min={5} 
                      step={5}
                      value={[localPreferences.heatmapIntensity * 100]}
                      onValueChange={(values) => setLocalPreferences({...localPreferences, heatmapIntensity: values[0] / 100})}
                      className="flex-1"
                    />
                    <span className="w-8 text-center">{Math.round(localPreferences.heatmapIntensity * 100)}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="heatmapRadius" className="text-right text-sm">
                    {t('preferences.heatmap.radius')}
                  </Label>
                  <div className="col-span-2 flex items-center gap-4">
                    <Slider 
                      id="heatmapRadius"
                      defaultValue={[localPreferences.heatmapRadius]} 
                      max={20} 
                      min={1} 
                      step={1}
                      value={[localPreferences.heatmapRadius]}
                      onValueChange={(values) => setLocalPreferences({...localPreferences, heatmapRadius: values[0]})}
                      className="flex-1"
                    />
                    <span className="w-8 text-center">{localPreferences.heatmapRadius}px</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="border-b pb-4">
            <h4 className="text-sm font-medium mb-3">{t('preferences.otherFlightPaths')}</h4>
            
            <div className="grid grid-cols-3 items-center gap-4 mb-3">
              <Label htmlFor="hideOtherFlightPaths" className="text-right text-sm">
                {t('preferences.hideOtherPaths')}
              </Label>
              <div className="col-span-2">
                <Switch 
                  id="hideOtherFlightPaths"
                  checked={localPreferences.hideOtherFlightPaths}
                  onCheckedChange={(checked) => setLocalPreferences({...localPreferences, hideOtherFlightPaths: checked})}
                />
              </div>
            </div>
            
            {!localPreferences.hideOtherFlightPaths && (
              <>
                <div className="grid grid-cols-3 items-center gap-4 mb-3">
                  <Label htmlFor="fadeOtherFlightPaths" className="text-right text-sm">
                    {t('preferences.fadeOtherPaths')}
                  </Label>
                  <div className="col-span-2">
                    <Switch 
                      id="fadeOtherFlightPaths"
                      checked={localPreferences.fadeOtherFlightPaths}
                      onCheckedChange={(checked) => setLocalPreferences({...localPreferences, fadeOtherFlightPaths: checked})}
                    />
                  </div>
                </div>
                
                {localPreferences.fadeOtherFlightPaths && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="otherFlightPathsOpacity" className="text-right text-sm">
                      {t('preferences.fadeOpacity')}
                    </Label>
                    <div className="col-span-2 flex items-center gap-4">
                      <Slider 
                        id="otherFlightPathsOpacity"
                        defaultValue={[localPreferences.otherFlightPathsOpacity * 100]} 
                        max={100} 
                        min={0} 
                        step={10}
                        value={[localPreferences.otherFlightPathsOpacity * 100]}
                        onValueChange={(values) => setLocalPreferences({...localPreferences, otherFlightPathsOpacity: values[0] / 100})}
                        className="flex-1"
                      />
                      <span className="w-8 text-center">{Math.round(localPreferences.otherFlightPathsOpacity * 100)}%</span>
                    </div>
                  </div>
                )}
              </>
            )}
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
