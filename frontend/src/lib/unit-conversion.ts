import { DistanceUnit, SpeedUnit } from '@/store/preferences-store';

/**
 * Convert distance from nautical miles to the target unit
 */
export const convertDistance = (nauticalMiles: number, targetUnit: DistanceUnit): number => {
  switch (targetUnit) {
    case 'nm':
      return nauticalMiles;
    case 'km':
      return nauticalMiles * 1.852; // 1 NM = 1.852 km
    case 'mi':
      return nauticalMiles * 1.15078; // 1 NM = 1.15078 miles
    default:
      return nauticalMiles;
  }
};

/**
 * Convert speed from knots to the target unit
 */
export const convertSpeed = (knots: number, targetUnit: SpeedUnit): number => {
  switch (targetUnit) {
    case 'kt':
      return knots;
    case 'kmh':
      return knots * 1.852; // 1 knot = 1.852 km/h
    case 'mph':
      return knots * 1.15078; // 1 knot = 1.15078 mph
    default:
      return knots;
  }
};

/**
 * Get the label for a distance unit
 */
export const getDistanceUnitLabel = (unit: DistanceUnit): string => {
  switch (unit) {
    case 'nm':
      return 'NM';
    case 'km':
      return 'km';
    case 'mi':
      return 'mi';
    default:
      return 'NM';
  }
};

/**
 * Get the label for a speed unit
 */
export const getSpeedUnitLabel = (unit: SpeedUnit): string => {
  switch (unit) {
    case 'kt':
      return 'kt';
    case 'kmh':
      return 'km/h';
    case 'mph':
      return 'mph';
    default:
      return 'kt';
  }
};

/**
 * Format distance with the appropriate unit
 */
export const formatDistance = (nauticalMiles: number, targetUnit: DistanceUnit, decimals: number = 1): string => {
  const converted = convertDistance(nauticalMiles, targetUnit);
  const rounded = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `${rounded} ${getDistanceUnitLabel(targetUnit)}`;
};

/**
 * Format speed with the appropriate unit
 */
export const formatSpeed = (knots: number, targetUnit: SpeedUnit, decimals: number = 0): string => {
  const converted = convertSpeed(knots, targetUnit);
  const rounded = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `${rounded} ${getSpeedUnitLabel(targetUnit)}`;
};
