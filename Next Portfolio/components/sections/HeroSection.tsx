'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="hero" id="home">
      {/* Floating Elements */}
      <div className="floating-element">💻</div>
      <div className="floating-element">⚡</div>
      <div className="floating-element">🚀</div>
      
      <div className="hero-content">
        <div className="hero-badge">
          Available for new opportunities
        </div>
        
        <h1>
          Rajat Kumar Pradhan
        </h1>
        
        <p className="subtitle">
          QA Automation Expert & Team Lead
        </p>
        
        <p className="description">
          Crafting robust test automation frameworks with 4 years of expertise in Selenium, Playwright, and modern testing practices. Leading teams to deliver flawless software experiences.
        </p>
        
        <div className="hero-buttons">
          <Link href="#contact" className="btn btn-primary">
            <span>Let's Connect</span>
            <span>📧</span>
          </Link>
          <Link href="#projects" className="btn btn-secondary">
            <span>View My Work</span>
            <span>👀</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;