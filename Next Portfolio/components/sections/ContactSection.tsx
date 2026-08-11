'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, RefreshCw } from 'lucide-react';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'DevOps mail-webhook server listening... [OK]'
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    setConsoleLogs([
      '⚙️ Initializing webhook dispatcher client...',
      `📦 Packing data payload: { name: "${formData.name}", email: "${formData.email}" }`
    ]);

    await new Promise(r => setTimeout(r, 600));
    setConsoleLogs(prev => [
      ...prev,
      `📡 Dispatching POST request to gateway: https://api.rajat.qa/v1/inbox`
    ]);

    await new Promise(r => setTimeout(r, 700));
    setConsoleLogs(prev => [
      ...prev,
      `🟢 Response: 202 Accepted. Message offset queued in Kafka.`,
      `💬 Routing notification hook to Rajat's mobile client...`
    ]);

    await new Promise(r => setTimeout(r, 500));
    setConsoleLogs(prev => [
      ...prev,
      `✅ Delivery confirmed! Thanks for connecting. I'll get back to you shortly.`
    ]);

    // Reset Form
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: <Mail size={22} />,
      title: "Email",
      display: "kumarrajatpradhan5364@gmail.com",
      link: "mailto:kumarrajatpradhan5364@gmail.com",
      desc: "Drop me an email anytime."
    },
    {
      icon: <Phone size={22} />,
      title: "Phone",
      display: "+91 8810455929",
      link: "tel:+918810455929",
      desc: "Call or text for urgent matters."
    },
    {
      icon: <MapPin size={22} />,
      title: "Location",
      display: "New Delhi, India",
      link: "https://maps.google.com",
      desc: "Remote work or onsite APAC/India."
    }
  ];

  return (
    <section id="contact">
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-badge">
            <MessageSquare size={12} style={{ marginRight: '0.25rem' }} />
            <span>Get In Touch</span>
          </div>
          <h2 className="section-title">Let's Work Together</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Ready to enhance your test coverage, speed up your builds, or discuss open positions? Let's talk!
          </p>
        </div>

        {/* Contact Layout */}
        <div className="contact-wrapper">
          
          {/* Left Side: Contact Methods & Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="contact-info-list">
              {contactMethods.map((method, idx) => {
                const cardThemes = ['neon-indigo', 'neon-purple', 'neon-teal'];
                const cardTheme = cardThemes[idx % 3];

                return (
                  <div key={idx} className={`glass-card contact-method-card ${cardTheme}`}>
                    <div className="contact-method-icon">
                      {method.icon}
                    </div>
                    <div className="contact-method-details">
                      <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                        {method.title}
                      </p>
                      <h3 style={{ margin: '0.15rem 0 0.35rem 0', fontSize: '1rem', fontWeight: '700' }}>
                        {method.desc}
                      </h3>
                      {method.link.startsWith('http') ? (
                        <a href={method.link} target="_blank" rel="noopener noreferrer">
                          {method.display}
                        </a>
                      ) : (
                        <a href={method.link}>
                          {method.display}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated Webhook Logger */}
            <div className="contact-terminal-output">
              {consoleLogs.map((log, idx) => {
                let logClass = 'log-info';
                if (log.startsWith('🟢') || log.startsWith('✅')) logClass = 'log-pass';
                if (log.startsWith('⚙️') || log.startsWith('📦')) logClass = 'log-step';
                if (log.startsWith('📡')) logClass = 'log-cmd';
                return (
                  <div key={idx} className={logClass}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Glassmorphic Input Form */}
          <div className="glass-card contact-form-card neon-indigo">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. john@company.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="How can I help you?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe your inquiry..."
                  rows={5}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Transmitting message...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default ContactSection;