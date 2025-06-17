import React from 'react';

export default function UsefulLinks() {
    return (
        <div className="container py-5">
            <h5 className="fw-bold">Useful links</h5>
            <div className="row">
                <div className="col-md-6">
                    <ul className="list-unstyled">
                        <li><a href="#">West London Apartments →</a></li>
                        <li><a href="#">Riverside Apartments →</a></li>
                        <li><a href="#">Apartments in Finance Sector City of London →</a></li>
                        <li><a href="#">Apartments in Soho, Fitrovia →</a></li>
                        <li><a href="#">East London Apartments →</a></li>
                    </ul>
                </div>
                <div className="col-md-6">
                    <ul className="list-unstyled">
                        <li><a href="#">Suitable for Families or Groups →</a></li>
                        <li><a href="#">Apartments with Parking →</a></li>
                        <li><a href="#">Apartments with Elevator →</a></li>
                        <li><a href="#">Apartments suitable for physical disabilities →</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
