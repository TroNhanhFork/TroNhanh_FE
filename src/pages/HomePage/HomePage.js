import React from 'react';
import './HomePage_css.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import HeroSection from './HeroSection';
import InfoSection from './InfoSection';
import DiscoverSection from './DiscoverSection';
import ServicesSection from './ServicesSection';
import TestimonialsCarousel from './testimonials';
import BlogSection from './BlogSection';
import UsefulLinks from './UsefulLinks';

export default function HomePage() {
    return (
        <div className="homepage-container">
            <HeroSection />
            <InfoSection />
            <DiscoverSection />
            <ServicesSection />
            <TestimonialsCarousel />
            <BlogSection />
            <UsefulLinks />
        </div>
    );
}
