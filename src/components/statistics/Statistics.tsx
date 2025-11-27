import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAirfieldStore } from '@/store/airfield-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Ruler, 
  Clock, 
  TrendingUp,
  Home,
  Target,
  Route,
  TowerControl,
  Map as MapIcon,
  BarChart3
} from 'lucide-react';
import { calculateFlightStatistics } from '@/lib/flight-parser';
import { formatDistance } from '@/lib/unit-conversion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatisticsProps {
  className?: string;
}

const Statistics = ({ className = '' }: StatisticsProps) => {
  const { t } = useTranslation();
  const { airfields, flightPaths, homeAirfieldId } = useAirfieldStore();
  const { units } = usePreferencesStore();

  // Calculate overall statistics
  const stats = useMemo(() => {
    // Flight statistics
    const totalFlights = flightPaths.length;
    let totalDistance = 0;
    let totalDuration = 0;
    let maxAltitude = 0;
    let totalAltitude = 0;
    let flightCount = 0;

    const flightsByYear: Record<string, number> = {};
    const flightsByMonth: Record<string, number> = {};
    const distanceByYear: Record<string, number> = {};

    flightPaths.forEach(flight => {
      const flightStats = calculateFlightStatistics(flight);
      totalDistance += flightStats.totalDistance;
      totalDuration += flightStats.duration;
      
      if (flightStats.maxAltitude > maxAltitude) {
        maxAltitude = flightStats.maxAltitude;
      }
      
      if (flightStats.avgAltitude > 0) {
        totalAltitude += flightStats.avgAltitude;
        flightCount++;
      }

      // Group by year
      const year = flight.date.substring(0, 4);
      flightsByYear[year] = (flightsByYear[year] || 0) + 1;
      distanceByYear[year] = (distanceByYear[year] || 0) + flightStats.totalDistance;

      // Group by month
      const month = flight.date.substring(0, 7);
      flightsByMonth[month] = (flightsByMonth[month] || 0) + 1;
    });

    const avgAltitude = flightCount > 0 ? Math.round(totalAltitude / flightCount) : 0;
    const avgFlightDistance = totalFlights > 0 ? totalDistance / totalFlights : 0;

    // Airfield statistics
    const totalAirfields = airfields.length;
    const visitedAirfields = airfields.filter(a => a.visited).length;
    const plannedAirfields = airfields.filter(a => a.planned).length;
    const hasHomeAirfield = !!homeAirfieldId;

    // Most visited airfields
    const airfieldVisits: Record<string, number> = {};
    flightPaths.forEach(flight => {
      if (flight.departure) {
        airfieldVisits[flight.departure] = (airfieldVisits[flight.departure] || 0) + 1;
      }
      if (flight.arrival) {
        airfieldVisits[flight.arrival] = (airfieldVisits[flight.arrival] || 0) + 1;
      }
    });

    const mostVisitedAirfields = Object.entries(airfieldVisits)
      .map(([id, count]) => ({
        airfield: airfields.find(a => a.id === id),
        count
      }))
      .filter(item => item.airfield)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Find longest flight
    const longestFlight = flightPaths.reduce((longest, flight) => {
      const stats = calculateFlightStatistics(flight);
      const longestStats = calculateFlightStatistics(longest || flight);
      return stats.totalDistance > longestStats.totalDistance ? flight : longest;
    }, flightPaths[0]);

    // Find highest flight
    const highestFlight = flightPaths.reduce((highest, flight) => {
      const stats = calculateFlightStatistics(flight);
      const highestStats = calculateFlightStatistics(highest || flight);
      return stats.maxAltitude > highestStats.maxAltitude ? flight : highest;
    }, flightPaths[0]);

    return {
      totalFlights,
      totalDistance,
      totalDuration,
      maxAltitude,
      avgAltitude,
      avgFlightDistance,
      totalAirfields,
      visitedAirfields,
      plannedAirfields,
      hasHomeAirfield,
      flightsByYear,
      flightsByMonth,
      distanceByYear,
      mostVisitedAirfields,
      longestFlight,
      highestFlight
    };
  }, [flightPaths, airfields, homeAirfieldId]);

  // Format duration to hours and minutes
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Format duration to decimal hours
  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(1);
  };

  return (
    <div className={`${className} overflow-auto`}>
      <Tabs defaultValue="overview" className="h-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="h-4 w-4 mr-1" />
            {t('statistics.overview')}
          </TabsTrigger>
          <TabsTrigger value="flights" className="text-xs">
            <Plane className="h-4 w-4 mr-1" />
            {t('statistics.flights')}
          </TabsTrigger>
          <TabsTrigger value="airfields" className="text-xs">
            <TowerControl className="h-4 w-4 mr-1" />
            {t('statistics.airfields')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Plane className="h-4 w-4 text-primary" />
                  {t('statistics.totalFlights')}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="text-3xl font-bold">{stats.totalFlights}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <TowerControl className="h-4 w-4 text-primary" />
                  {t('statistics.totalAirfields')}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="text-3xl font-bold">{stats.totalAirfields}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-primary" />
                  {t('statistics.totalDistance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="text-2xl font-bold">
                  {formatDistance(stats.totalDistance, units.distance)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('statistics.totalFlightTime')}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="text-2xl font-bold">
                  {formatHours(stats.totalDuration)}h
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(stats.totalDuration)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('statistics.quickStats')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('statistics.visitedAirfields')}
                </span>
                <span className="font-semibold">{stats.visitedAirfields}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('statistics.plannedAirfields')}
                </span>
                <span className="font-semibold">{stats.plannedAirfields}</span>
              </div>
              {stats.avgFlightDistance > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('statistics.avgFlightDistance')}
                  </span>
                  <span className="font-semibold">
                    {formatDistance(stats.avgFlightDistance, units.distance)}
                  </span>
                </div>
              )}
              {stats.maxAltitude > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('statistics.maxAltitude')}
                  </span>
                  <span className="font-semibold">{stats.maxAltitude} {t('units.ft')}</span>
                </div>
              )}
              {stats.avgAltitude > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('statistics.avgAltitude')}
                  </span>
                  <span className="font-semibold">{stats.avgAltitude} {t('units.ft')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flights" className="space-y-4 mt-4">
          {stats.totalFlights > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('statistics.flightsByYear')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.flightsByYear)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([year, count]) => (
                      <div key={year} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{year}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {formatDistance(stats.distanceByYear[year] || 0, units.distance)}
                          </span>
                          <span className="font-semibold min-w-[3ch] text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {stats.longestFlight && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {t('statistics.longestFlight')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-semibold">{stats.longestFlight.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.longestFlight.date}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatDistance(
                          calculateFlightStatistics(stats.longestFlight).totalDistance,
                          units.distance
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.highestFlight && calculateFlightStatistics(stats.highestFlight).maxAltitude > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {t('statistics.highestFlight')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-semibold">{stats.highestFlight.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.highestFlight.date}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {calculateFlightStatistics(stats.highestFlight).maxAltitude} {t('units.ft')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('statistics.recentMonths')}</CardTitle>
                  <CardDescription>{t('statistics.last12Months')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.flightsByMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 12)
                    .map(([month, count]) => {
                      const date = new Date(month + '-01');
                      const monthName = date.toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short' 
                      });
                      return (
                        <div key={month} className="flex justify-between items-center">
                          <span className="text-sm">{monthName}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Plane className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>{t('statistics.noFlights')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="airfields" className="space-y-4 mt-4">
          {stats.totalAirfields > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-xs font-medium text-center">
                      {t('statistics.visited')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.visitedAirfields}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-xs font-medium text-center">
                      {t('statistics.planned')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.plannedAirfields}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-xs font-medium text-center">
                      {t('statistics.other')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3 text-center">
                    <div className="text-2xl font-bold">
                      {stats.totalAirfields - stats.visitedAirfields - stats.plannedAirfields}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats.mostVisitedAirfields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('statistics.mostVisited')}</CardTitle>
                    <CardDescription>{t('statistics.mostVisitedDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.mostVisitedAirfields.map((item, index) => (
                      <div key={item.airfield!.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">
                            {item.airfield!.name}
                          </div>
                          {item.airfield!.icao && (
                            <div className="text-xs text-muted-foreground">
                              {item.airfield!.icao}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Route className="h-3 w-3" />
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <TowerControl className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>{t('statistics.noAirfields')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;
