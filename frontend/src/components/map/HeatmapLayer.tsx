import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { FlightPath } from '@/types/airfield';

interface HeatmapLayerProps {
  flightPaths: FlightPath[];
  intensity?: number; // 0-1
  radius?: number; // in pixels
  maxIntensity?: number;
}

const HeatmapLayer = ({ 
  flightPaths, 
  intensity = 0.5, 
  radius = 15,
  maxIntensity = 1
}: HeatmapLayerProps) => {
  const map = useMap();
  const canvasLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    // Create a custom canvas layer
    const CanvasLayer = L.Layer.extend({
      onAdd: function(map: L.Map) {
        this._map = map;
        
        // Create canvas element
        const canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');
        const size = map.getSize();
        canvas.width = size.x;
        canvas.height = size.y;
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        
        // Add to map pane
        map.getPanes().overlayPane.appendChild(canvas);
        
        // Register event handlers
        map.on('moveend zoom viewreset', this._reset, this);
        this._reset();
      },
      
      onRemove: function(map: L.Map) {
        L.DomUtil.remove(this._canvas);
        map.off('moveend zoom viewreset', this._reset, this);
      },
      
      _reset: function() {
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        
        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        
        this._draw();
      },
      
      _draw: function() {
        if (!this._ctx) return;
        
        const ctx = this._ctx;
        const canvas = this._canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Collect all points from flight paths
        const points: Array<{ x: number; y: number; intensity: number }> = [];
        
        flightPaths.forEach(flightPath => {
          flightPath.coordinates.forEach(coord => {
            const point = this._map.latLngToContainerPoint([coord[0], coord[1]]);
            points.push({
              x: point.x,
              y: point.y,
              intensity: intensity
            });
          });
        });
        
        if (points.length === 0) return;
        
        // Create a temporary canvas for the heatmap generation
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) return;
        
        // Draw radial gradients for each point
        points.forEach(point => {
          const gradient = tempCtx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, radius
          );
          
          gradient.addColorStop(0, `rgba(0, 0, 0, ${point.intensity})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          tempCtx.fillStyle = gradient;
          tempCtx.fillRect(
            point.x - radius,
            point.y - radius,
            radius * 2,
            radius * 2
          );
        });
        
        // Get image data and apply color gradient
        const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Find max intensity for normalization
        let max = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > max) max = data[i];
        }
        
        // Apply color gradient based on intensity
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha === 0) continue;
          
          // Normalize intensity
          const normalizedIntensity = (alpha / 255) / (max / 255) * maxIntensity;
          
          // Apply color gradient (blue -> green -> yellow -> red)
          const color = this._getColor(normalizedIntensity);
          data[i] = color.r;
          data[i + 1] = color.g;
          data[i + 2] = color.b;
          data[i + 3] = Math.min(255, alpha * 1.5); // Increase visibility
        }
        
        ctx.putImageData(imageData, 0, 0);
      },
      
      _getColor: function(value: number): { r: number; g: number; b: number } {
        // Color gradient: blue (0) -> cyan -> green -> yellow -> red (1)
        const colors = [
          { r: 0, g: 0, b: 255 },     // Blue
          { r: 0, g: 255, b: 255 },   // Cyan
          { r: 0, g: 255, b: 0 },     // Green
          { r: 255, g: 255, b: 0 },   // Yellow
          { r: 255, g: 0, b: 0 }      // Red
        ];
        
        const scaledValue = value * (colors.length - 1);
        const index = Math.floor(scaledValue);
        const remainder = scaledValue - index;
        
        if (index >= colors.length - 1) {
          return colors[colors.length - 1];
        }
        
        const color1 = colors[index];
        const color2 = colors[index + 1];
        
        return {
          r: Math.round(color1.r + (color2.r - color1.r) * remainder),
          g: Math.round(color1.g + (color2.g - color1.g) * remainder),
          b: Math.round(color1.b + (color2.b - color1.b) * remainder)
        };
      }
    });
    
    // Remove existing layer if any
    if (canvasLayerRef.current) {
      map.removeLayer(canvasLayerRef.current);
    }
    
    // Create and add new layer
    const layer = new CanvasLayer();
    layer.addTo(map);
    canvasLayerRef.current = layer;
    
    // Cleanup on unmount
    return () => {
      if (canvasLayerRef.current) {
        map.removeLayer(canvasLayerRef.current);
        canvasLayerRef.current = null;
      }
    };
  }, [map, flightPaths, intensity, radius, maxIntensity]);
  
  return null;
};

export default HeatmapLayer;
