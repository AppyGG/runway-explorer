import { useState } from 'react';
import { useAirfieldStore } from '@/store/airfield-store';
import { parseFlightFile, matchAirfields } from '@/lib/flight-parser';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Airfield } from '@/types/airfield';
import AirfieldDiscoveryDialog from './AirfieldDiscoveryDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Upload, CalendarIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlightPath } from '@/types/airfield';

const formSchema = z.object({
  flightFile: z.instanceof(File)
    .refine(file => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      file => ['application/vnd.google-earth.kml+xml', 'application/xml', 'text/xml', '.kml', '.gpx'].includes(file.type) || 
              file.name.endsWith('.kml') || file.name.endsWith('.gpx'),
      'Only KML or GPX files are allowed'
    ),
  date: z.date(),
  name: z.string().min(1, 'Flight name is required'),
  departure: z.string().optional(),
  arrival: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface FlightUploadDialogProps {
  trigger?: React.ReactNode;
  onUploadComplete?: (flight: FlightPath) => void;
}

const FlightUploadDialog = ({ trigger, onUploadComplete }: FlightUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [flightPreview, setFlightPreview] = useState<FlightPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { airfields, addFlightPath, updateAirfield, addAirfield } = useAirfieldStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Airfield discovery state
  const [discoveryStep, setDiscoveryStep] = useState<'none' | 'departure' | 'arrival'>('none');
  const [discoveredDepartureAirfield, setDiscoveredDepartureAirfield] = useState<Airfield | null>(null);
  const [discoveredArrivalAirfield, setDiscoveredArrivalAirfield] = useState<Airfield | null>(null);
  const [departureCoordinates, setDepartureCoordinates] = useState<[number, number] | null>(null);
  const [arrivalCoordinates, setArrivalCoordinates] = useState<[number, number] | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      name: ''
    }
  });

  const handleFileChange = async (file: File) => {
    setIsLoading(true);
    try {
      const flightData = await parseFlightFile(file);
      
      if (!flightData) {
        toast({
          title: t('upload.error'),
          description: t('upload.invalidFile'),
          variant: "destructive"
        });
        form.reset();
        return;
      }
      
      // Verify coordinates exist and are valid
      if (!flightData.coordinates || flightData.coordinates.length < 2) {
        toast({
          title: t('upload.error'),
          description: t('upload.invalidCoordinates'),
          variant: "destructive"
        });
        form.reset();
        return;
      }

      // Try to match departure/arrival airfields
      const matchResult = matchAirfields(flightData, airfields);
      const { departure, arrival, departureCoordinates, arrivalCoordinates } = matchResult;
      
      setFlightPreview({
        ...flightData,
        departure,
        arrival
      });
      
      // Set form values based on parsed data
      form.setValue('name', flightData.name);
      form.setValue('date', new Date(flightData.date));
      if (departure) form.setValue('departure', departure);
      if (arrival) form.setValue('arrival', arrival);
      
      // Store coordinates for potential discovery
      setDepartureCoordinates(departureCoordinates);
      setArrivalCoordinates(arrivalCoordinates);
      
      // Trigger airfield discovery if no matches found
      if (!departure && departureCoordinates) {
        setDiscoveryStep('departure');
      } else if (!arrival && arrivalCoordinates) {
        setDiscoveryStep('arrival');
      }
      
    } catch (error) {
      toast({
        title: t('upload.error'),
        description: error instanceof Error ? error.message : t('upload.processingError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartureAirfieldDiscovered = (airfield: Airfield) => {
    setDiscoveredDepartureAirfield(airfield);
    setDiscoveryStep('none');
    
    // Check if we need to discover arrival airfield
    if (!form.getValues('arrival') && arrivalCoordinates) {
      setDiscoveryStep('arrival');
    }
  };

  const handleArrivalAirfieldDiscovered = (airfield: Airfield) => {
    setDiscoveredArrivalAirfield(airfield);
    setDiscoveryStep('none');
  };

  const handleSkipDiscovery = () => {
    if (discoveryStep === 'departure') {
      setDiscoveryStep('none');
      // Check if we need to discover arrival airfield
      if (!form.getValues('arrival') && arrivalCoordinates) {
        setDiscoveryStep('arrival');
      }
    } else if (discoveryStep === 'arrival') {
      setDiscoveryStep('none');
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!flightPreview) {
      toast({
        title: t('upload.error'),
        description: t('upload.noData'),
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Add discovered airfields to the store first
      let departureId = values.departure;
      let arrivalId = values.arrival;
      
      if (discoveredDepartureAirfield) {
        addAirfield(discoveredDepartureAirfield);
        // Get the ID from the store (it will be assigned during addAirfield)
        const addedDeparture = useAirfieldStore.getState().airfields.find(
          a => a.name === discoveredDepartureAirfield.name && 
               a.coordinates.lat === discoveredDepartureAirfield.coordinates.lat
        );
        if (addedDeparture) {
          departureId = addedDeparture.id;
        }
      }
      
      if (discoveredArrivalAirfield) {
        addAirfield(discoveredArrivalAirfield);
        // Get the ID from the store
        const addedArrival = useAirfieldStore.getState().airfields.find(
          a => a.name === discoveredArrivalAirfield.name && 
               a.coordinates.lat === discoveredArrivalAirfield.coordinates.lat
        );
        if (addedArrival) {
          arrivalId = addedArrival.id;
          // Mark as visited
          updateAirfield(addedArrival.id, { visited: true });
        }
      }
      
      const newFlight: Omit<FlightPath, 'id'> = {
        ...flightPreview,
        name: values.name,
        date: format(values.date, 'yyyy-MM-dd'),
        departure: departureId,
        arrival: arrivalId
      };
      
      addFlightPath(newFlight);
      
      // Automatically mark arrival airfield as visited if it's not already
      if (arrivalId && arrivalId !== 'null' && !discoveredArrivalAirfield) {
        const arrivalAirfield = airfields.find(a => a.id === arrivalId);
        if (arrivalAirfield && !arrivalAirfield.visited) {
          updateAirfield(arrivalId, { visited: true });
        }
      }
      
      toast({
        title: t('upload.success'),
        description: t('upload.successDescription'),
      });
      
      if (onUploadComplete) {
        // Use a small delay to ensure the store has been updated and the component will re-render
        setTimeout(() => {
          // Get the most recently added flight from the store (it will have the correct ID)
          const flightPaths = useAirfieldStore.getState().flightPaths;
          const addedFlight = flightPaths[flightPaths.length - 1];
          onUploadComplete(addedFlight);
        }, 0);
      }
      
      // Reset state
      setOpen(false);
      form.reset();
      setFlightPreview(null);
      setDiscoveredDepartureAirfield(null);
      setDiscoveredArrivalAirfield(null);
      setDepartureCoordinates(null);
      setArrivalCoordinates(null);
      setDiscoveryStep('none');
    } catch (error) {
      toast({
        title: t('upload.error'),
        description: t('upload.addError'),
        variant: "destructive"
      });
      console.error("Error adding flight:", error);
    }
  };

  return (
    <>
      <AirfieldDiscoveryDialog
        open={discoveryStep === 'departure'}
        onOpenChange={(isOpen) => !isOpen && setDiscoveryStep('none')}
        coordinates={departureCoordinates || [0, 0]}
        type="departure"
        onAirfieldSelected={handleDepartureAirfieldDiscovered}
        onSkip={handleSkipDiscovery}
      />
      
      <AirfieldDiscoveryDialog
        open={discoveryStep === 'arrival'}
        onOpenChange={(isOpen) => !isOpen && setDiscoveryStep('none')}
        coordinates={arrivalCoordinates || [0, 0]}
        type="arrival"
        onAirfieldSelected={handleArrivalAirfieldDiscovered}
        onSkip={handleSkipDiscovery}
      />
      
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1">
            <Upload className="h-4 w-4" />
            <span>{t('flights.upload')}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg z-[1000]">
        <DialogHeader>
          <DialogTitle>{t('upload.title')}</DialogTitle>
          <DialogDescription>
            {t('flights.uploadInfo')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="flightFile"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('upload.selectFile')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="file"
                      accept=".kml,.gpx,application/vnd.google-earth.kml+xml,application/xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          handleFileChange(file);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('upload.formats')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : flightPreview ? (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('upload.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('upload.date')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t('upload.selectDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[1001]" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('flights.departure')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('flights.selectDeparture')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[1002]">
                            <SelectItem value="null">{t('flights.none')}</SelectItem>
                            {airfields.map(airfield => (
                              <SelectItem key={airfield.id} value={airfield.id}>
                                {airfield.name} {airfield.icao ? `(${airfield.icao})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {discoveredDepartureAirfield && (
                          <FormDescription className="text-xs text-green-600">
                            ✓ {t('flights.willBeAdded', { name: discoveredDepartureAirfield.name })}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="arrival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('flights.arrival')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('flights.selectArrival')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[1002]">
                            <SelectItem value="null">{t('flights.none')}</SelectItem>
                            {airfields.map(airfield => (
                              <SelectItem key={airfield.id} value={airfield.id}>
                                {airfield.name} {airfield.icao ? `(${airfield.icao})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {discoveredArrivalAirfield && (
                          <FormDescription className="text-xs text-green-600">
                            ✓ {t('flights.willBeAdded', { name: discoveredArrivalAirfield.name })}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : null}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                {t('upload.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !flightPreview}
              >
                {t('upload.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default FlightUploadDialog;