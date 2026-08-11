'use client';

import { Monitor, Link, Terminal, Database, GitBranch, BarChart, Wrench } from 'lucide-react';

const SkillsSection = () => {
  const skillCategories = [
    {
      title: "UI Automation",
      icon: <Monitor size={20} />,
      skills: ["Playwright", "Selenium WebDriver", "TestNG", "Page Object Model", "Appium", "Mobile Automation"]
    },
    {
      title: "API Automation",
      icon: <Link size={20} />,
      skills: ["Jest", "Axios", "REST APIs", "Postman", "REST Assured"]
    },
    {
      title: "Programming",
      icon: <Terminal size={20} />,
      skills: ["Java", "JavaScript", "TypeScript", "SQL", "HTML/CSS", "YAML"]
    },
    {
      title: "Backend Validation",
      icon: <Database size={20} />,
      skills: ["MongoDB", "Redis", "Kafka", "SQL Server", "MySQL"]
    },
    {
      title: "CI/CD & DevOps",
      icon: <GitBranch size={20} />,
      skills: ["Jenkins", "Azure DevOps", "Git", "GitHub", "Bitbucket", "Docker"]
    },
    {
      title: "Reporting & PM",
      icon: <BarChart size={20} />,
      skills: ["Allure Report", "Jira", "Agile", "Scrum"]
    }
  ];

  return (
    <section id="skills">
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-badge">
            <Wrench size={12} style={{ marginRight: '0.25rem' }} />
            <span>Technical Toolkit</span>
          </div>
          <h2 className="section-title">Skills & Expertise</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            A modular compilation of frameworks, databases, and DevOps tools built to deliver rock-solid quality.
          </p>
        </div>

        {/* Skills Grid */}
        <div className="skills-grid">
          {skillCategories.map((category, idx) => {
            const cardThemes = ['neon-indigo', 'neon-purple', 'neon-teal'];
            const cardTheme = cardThemes[idx % 3];
            
            return (
              <div key={idx} className={`glass-card skills-card ${cardTheme}`}>
                <h3>
                  <span className="skills-card-icon">{category.icon}</span>
                  <span>{category.title}</span>
                </h3>
                <div className="skills-list">
                  {category.skills.map((skill, sIdx) => (
                    <span key={sIdx} className="skills-tag">
                      {skill}
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

export default SkillsSection;