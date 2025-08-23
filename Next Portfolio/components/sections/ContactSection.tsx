'use client';

import { useState, useEffect, useRef } from 'react';

const ContactSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Form submitted:', formData);
    
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
    
    // Show success message (you can implement a toast notification here)
    alert('Message sent successfully!');
  };

  const contactMethods = [
    {
      icon: "📧",
      title: "Email",
      description: "Drop me a line anytime",
      contact: "kumarrajatpradhan5364@gmail.com",
      gradient: "var(--gradient-primary)"
    },
    {
      icon: "📱",
      title: "Phone",
      description: "Call for immediate response",
      contact: "+91 8810455929",
      gradient: "var(--gradient-secondary)"
    },
    {
      icon: "📍",
      title: "Location",
      description: "Based in New Delhi",
      contact: "New Delhi, India",
      gradient: "var(--gradient-accent)"
    },
    {
      icon: "💼",
      title: "LinkedIn",
      description: "Let's connect professionally",
      contact: "https://www.linkedin.com/in/rajat-kumar-pradhan-204974257/",
      gradient: "var(--gradient-success)"
    }
  ];

  return (
    <section ref={sectionRef} className="contact" id="contact">
      <div className="section-header">
        <div className="section-badge">
          💬 Get in touch
        </div>
        <h2 className="section-title">Let's Work Together</h2>
        <p className="section-subtitle">
          Ready to discuss your next project or explore opportunities? I'd love to hear from you.
        </p>
      </div>

      <div className="contact-grid">
        <div className="contact-info">
          {contactMethods.map((method, index) => (
            <div 
              key={method.title} 
              className="contact-method"
              style={{ 
                animationDelay: isVisible ? `${index * 0.1}s` : '0s',
                animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
              }}
            >
              <div className="contact-method-icon" style={{ background: method.gradient }}>
                {method.icon}
              </div>
              <h3>{method.title}</h3>
              <p>{method.description}</p>
              <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{method.contact}</p>
            </div>
          ))}
        </div>

        <form 
          className="contact-form"
          onSubmit={handleSubmit}
          style={{ 
            animationDelay: isVisible ? '0.4s' : '0s',
            animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
          }}
        >
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter your full name"
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
              placeholder="Enter your email address"
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
              placeholder="What's this about?"
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
              placeholder="Tell me about your project or inquiry..."
              rows={6}
            />
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? (
              <>
                <span>Sending...</span>
                <span>⏳</span>
              </>
            ) : (
              <>
                <span>Send Message</span>
                <span>🚀</span>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;