'use client';

import { useState, useEffect, useRef } from 'react';

const AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="about" id="about">
      <div className="section-header">
        <div className="section-badge">
          👨‍💻 Get to know me
        </div>
        <h2 className="section-title">About Me</h2>
        <p className="section-subtitle">
          Passionate about quality assurance and test automation with a proven track record of delivering reliable software solutions.
        </p>
      </div>

      <div className="about-grid">
        <div className="about-card about-info">
          <h3>Quality Assurance Engineer</h3>
          <div className="contact-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>New Delhi, India</span>
          </div>
          <div className="contact-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            <span>+91 8810455929</span>
          </div>
          <div className="contact-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span>rajat.pradhan@email.com</span>
          </div>
        </div>

        <div className="about-text">
          <p>
              👋 As an experienced <b>Software QA Team Lead</b> with 4 years of experience in automation and manual testing of web and mobile applications. I specialize in building scalable test frameworks, integrating CI/CD pipelines, and ensuring product reliability at scale — currently verifying <b>7K+ URLs daily</b> through automation.
          </p>

          <p>
            <b>💡 What I Do Best</b><br />
            • Build robust automation frameworks from scratch using Playwright (JavaScript) and Selenium WebDriver (Java, TestNG, POM).<br />
            • Perform Android app testing (UI, functional, regression) to ensure mobile stability across devices.<br />
            • Test APIs using Postman & Rest Assured and validate backend data with SQL & MongoDB.<br />
            • Connect complex systems like Discord Bots → n8n Workflows → Frontend Dashboards → Backend APIs for seamless end-to-end validation.<br />
            • Integrate automation with Jenkins, Docker, Redis, and Kafka for high-speed, reliable CI/CD pipelines.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;