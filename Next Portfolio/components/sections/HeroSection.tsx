'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, RefreshCw, Terminal, Mail, Code, Check, ShieldAlert } from 'lucide-react';

interface TestStep {
  id: string;
  name: string;
  framework: string;
  duration: string;
  status: 'idle' | 'running' | 'pass';
}

const HeroSection = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuite, setTestSuite] = useState<TestStep[]>([
    { id: '1', name: 'Verify Auth REST APIs', framework: 'Jest / Axios', duration: '320ms', status: 'idle' },
    { id: '2', name: 'Playwright UI Smoke Test', framework: 'Playwright', duration: '740ms', status: 'idle' },
    { id: '3', name: 'Kafka Stream Event Validation', framework: 'Kafka / Redis', duration: '490ms', status: 'idle' },
    { id: '4', name: 'MongoDB Consistency Checks', framework: 'MongoDB', duration: '210ms', status: 'idle' },
  ]);
  const [logs, setLogs] = useState<string[]>(['Click "Run Diagnostics" to launch automated suites...']);

  const runAutomation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs(['$ npm run test:production-readiness', '🚀 Starting automation pipeline test hooks...', '📡 Contacting Staging/Production clusters...']);
    
    // Reset test steps
    setTestSuite(prev => prev.map(t => ({ ...t, status: 'idle' })));

    for (let i = 0; i < testSuite.length; i++) {
      const step = testSuite[i];
      
      // Mark as running
      setTestSuite(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'running' } : t));
      setLogs(prev => [...prev, `⚙️ Running: ${step.name} [${step.framework}]`]);
      
      // Simulate delay
      await new Promise(r => setTimeout(r, 600));

      // Mark as passed
      setTestSuite(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'pass' } : t));
      setLogs(prev => [
        ...prev, 
        `✅ [PASS] ${step.name} (${step.duration})`
      ]);
    }

    await new Promise(r => setTimeout(r, 300));
    setLogs(prev => [
      ...prev,
      '==========================================',
      'RESULTS: 4 suites passed, 12 assertions verified.',
      'System Integrity: 100% stable. 🟢',
      'STATUS: READY FOR PRODUCTION DEPLOY'
    ]);
    setIsRunning(false);
  };

  // Run automatically on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      runAutomation();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="home" style={{ overflow: 'hidden' }}>
      <div className="container hero-wrapper">
        
        {/* Hero Left: Information */}
        <div className="hero-info">
          <div className="section-badge">
            <Terminal size={12} style={{ marginRight: '0.25rem' }} />
            <span>QUALITY ENGINEERING ONLINE</span>
          </div>
          
          <h1>
            Rajat Kumar Pradhan <br />
            <span className="gradient-text">QE Automation Expert</span>
          </h1>
          
          <p className="hero-subtitle">
            Senior Software Development Engineer in Test (SDET) and QE Manager. I design high-velocity, scalable UI/API test frameworks and validate distributed event systems (Kafka, Redis, MongoDB).
          </p>
          
          <div className="hero-actions">
            <Link href="#contact" className="btn btn-primary">
              <Mail size={16} />
              <span>Let's Connect</span>
            </Link>
            <Link href="#projects" className="btn btn-secondary">
              <Code size={16} />
              <span>Explore Projects</span>
            </Link>
          </div>
          
          <div className="hero-metrics">
            <div className="hero-metric-item">
              <span className="hero-metric-num">5+</span>
              <span className="hero-metric-label">Years Exp</span>
            </div>
            <div className="hero-metric-item">
              <span className="hero-metric-num">4+</span>
              <span className="hero-metric-label">Frameworks</span>
            </div>
            <div className="hero-metric-item">
              <span className="hero-metric-num">10k+</span>
              <span className="hero-metric-label">Tests Written</span>
            </div>
          </div>
        </div>

        {/* Hero Right: Live Interactive Console */}
        <div className="hero-console-container">
          <div className="hero-console">
            <div className="console-header">
              <div className="console-dots">
                <span className="console-dot red"></span>
                <span className="console-dot yellow"></span>
                <span className="console-dot green"></span>
              </div>
              <div className="console-title">rajat-test-runner.js</div>
              <button 
                onClick={runAutomation} 
                disabled={isRunning}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-console)',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '0.25rem',
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                {isRunning ? (
                  <RefreshCw className="spin" size={10} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Play size={10} />
                )}
                <span>{isRunning ? 'Running...' : 'Run Diagnostics'}</span>
              </button>
            </div>
            
            <div className="console-body">
              {/* Dynamic steps grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {testSuite.map((step) => (
                  <div 
                    key={step.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '0.35rem',
                      borderLeft: `3px solid ${
                        step.status === 'pass' ? 'var(--success)' : 
                        step.status === 'running' ? 'var(--warning)' : 
                        'var(--text-muted)'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '0.2rem',
                        background: 
                          step.status === 'pass' ? 'rgba(16, 185, 129, 0.15)' :
                          step.status === 'running' ? 'rgba(245, 158, 11, 0.15)' :
                          'var(--bg-console-item)',
                        color:
                          step.status === 'pass' ? 'var(--success)' :
                          step.status === 'running' ? 'var(--warning)' :
                          'var(--text-secondary)'
                      }}>
                        {step.status.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: '500' }}>{step.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      {step.status === 'pass' ? step.duration : step.status === 'running' ? '⏳ runs' : 'idle'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Logs display */}
              <div 
                style={{ 
                  flex: 1, 
                  background: 'var(--bg-console-item)', 
                  border: '1px solid var(--border-console)',
                  borderRadius: '0.5rem', 
                  padding: '0.75rem',
                  fontSize: '0.7rem',
                  overflowY: 'auto',
                  fontFamily: 'JetBrains Mono, monospace',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                {logs.map((log, idx) => {
                  let logClass = 'log-info';
                  if (log.startsWith('✅')) logClass = 'log-pass';
                  else if (log.startsWith('================')) logClass = 'log-muted';
                  else if (log.startsWith('RESULTS:') || log.startsWith('STATUS:')) logClass = 'log-success';
                  else if (log.startsWith('$')) logClass = 'log-cmd';
                  
                  return (
                    <div key={idx} className={logClass}>
                      {log}
                    </div>
                  );
                })}
                {isRunning && <span className="terminal-cursor" style={{ background: 'var(--text-console)' }}></span>}
              </div>
            </div>
          </div>
        </div>

      </div>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;