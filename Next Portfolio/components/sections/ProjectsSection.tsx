'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cpu, Monitor, Database, Briefcase, Github, ExternalLink, Code } from 'lucide-react';

interface Project {
  title: string;
  description: string;
  category: 'ui' | 'api' | 'backend';
  icon: React.ReactNode;
  tags: string[];
  githubUrl: string;
  liveUrl: string;
}

const ProjectsSection = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ui' | 'api' | 'backend'>('all');

  const projects: Project[] = [
    {
      title: "Meteor Blast Backend API Automation",
      description: "Developed a robust and reusable backend API automation framework from scratch. Automated game-critical Authentication, Wallet, Tournament, Match, League, and Leaderboard APIs. Integrated Allure Reporting and automated execution within Jenkins pipelines.",
      category: "api",
      icon: <Cpu size={22} />,
      tags: ["Jest", "Axios", "Postman", "MongoDB", "Redis", "Kafka", "Jenkins", "Allure"],
      githubUrl: "https://github.com/RajatKumar5537",
      liveUrl: "#"
    },
    {
      title: "Android App P2P Backend API Automation",
      description: "Automated core peer-to-peer (P2P) backend services for the Android application, verifying payment handshakes, ledger integrations, dynamic tokens, and real-time state synchronization.",
      category: "api",
      icon: <Cpu size={22} />,
      tags: ["Jest", "Axios", "Appium", "P2P Protocols", "REST APIs", "Android", "MongoDB"],
      githubUrl: "https://github.com/RajatKumar5537",
      liveUrl: "#"
    },
    {
      title: "Nexus Backend API Automation",
      description: "Engineered comprehensive integration test suites for admin dashboard backend APIs, validating secure configurator endpoints, data tables feeds, and role-based session tokens.",
      category: "api",
      icon: <Cpu size={22} />,
      tags: ["Jest", "Axios", "REST APIs", "Postman", "Jenkins", "API Automation"],
      githubUrl: "https://github.com/RajatKumar5537",
      liveUrl: "#"
    },
    {
      title: "Nexus Dashboard UI Automation",
      description: "Engineered scalable UI automation using Playwright. Automated regression and smoke suites for the admin dashboard, verifying complex data tables, configuration forms, and user controls.",
      category: "ui",
      icon: <Monitor size={22} />,
      tags: ["Playwright", "JavaScript", "Jenkins", "UI Automation", "Dashboard Testing"],
      githubUrl: "https://github.com/RajatKumar5537",
      liveUrl: "#"
    },
    {
      title: "AFS Pixel Monitoring Validation",
      description: "Designed a backend monitoring test suite validating high-throughput tracking pixels. Performed deep validation across MongoDB databases, Redis cache consistency, and Kafka event logs.",
      category: "backend",
      icon: <Database size={22} />,
      tags: ["Playwright", "MongoDB", "Redis", "Kafka", "Node.js", "Backend Validation"],
      githubUrl: "https://github.com/RajatKumar5537",
      liveUrl: "#"
    },
    {
      title: "Vibrant Visions CRM Suite",
      description: "Built a Java-Selenium WebDriver Page Object Model test suite for an enterprise CRM system. Executed cross-browser functional testing, regression/smoke automation, and relational database validation.",
      category: "ui",
      icon: <Briefcase size={22} />,
      tags: ["Selenium", "Java", "TestNG", "Maven", "Git", "Jenkins", "SQL"],
      githubUrl: "https://github.com/RajatKumar5537",
      liveUrl: "#"
    }
  ];

  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(p => p.category === activeFilter);

  const filterTabs = [
    { id: 'all', label: 'All Frameworks' },
    { id: 'ui', label: 'UI Automation' },
    { id: 'api', label: 'API Automation' },
    { id: 'backend', label: 'Backend / Events' },
  ];

  return (
    <section id="projects">
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-badge">
            <Code size={12} style={{ marginRight: '0.25rem' }} />
            <span>Featured Works</span>
          </div>
          <h2 className="section-title">Automation Projects</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            A detailed showcase of custom-built test automation frameworks, API validation engines, and data pipeline tests.
          </p>
        </div>

        {/* Filters */}
        <div className="projects-filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`projects-filter-btn ${activeFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="projects-grid">
          {filteredProjects.map((project, idx) => {
            const cardThemes = ['neon-indigo', 'neon-purple', 'neon-teal'];
            const cardTheme = cardThemes[idx % 3];

            return (
              <div key={idx} className={`glass-card project-card ${cardTheme}`}>
                <div>
                  <div className="project-top-row">
                    <div className="project-icon">
                      {project.icon}
                    </div>
                    <div className="project-links">
                      <Link href={project.githubUrl} target="_blank" className="project-link-btn" aria-label="GitHub Repository">
                        <Github size={18} />
                      </Link>
                      <Link href={project.liveUrl} className="project-link-btn" aria-label="Live Demo">
                        <ExternalLink size={18} />
                      </Link>
                    </div>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
                <div className="project-tags">
                  {project.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="project-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ProjectsSection;