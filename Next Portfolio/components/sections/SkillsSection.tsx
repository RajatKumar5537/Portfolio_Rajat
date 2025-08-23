'use client';

import { useState, useEffect, useRef } from 'react';

const SkillsSection = () => {
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

  const skillCategories = [
    {
      title: "Test Automation",
      icon: "🔧",
      skills: ["Selenium WebDriver", "Playwright", "TestNG", "JUnit", "Jest", "Cucumber", "RestAssured", "Postman"]
    },
    {
      title: "Programming Languages",
      icon: "💻",
      skills: ["Java", "JavaScript", "TypeScript", "Python", "C#", "SQL", "HTML/CSS", "Bash"]
    },
    {
      title: "Frameworks & Tools",
      icon: "⚡",
      skills: ["Maven", "Gradle", "Jenkins", "GitHub Actions", "Docker", "Kubernetes", "Allure", "ExtentReports"]
    },
    {
      title: "Testing Types",
      icon: "🎯",
      skills: ["UI Testing", "API Testing", "Database Testing", "Cross-browser Testing", "Mobile Testing", "Performance Testing"]
    },
    {
      title: "CI/CD & DevOps",
      icon: "🚀",
      skills: ["Jenkins", "GitLab CI", "GitHub Actions", "Docker", "AWS", "Azure DevOps", "Terraform"]
    },
    {
      title: "Methodologies",
      icon: "📋",
      skills: ["Agile", "Scrum", "BDD", "TDD", "Risk-based Testing", "Shift-left Testing", "Continuous Testing"]
    }
  ];

  return (
    <section ref={sectionRef} className="skills" id="skills">
      <div className="section-header">
        <div className="section-badge">
          🛠️ My expertise
        </div>
        <h2 className="section-title">Skills & Technologies</h2>
        <p className="section-subtitle">
          A comprehensive toolkit for modern quality assurance and test automation
        </p>
      </div>

      <div className="skills-grid">
        {skillCategories.map((category, index) => (
          <div 
            key={category.title} 
            className="skill-category"
            style={{ 
              animationDelay: isVisible ? `${index * 0.1}s` : '0s',
              animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
            }}
          >
            <div className="skill-icon">
              {category.icon}
            </div>
            <h3>{category.title}</h3>
            <div className="skill-tags">
              {category.skills.map((skill, skillIndex) => (
                <span 
                  key={skill} 
                  className="skill-tag"
                  style={{ 
                    animationDelay: isVisible ? `${(index * 0.1) + (skillIndex * 0.05)}s` : '0s',
                    animation: isVisible ? 'fadeInUp 0.4s ease-out forwards' : 'none'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SkillsSection;