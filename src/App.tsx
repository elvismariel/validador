import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Settings, Plus, Trash2, CheckCircle, XCircle, Code, Play, Save } from 'lucide-react';

import type { JsonSchema, PropertyType } from './types/schema';
import { initialSchema, initialPayload } from './constants/initialData';
import { PropertyNode } from './components/PropertyNode';
import { Modal } from './components/Modal';
import { saveSchemaToGithub } from './services/githubService';
import { useSchemaValidation } from './hooks/useSchemaValidation';

import './index.css';

function App() {
  const [schema, setSchema] = useState<JsonSchema>(initialSchema);
  const [activeTab, setActiveTab] = useState<'schema' | 'payload'>('schema');
  
  // Payload Test State
  const [payloadText, setPayloadText] = useState<string>(initialPayload);

  // Schema Editor State for raw edit mode
  const [schemaText, setSchemaText] = useState<string>(JSON.stringify(initialSchema, null, 2));

  // Use Custom Hook for Validation
  const { schemaValid, payloadValid, payloadErrors } = useSchemaValidation(schemaText, payloadText);

  // Modals & Toasts State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: () => void}>({ isOpen: false, action: () => {} });
  const [tokenModal, setTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Visual Builder Handlers ---
  const handleMetaChange = (field: keyof JsonSchema, value: string | boolean) => {
    const newSchema = { ...schema, [field]: value };
    updateSchema(newSchema);
  };

  const clearSchema = () => {
    setConfirmModal({
      isOpen: true,
      action: () => {
        const emptySchema: JsonSchema = {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          title: "",
          description: "",
          additionalProperties: false,
          properties: {},
          required: []
        };
        updateSchema(emptySchema);
        setConfirmModal({ isOpen: false, action: () => {} });
      }
    });
  };

  const addProperty = () => {
    const key = `new_property_${Object.keys(schema.properties).length + 1}`;
    const newSchema = {
      ...schema,
      properties: {
        ...schema.properties,
        [key]: { type: "string" as PropertyType, description: "New property description" }
      }
    };
    updateSchema(newSchema);
  };

  const updatePropertyKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey) return;
    const newProps = { ...schema.properties };
    newProps[newKey] = newProps[oldKey];
    delete newProps[oldKey];

    // Update required array
    const newRequired = schema.required.map(k => k === oldKey ? newKey : k);
    
    updateSchema({ ...schema, properties: newProps, required: newRequired });
  };

  const deleteProperty = (key: string) => {
    const newProps = { ...schema.properties };
    delete newProps[key];
    const newRequired = schema.required.filter(k => k !== key);
    updateSchema({ ...schema, properties: newProps, required: newRequired });
  };

  const toggleRequired = (key: string) => {
    let newRequired = [...schema.required];
    if (newRequired.includes(key)) {
      newRequired = newRequired.filter(k => k !== key);
    } else {
      newRequired.push(key);
    }
    updateSchema({ ...schema, required: newRequired });
  };

  const updateSchema = (newSchema: JsonSchema) => {
    setSchema(newSchema);
    setSchemaText(JSON.stringify(newSchema, null, 2));
  };

  // --- GitHub Save Handlers ---
  const handleSaveToGithub = () => {
    if (!schema.title) {
      showToast("Para salvar, o evento deve ter um 'Title' preenchido.", "error");
      return;
    }
    const token = localStorage.getItem('gh_token');
    if (!token) {
      setTokenModal(true);
      return;
    }
    executeSave(token);
  };

  const executeSave = async (token: string) => {
    try {
      await saveSchemaToGithub(schema, token);
      showToast('Salvo no diretório public/canonical do GitHub com sucesso!', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(msg, 'error');
      if (msg.includes('Bad credentials') || msg.includes('Requires authentication')) {
        localStorage.removeItem('gh_token');
      }
    }
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('gh_token', tokenInput.trim());
      setTokenModal(false);
      executeSave(tokenInput.trim());
    } else {
      showToast('O token não pode estar vazio.', 'error');
    }
  };

  return (
    <div className="layout-container">
      {/* LEFT PANEL: VISUAL BUILDER */}
      <div className="panel-left glass-panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="panel-title">
            <Settings size={20} className="text-primary" />
            Construtor Visual (JSON Schema)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }} onClick={clearSchema}>
              <Trash2 size={16} /> Limpar Tudo
            </button>
            <button className="btn" onClick={addProperty}>
              <Plus size={16} /> Nova Propriedade
            </button>
          </div>
        </div>
        <div className="panel-content">
          
          <div className="property-card" style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Metadados do Evento</h3>
            
            <div className="input-group">
              <label htmlFor="title" className="input-label">Title (Nome do Evento)</label>
              <input 
                id="title"
                type="text" 
                className="input-field" 
                value={schema.title} 
                onChange={e => handleMetaChange('title', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="description" className="input-label">Description</label>
              <input 
                id="description"
                type="text" 
                className="input-field" 
                value={schema.description} 
                onChange={e => handleMetaChange('description', e.target.value)}
              />
            </div>
            
          </div>

          <div style={{ margin: '2rem 0 1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Propriedades do Payload</h3>
          </div>

          {Object.entries(schema.properties).map(([key, prop]) => (
            <PropertyNode
              key={key}
              propertyKey={key}
              propInfo={prop}
              isRequired={schema.required.includes(key)}
              onChangeKey={(oldKey, newKey) => updatePropertyKey(oldKey, newKey)}
              onDelete={() => deleteProperty(key)}
              onChangeInfo={(newInfo) => {
                const newProps = { ...schema.properties, [key]: newInfo };
                updateSchema({ ...schema, properties: newProps });
              }}
              onToggleRequired={() => toggleRequired(key)}
            />
          ))}

        </div>
      </div>

      {/* RIGHT PANEL: EDITOR & PAYLOAD TESTER */}
      <div className="panel-right glass-panel">
        <div className="panel-header" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'schema' ? 'active' : ''}`}
              onClick={() => setActiveTab('schema')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Code size={16} /> JSON Schema
            </div>
            <div 
              className={`tab ${activeTab === 'payload' ? 'active' : ''}`}
              onClick={() => setActiveTab('payload')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={16} /> Testar Payload
            </div>
          </div>
          <button 
            className="btn" 
            disabled={!(schemaValid && payloadValid)} 
            onClick={handleSaveToGithub}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 12px',
              opacity: (schemaValid && payloadValid) ? 1 : 0.5,
              cursor: (schemaValid && payloadValid) ? 'pointer' : 'not-allowed',
              background: (schemaValid && payloadValid) ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Save size={16} /> Salvar
          </button>
        </div>
        
        <div className="panel-content" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          
          {activeTab === 'payload' && (
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)' }}>
              <div className={`status-banner ${payloadValid ? 'status-valid' : 'status-invalid'}`}>
                {payloadValid ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {payloadErrors}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Digite um JSON de evento abaixo. O motor <b>Ajv</b> fará a validação em tempo real contra o modelo construído no painel ao lado.
              </p>
            </div>
          )}

          <div style={{ flex: 1 }}>
            {activeTab === 'schema' ? (
              <Editor
                height="100%"
                language="json"
                theme="vs-dark"
                value={schemaText}
                onChange={(val) => {
                  if (val) {
                    setSchemaText(val);
                    try {
                      const p = JSON.parse(val);
                      setSchema(p);
                    } catch (e) {
                      console.debug("Invalid JSON during typing", e);
                    }
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  formatOnPaste: true,
                  padding: { top: 16 }
                }}
              />
            ) : (
              <Editor
                height="100%"
                language="json"
                theme="vs-dark"
                value={payloadText}
                onChange={(val) => val && setPayloadText(val)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: { top: 16 }
                }}
              />
            )}
          </div>

        </div>
      </div>

      {/* --- MODALS E TOASTS --- */}
      
      {/* Modal de Confirmação (Limpar Tudo) */}
      <Modal isOpen={confirmModal.isOpen} title="Confirmar ação" onClose={() => setConfirmModal({isOpen: false, action: () => {}})}>
        <p style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Tem certeza que deseja limpar todo o modelo?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn" style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }} onClick={() => setConfirmModal({isOpen: false, action: () => {}})}>Cancelar</button>
          <button className="btn" style={{ background: '#ef4444', border: '1px solid #ef4444' }} onClick={confirmModal.action}>Sim, limpar</button>
        </div>
      </Modal>

      {/* Modal de Token */}
      <Modal isOpen={tokenModal} title="Token do GitHub" onClose={() => setTokenModal(false)}>
        <p style={{ color: 'var(--text-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Para salvar diretamente no GitHub, insira seu Personal Access Token (PAT) com permissão de escrita no repositório.
        </p>
        <input 
          type="password" 
          className="input-field" 
          value={tokenInput} 
          onChange={e => setTokenInput(e.target.value)} 
          placeholder="ghp_..."
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }} onClick={() => setTokenModal(false)}>Cancelar</button>
          <button className="btn" onClick={handleTokenSubmit}>Salvar e Continuar</button>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
