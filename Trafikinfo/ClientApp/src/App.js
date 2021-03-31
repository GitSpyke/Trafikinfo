import './App.css';

// react
import React, { useState, useEffect } from 'react';

// openlayers
import GeoJSON from 'ol/format/GeoJSON'
import Feature from 'ol/Feature';

// components
import MapWrapper from './components/MapWrapper'
import Geocoder from 'ol-geocoder'

function App() {

    // set intial state
    const [features, setFeatures] = useState([])

    // initialization - retrieve GeoJSON features from Mock JSON API get features from mock 
    //  GeoJson API (read from flat .json file in public directory)
    useEffect(() => {

        fetch('/mock-geojson-api.json')
            .then(response => response.json())
            .then((fetchedFeatures) => {

                // parse fetched geojson into OpenLayers features
                //  use options to convert feature from EPSG:4326 to EPSG:3857
                const wktOptions = {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                }
                const parsedFeatures = new GeoJSON().readFeatures(fetchedFeatures, wktOptions)

                // set features into state (which will be passed into OpenLayers
                //  map component as props)
                setFeatures(parsedFeatures)

            })

    }, [])

    return (
        <div className="App">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.4.3/css/ol.css" />
            <link rel="stylesheet" href="https://unpkg.com/ol-popup@4.0.0/src/ol-popup.css" />
            <link rel="stylesheet" href="https://unpkg.com/ol-geocoder@latest/dist/ol-geocoder.min.css" />
            <div className="app-label">
                <p>Kartprojektetet 2021</p>
                <button onClick="">En knapp som inte gör något!</button>
                {/*<p>React Functional Components with OpenLayers Example</p>*/}
                {/*<p>Click the map to reveal location coordinate via React State</p>*/}
            </div>
            {/*<div class='ol-control ol-unselectable locate'></div>*/}
            {/*<button title="Locate me">◎</button>;*/}
            <script src="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.4.3/build/ol.js"></script>
            <script src="https://unpkg.com/ol-popup@4.0.0/dist/ol-popup.js"></script>
            <script src="https://unpkg.com/ol-geocoder"></script>
            <script src="
control-glass.js"></script>

            <MapWrapper features={features} />

        </div>
    )
}

export default App
