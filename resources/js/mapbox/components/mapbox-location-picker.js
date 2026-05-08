import {
    defaultMapboxConfig,
    mergeConfig,
    initMapbox,
    centerMap,
    createMarker,
    watchReactiveConfig,
    configsDiffer,
} from './mapbox.js';

export default function mapboxLocationPicker({ statePath, config }) {
    return {
        map: null,
        marker: null,
        config: mergeConfig(defaultMapboxConfig, config),

        init() {
            this.map = initMapbox(this.config);

            const current = this.$wire.get(statePath);
            if (current && current.lng != null && current.lat != null) {
                this.addMarker(current.lng, current.lat, true, true);
            }

            this.map.on('click', (e) => {
                const { lng, lat } = e.lngLat;
                this.addMarker(lng, lat);
            });

            // Bridge from Filament closures (`->mapCenter(fn (Get $get) => ...)`,
            // `->mapZoom(...)`) into the running map. The Blade wrapper writes
            // the latest server-rendered config into `data-mapbox-config`, and
            // Livewire morphs that attribute on every render — so re-evaluated
            // closure values reach us without rebuilding the map.
            watchReactiveConfig(this.$el, (next, prev) => {
                if (! prev) return; // initial pass: map already constructed with these values
                if (! configsDiffer(prev.map, next.map)) return;

                const prevCenter = prev.map?.center;
                const nextCenter = next.map?.center;
                if (Array.isArray(nextCenter) && configsDiffer(prevCenter, nextCenter)) {
                    centerMap(this.map, nextCenter, { animate: true });
                }

                const prevZoom = prev.map?.zoom;
                const nextZoom = next.map?.zoom;
                if (typeof nextZoom === 'number' && nextZoom !== prevZoom) {
                    this.map.setZoom(nextZoom);
                }
            });
        },

        addMarker(lng, lat, shouldCenter = false, animate = true) {
            if (!this.marker) {
                this.marker = createMarker({ lng, lat, draggable: true }).addTo(this.map);

                this.marker.on('dragend', () => {
                    const { lng, lat } = this.marker.getLngLat();
                    this.setCoords({ lng, lat });
                    centerMap(this.map, [lng, lat], { animate });
                });
            } else {
                this.marker.setLngLat([lng, lat]);
            }

            if (shouldCenter) centerMap(this.map, [lng, lat], { animate });
            this.setCoords({ lng, lat });
        },

        setCoords({ lng, lat }) {
            this.$wire.set(statePath, { lng, lat });
        }
    };
}
