import React from 'react';

export default function ServicesSection() {
    return (
        <div className="mt-3 d-flex justify-content-between align-items-stretch service_box_container mx-5">
            {[
                { icon: "calendar.png", title: "Flexible living", desc: "Stay as long or as little as you need with month-to-month contracts" },
                { icon: "sofa.png", title: "Move-in ready", desc: "Ready to move in with everything you need" },
                { icon: "wi-fi.png", title: "High-speed Wi-Fi", desc: "Best in class internet speeds suitable for working from home" },
                { icon: "chat.png", title: "24/7 support", desc: "On hand team for any issues you have" }
            ].map((item, i) => (
                <div className="service_box mx-2" key={i}>
                    <img src={item.icon} className="icon_image" />
                    <h4 className='text'>{item.title}</h4>
                    <p className='text'>{item.desc}</p>
                </div>
            ))}
        </div>
    );
}
