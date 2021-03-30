// react
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
import { toLonLat } from 'ol/proj'

// jQuery
import $ from 'jquery'
import Departures from './Departures';

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
    const [showDepartures, setShowDepartures] = useState(false)

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
            $.support.cors = true; // Enable Cross domain requests
            try {
                $.ajaxSetup({
                    type: "POST",
                    contentType: "text/xml",
                    dataType: "json",
                    url: "https://api.trafikinfo.trafikverket.se/v2/data.json",
                    error: function (msg) {
                        if (msg.statusText == "abort") return;
                        alert("Request failed: " + msg.statusText + "\n" + msg.responseText);
                    }
                });
            }
            catch (e) { alert("Ett fel uppstod vid initialisering."); }
            // Create an ajax loading indicator
            var loadingTimer;
            $("#loader").hide();
            $(document).ajaxStart(function () {
                loadingTimer = setTimeout(function () {
                    $("#loader").show();
                }, 200);
            }).ajaxStop(function () {
                clearTimeout(loadingTimer);
                $("#loader").hide();
            });
            // Load stations
            GetNearbyStation();

            //GetNearbyStation().then(response =>
            //    GetDepartures(response));

        });

        function GetDepartures(locationSignature) {
            // Request to load all stations
            //console.log(toLonLat(initialMap.getView().getCenter()))
            //let locationSignature = await GetNearbyStation();
            console.log(locationSignature)
            $.ajax({
                data: `<REQUEST><LOGIN authenticationkey="6a3d19e740114ade9e1ccc03d3eee5b1" /><QUERY objecttype="TrainAnnouncement" schemaversion="1.3" orderby="AdvertisedTimeAtLocation"><FILTER><AND><EQ name="ActivityType" value="Avgang" /><EQ name="LocationSignature" value="${locationSignature}" /><OR><AND><GT name="AdvertisedTimeAtLocation" value="$dateadd(-00:15:00)" /><LT name="AdvertisedTimeAtLocation" value="$dateadd(14:00:00)" /></AND><AND><LT name="AdvertisedTimeAtLocation" value="$dateadd(00:30:00)" /><GT name="EstimatedTimeAtLocation" value="$dateadd(-00:15:00)" /></AND></OR></AND></FILTER><INCLUDE>AdvertisedTrainIdent</INCLUDE><INCLUDE>AdvertisedTimeAtLocation</INCLUDE><INCLUDE>TrackAtLocation</INCLUDE><INCLUDE>ToLocation</INCLUDE></QUERY></REQUEST>`,
                success: function (response) {
                    if (response == null) return;
                    console.log(response.RESPONSE.RESULT[0].TrainAnnouncement)
                    $(response.RESPONSE.RESULT[0].TrainAnnouncement).each(function (item) { departures.push((response.RESPONSE.RESULT[0].TrainAnnouncement[item].AdvertisedTimeAtLocation)); })
                    setDepartures(departures)
                    setShowDepartures(true)
                    console.log(departures[0])//return response.RESPONSE.RESULT[0].TrainStation[0].LocationSignature;
                }
            });
        }

        function GetNearbyStation() {
            // Request to load all stations
            //console.log(toLonLat(initialMap.getView().getCenter()))
            return $.ajax({
                data: `<REQUEST><LOGIN authenticationkey="6a3d19e740114ade9e1ccc03d3eee5b1" /><QUERY objecttype="TrainStation" schemaversion="1.4"><FILTER><NEAR name="Geometry.WGS84" value="${toLonLat(initialMap.getView().getCenter())[0]} ${toLonLat(initialMap.getView().getCenter())[1]}" mindistance="0" maxdistance="4000" /></FILTER></QUERY></REQUEST>`,
                success: function (response) {
                    if (response == null) return;
                    GetDepartures(response.RESPONSE.RESULT[0].TrainStation[0].LocationSignature);
                }
            });
        }

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
        const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

        // set React state
        setSelectedCoord(transormedCoord)

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