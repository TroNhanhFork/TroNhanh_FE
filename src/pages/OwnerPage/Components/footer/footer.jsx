import React from "react";
import { Layout } from "antd";
import "./footer.css"; // Import your CSS file for styling
const { Footer } = Layout;

const FooterBar = () => {
    return (
        <Footer className="footer-container">
            <div className="footer-content">
                <div className="footer-section">
                    <img src="path-to-flex-living-logo.png" alt="Flex Living Logo" className="footer-logo" />
                    <p>Contact number: 02033074477</p>
                    <div className="social-icons">
                        <span>in</span>
                        <span>f</span>
                        <span>🐦</span>
                    </div>
                    <p>© 2021 Flex Living</p>
                </div>
                <div class="Company-section">
                    <p>Company</p>
                    <p>Home</p>
                    <p>About us</p>
                    <p>Our team</p>
                </div>
                <div className="guests-section">
                    <p>Guests</p>
                    <p>Blog</p>
                    <p>FAQ</p>
                    <p>Career</p>
                </div>
                <div className="privacy-section">
                    <p>Privacy</p>
                    <p>Terms of Service</p>
                    <p>Privacy Policy</p>
                </div>
                <div className="subscribe-section">
                    <p>Stay up to date</p>
                    <p>Be the first to know about our newest apartments</p>
                    <input type="text" className="email-input" placeholder="Email address" />
                    <button className="subscribe-btn">Subscribe</button>
                </div>
            </div>
        </Footer>
    );
};

export default FooterBar;