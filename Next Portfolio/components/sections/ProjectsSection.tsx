'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const ProjectsSection = () => {
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

  const projects = [
    {
      title: "E-commerce Test Automation Suite",
      description: "Comprehensive automation framework for end-to-end testing of e-commerce platform including payment processing, inventory management, and user workflows.",
      icon: "🛒",
      tags: ["Selenium", "Java", "TestNG", "Maven", "Jenkins", "Allure"],
      githubUrl: "#",
      liveUrl: "#"
    },
    {
      title: "API Testing Framework",
      description: "Robust REST API testing framework with data-driven testing, automated contract validation, and performance benchmarking capabilities.",
      icon: "🔌",
      tags: ["RestAssured", "Java", "JSON Schema", "Postman", "Newman"],
      githubUrl: "#",
      liveUrl: "#"
    },
    {
      title: "Mobile Test Automation",
      description: "Cross-platform mobile testing solution for Android and iOS applications with device farm integration and parallel execution.",
      icon: "📱",
      tags: ["Appium", "Selenium Grid", "Android", "iOS", "BrowserStack"],
      githubUrl: "#",
      liveUrl: "#"
    },
    {
      title: "Performance Testing Dashboard",
      description: "Real-time performance monitoring and testing dashboard with automated load testing and performance regression detection.",
      icon: "📊",
      tags: ["JMeter", "Grafana", "InfluxDB", "Docker", "K6"],
      githubUrl: "#",
      liveUrl: "#"
    },
    {
      title: "CI/CD Pipeline Integration",
      description: "Complete DevOps integration with automated testing pipelines, quality gates, and deployment automation for multiple environments.",
      icon: "⚙️",
      tags: ["Jenkins", "Docker", "GitHub Actions", "SonarQube", "AWS"],
      githubUrl: "#",
      liveUrl: "#"
    },
    {
      title: "Test Data Management Tool",
      description: "Intelligent test data generation and management system with database seeding, data masking, and environment synchronization.",
      icon: "💾",
      tags: ["Python", "PostgreSQL", "Docker", "Faker", "SQLAlchemy"],
      githubUrl: "#",
      liveUrl: "#"
    }
  ];

  return (
    <section ref={sectionRef} className="projects" id="projects">
      <div className="section-header">
        <div className="section-badge">
          🚀 My work
        </div>
        <h2 className="section-title">Featured Projects</h2>
        <p className="section-subtitle">
          A showcase of test automation frameworks and quality assurance solutions I've built
        </p>
      </div>

      <div className="projects-grid">
        {projects.map((project, index) => (
          <div 
            key={project.title} 
            className="project-card"
            style={{ 
              animationDelay: isVisible ? `${index * 0.15}s` : '0s',
              animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
            }}
          >
            <div className="project-image">
              {project.icon}
            </div>
            <div className="project-content">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="project-tags">
                {project.tags.map((tag, tagIndex) => (
                  <span 
                    key={tag} 
                    className="project-tag"
                    style={{ 
                      animationDelay: isVisible ? `${(index * 0.15) + (tagIndex * 0.05)}s` : '0s',
                      animation: isVisible ? 'fadeInUp 0.4s ease-out forwards' : 'none'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="project-links">
                <Link href={project.githubUrl} className="project-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Code
                </Link>
                <Link href={project.liveUrl} className="project-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                  </svg>
                  Demo
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;