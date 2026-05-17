import { useState } from 'react';
import { JsonSchemaBuilder } from './components/JsonSchemaBuilder';
import { YamlSchemaBuilder } from './components/YamlSchemaBuilder';

import './index.css';

function App() {
  const [activeBuilder, setActiveBuilder] = useState<'json' | 'yaml'>('json');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Top Navigation */}
      <header style={{ 
        padding: '1rem 2rem', 
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(26, 32, 53, 0.4)',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--primary-color)' }}>⚡</span> Validador & Construtor
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
          <button 
            className={`tab ${activeBuilder === 'json' ? 'active' : ''}`}
            onClick={() => setActiveBuilder('json')}
            style={{ border: 'none', outline: 'none' }}
          >
            JSON Schema Builder
          </button>
          <button 
            className={`tab ${activeBuilder === 'yaml' ? 'active' : ''}`}
            onClick={() => setActiveBuilder('yaml')}
            style={{ border: 'none', outline: 'none' }}
          >
            YAML Event Dispatcher Builder
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeBuilder === 'json' ? <JsonSchemaBuilder /> : <YamlSchemaBuilder />}
      </div>
    </div>
  );
}

export default App;
