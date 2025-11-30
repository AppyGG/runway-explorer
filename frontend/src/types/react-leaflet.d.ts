/** Extends de leaflet pour type le plugin smoothWheelScroll */

import 'react-leaflet';

declare module 'react-leaflet' {
  interface MapContainerProps {
    smoothWheelZoom?: boolean;
    smoothSensitivity?: number;
  }
}
