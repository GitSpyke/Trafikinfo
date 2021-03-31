﻿// react
import React, { useState, useEffect, useRef } from 'react';

// openlayers
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import { transform } from 'ol/proj'
import { toStringXY } from 'ol/coordinate'
import Feature from 'ol/Feature'
import { circular } from 'ol/geom/Polygon'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'

// jQuery
import $ from 'jquery'

// React
import Departures from './Departures';

// local
import { GetNearbyStation, SetUpAjax } from '../main.js'

function MapWrapper(props) {

    const source = new VectorSource();
    const layer = new VectorLayer({
        source: source
    });

    // set intial state
    const [map, setMap] = useState()
    const [featuresLayer, setFeaturesLayer] = useState()
    const [selectedCoord, setSelectedCoord] = useState()
    const [departures, setDepartures] = useState([])
    const [stationCoordinates, setStationCoordinates] = useState()
    const [showDepartures, setShowDepartures] = useState(true)

    // pull refs
    const mapElement = useRef()

    // create state ref that can be accessed in OpenLayers onclick callback function
    //  https://stackoverflow.com/a/60643670
    const mapRef = useRef()
    mapRef.current = map

    // initialize map on first render - logic formerly put into componentDidMount
    useEffect(() => {

        // create and add vector source layer
        const initalFeaturesLayer = new VectorLayer({
            source: new VectorSource()
        })

        // create map
        const initialMap = new Map({
            target: mapElement.current,
            layers: [

                // USGS Topo
                new TileLayer({
                    source: new XYZ({
                        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        //  url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
                    })
                }),

                // Google Maps Terrain
                //new TileLayer({
                //    source: new XYZ({
                //        url: 'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}',
                //    })
                //}),

                initalFeaturesLayer

            ],
            view: new View({
                projection: 'EPSG:3857',
                center: [0, 0],
                zoom: 12.5
            }),
            controls: []
        })


        initialMap.addLayer(layer);

        // set map onclick handler
        initialMap.on('click', handleMapClick)

        navigator.geolocation.watchPosition(function (pos) {
            //ajax anropet ska göras här sen
            const coords = [pos.coords.longitude, pos.coords.latitude];
            const accuracy = circular(coords, pos.coords.accuracy);
            initialMap.getView().setCenter(transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));
            source.clear(true);
            source.addFeatures([
                new Feature(accuracy.transform('EPSG:4326', initialMap.getView().getProjection())),
                new Feature(new Point(fromLonLat(coords)))
            ]);
        }, function (error) {
            alert(`ERROR: ${error.message}`);
        }, {
            enableHighAccuracy: true
        });

        // save map and vector layer references to state
        setMap(initialMap)
        setFeaturesLayer(initalFeaturesLayer)

        $(document).ready(async function () {
        //document.addEventListener("DOMContentLoaded", function (event) {
            //we ready baby
            SetUpAjax();
            // Create an ajax loading indicator
            //var loadingTimer;
            //$("#loader").hide();
            //$(document).ajaxStart(function () {
            //    loadingTimer = setTimeout(function () {
            //        $("#loader").show();
            //    }, 200);
            //}).ajaxStop(function () {
            //    clearTimeout(loadingTimer);
            //    $("#loader").hide();
            //});
            // Load stations

            //GetNearbyStation().then(response =>
            //    GetDepartures(response));

            GetNearbyStation(map, setStationCoordinates, setDepartures);
        });
        //});

        //const locate = document.createElement('div');
        //locate.className = 'ol-control ol-unselectable locate';
        //locate.innerHTML = '<button title="Locate me">◎</button>';
        //locate.addEventListener('click', function () {
        //    if (!source.isEmpty()) {
        //        initialMap.getView().fit(source.getExtent(), {
        //            maxZoom: 18,
        //            duration: 500
        //        });
        //    }
        //});


    }, [])

    // update map if features prop changes - logic formerly put into componentDidUpdate
    useEffect(() => {

        if (props.features.length) { // may be null on first render

            // set features to map
            featuresLayer.setSource(
                new VectorSource({
                    features: props.features // make sure features is an array
                })
            )

            // fit map to feature extent (with 100px of padding)
            map.getView().fit(featuresLayer.getSource().getExtent(), {
                padding: [100, 100, 100, 100]
            })

        }

    }, [props.features])

    // map click handler
    const handleMapClick = (event) => {

        // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
        //  https://stackoverflow.com/a/60643670
        const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);

        // transform coord to EPSG 4326 standard Lat Long
        const transformedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

        // set React state
        setSelectedCoord(transformedCoord)

        console.log(stationCoordinates[0], transformedCoord[0])
        if (Math.abs(stationCoordinates[0] - transformedCoord[0]) < 5) { setShowDepartures(true) }

    }


    // render component
    return (
        <div>

            <div ref={mapElement} className="map-container"></div>

            <div className="clicked-coord-label">
                <p>{(selectedCoord) ? toStringXY(selectedCoord, 5) : ''}</p>
            </div>
            {showDepartures && <Departures departures={departures} />}

        </div>
    )

}

export default MapWrapper