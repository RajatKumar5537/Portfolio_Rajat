'use client';

import { Calendar, Cpu, CheckSquare, Activity, CheckCircle, Code, Shield } from 'lucide-react';

const AboutSection = () => {
  const stats = [
    { label: 'Years Experience', value: '5+', icon: <Calendar size={22} /> },
    { label: 'Frameworks Designed', value: '4+', icon: <Cpu size={22} /> },
    { label: 'Tests Executed', value: '10k+', icon: <CheckSquare size={22} /> },
    { label: 'Stability Rate', value: '99.9%', icon: <Activity size={22} /> },
  ];

  const highlights = [
    { title: "Scalable UI Testing", desc: "Crafting modular, error-resilient automation suites using Playwright (TypeScript/JS) & Selenium WebDriver (Java, POM)." },
    { title: "Reusable API Automation", desc: "Designing Jest & Axios integration suites covering Auth, gateway transactions, and live leaderboards." },
    { title: "Backend validation", desc: "Auditing distributed message stream brokers and caching stores (Kafka queues, Redis cache, MongoDB databases)." },
    { title: "CI/CD Orchestration", desc: "Automating execution hooks and Allure dashboard uploads within Jenkins and Azure DevOps." },
  ];

  return (
    <section id="about">
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-badge">
            <Shield size={12} style={{ marginRight: '0.25rem' }} />
            <span>Profile Overview</span>
          </div>
          <h2 className="section-title">About Me</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Passionate Senior SDET & QE Manager specializing in building modular test architectures and validating high-throughput systems.
          </p>
        </div>

        {/* Section Content Wrapper */}
        <div className="about-wrapper">
          
          {/* Left Column: Glass Metric Cards */}
          <div className="about-metrics-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="glass-card about-metric-card neon-indigo">
                <div className="about-metric-icon">
                  {stat.icon}
                </div>
                <div className="about-metric-val">{stat.value}</div>
                <div className="about-metric-lbl">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Right Column: Bio & Core Competencies */}
          <div className="about-text">
            <p>
              Hey there! I am Rajat Kumar Pradhan, an experienced <b>Senior Software Development Engineer in Test (SDET)</b> and <b>QE Manager</b> with over 5 years in the software quality assurance space. 
            </p>
            <p>
              I specialize in designing test automation architectures from the ground up, reducing regression overhead, and integrating continuous feedback loops into engineering workflows. My main focus is checking not just the UI, but ensuring database integrity, caching persistence, and event stream validation behave reliably under load.
            </p>

            <ul className="about-highlights">
              {highlights.map((h, idx) => (
                <li key={idx} className="about-highlight-item">
                  <div className="highlight-icon-wrapper">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                      {h.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {h.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AboutSection;