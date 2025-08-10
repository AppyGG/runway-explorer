import { useState, useEffect, useCallback } from 'react';
import { useAirfieldStore } from '@/store/airfield-store';
import { 
  CheckCircle2, 
  Circle, 
  Home, 
  MapPin, 
  Search, 
  PlaneTakeoff,
  X,
  Loader2,
  Globe,
  FilterIcon,
  Download,
  CircleDashed
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Airfield } from '@/types/airfield';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { searchAirfields } from '@/services/openAIP';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface AirfieldListProps {
  onSelectAirfield?: (airfield: Airfield) => void;
  className?: string;
}

const AirfieldList = ({ onSelectAirfield, className = '' }: AirfieldListProps) => {
  const { airfields, homeAirfieldId, setHomeAirfield, addAirfield } = useAirfieldStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [openAIPResults, setOpenAIPResults] = useState<Airfield[]>([]);
  const [searchMode, setSearchMode] = useState<'local' | 'openAIP'>('local');
  const { toast } = useToast();
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    showVisited: true,
    showPlanned: true,
    showOther: true,
    showHome: true,
  });
  
  // Sort options
  const [sortOption, setSortOption] = useState<'name' | 'icao' | 'status'>('name');
  
  const handleSetHomeAirfield = (airfield: Airfield) => {
    setHomeAirfield(airfield.id === homeAirfieldId ? null : airfield.id);
  };

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term || term.length < 3 || searchMode !== 'openAIP') return;
      
      setIsSearching(true);
      try {
        const results = await searchAirfields(term);
        setOpenAIPResults(results);
      } catch (error) {
        console.error('Error searching OpenAIP:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to search for airfields. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [searchMode]
  );

  // Handle search term changes
  useEffect(() => {
    if (searchMode === 'openAIP') {
      debouncedSearch(searchTerm);
    }
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, searchMode, debouncedSearch]);

  // Add debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    const debounced = (...args: Parameters<T>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), wait);
    };
    
    debounced.cancel = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
    
    return debounced;
  }

  // Handle adding an airfield from OpenAIP results
  const handleAddAirfield = (airfield: Airfield) => {
    const existingAirfield = airfields.find(a => 
      a.icao === airfield.icao && airfield.icao !== ''
    );

    if (existingAirfield) {
      toast({
        title: 'Airfield Already Exists',
        description: `${airfield.name} (${airfield.icao}) is already in your collection.`,
      });
      return;
    }

    addAirfield(airfield);
    toast({
      title: 'Airfield Added',
      description: `${airfield.name} has been added to your collection.`,
    });
  };
  
  // Export airfields as CSV
  const exportAirfields = () => {
    // Create CSV content
    const headers = ['Name', 'ICAO', 'Latitude', 'Longitude', 'Elevation (ft)', 'Runway Length (m)', 
                     'Runway Surface', 'Status', 'Notes'];
    
    const csvRows = [headers.join(',')];
    
    airfields.forEach(airfield => {
      // Determine status
      let status = 'Not visited';
      if (airfield.id === homeAirfieldId) status = 'Home';
      else if (airfield.visited) status = 'Visited';
      else if (airfield.planned) status = 'Planned';
      
      // Clean up notes (remove commas and new lines for CSV)
      const notes = airfield.notes ? airfield.notes.replace(/,/g, ' ').replace(/\n/g, ' ') : '';
      
      const row = [
        `"${airfield.name.replace(/"/g, '""')}"`,  // Escape quotes in name
        airfield.icao || '',
        airfield.coordinates.lat,
        airfield.coordinates.lng,
        airfield.elevation !== undefined ? airfield.elevation : '',
        airfield.runwayLength || '',
        airfield.runwaySurface ? `"${airfield.runwaySurface.replace(/"/g, '""')}"` : '',
        status,
        `"${notes}"`
      ];
      
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create downloadable file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `airfields_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Successful',
      description: `${airfields.length} airfields exported as CSV.`
    });
  };
  
  // Apply both text search and filter options
  const filteredAirfields = searchMode === 'local' 
    ? airfields.filter(airfield => {
        // Text search filter
        const matchesSearch = 
          airfield.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          airfield.icao?.toLowerCase().includes(searchTerm.toLowerCase());
          
        // Status filters
        const statusMatch = 
          (airfield.visited && filterOptions.showVisited) ||
          (airfield.planned && !airfield.visited && filterOptions.showPlanned) ||
          (!airfield.visited && !airfield.planned && filterOptions.showOther) ||
          (airfield.id === homeAirfieldId && filterOptions.showHome);
          
        return matchesSearch && statusMatch;
      })
    : openAIPResults;
    
  // Sort the filtered airfields
  const sortedAirfields = [...filteredAirfields].sort((a, b) => {
    // Always prioritize home airfield if showing
    if (filterOptions.showHome) {
      if (a.id === homeAirfieldId) return -1;
      if (b.id === homeAirfieldId) return 1;
    }
    
    switch (sortOption) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'icao':
        return (a.icao || '').localeCompare(b.icao || '');
      case 'status':
        // Sort by status: Home > Visited > Planned > Other
        const statusA = a.id === homeAirfieldId ? 0 : a.visited ? 1 : a.planned ? 2 : 3;
        const statusB = b.id === homeAirfieldId ? 0 : b.visited ? 1 : b.planned ? 2 : 3;
        return statusA - statusB;
      default:
        return 0;
    }
  });
  
  return (
    <div className={cn("flex flex-col h-full bg-card rounded-md border", className)}>
      <div className="p-3 border-b">
        <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Airfields
        </h2>
        
        {/* Search toggle buttons */}
        <div className="flex mb-2 space-x-1">
          <Button
            size="sm"
            variant={searchMode === 'local' ? 'default' : 'outline'}
            onClick={() => {
              setSearchMode('local');
              setOpenAIPResults([]);
            }}
            className="flex-1"
          >
            <Search className="h-3.5 w-3.5 mr-1" />
            My Airfields
          </Button>
          <Button
            size="sm"
            variant={searchMode === 'openAIP' ? 'default' : 'outline'}
            onClick={() => setSearchMode('openAIP')}
            className="flex-1"
          >
            <Globe className="h-3.5 w-3.5 mr-1" />
            OpenAIP Search
          </Button>
        </div>
        
        {/* Search input with filter dropdown */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder={searchMode === 'local' ? "Search my airfields..." : "Search global airfields (min 3 chars)..."}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && searchMode === 'openAIP' && (
              <Loader2 className="w-4 h-4 absolute right-2.5 top-2.5 animate-spin text-primary" />
            )}
            {searchTerm && !isSearching && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 absolute right-2 top-2"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {searchMode === 'local' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter Airfields</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-home" 
                        checked={filterOptions.showHome}
                        onCheckedChange={(checked) => 
                          setFilterOptions(prev => ({ ...prev, showHome: !!checked }))
                        }
                      />
                      <label htmlFor="show-home" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
                        <Home className="h-3.5 w-3.5" /> Home
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-visited" 
                        checked={filterOptions.showVisited}
                        onCheckedChange={(checked) => 
                          setFilterOptions(prev => ({ ...prev, showVisited: !!checked }))
                        }
                      />
                      <label htmlFor="show-visited" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Visited
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-planned" 
                        checked={filterOptions.showPlanned}
                        onCheckedChange={(checked) => 
                          setFilterOptions(prev => ({ ...prev, showPlanned: !!checked }))
                        }
                      />
                      <label htmlFor="show-planned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
                        <CircleDashed className="h-3.5 w-3.5" /> Planned
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-other" 
                        checked={filterOptions.showOther}
                        onCheckedChange={(checked) => 
                          setFilterOptions(prev => ({ ...prev, showOther: !!checked }))
                        }
                      />
                      <label htmlFor="show-other" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Other
                      </label>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                
                <DropdownMenuCheckboxItem
                  checked={sortOption === 'name'}
                  onCheckedChange={() => setSortOption('name')}
                >
                  Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortOption === 'icao'}
                  onCheckedChange={() => setSortOption('icao')}
                >
                  ICAO Code
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortOption === 'status'}
                  onCheckedChange={() => setSortOption('status')}
                >
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {searchMode === 'local' && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => exportAirfields()}
              title="Export airfields as CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {searchMode === 'openAIP' && (
          <p className="text-xs text-muted-foreground mt-1">
            {searchTerm.length < 3 
              ? "Enter at least 3 characters to search OpenAIP database" 
              : isSearching 
                ? "Searching airfields..." 
                : openAIPResults.length > 0 
                  ? `Found ${openAIPResults.length} airfields` 
                  : "No airfields found"}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        {sortedAirfields.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mb-2 opacity-50" />
            <p>
              {searchMode === 'local' 
                ? "No airfields found" 
                : searchTerm.length < 3 
                  ? "Enter at least 3 characters to search" 
                  : "No airfields found in OpenAIP database"}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {sortedAirfields.map(airfield => (
              <li 
                key={airfield.id} 
                className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelectAirfield?.(airfield)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{airfield.name}</h3>
                    {airfield.icao && (
                      <div className="text-sm text-muted-foreground">
                        ICAO: {airfield.icao}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {searchMode === 'local' ? (
                      airfield.id === homeAirfieldId ? (
                        <Badge variant="default" className="bg-primary text-primary-foreground">Home</Badge>
                      ) : airfield.visited ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Visited</Badge>
                      ) : airfield.planned ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-700">Planned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not Visited</Badge>
                      )
                    ) : (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">OpenAIP</Badge>
                    )}
                  </div>
                </div>
                
                {searchMode === 'local' ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Button 
                      variant={airfield.id === homeAirfieldId ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetHomeAirfield(airfield);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Home className="h-3.5 w-3.5" />
                      {airfield.id === homeAirfieldId ? "Home Base" : "Set as Home"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAirfield(airfield);
                      }}
                      className="flex items-center gap-1"
                    >
                      <PlaneTakeoff className="h-3.5 w-3.5" />
                      Add to My Airfields
                    </Button>
                  </div>
                )}

                <div className="mt-2 text-xs flex flex-wrap gap-2">
                  {airfield.elevation !== undefined && (
                    <span className="text-muted-foreground">Elev: {airfield.elevation} ft</span>
                  )}
                  {airfield.runwayLength && (
                    <span className="text-muted-foreground">
                      RW: {airfield.runwayLength}m ({airfield.runwaySurface})
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
      
      <div className="p-3 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {searchMode === 'local' 
            ? `${sortedAirfields.length} airfields in collection` 
            : searchTerm.length < 3 
              ? "Enter at least 3 characters to search"
              : `${sortedAirfields.length} results from OpenAIP`
          }
        </div>
        {searchMode === 'local' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1"
            onClick={() => {
              setSearchMode('openAIP');
              setSearchTerm('');
            }}
          >
            <Globe className="h-3.5 w-3.5" />
            Search OpenAIP
          </Button>
        )}
      </div>
    </div>
  );
};

export default AirfieldList;