const { createApp, ref, onMounted, nextTick } = Vue;

createApp({
    setup() {
        // State
        const isApiLoaded = ref(true); // Always true for Leaflet
        const isLoading = ref(false);
        const hasRoute = ref(false);
        const routeDetails = ref(null);
        const errorMessage = ref(null);

        // Hospital Base Stations
        const hospitals = ref([
            { name: "National Hospital", lat: 42.8820, lng: 74.5950 },
            { name: "City Hospital #1", lat: 42.8550, lng: 74.6200 },
            { name: "Central Ambulance Station", lat: 42.8680, lng: 74.5700 },
            { name: "Ala-Too District Station", lat: 42.8400, lng: 74.5600 },
            { name: "Dordoi Emergency Post", lat: 42.9200, lng: 74.6300 }
        ]);
        const selectedHospitalIndex = ref("");

        // Map Objects
        let map = null;
        let routeLayer = null;
        let startMarker = null;
        let endMarker = null;

        // Refs for Inputs
        const originInput = ref(null);
        const destinationInput = ref(null);

        // Constants
        const BISHKEK_CENTER = [42.8746, 74.5698];
        const API_BASE_URL = 'http://127.0.0.1:8000/api';

        const initMap = () => {
            // Initialize Leaflet
            map = L.map('map', {
                zoomControl: true,
                attributionControl: false
            }).setView(BISHKEK_CENTER, 13);

            // Google Maps-like styling (using CartoDB Voyager or similar clean light theme)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            // Allow clicking to select points
            map.on('click', handleMapClick);
        };

        const handleMapClick = (e) => {
            if (!startMarker) {
                setStartPoint(e.latlng);
            } else if (!endMarker) {
                setEndPoint(e.latlng);
            }
        };

        const onHospitalSelect = () => {
            if (selectedHospitalIndex.value === "") return;
            const h = hospitals.value[selectedHospitalIndex.value];
            // Backward compatibility if backend field names differ slightly (though serializers usually match model fields)
            const lat = h.latitude || h.lat;
            const lng = h.longitude || h.lng;
            setStartPoint(L.latLng(lat, lng), h.name);
            map.flyTo([lat, lng], 14);
        };

        const setStartPoint = (latlng, label = "Ambulance Start") => {
            if (startMarker) map.removeLayer(startMarker);

            const icon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                shadowSize: [41, 41]
            });

            startMarker = L.marker(latlng, { icon }).addTo(map).bindPopup(label).openPopup();

            // Auto calculate if both exist
            if (startMarker && endMarker) {
                calculateRoute();
            }
        };

        const setEndPoint = (latlng) => {
            if (endMarker) map.removeLayer(endMarker);

            const icon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                shadowSize: [41, 41]
            });

            endMarker = L.marker(latlng, { icon }).addTo(map).bindPopup("Destination").openPopup();
            destinationInput.value.value = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;

            // Auto calculate if both exist
            if (startMarker && endMarker) {
                calculateRoute();
            }
        };

        const calculateRoute = async () => {
            if (!startMarker || !endMarker) {
                errorMessage.value = "Please select Start and Destination points on the map.";
                setTimeout(() => errorMessage.value = null, 3000);
                return;
            }

            isLoading.value = true;
            errorMessage.value = null;

            try {
                const start = startMarker.getLatLng();
                const end = endMarker.getLatLng();

                // Call Backend API
                const response = await fetch(`${API_BASE_URL}/route/calculate/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        start_latitude: start.lat,
                        start_longitude: start.lng,
                        end_latitude: end.lat,
                        end_longitude: end.lng
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to calculate route");
                }

                const data = await response.json();
                drawRoutes(data);

            } catch (err) {
                console.error(err);
                errorMessage.value = `Error: ${err.message}`;
            } finally {
                isLoading.value = false;
            }
        };

        const drawRoutes = (data) => {
            if (routeLayer) {
                routeLayer.eachLayer(layer => map.removeLayer(layer));
                map.removeLayer(routeLayer);
                routeLayer = null;
            }

            // Create a FeatureGroup to hold multiple polylines
            routeLayer = L.featureGroup().addTo(map);

            // Draw Shortest Path (e.g., Grey/Blue)
            if (data.shortest_path_coords) {
                L.polyline(data.shortest_path_coords, {
                    color: '#3b82f6', // blue
                    weight: 4,
                    opacity: 0.6,
                    dashArray: '5, 10'
                }).addTo(routeLayer).bindPopup("Standard Shortest Path");
            }

            // Draw Optimized Path (Red/Green - Main)
            if (data.optimized_path_coords) {
                L.polyline(data.optimized_path_coords, {
                    color: '#ef4444', // red
                    weight: 6,
                    opacity: 0.9
                }).addTo(routeLayer).bindPopup("AI Optimized Path");
            }

            hasRoute.value = true;

            // Fit bounds
            if (routeLayer.getBounds().isValid()) {
                map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
            }

            // Set Details (Mock details from backend or calculated locally?)
            // For now, we just show simple status since backend mock doesn't return distance/duration yet
            routeDetails.value = {
                distance: "Calculated", // Placeholder
                duration: "Optimal",    // Placeholder
                trafficStatus: "AI Path Loaded"
            };
        };

        const clearRoute = () => {
            if (routeLayer) {
                routeLayer.clearLayers();
                map.removeLayer(routeLayer);
            }
            if (startMarker) map.removeLayer(startMarker);
            if (endMarker) map.removeLayer(endMarker);

            startMarker = null;
            endMarker = null;
            routeLayer = null;

            hasRoute.value = false;
            routeDetails.value = null;
            originInput.value.value = "";
            destinationInput.value.value = "";

            map.setView(BISHKEK_CENTER, 13);
        };

        // Fetch Hospitals from Backend
        const fetchHospitals = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/hospitals/`);
                if (res.ok) {
                    hospitals.value = await res.json();
                } else {
                    console.error("Failed to load hospitals");
                }
            } catch (e) {
                console.error("Error fetching hospitals:", e);
                // Fallback to empty or keep hardcoded if desired (removed here to force API usage)
                // hospitals.value = []; 
            }
        };

        // Lifecycle
        onMounted(() => {
            // Small delay to ensure container is ready
            nextTick(() => {
                initMap();
                fetchHospitals();
            });
        });

        return {
            isApiLoaded,
            isLoading,
            hasRoute,
            routeDetails,
            errorMessage,
            originInput,
            destinationInput,
            calculateRoute,
            clearRoute,
            hospitals,
            selectedHospitalIndex,
            onHospitalSelect
        };
    }
}).mount('#app');
