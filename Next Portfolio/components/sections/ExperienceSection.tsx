'use client';

import { Briefcase, Calendar, MapPin, CheckCircle, Award } from 'lucide-react';

interface Experience {
  title: string;
  company: string;
  duration: string;
  location: string;
  responsibilities: string[];
  techStack: string[];
}

const ExperienceSection = () => {
  const experiences: Experience[] = [
    {
      title: "QE Manager",
      company: "Somo Media Pvt. Ltd.",
      duration: "Dec 2024 – Present",
      location: "New Delhi, India",
      responsibilities: [
        "Led Quality Engineering (QE) activities across multiple web and mobile applications.",
        "Designed scalable Playwright automation framework from scratch.",
        "Built reusable API Automation Framework using Jest and Axios.",
        "Integrated automation into Jenkins CI/CD pipelines and developed automated reporting using Allure.",
        "Performed backend validation using MongoDB, Redis, and Kafka.",
        "Designed automation architecture for Gaming Platform APIs.",
        "Reviewed pull requests, mentored junior QE engineers, and established best practices."
      ],
      techStack: ["Playwright", "Jest", "Axios", "Jenkins", "Allure", "MongoDB", "Redis", "Kafka"]
    },
    {
      title: "Automation Test Engineer",
      company: "JIVIEWS Private Limited",
      duration: "Oct 2023 – Dec 2024",
      location: "Bangalore, India",
      responsibilities: [
        "Developed Jest & Axios API automation frameworks covering Authentication, Wallet, Tournament, Match, League, and Leaderboards for the Meteor Blast Gaming Platform.",
        "Conducted UI Automation, regression/smoke suites, and admin dashboard testing for Nexus Dashboard using Playwright, JavaScript, and Jenkins.",
        "Validated backend streams, event tracking, MongoDB records, Redis cache, and Kafka events for AFS Pixel Monitoring Dashboard."
      ],
      techStack: ["Playwright", "Jest", "Axios", "Postman", "MongoDB", "Redis", "Kafka", "Jenkins"]
    },
    {
      title: "Automation Test Engineer",
      company: "Test Well Technologies Pvt Ltd",
      duration: "Dec 2020 – Sep 2023",
      location: "Bangalore, India",
      responsibilities: [
        "Developed Selenium Automation Framework from scratch with Java and TestNG.",
        "Executed UI Automation, API testing using Postman, and database validations.",
        "Performed cross-browser testing, regression, smoke testing, and managed bug tracking/reporting in Jira."
      ],
      techStack: ["Selenium", "Java", "TestNG", "Maven", "Git", "Jenkins", "SQL", "Postman"]
    }
  ];

  return (
    <section id="experience">
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-badge">
            <Award size={12} style={{ marginRight: '0.25rem' }} />
            <span>My Journey</span>
          </div>
          <h2 className="section-title">Professional Experience</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            A progression of leadership and engineering roles specializing in software quality validation.
          </p>
        </div>

        {/* Timeline Component */}
        <div className="timeline">
          {experiences.map((exp, idx) => {
            const cardThemes = ['neon-indigo', 'neon-purple', 'neon-teal'];
            const cardTheme = cardThemes[idx % 3];

            return (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className={`glass-card timeline-card ${cardTheme}`}>
                  <div className="timeline-header">
                    <div>
                      <h3 className="timeline-role">{exp.title}</h3>
                      <span className="timeline-company">{exp.company}</span>
                    </div>
                    <div className="timeline-meta">
                      <div className="timeline-meta-item">
                        <Calendar size={14} />
                        <span>{exp.duration}</span>
                      </div>
                      <div className="timeline-meta-item">
                        <MapPin size={14} />
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="timeline-list">
                    {exp.responsibilities.map((resp, rIdx) => (
                      <li key={rIdx} className="timeline-list-item">
                        <span className="timeline-list-icon">
                          <CheckCircle size={14} />
                        </span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="timeline-tech-wrap">
                    <span className="timeline-tech-lbl">Stack:</span>
                    <div className="timeline-tech-tags">
                      {exp.techStack.map((tech, tIdx) => (
                        <span key={tIdx} className="timeline-tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ExperienceSection;