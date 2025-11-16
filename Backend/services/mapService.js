const axios = require('axios');

class MapService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Geocode address to coordinates
  async geocodeAddress(address) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.googleMapsApiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      
      return {
        success: true,
        data: {
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng
          },
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
          placeId: result.place_id,
          types: result.types
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude, longitude) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.googleMapsApiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Reverse geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      
      return {
        success: true,
        data: {
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
          placeId: result.place_id,
          types: result.types
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Search for places near coordinates
  async searchNearby(latitude, longitude, radius = 5000, type = null, keyword = null) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const params = {
        location: `${latitude},${longitude}`,
        radius: radius,
        key: this.googleMapsApiKey
      };

      if (type) params.type = type;
      if (keyword) params.keyword = keyword;

      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: params
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Place search failed: ${response.data.status}`);
      }

      const places = response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        address: place.vicinity,
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types,
        photos: place.photos ? place.photos.map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) : []
      }));

      return {
        success: true,
        data: {
          places,
          total: places.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get place details by place ID
  async getPlaceDetails(placeId) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,rating,formatted_phone_number,website,opening_hours,photos,reviews',
          key: this.googleMapsApiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Place details failed: ${response.data.status}`);
      }

      const place = response.data.result;
      
      return {
        success: true,
        data: {
          placeId: placeId,
          name: place.name,
          formattedAddress: place.formatted_address,
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          rating: place.rating,
          phone: place.formatted_phone_number,
          website: place.website,
          openingHours: place.opening_hours,
          photos: place.photos ? place.photos.map(photo => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height
          })) : [],
          reviews: place.reviews || []
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2, unit = 'km') {
    const R = unit === 'miles' ? 3959 : 6371; // Earth's radius in miles or kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get distance matrix between multiple origins and destinations
  async getDistanceMatrix(origins, destinations, mode = 'driving') {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const originsStr = origins.map(origin => {
        if (typeof origin === 'string') return origin;
        return `${origin.lat},${origin.lng}`;
      }).join('|');

      const destinationsStr = destinations.map(dest => {
        if (typeof dest === 'string') return dest;
        return `${dest.lat},${dest.lng}`;
      }).join('|');

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: originsStr,
          destinations: destinationsStr,
          mode: mode,
          units: 'metric',
          key: this.googleMapsApiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Distance matrix failed: ${response.data.status}`);
      }

      const results = response.data.rows.map((row, originIndex) => ({
        originIndex,
        destinations: row.elements.map((element, destIndex) => ({
          destinationIndex: destIndex,
          distance: element.distance ? {
            text: element.distance.text,
            value: element.distance.value
          } : null,
          duration: element.duration ? {
            text: element.duration.text,
            value: element.duration.value
          } : null,
          status: element.status
        }))
      }));

      return {
        success: true,
        data: {
          originAddresses: response.data.origin_addresses,
          destinationAddresses: response.data.destination_addresses,
          results
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get directions between two points
  async getDirections(origin, destination, mode = 'driving', waypoints = []) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destinationStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;

      const params = {
        origin: originStr,
        destination: destinationStr,
        mode: mode,
        key: this.googleMapsApiKey
      };

      if (waypoints.length > 0) {
        params.waypoints = waypoints.map(waypoint => 
          typeof waypoint === 'string' ? waypoint : `${waypoint.lat},${waypoint.lng}`
        ).join('|');
      }

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: params
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Directions failed: ${response.data.status}`);
      }

      const route = response.data.routes[0];
      
      return {
        success: true,
        data: {
          summary: route.summary,
          distance: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
          duration: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
          startAddress: route.legs[0].start_address,
          endAddress: route.legs[route.legs.length - 1].end_address,
          polyline: route.overview_polyline.points,
          steps: route.legs.flatMap(leg => leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
            distance: step.distance,
            duration: step.duration,
            startLocation: step.start_location,
            endLocation: step.end_location
          })))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get photo URL from photo reference
  getPhotoUrl(photoReference, maxWidth = 400) {
    if (!this.googleMapsApiKey || !photoReference) {
      return null;
    }

    return `${this.baseUrl}/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.googleMapsApiKey}`;
  }

  // Search for locations suitable for filming
  async searchFilmingLocations(latitude, longitude, radius = 10000, options = {}) {
    try {
      const {
        type = null,
        minRating = 3.0,
        priceLevel = null,
        openNow = false
      } = options;

      // Search for various types of locations that might be suitable for filming
      const searchTypes = [
        'tourist_attraction',
        'park',
        'museum',
        'restaurant',
        'store',
        'university',
        'library',
        'church'
      ];

      const allResults = [];

      for (const searchType of searchTypes) {
        if (type && type !== searchType) continue;

        const result = await this.searchNearby(latitude, longitude, radius, searchType);
        
        if (result.success) {
          const filteredPlaces = result.data.places.filter(place => {
            if (minRating && place.rating && place.rating < minRating) return false;
            if (priceLevel !== null && place.priceLevel !== priceLevel) return false;
            return true;
          });

          allResults.push(...filteredPlaces.map(place => ({
            ...place,
            filmingCategory: searchType,
            suitabilityScore: this.calculateFilmingSuitability(place)
          })));
        }
      }

      // Remove duplicates and sort by suitability score
      const uniqueResults = allResults.filter((place, index, self) =>
        index === self.findIndex(p => p.placeId === place.placeId)
      ).sort((a, b) => b.suitabilityScore - a.suitabilityScore);

      return {
        success: true,
        data: {
          locations: uniqueResults,
          total: uniqueResults.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Calculate filming suitability score for a location
  calculateFilmingSuitability(place) {
    let score = 0;

    // Base score from rating
    if (place.rating) {
      score += place.rating * 20; // Max 100 points
    }

    // Points for having photos
    if (place.photos && place.photos.length > 0) {
      score += Math.min(place.photos.length * 5, 25); // Max 25 points
    }

    // Points for interesting types
    const interestingTypes = [
      'tourist_attraction', 'park', 'museum', 'church', 
      'university', 'library', 'art_gallery', 'castle'
    ];
    
    if (place.types && place.types.some(type => interestingTypes.includes(type))) {
      score += 20;
    }

    // Penalty for high price level (might be expensive to film)
    if (place.priceLevel && place.priceLevel > 2) {
      score -= 10;
    }

    return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
  }

  // Validate coordinates
  validateCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return { valid: false, message: 'Coordinates must be valid numbers' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, message: 'Latitude must be between -90 and 90' };
    }

    if (lng < -180 || lng > 180) {
      return { valid: false, message: 'Longitude must be between -180 and 180' };
    }

    return { valid: true, coordinates: { latitude: lat, longitude: lng } };
  }

  // Generate static map URL
  generateStaticMapUrl(center, zoom = 15, size = '600x400', markers = []) {
    if (!this.googleMapsApiKey) {
      return null;
    }

    const centerStr = typeof center === 'string' ? center : `${center.lat},${center.lng}`;
    let url = `${this.baseUrl}/staticmap?center=${centerStr}&zoom=${zoom}&size=${size}&key=${this.googleMapsApiKey}`;

    // Add markers
    markers.forEach((marker, index) => {
      const markerStr = typeof marker === 'string' ? marker : `${marker.lat},${marker.lng}`;
      const label = marker.label || String.fromCharCode(65 + index); // A, B, C...
      url += `&markers=color:red|label:${label}|${markerStr}`;
    });

    return url;
  }

  // Get timezone for coordinates
  async getTimezone(latitude, longitude, timestamp = null) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const ts = timestamp || Math.floor(Date.now() / 1000);

      const response = await axios.get(`${this.baseUrl}/timezone/json`, {
        params: {
          location: `${latitude},${longitude}`,
          timestamp: ts,
          key: this.googleMapsApiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Timezone lookup failed: ${response.data.status}`);
      }

      return {
        success: true,
        data: {
          timeZoneId: response.data.timeZoneId,
          timeZoneName: response.data.timeZoneName,
          dstOffset: response.data.dstOffset,
          rawOffset: response.data.rawOffset
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new MapService();