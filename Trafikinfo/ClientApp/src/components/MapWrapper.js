// react
import React, { useState, useEffect, useRef } from 'react';

// openlayers
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import { toStringXY } from 'ol/coordinate'
import Feature from 'ol/Feature'
import { circular } from 'ol/geom/Polygon'
import Point from 'ol/geom/Point'
import { transform, fromLonLat, toLonLat } from 'ol/proj'

// jQuery
import $ from 'jquery'

import Departures from './Departures';
//import Control from 'ol/control'

// local
import { GetNearbyStation, SetUpAjax, AddSearchBox } from '../main.js'

function MapWrapper(props) {

    const source = new VectorSource();
    const layer = new VectorLayer({
        source: source
    });

    // set intial state
    const [map, setMap] = useState()
    const [featuresLayer, setFeaturesLayer] = useState()
    const [selectedCoord, setSelectedCoord] = useState([0, 0])
    const [departures, setDepartures] = useState()
    const [stationCoord, setStationCoord] = useState()
    const [showDepartures, setShowDepartures] = useState(false)
    const [locationCoord, setLocationCoord] = useState()

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

        navigator.geolocation.watchPosition(function (pos) {// maybe watchPosition instead
            //ajax anrop ska göras här sen
            const coords = [pos.coords.longitude, pos.coords.latitude];
            const accuracy = circular(coords, pos.coords.accuracy);
            setLocationCoord(transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));
            initialMap.getView().setCenter(transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'))
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

        AddSearchBox(initialMap, setStationCoord, setDepartures);

        $(document).ready(async function () {
            //document.addEventListener("DOMContentLoaded", function (event) {
            await SetUpAjax();
            GetNearbyStation(setStationCoord, setDepartures, toLonLat(initialMap.getView().getCenter()));
        });



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
        const clickedCoord = transform(mapRef.current.getCoordinateFromPixel(event.pixel), 'EPSG:3857', 'EPSG:4326');
        // set React state
        setSelectedCoord(clickedCoord)
    }

    // render component
    return (
        <div>
            <div onClick={() => setShowDepartures((Math.abs(stationCoord[0] - selectedCoord[0]) < 0.01 && Math.abs(stationCoord[1] - selectedCoord[1]) < 0.01))} ref={mapElement} className="map"></div>
            {showDepartures && <div id="popup" className="ol-popup">
                <a href="#" id="popup-closer" className="ol-popup-closer"></a>
                <div id="popup-content"><table><Departures departures={departures} /></table></div>
            </div>}
            <div className="clicked-coord-label">
                <p>{(selectedCoord) ? toStringXY(selectedCoord, 5) : ''}</p>
            </div>

            {/*<button onClick={() => initialMap.getView().setCenter([locationCoord[0], locationCoord[1]], 'EPSG:4326', 'EPSG:3857')} title="tracker">Track me</button>*/}


        </div>
    )

}

export default MapWrapper