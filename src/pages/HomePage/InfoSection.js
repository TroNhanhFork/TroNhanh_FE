import React from 'react';

export default function InfoSection() {
    return (
        <div className="info-section container-fluid px-0">
            <div className="images row align-items-center justify-content-center">
                <div className="col-md-5 image-grid">
                    <img className='top-left' src="DaNang1.jpg" alt="img1" />
                    <img src="DaNang2.png" alt="img2" />
                    <img className='bottom-left' src="DaNang3.jpg" alt="img3" />
                    <img src="Danang4.jpg" alt="img4" />
                </div>
                <div className="text col-md-5 p-4 bg-light d-flex flex-column justify-content-center">
                    <h2>The choice is flexible</h2>
                    <p>
                        We believe in a world where finding a home is just a click away. Whether you're selling your home,
                        travelling for work or moving to a new city. Just bring your bags, and we'll handle the rest.
                    </p>
                </div>
            </div>
        </div>
    );
}
