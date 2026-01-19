/**
 * Location Service for Dubai Sahayak
 * Handles geolocation and nearest facility lookups
 */

/**
 * Gets the user's current coordinates
 * @returns {Promise<{lat: number, lng: number}>}
 */
export async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

/**
 * Finds the nearest facility of a certain type within 1km
 * Uses OpenStreetMap Overpass API (free, no key required)
 * 
 * @param {number} lat 
 * @param {number} lng 
 * @param {string} type - 'hotel', 'subway', 'restaurant', 'pharmacy', 'clinic'
 * @returns {Promise<string|null>} - Name of the nearest facility
 */
export async function getNearestFacility(lat, lng, type) {
    // Map type to OSM tags
    const tagMap = {
        hotel: 'tourism=hotel',
        metro: 'railway=station][station=subway',
        food: 'amenity=restaurant',
        pharmacy: 'amenity=pharmacy',
        places: 'tourism=attraction',
        clinic: 'amenity=clinic'
    };

    const tag = tagMap[type] || 'amenity=public_building';
    const radius = 1000; // 1km

    // Overpass QL query
    const query = `
    [out:json][timeout:25];
    (
      node[${tag}](around:${radius},${lat},${lng});
      way[${tag}](around:${radius},${lat},${lng});
      relation[${tag}](around:${radius},${lat},${lng});
    );
    out body qt 1;
  `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`
        });

        if (!response.ok) throw new Error("Overpass API error");

        const data = await response.json();
        if (data.elements && data.elements.length > 0) {
            const element = data.elements[0];
            return element.tags.name || element.tags.operator || "কৰিব পৰা ওচৰতে আছে";
        }
        return null;
    } catch (error) {
        console.error(`Error fetching nearest ${type}:`, error);
        return null;
    }
}
