import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

function Departures({ departures }){
    return (
        <div>
            {departures.map((departure) => <h4>{departure}</h4>)}
        </div>
    )
}

export default Departures
