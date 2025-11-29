import { useState } from 'react';
import { useAirfieldStore } from '@/store/airfield-store';
import { parseFlightFile, matchAirfields } from '@/lib/flight-parser';
import { useToast } from '@/hooks/use-toast';
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
  const { airfields, addFlightPath } = useAirfieldStore();
  const { toast } = useToast();

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
          title: "Error",
          description: "Could not parse flight data from file. Please ensure it's a valid KML or GPX file.",
          variant: "destructive"
        });
        form.reset();
        return;
      }
      
      // Verify coordinates exist and are valid
      if (!flightData.coordinates || flightData.coordinates.length < 2) {
        toast({
          title: "Error",
          description: "The uploaded file doesn't contain enough valid GPS coordinates.",
          variant: "destructive"
        });
        form.reset();
        return;
      }

      // Try to match departure/arrival airfields
      const { departure, arrival } = matchAirfields(flightData, airfields);
      
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
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!flightPreview) {
      toast({
        title: "Error",
        description: "No flight data available to upload.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newFlight: Omit<FlightPath, 'id'> = {
        ...flightPreview,
        name: values.name,
        date: format(values.date, 'yyyy-MM-dd'),
        departure: values.departure,
        arrival: values.arrival
      };
      
      addFlightPath(newFlight);
      
      toast({
        title: "Success",
        description: "Flight uploaded successfully!",
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
      
      setOpen(false);
      form.reset();
      setFlightPreview(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add flight to your collection. Please try again.",
        variant: "destructive"
      });
      console.error("Error adding flight:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1">
            <Upload className="h-4 w-4" />
            <span>Upload Flight</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg z-[1000]">
        <DialogHeader>
          <DialogTitle>Upload Flight Data</DialogTitle>
          <DialogDescription>
            Upload KML or GPX files to add flight traces to your logbook.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="flightFile"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Flight File (KML/GPX)</FormLabel>
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
                    Upload a KML or GPX file containing your flight path.
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
                      <FormLabel>Flight Name</FormLabel>
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
                      <FormLabel>Flight Date</FormLabel>
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
                                <span>Pick a date</span>
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
                        <FormLabel>Departure Airfield</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select departure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">None</SelectItem>
                            {airfields.map(airfield => (
                              <SelectItem key={airfield.id} value={airfield.id}>
                                {airfield.name} {airfield.icao ? `(${airfield.icao})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="arrival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Airfield</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select arrival" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">None</SelectItem>
                            {airfields.map(airfield => (
                              <SelectItem key={airfield.id} value={airfield.id}>
                                {airfield.name} {airfield.icao ? `(${airfield.icao})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !flightPreview}
              >
                Upload Flight
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FlightUploadDialog;