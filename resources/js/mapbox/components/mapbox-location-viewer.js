import {
    defaultMapboxConfig,
    mergeConfig,
    initMapbox,
    centerMap,
    createMarker,
    watchReactiveConfig,
    configsDiffer,
} from './mapbox.js';

export default function mapboxLocationViewer({ location, config }) {
    return {
        map: null,
        config: mergeConfig(defaultMapboxConfig, config),

        init() {
            this.map = initMapbox(this.config);

            createMarker({ lng: location.lng, lat: location.lat, draggable: false }).addTo(this.map);

            centerMap(this.map, location, { animate: true });

            watchReactiveConfig(this.$el, (next, prev) => {
                if (! prev) return;
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
        }
    };
}
