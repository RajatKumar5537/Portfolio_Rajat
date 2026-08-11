'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Terminal, ShieldAlert, Cpu, Database, RefreshCw, Layers } from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  logs: string[];
}

const AutomationSandbox = () => {
  const [activeScenarioId, setActiveScenarioId] = useState('e2e');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['Select a scenario and click "Trigger Pipeline" to execute diagnostics...']);
  const [status, setStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const consoleBodyRef = useRef<HTMLDivElement>(null);

  const scenarios: Scenario[] = [
    {
      id: 'e2e',
      title: 'E2E Cart Flow',
      desc: 'Playwright UI smoke test asserting product addition and checkout flow.',
      icon: <Layers size={18} />,
      logs: [
        '[INFO] Starting test execution hook: playwright test',
        '[INFO] Spin-up chromium context... SUCCESS',
        '[TEST] Spec file loaded: client-checkout-flow.spec.ts',
        '[STEP] Navigate: https://staging.meteorblast.io/',
        '[STEP] Login visitor account: test.user@meteorblast.io',
        '[PASS] Response token successfully saved to local storage.',
        '[STEP] Adding item: "Meteor Pro Skin Pack" to shopping cart',
        '[STEP] Assertion: Cart element badge should match count "1"',
        '[PASS] Element locator ".cart-count" matches text content "1" (84ms)',
        '[STEP] Process checkout request and handle webhook responses',
        '[PASS] Server status: 201 Created. Order registered: #MB-9941',
        '[INFO] Playwright browser instance teardown completed.',
        '[SUCCESS] E2E checkout test run finished. Assertions: 4/4 passed.'
      ]
    },
    {
      id: 'api',
      title: 'API Gateway Load',
      desc: 'Axios and Jest framework validating gateway endpoint responses.',
      icon: <Cpu size={18} />,
      logs: [
        '[INFO] Starting test execution hook: jest api-load.test.ts',
        '[INFO] Resolving endpoint gateway configurations...',
        '[STEP] GET /api/v1/auth/session - validating token handshakes',
        '[PASS] API response status 200 OK. Handshake complete (140ms)',
        '[STEP] POST /api/v1/checkout/intent - mock payment gateway load',
        '[PASS] API response status 201 Created. Intent generated (230ms)',
        '[STEP] GET /api/v1/inventory/status - database check latency',
        '[PASS] API response status 200 OK. Query matched (90ms)',
        '[SUCCESS] Jest API verification complete. Gateway responsive.'
      ]
    },
    {
      id: 'db',
      title: 'DB State Validation',
      desc: 'Verifying queue offsets and cache sync status across Kafka and Redis.',
      icon: <Database size={18} />,
      logs: [
        '[INFO] Starting test execution hook: node db-verify.js',
        '[STEP] Connecting to Redis caching store...',
        '[PASS] Redis connection active. PING -> PONG resolved (12ms)',
        '[STEP] Asserting cache key invalidation lifecycle (5000ms TTL)',
        '[PASS] Key successfully purged on expiration trigger.',
        '[STEP] Connecting to Kafka message queue clusters...',
        '[PASS] Kafka brokers online. Consumer group partition active.',
        '[STEP] Validate consumer queue offsets matching producer sync states',
        '[PASS] Offset partition 0 matched target write index: 149491',
        '[SUCCESS] Kafka to DB synchronization pipeline checks complete. All states match.'
      ]
    }
  ];

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  // Auto-scroll logs container to bottom only when pipeline is running
  useEffect(() => {
    if (consoleBodyRef.current && isRunning) {
      consoleBodyRef.current.scrollTo({
        top: consoleBodyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [consoleLogs, isRunning]);

  const triggerPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatus('running');
    setConsoleLogs(['$ sh deploy-diagnostics-hooks.sh', '🛠️ Bootstrapping Docker network bridges...', '🔌 Connecting to test databases...']);

    const targetLogs = activeScenario.logs;
    
    // Output logs one by one with a simulated delay
    for (let i = 0; i < targetLogs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 450));
      setConsoleLogs(prev => [...prev, targetLogs[i]]);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    setConsoleLogs(prev => [
      ...prev,
      '==================================================',
      '🟢 STAGING DEPLOYMENT STATUS: ALL TESTS PASSED.',
      'Deployment pipeline release candidate greenlighted. 🚀'
    ]);
    setStatus('success');
    setIsRunning(false);
  };

  const handleScenarioChange = (id: string) => {
    if (isRunning) return;
    setActiveScenarioId(id);
    setStatus('idle');
    setConsoleLogs([`Switched to scenario: ${id.toUpperCase()}`, `Ready to trigger simulation...`]);
  };

  return (
    <section id="sandbox" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-badge">
            <Terminal size={12} style={{ marginRight: '0.25rem' }} />
            <span>Interactive Demo</span>
          </div>
          <h2 className="section-title">Automation Sandbox</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Run simulated QE frameworks directly in the browser. Select a test suite below and launch the verification sequence.
          </p>
        </div>

        {/* Sandbox Content Layout */}
        <div className="sandbox-wrapper">
          
          {/* Controls Column */}
          <div className="glass-card sandbox-control-card neon-indigo">
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Select Test Target</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Choose which section of Rajat's framework to test.
              </p>
              
              <div className="sandbox-scenarios">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => handleScenarioChange(scenario.id)}
                    className={`sandbox-btn-scenario ${activeScenarioId === scenario.id ? 'active' : ''}`}
                    disabled={isRunning}
                  >
                    <div className="sandbox-scenario-title">
                      <span>{scenario.title}</span>
                      <span style={{ color: activeScenarioId === scenario.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {scenario.icon}
                      </span>
                    </div>
                    <div className="sandbox-scenario-desc">{scenario.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={triggerPipeline}
              disabled={isRunning}
              className="sandbox-run-btn"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Pipeline Executing...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Trigger Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* Terminal Console Column */}
          <div className="glass-card sandbox-console-card">
            <div className="sandbox-console-header">
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span className="console-dot red" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></span>
                <span className="console-dot yellow" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></span>
                <span className="console-dot green" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></span>
              </div>
              <div className="console-title" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                pipeline-runner --scenario={activeScenarioId}
              </div>
              <div className="sandbox-status">
                <span className={`sandbox-status-dot ${status === 'success' ? 'active' : status === 'running' ? 'running' : ''}`}></span>
                <span style={{ fontSize: '0.7rem' }}>
                  {status === 'idle' && 'READY'}
                  {status === 'running' && 'RUNNING'}
                  {status === 'success' && 'SUCCESS'}
                </span>
              </div>
            </div>

            <div className="sandbox-console-body" ref={consoleBodyRef}>
              {consoleLogs.map((log, idx) => {
                let logClass = 'log-muted';
                if (log.startsWith('[PASS]') || log.startsWith('🟢')) {
                  logClass = 'log-pass';
                } else if (log.startsWith('[INFO]')) {
                  logClass = 'log-info';
                } else if (log.startsWith('[STEP]')) {
                  logClass = 'log-step';
                } else if (log.startsWith('[SUCCESS]') || log.startsWith('Deployment') || log.startsWith('🟢 STAGING')) {
                  logClass = 'log-success';
                } else if (log.startsWith('$')) {
                  logClass = 'log-cmd';
                }
                
                return (
                  <div key={idx} className={logClass}>
                    {log}
                  </div>
                );
              })}
              {isRunning && (
                <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', color: 'var(--primary)' }}>
                  <span>⏳ Executing task assertions</span>
                  <span className="terminal-cursor" style={{ background: 'var(--text-console)' }}></span>
                </div>
              )}
            </div>
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

export default AutomationSandbox;
