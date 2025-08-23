'use client';

import { useState, useEffect, useRef } from 'react';

const ExperienceSection = () => {
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

  const experiences = [
    {
      title: "Software QA Team Lead",
      company: "SOMO MEDIA PVT LTD",
      duration: "December 2024 – Present",
      location: "New Delhi",
      responsibilities: [
        "Built and manage Playwright (JavaScript) automation framework from scratch",
        "Lead and mentor QA engineering team, establishing quality benchmarks",
        "Drive end-to-end QA processes from requirement analysis to production",
        "Integrate automation scripts into CI/CD pipelines for continuous feedback",
        "Collaborate with cross-functional teams to ensure seamless product delivery"
      ]
    },
    {
      title: "Quality Assurance Automation Engineer",
      company: "JIVI (Jiviews)",
      duration: "Septmber 2023 – November 2024",
      location: "Bangalore",
      responsibilities: [
        "Developed comprehensive test automation suites using Selenium WebDriver and Java",
        "Implemented API testing frameworks using RestAssured and Postman",
        "Created robust test data management and database validation processes",
        "Collaborated with development teams in Agile environment for quality delivery",
        "Mentored junior QA engineers and established testing best practices"
      ]
    },
    {
      title: "Test Automation Engineer",
      company: "Test Well Technologies",
      duration: "Dec 2020 – Septmber 2023",
      location: "Bangalore",
      responsibilities: [
        "Performed manual and exploratory testing for web and mobile applications",
        "Created detailed test cases and executed comprehensive test plans",
        "Identified, documented, and tracked defects through resolution",
        "Participated in requirement analysis and test planning activities",
        "Supported automation initiatives and learned testing frameworks"
      ]
    }
  ];

  return (
    <section ref={sectionRef} className="experience" id="experience">
      <div className="section-header">
        <div className="section-badge">
          🏆 My journey
        </div>
        <h2 className="section-title">Professional Experience</h2>
        <p className="section-subtitle">
          A progression of roles that shaped my expertise in quality assurance and test automation
        </p>
      </div>

      <div className="experience-timeline">
        {experiences.map((exp, index) => (
          <div 
            key={index} 
            className="timeline-item"
            style={{ 
              animationDelay: isVisible ? `${index * 0.2}s` : '0s',
              animation: isVisible ? 'fadeInUp 0.8s ease-out forwards' : 'none'
            }}
          >
            <div className="timeline-content">
              <h3>{exp.title}</h3>
              <div className="company">{exp.company}</div>
              <div className="duration">{exp.duration}</div>
              <ul>
                {exp.responsibilities.map((responsibility, idx) => (
                  <li key={idx}>{responsibility}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExperienceSection;