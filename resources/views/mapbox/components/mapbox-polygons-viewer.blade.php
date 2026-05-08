@php
    use Filament\Support\Facades\FilamentAsset;
@endphp

<x-dynamic-component
    :component="$getEntryWrapperView()"
    :entry="$entry"
>
    <div
        x-load
        x-load-css="[
            @js(FilamentAsset::getStyleHref('mapbox')),
            @js(FilamentAsset::getStyleHref('mapbox-draw'))
        ]"
        x-load-src="{{ FilamentAsset::getAlpineComponentSrc('mapbox-polygons-viewer') }}"
        x-data="mapboxPolygonsViewer({
            featuresCollection: @js($getState()),
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
