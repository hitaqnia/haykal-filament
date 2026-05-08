import {
    defaultMapboxConfig,
    mergeConfig,
    initMapbox,
    fitToFeatures,
    centerMap,
    watchReactiveConfig,
    configsDiffer,
} from './mapbox.js';

export default function mapboxPolygonsViewer({ featuresCollection, config }) {
    return {
        map: null,
        sourceId: 'readonly-polygons',
        fillLayerId: 'readonly-polygons-fill',
        lineLayerId: 'readonly-polygons-line',
        config: mergeConfig(defaultMapboxConfig, config),

        init() {
            this.map = initMapbox(this.config);
            this.map.on('load', () => this.load(featuresCollection));

            // Same bridge as the drawer, with the same "don't fight feature
            // bounds" guard: when polygons are present, `fitToFeatures` owns
            // the viewport.
            watchReactiveConfig(this.$el, (next, prev) => {
                if (! prev) return;
                if (! configsDiffer(prev.map, next.map)) return;

                const hasFeatures = (featuresCollection?.features?.length ?? 0) > 0;
                if (hasFeatures) return;

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

        load(fc) {
            if (!fc || fc.type !== 'FeatureCollection' || !(fc.features ?? []).length) return;

            if (!this.map.getSource(this.sourceId)) {
                this.map.addSource(this.sourceId, { type: 'geojson', data: fc });
            } else {
                this.map.getSource(this.sourceId).setData(fc);
            }

            if (!this.map.getLayer(this.fillLayerId)) {
                this.map.addLayer({
                    id: this.fillLayerId,
                    type: 'fill',
                    source: this.sourceId,
                    paint: {
                        'fill-color': '#3b82f6',
                        'fill-opacity': 0.25
                    },
                    filter: ['in', ['get', 'type'], ['literal', ['Feature']]] // show all features
                });
            }

            if (!this.map.getLayer(this.lineLayerId)) {
                this.map.addLayer({
                    id: this.lineLayerId,
                    type: 'line',
                    source: this.sourceId,
                    paint: {
                        'line-color': '#1d4ed8',
                        'line-width': 2
                    }
                });
            }

            // Fit to data
            fitToFeatures(this.map, fc.features);
        },
    }
}
