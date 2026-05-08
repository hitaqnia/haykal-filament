@php
    use Filament\Support\Facades\FilamentAsset;
@endphp

<x-dynamic-component
    :component="$getFieldWrapperView()"
    :field="$field"
>
    <div
        x-load
        x-load-css="[
            @js(FilamentAsset::getStyleHref('mapbox')),
            @js(FilamentAsset::getStyleHref('mapbox-draw'))
        ]"
        x-load-src="{{ FilamentAsset::getAlpineComponentSrc('mapbox-polygons-drawer') }}"
        x-data="mapboxPolygonsDrawer({
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
