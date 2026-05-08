@php
    use Filament\Support\Facades\FilamentAsset;
@endphp

<x-dynamic-component
    :component="$getFieldWrapperView()"
    :field="$field"
>
    {{--
        The outer wrapper is intentionally NOT `wire:ignore` so Livewire keeps
        morphing its `data-mapbox-config` and inline `style` on every render.
        The Alpine component installs a MutationObserver on `data-mapbox-config`
        (see `watchReactiveConfig`) so closure-driven `mapCenter` / `mapZoom`
        changes reach the running Mapbox instance without rebuilding it.
        The map canvas lives in the inner `wire:ignore` + `x-ignore` div, which
        preserves mapbox-gl's DOM across Livewire updates.
    --}}
    <div
        x-load
        x-load-css="[@js(FilamentAsset::getStyleHref('mapbox'))]"
        x-load-src="{{ FilamentAsset::getAlpineComponentSrc('mapbox-location-picker') }}"
        x-data="mapboxLocationPicker({
            statePath: '{{ $getStatePath() }}',
            config: {{ $getMapboxJsonConfig() }}
        })"
        data-mapbox-config="{{ $getMapboxJsonConfig() }}"
        style="position: relative; height: {{ $getMapHeight() }}px;"
    >
        <div
            wire:ignore
            x-ignore
            id="{{ $getMapContainer() }}"
            style="position: absolute; top: 0; bottom: 0; width: 100%;"
        ></div>
    </div>
</x-dynamic-component>
