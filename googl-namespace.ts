declare namespace google {
    namespace maps {
      interface LatLng {
        lat(): number;
        lng(): number;
      }
  
      interface GeocoderResult {
        formatted_address: string;
        geometry: {
          location: LatLng;
        };
      }
  
      
      class PlacesAutocomplete {
        constructor(input: HTMLInputElement);
        addListener(event: string, callback: () => void): void;
        getPlace(): {
          formatted_address?: string;
          geometry: {
            location: LatLng;
          };
        };
      }
    }
  }