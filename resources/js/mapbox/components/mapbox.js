import mapboxgl from 'mapbox-gl';

// Mapbox's setRTLTextPlugin must be called exactly once per page.
// Calling it again throws ("setRTLTextPlugin cannot be called multiple
// times"). The flag below makes registration idempotent across all four
// Mapbox components.
//
// `lazy: true` defers the actual plugin fetch until a tile contains
// RTL glyphs, so non-Arabic/Hebrew/Persian maps pay no cost.
//
// https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-rtl-text/
const RTL_TEXT_PLUGIN_URL =
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js';

let rtlTextPluginRegistered = false;

function registerRtlTextPlugin() {
    if (rtlTextPluginRegistered) return;
    if (typeof mapboxgl.getRTLTextPluginStatus === 'function'
        && mapboxgl.getRTLTextPluginStatus() !== 'unavailable') {
        rtlTextPluginRegistered = true;
        return;
    }

    mapboxgl.setRTLTextPlugin(RTL_TEXT_PLUGIN_URL, null, true);
    rtlTextPluginRegistered = true;
}

export const defaultMapboxConfig = {
    token: null,
    map: {
        container: null,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 0],
        zoom: 9,
        controls: {
            navigation: true,
        }
    },
    maxPolygons: Infinity,
};

export function mergeConfig(base, override = {}) {
    const out = structuredClone(base);
    const stack = [[out, override]];
    while (stack.length) {
        const [target, src] = stack.pop();
        for (const k of Object.keys(src ?? {})) {
            if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
                if (!target[k] || typeof target[k] !== 'object') target[k] = {};
                stack.push([target[k], src[k]]);
            } else {
                target[k] = src[k];
            }
        }
    }
    return out;
}

export function initMapbox(config) {
    if (!config?.token) throw new Error('Mapbox token is required');
    if (!config?.map?.container) throw new Error('Map container is required');

    mapboxgl.accessToken = config.token;

    registerRtlTextPlugin();

    const map = new mapboxgl.Map({
        container: config.map.container,
        style: config.map.style,
        center: config.map.center,
        zoom: config.map.zoom,
        attributionControl: false,
    });

    addControls(map, config.map.controls);

    return map;
}

export function addControls(map, controls = {}) {
    if (controls.navigation) map.addControl(new mapboxgl.NavigationControl());
}

export function centerMap(map, centerLngLat, { animate = true } = {}) {
    if (animate) map.flyTo({ center: centerLngLat, essential: true });
    else map.setCenter(centerLngLat);
}

// Bridge for closure-driven `mapCenter` / `mapZoom` (and any future numeric
// config knobs) on the Mapbox components. The Blade wrapper that hosts the
// Alpine component carries the latest server-rendered config in its
// `data-mapbox-config` attribute. Livewire morphs that attribute on every
// render, so a MutationObserver attached to it survives both the wrapper's
// child-level `wire:ignore` and Alpine's `x-ignore` — the live mapbox-gl
// instance is preserved while center/zoom updates flow through.
//
// `apply(next, prev)` is invoked once at registration with the initial
// config, then again every time the attribute mutates with the previous
// value as the second argument. Components diff inside `apply` so they can
// skip no-op work and avoid stomping on user-driven map movement.
export function watchReactiveConfig(el, apply) {
    const read = () => {
        const raw = el.getAttribute('data-mapbox-config');
        if (! raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    };

    let last = read();
    if (last) apply(last, null);

    const observer = new MutationObserver(() => {
        const next = read();
        if (! next) return;
        const prev = last;
        last = next;
        apply(next, prev);
    });

    observer.observe(el, { attributes: true, attributeFilter: ['data-mapbox-config'] });

    return () => observer.disconnect();
}

export function configsDiffer(a, b) {
    if (a === b) return false;
    if (! a || ! b) return true;
    return JSON.stringify(a) !== JSON.stringify(b);
}

export function createMarker({ lng, lat, draggable = false }) {
    return new mapboxgl.Marker({ draggable }).setLngLat([lng, lat]);
}

export function fitToFeatures(map, features) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const eachCoord = (coords, type) => {
        if (type === 'Polygon') {
            coords.forEach(ring => ring.forEach(([x, y]) => {
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }));
        } else if (type === 'MultiPolygon') {
            coords.forEach(poly => poly.forEach(ring => ring.forEach(([x, y]) => {
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            })));
        }
    };

    features.forEach(f => eachCoord(f.geometry.coordinates, f.geometry.type));

    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
        map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 40, duration: 0 });
    }
}
