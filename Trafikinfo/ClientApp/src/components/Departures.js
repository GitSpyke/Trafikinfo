import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

function Departures({ departures }){
    return (
        <div>
            {departures.map((departure) => <div className='new-line'>{departure}</div>)}
        </div>
    )
}

export default Departures
