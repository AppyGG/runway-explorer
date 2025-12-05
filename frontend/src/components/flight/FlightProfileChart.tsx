import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlightPath } from '@/types/airfield';
import { TrendingUp, Gauge, Clock } from 'lucide-react';
import { usePreferencesStore } from '@/store/preferences-store';
import { convertDistance, convertSpeed, getDistanceUnitLabel, getSpeedUnitLabel } from '@/lib/unit-conversion';

interface FlightProfileChartProps {
  flight: FlightPath;
}

interface ChartDataPoint {
  distance: number;
  altitude: number;
  speed: number;
  distanceLabel: string;
  distanceRaw?: number;
  speedLabel?: string;
  time?: string;
  timeLabel?: string;
}

const FlightProfileChart = ({ flight }: FlightProfileChartProps) => {
  const { t } = useTranslation();
  const { units } = usePreferencesStore();
  
  // Prepare chart data from flight coordinates
  const chartData = useMemo(() => {
    if (!flight.waypoints || flight.waypoints.length === 0) {
      return [];
    }

    let cumulativeDistance = 0;
    
    // Calculate distance between two points using Haversine formula (in nautical miles)
    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 3440.065; // Earth's radius in nautical miles
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Get the first timestamp to calculate relative time
    const firstTimestamp = flight.waypoints[0]?.timestamp;
    
    return flight.waypoints.map((waypoint, index) => {
      // Calculate cumulative distance
      if (index > 0) {
        const prevWaypoint = flight.waypoints![index - 1];
        const distance = calculateDistance(
          prevWaypoint.lat,
          prevWaypoint.lng,
          waypoint.lat,
          waypoint.lng
        );
        cumulativeDistance += distance;
      }

      // Calculate time label if timestamp is available
      let timeLabel: string | undefined;
      if (waypoint.timestamp) {
        const time = new Date(waypoint.timestamp);
        timeLabel = time.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
      } else if (firstTimestamp && index > 0) {
        // Calculate relative time based on first timestamp and average speed
        const firstTime = new Date(firstTimestamp).getTime();
        const elapsedMinutes = index * 0.5; // Approximate: 1 point every 30 seconds
        const currentTime = new Date(firstTime + elapsedMinutes * 60 * 1000);
        timeLabel = currentTime.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
      }

      const convertedDistance = convertDistance(cumulativeDistance, units.distance);
      const convertedSpeed = convertSpeed(waypoint.speed || 0, units.speed);
      
      return {
        distance: Math.round(convertedDistance * 10) / 10,
        altitude: waypoint.altitude || 0,
        speed: Math.round(convertedSpeed),
        distanceLabel: `${Math.round(convertedDistance)} ${getDistanceUnitLabel(units.distance)}`,
        distanceRaw: cumulativeDistance, // Keep raw value for calculations
        speedLabel: `${Math.round(convertedSpeed)} ${getSpeedUnitLabel(units.speed)}`,
        time: waypoint.timestamp,
        timeLabel,
      };
    });
  }, [flight]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const altitudeData = payload.find((p: any) => p.dataKey === 'altitude');
      const speedData = payload.find((p: any) => p.dataKey === 'speed');
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <div className="space-y-1.5">
            {data.timeLabel && (
              <p className="text-sm flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t('flights.time')}:</span>
                <span className="font-medium">{data.timeLabel}</span>
              </p>
            )}
            <p className="text-sm flex items-center gap-1.5">
              <span className="text-muted-foreground">Distance:</span>
              <span className="font-medium">{data.distanceLabel}</span>
            </p>
            <p className="text-sm flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-muted-foreground">{t('flights.altitude')}:</span>
              <span className="font-medium">{altitudeData?.value ? parseInt(altitudeData.value) : 0} {t('units.ft')}</span>
            </p>
            <p className="text-sm flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">{t('flights.speed')}:</span>
              <span className="font-medium">{data.speedLabel}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {t('flights.profile')}
          <div className="flex items-center gap-3 ml-auto text-sm font-normal">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">{t('flights.altitude')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">{t('flights.speed')}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="distance"
              allowDecimals={false}
              label={{ value: `${t('flights.distance')} (${getDistanceUnitLabel(units.distance)})`, position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="altitude"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              yAxisId="altitude"
            />
            <Line
              type="monotone"
              dataKey="speed"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              yAxisId="speed"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FlightProfileChart;
