'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      
      const sections = ['home', 'about', 'skills', 'sandbox', 'experience', 'projects', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust threshold to pick active section based on proximity to top of screen
          return rect.top <= 150 && rect.bottom >= 150;
        }
        return false;
      });
      
      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial call to set active section on mount/refresh
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#skills', label: 'Skills' },
    { href: '#sandbox', label: 'Sandbox' },
    { href: '#experience', label: 'Experience' },
    { href: '#projects', label: 'Projects' },
    { href: '#contact', label: 'Contact' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={isScrolled ? 'scrolled' : ''}>
      <div className="nav-container">
        <Link href="#home" className="nav-logo">
          <Terminal size={18} style={{ color: 'var(--primary)' }} />
          <span>RAJAT<span style={{ color: 'var(--text-secondary)' }}>.QE</span></span>
        </Link>
        
        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href} 
                className={activeSection === item.href.slice(1) ? 'active' : ''}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Online status indicator */}
          <div className="status-badge" style={{ padding: '0.25rem 0.6rem', border: '1px solid rgba(16, 185, 129, 0.15)', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '99px', fontSize: '0.65rem', color: 'var(--success)', fontWeight: '600' }}>
            <span className="status-dot"></span>
            <span>STAGING ONLINE</span>
          </div>
          
          <ThemeToggle />

          <button 
            className="nav-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            style={{ padding: '0.25rem' }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;