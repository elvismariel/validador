import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Settings, Code, Trash2 } from 'lucide-react';
import YAML from 'yaml';
import { Modal } from './Modal';
import { ProcessorEditor } from './ProcessorEditor';
import type { AnyProcessor, ProcessorType } from '../types/processors';

// --- Types ---
type AdapterType = 'http' | 'queue';

interface YamlFormData {
  name: string;
  description: string;
  namespace: string;
  tags: {
    application_service: string;
    order_required: boolean;
    owner_squad: string;
    business_capability: string;
    business_service: string;
    owner_sre: string;
  };
  adapterType: AdapterType;
  http: {
    url: string;
    path: string;
    headers: string; // JSON string format
    allowed_status: string; // comma separated
    verb: string;
  };
  queue: {
    name: string;
    url: string;
    region: string;
    endpoints: string;
  };
  processors: AnyProcessor[];
}

const initialFormData: YamlFormData = {
  name: "event-dispatcher-service-example",
  description: "Example event dispatcher configuration",
  namespace: "registry.example.namespace.changed",
  tags: {
    application_service: "example-service",
    order_required: false,
    owner_squad: "squad-name",
    business_capability: "registry",
    business_service: "example-management",
    owner_sre: "sre-team"
  },
  adapterType: 'http',
  http: {
    url: "https://example.com",
    path: "/event",
    headers: '{\n  "content-type": "application/json",\n  "accept": "application/json"\n}',
    allowed_status: "200, 202, 204",
    verb: "PUT"
  },
  queue: {
    name: "example-queue-name",
    url: "https://sqs.us-east-1.amazonaws.com/123/example",
    region: "us-east-1",
    endpoints: "https://vpce-sqs.us-east-1.vpce.amazonaws.com"
  },
  processors: []
};

export function YamlSchemaBuilder() {
  const [formData, setFormData] = useState<YamlFormData>(initialFormData);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: () => void}>({ isOpen: false, action: () => {} });

  // Drag and Drop State
  const [draggableId, setDraggableId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setFormData(prev => {
      const newProcessors = [...prev.processors];
      const draggedItem = newProcessors[draggedIndex];
      newProcessors.splice(draggedIndex, 1);
      newProcessors.splice(dropIndex, 0, draggedItem);
      
      const updatedProcessors = newProcessors.map((p, idx) => ({ ...p, order: idx }));
      
      return { ...prev, processors: updatedProcessors };
    });
    setDraggedIndex(null);
    setDraggableId(null);
  };

  const clearForm = () => {
    setConfirmModal({
      isOpen: true,
      action: () => {
        setFormData({
          name: "",
          description: "",
          namespace: "",
          tags: {
            application_service: "",
            order_required: false,
            owner_squad: "",
            business_capability: "",
            business_service: "",
            owner_sre: ""
          },
          adapterType: 'http',
          http: { url: "", path: "", headers: "", allowed_status: "", verb: "" },
          queue: { name: "", url: "", region: "", endpoints: "" },
          processors: []
        });
        setConfirmModal({ isOpen: false, action: () => {} });
      }
    });
  };

  // Generate YAML using useMemo instead of useEffect + state
  const yamlText = useMemo(() => {
    const stream = formData.namespace.split('.')[0] || 'unknown';

    const adapterBlock: Record<string, unknown> = { type: formData.adapterType };

    if (formData.adapterType === 'http') {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(formData.http.headers || '{}');
      } catch {
        // invalid json, ignore headers parse
      }

      const parsedStatus = formData.http.allowed_status
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      adapterBlock.http = {
        url: formData.http.url,
        path: formData.http.path,
        headers: parsedHeaders,
        allowed_status: parsedStatus,
        verb: formData.http.verb
      };
    } else {
      adapterBlock.queue = {
        name: formData.queue.name,
        url: formData.queue.url,
        aws: {
          region: formData.queue.region,
          endpoints: {
            sqs: formData.queue.endpoints
          }
        },
        msg: { max: 10 },
        visibility: { time: 30 },
        send: { delay_seconds: 10 },
        pool: { size: 32 }
      };
    }

    let processorBlock: Record<string, unknown> | undefined = undefined;
    if (formData.processors.length > 0) {
      const pBlock: Record<string, unknown> = {};
      formData.processors.forEach(proc => {
        switch (proc.type) {
          case 'filter_version':
            pBlock.filter_version = {
              order: proc.order,
              mode: proc.mode,
              versions: proc.versions.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            };
            break;
          case 'filter_attribute':
            pBlock.filter_attribute = {
              order: proc.order,
              mode: proc.mode,
              operation: proc.operation,
              rules: proc.rules
            };
            break;
          case 'addtag': {
            const tagsObj: Record<string, string> = {};
            proc.tags.forEach(t => { if (t.key) tagsObj[t.key] = t.value; });
            pBlock.addtag = {
              order: proc.order,
              tags: tagsObj
            };
            break;
          }
          case 'replace':
            pBlock.replace = {
              order: proc.order,
              force_marshal: proc.force_marshal,
              targets: proc.targets
            };
            break;
          case 'regexreplace':
            pBlock.regexreplace = {
              order: proc.order,
              force_marshal: proc.force_marshal,
              targets: proc.targets
            };
            break;
          case 'transform': {
            const templateStr = proc.templates.endsWith('\n') ? proc.templates : proc.templates + '\n';
            const templateScalar = new YAML.Scalar(templateStr);
            templateScalar.type = 'BLOCK_LITERAL';
            pBlock.transform = {
              order: proc.order,
              'content-type': proc.contentType,
              'accept-unknown-namespace': proc.acceptUnknownNamespace,
              templates: {
                default: templateScalar
              }
            };
            break;
          }
        }
      });
      processorBlock = pBlock;
    }

    const docObj = {
      name: formData.name,
      description: formData.description,
      tags: {
        application_service: formData.tags.application_service,
        order_required: formData.tags.order_required,
        owner_squad: formData.tags.owner_squad,
        business_capability: formData.tags.business_capability,
        business_service: formData.tags.business_service,
        owner_sre: formData.tags.owner_sre
      },
      envs: {
        hom: {
          log: { level: 'info' },
          http: { host: '0.0.0.0', port: 8080 },
          Metric: { ListenAddr: '0.0.0.0:9090' },
          adapter: adapterBlock,
          broker: {
            nats: {
              name: 'cluster-nats',
              urls: ['nats://nats-server-c2.hom.eventcloud.gondor.infra:4223']
            }
          },
          ...(processorBlock ? { processor: processorBlock } : {}),
          consumer: {
            name: formData.name,
            namespace: formData.namespace,
            stream: stream,
            channel: false,
            delivery: { policy: 'last' },
            pool: { size: 8 },
            max: { poll: { message: formData.adapterType === 'queue' ? 1000 : 1 } },
            ack_wait: '45s',
            max_waiting: 10000,
            max_ack_pending: 10000,
            max_batch: 10000,
            max_bytes: 10240000
          }
        }
      }
    };

    return YAML.stringify(docObj);
  }, [formData]);

  const updateField = (fieldPath: string, value: unknown) => {
    setFormData(prev => {
      const keys = fieldPath.split('.');
      const updated = { ...prev } as Record<string, unknown>;
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...(current[key] as Record<string, unknown>) };
        current = current[key] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      return updated as unknown as YamlFormData;
    });
  };

  const addProcessor = (type: ProcessorType) => {
    const newOrder = formData.processors.length;
    const id = Date.now().toString();
    
    let newProc: AnyProcessor;
    switch (type) {
      case 'filter_version':
        newProc = { id, type, order: newOrder, mode: 'reject', versions: '' };
        break;
      case 'filter_attribute':
        newProc = { id, type, order: newOrder, mode: 'reject', operation: 'or', rules: [] };
        break;
      case 'addtag':
        newProc = { id, type, order: newOrder, tags: [] };
        break;
      case 'replace':
        newProc = { id, type, order: newOrder, force_marshal: true, targets: [] };
        break;
      case 'regexreplace':
        newProc = { id, type, order: newOrder, force_marshal: true, targets: [] };
        break;
      case 'transform':
        newProc = { id, type, order: newOrder, contentType: 'application/json', acceptUnknownNamespace: false, templates: '{\n  "user_id": "{{ .user_id }}"\n}' };
        break;
    }
    
    setFormData(prev => ({ ...prev, processors: [...prev.processors, newProc] }));
  };

  const updateProcessor = (index: number, newProc: AnyProcessor) => {
    setFormData(prev => {
      const newProcessors = [...prev.processors];
      newProcessors[index] = newProc;
      return { ...prev, processors: newProcessors };
    });
  };

  const removeProcessor = (index: number) => {
    setFormData(prev => {
      const newProcessors = [...prev.processors];
      newProcessors.splice(index, 1);
      const updatedProcessors = newProcessors.map((p, idx) => ({ ...p, order: idx }));
      return { ...prev, processors: updatedProcessors };
    });
  };

  return (
    <div className="layout-container">
      {/* LEFT PANEL: VISUAL BUILDER */}
      <div className="panel-left glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Settings size={20} className="text-primary" />
            Construtor Visual (YAML)
          </div>
          <button className="btn" style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }} onClick={clearForm}>
            <Trash2 size={16} /> Limpar
          </button>
        </div>
        
        <div className="panel-content">
          <div className="property-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Informações Básicas</h3>
            <div className="input-group">
              <label className="input-label">Name</label>
              <input type="text" className="input-field" value={formData.name} onChange={e => updateField('name', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <input type="text" className="input-field" value={formData.description} onChange={e => updateField('description', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Consumer Namespace</label>
              <input type="text" className="input-field" value={formData.namespace} onChange={e => updateField('namespace', e.target.value)} placeholder="ex: registry.single-registry.event" />
            </div>
          </div>

          <div className="property-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Tags</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Application Service</label>
                <input type="text" className="input-field" value={formData.tags.application_service} onChange={e => updateField('tags.application_service', e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Owner Squad</label>
                <input type="text" className="input-field" value={formData.tags.owner_squad} onChange={e => updateField('tags.owner_squad', e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Business Capability</label>
                <input type="text" className="input-field" value={formData.tags.business_capability} onChange={e => updateField('tags.business_capability', e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Business Service</label>
                <input type="text" className="input-field" value={formData.tags.business_service} onChange={e => updateField('tags.business_service', e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Owner SRE</label>
                <input type="text" className="input-field" value={formData.tags.owner_sre} onChange={e => updateField('tags.owner_sre', e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ marginBottom: '8px' }}>Order Required?</label>
                <select className="input-field" value={formData.tags.order_required ? 'true' : 'false'} onChange={e => updateField('tags.order_required', e.target.value === 'true')}>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </div>
          </div>

          <div className="property-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Adapter</h3>
            <div className="input-group">
              <label htmlFor="adapterType" className="input-label">Adapter Type</label>
              <select id="adapterType" className="input-field" value={formData.adapterType} onChange={e => updateField('adapterType', e.target.value)}>
                <option value="http">HTTP</option>
                <option value="queue">Queue (SQS)</option>
              </select>
            </div>

            {formData.adapterType === 'http' && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="input-group">
                  <label className="input-label">URL</label>
                  <input type="text" className="input-field" value={formData.http.url} onChange={e => updateField('http.url', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Path</label>
                  <input type="text" className="input-field" value={formData.http.path} onChange={e => updateField('http.path', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Verb</label>
                  <select className="input-field" value={formData.http.verb} onChange={e => updateField('http.verb', e.target.value)}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Allowed Status (comma separated)</label>
                  <input type="text" className="input-field" value={formData.http.allowed_status} onChange={e => updateField('http.allowed_status', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Headers (JSON Object format)</label>
                  <textarea 
                    className="input-field" 
                    rows={4} 
                    value={formData.http.headers} 
                    onChange={e => updateField('http.headers', e.target.value)} 
                    style={{ resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            )}

            {formData.adapterType === 'queue' && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="input-group">
                  <label className="input-label">Queue Name</label>
                  <input type="text" className="input-field" value={formData.queue.name} onChange={e => updateField('queue.name', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Queue URL</label>
                  <input type="text" className="input-field" value={formData.queue.url} onChange={e => updateField('queue.url', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">AWS Region</label>
                  <input type="text" className="input-field" value={formData.queue.region} onChange={e => updateField('queue.region', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">SQS Endpoint</label>
                  <input type="text" className="input-field" value={formData.queue.endpoints} onChange={e => updateField('queue.endpoints', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="property-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Processors</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  aria-label="Add Processor"
                  className="input-field" 
                  style={{ padding: '4px 8px', width: 'auto' }}
                  onChange={e => {
                    if (e.target.value) {
                      addProcessor(e.target.value as ProcessorType);
                      e.target.value = ''; // reset
                    }
                  }}
                >
                  <option value="">+ Add Processor</option>
                  <option value="filter_version">filter_version</option>
                  <option value="filter_attribute">filter_attribute</option>
                  <option value="addtag">addtag</option>
                  <option value="replace">replace</option>
                  <option value="regexreplace">regexreplace</option>
                  <option value="transform">transform</option>
                </select>
              </div>
            </div>

            {formData.processors.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum processador adicionado.</p>
            )}

            {formData.processors.map((proc, index) => (
              <div 
                key={proc.id}
                draggable={draggableId === proc.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => { setDraggedIndex(null); setDraggableId(null); }}
                style={{
                  opacity: draggedIndex === index ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <ProcessorEditor 
                  processor={proc} 
                  update={(newProc) => updateProcessor(index, newProc)} 
                  remove={() => removeProcessor(index)} 
                  setDraggable={(id) => setDraggableId(id)}
                />
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* RIGHT PANEL: EDITOR */}
      <div className="panel-right glass-panel">
        <div className="panel-header">
          <div className="tabs">
            <div className="tab active" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code size={16} /> Generated YAML
            </div>
          </div>
        </div>
        
        <div className="panel-content" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language="yaml"
              theme="vs-dark"
              value={yamlText}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 16 }
              }}
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Modal isOpen={confirmModal.isOpen} title="Confirmar ação" onClose={() => setConfirmModal({isOpen: false, action: () => {}})}>
        <p style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Tem certeza que deseja limpar todo o formulário?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn" style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }} onClick={() => setConfirmModal({isOpen: false, action: () => {}})}>Cancelar</button>
          <button className="btn" style={{ background: '#ef4444', border: '1px solid #ef4444' }} onClick={confirmModal.action}>Sim, limpar</button>
        </div>
      </Modal>

    </div>
  );
}
