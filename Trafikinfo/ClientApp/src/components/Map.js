import React, { Component } from 'react';

export class Map extends Component {

  //constructor(props) {
  //  super(props);
  //  this.state = { forecasts: [], loading: true };
  //}

  //componentDidMount() {
  //  this.populateWeatherData();
  //}

//import Map from 'ol/Map';
//import View from 'ol/View';
//import TileLayer from 'ol/layer/Tile';
//import XYZ from 'ol/source/XYZ';

//new Map({
//    target: 'map',
//    layers: [
//        new TileLayer({
//            source: new XYZ({
//                url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
//            })
//        })
//    ],
//    view: new View({
//        center: [0, 0],
//        zoom: 2
//    })
});


  static renderForecastsTable(forecasts) {
    return (
      <table className='table table-striped' aria-labelledby="tabelLabel">
        <thead>
          <tr>
            <th>Date</th>
            <th>Temp. (C)</th>
            <th>Temp. (F)</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map(forecast =>
            <tr key={forecast.date}>
              <td>{forecast.date}</td>
              <td>{forecast.temperatureC}</td>
              <td>{forecast.temperatureF}</td>
              <td>{forecast.summary}</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  render() {
    let contents = this.state.loading
      ? <p><em>Loading...</em></p>
      : FetchData.renderForecastsTable(this.state.forecasts);

    return (
      <div>
        <h1 id="tabelLabel" >Weather forecast</h1>
        <p>This component demonstrates fetching data from the server.</p>
        {contents}
      </div>
    );
  }

  async populateWeatherData() {
    const response = await fetch('weatherforecast');
    const data = await response.json();
    this.setState({ forecasts: data, loading: false });
  }
}
