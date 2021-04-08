import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

function Departures({ departures }) {
    return (
            <tbody>
                <tr>
                    <th>Destination</th>
                    <th>Nummer</th>
                    <th>Tid</th>
                </tr>
                {departures.map((departure, index) => {
                    return <tr key={index}>
                        <td>{departure.destination}</td>
                        <td>{departure.number}</td>
                        <td>{departure.time}</td>
                    </tr>;
                })}
            </tbody>
    )
}

export default Departures
