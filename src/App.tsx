import React, { useState, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Settings, Plus, Trash2, CheckCircle, XCircle, Code, Play, Save } from 'lucide-react';
import './index.css';

// Initialize AJV
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Types
type PropertyType = 'string' | 'integer' | 'number' | 'object' | 'array' | 'boolean';

interface SchemaProperty {
  type: PropertyType;
  description?: string;
  enum?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  format?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

interface JsonSchema {
  $schema: string;
  type: string;
  title: string;
  description: string;
  additionalProperties: boolean;
  properties: Record<string, SchemaProperty>;
  required: string[];
}

// Initial State exactly as the image from C6 Bank
const initialSchema: JsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  title: "corporate-services.c6availability-service.product-status.changed",
  description: "This event reports a product status change indicating whether it is available or not",
  additionalProperties: false,
  properties: {
    "product_id": { type: "integer", description: "Product identification" },
    "product_name": { type: "string", description: "Product name" },
    "allowed_volume": { type: "integer", description: "Percentage of volume allowed for the product" },
    "status": { type: "string", enum: ["AVAILABLE", "UNAVAILABLE"], description: "Product status" },
    "switch": { type: "string", enum: ["PRODUCT", "CHANNEL", "GENERAL"], description: "Scope of unavailability" },
    "title": { type: "string", description: "Title shown on the unavailability screen" },
    "message": { type: "string", description: "Message shown on the unavailability screen" },
    "tapume_up_time": { type: "string", description: "When the siding went up" },
    "tapume_down_time": { type: "string", description: "When the siding was removed" },
    "devices_attempted": { type: "integer", description: "Number of devices attempted" }
  },
  required: ["product_id", "product_name", "allowed_volume", "status", "switch"]
};

const initialPayload = JSON.stringify({
  product_id: 12345,
  product_name: "Cartão de Crédito",
  allowed_volume: 100,
  status: "UNAVAILABLE",
  switch: "CHANNEL"
}, null, 2);

interface PropertyNodeProps {
  propertyKey: string;
  propInfo: SchemaProperty;
  isRequired: boolean;
  onChangeKey: (oldKey: string, newKey: string) => void;
  onDelete: () => void;
  onChangeInfo: (newInfo: SchemaProperty) => void;
  onToggleRequired: () => void;
}

const PropertyNode: React.FC<PropertyNodeProps> = ({
  propertyKey, propInfo, isRequired, onChangeKey, onDelete, onChangeInfo, onToggleRequired
}) => {
  const updateField = (field: keyof SchemaProperty, value: any) => {
    let newInfo = { ...propInfo, [field]: value };
    
    if (field === 'enum') {
      const enumVals = value.split(',').map((v: string) => v.trim()).filter(Boolean);
      if (enumVals.length > 0) {
        newInfo.enum = enumVals;
      } else {
        delete newInfo.enum;
      }
    }
    
    if (field === 'minLength' || field === 'maxLength') {
      if (value === '' || isNaN(Number(value))) {
        delete newInfo[field];
      } else {
        newInfo[field] = Number(value);
      }
    }

    if (field === 'pattern' || field === 'format') {
      if (!value) {
        delete newInfo[field];
      }
    }

    if (field === 'type') {
      if (value === 'object') {
        newInfo.properties = newInfo.properties || {};
        newInfo.required = newInfo.required || [];
        newInfo.additionalProperties = false;
      } else {
        delete newInfo.properties;
        delete newInfo.required;
        delete newInfo.additionalProperties;
      }
      if (value !== 'string') {
        delete newInfo.enum;
        delete newInfo.pattern;
        delete newInfo.minLength;
        delete newInfo.maxLength;
        delete newInfo.format;
      }
    }
    
    onChangeInfo(newInfo);
  };

  const updateChildKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey) return;
    const newProps = { ...(propInfo.properties || {}) };
    newProps[newKey] = newProps[oldKey];
    delete newProps[oldKey];
    const newReq = (propInfo.required || []).map(k => k === oldKey ? newKey : k);
    onChangeInfo({ ...propInfo, properties: newProps, required: newReq });
  };

  const updateChildInfo = (childKey: string, newChildInfo: SchemaProperty) => {
    onChangeInfo({
      ...propInfo,
      properties: {
        ...(propInfo.properties || {}),
        [childKey]: newChildInfo
      }
    });
  };

  const deleteChild = (childKey: string) => {
    const newProps = { ...(propInfo.properties || {}) };
    delete newProps[childKey];
    const newReq = (propInfo.required || []).filter(k => k !== childKey);
    onChangeInfo({ ...propInfo, properties: newProps, required: newReq });
  };

  const toggleChildRequired = (childKey: string) => {
    let newReq = [...(propInfo.required || [])];
    if (newReq.includes(childKey)) {
      newReq = newReq.filter(k => k !== childKey);
    } else {
      newReq.push(childKey);
    }
    onChangeInfo({ ...propInfo, required: newReq });
  };

  const addChildProperty = () => {
    const key = `new_property_${Object.keys(propInfo.properties || {}).length + 1}`;
    onChangeInfo({
      ...propInfo,
      properties: {
        ...(propInfo.properties || {}),
        [key]: { type: "string" as PropertyType, description: "New property description" }
      }
    });
  };

  return (
    <div className="property-card flex flex-col gap-3" style={{ background: 'rgba(0,0,0,0.15)' }}>
      <div className="property-header">
        <input 
          type="text" 
          className="input-field" 
          style={{ width: '40%', fontSize: '1rem', fontWeight: 'bold', background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', padding: '5px' }}
          onBlur={e => onChangeKey(propertyKey, e.target.value)}
          defaultValue={propertyKey}
        />
        <button className="btn-secondary" style={{ padding: '4px 8px', borderColor: 'transparent' }} onClick={onDelete}>
          <Trash2 size={16} color="#ef4444" />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Tipo</label>
          <select 
            className="input-field" 
            value={propInfo.type} 
            onChange={e => updateField('type', e.target.value as PropertyType)}
          >
            <option value="string">String</option>
            <option value="integer">Integer</option>
            <option value="number">Number (Float)</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
        </div>
        
        <div className="input-group" style={{ flex: 2 }}>
          <label className="input-label">Descrição</label>
          <input 
            type="text" 
            className="input-field" 
            value={propInfo.description || ''} 
            onChange={e => updateField('description', e.target.value)}
          />
        </div>
      </div>

      {propInfo.type === 'string' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="input-group">
            <label className="input-label">Formato Especial</label>
            <select
              className="input-field"
              value={propInfo.format || ''}
              onChange={e => updateField('format', e.target.value)}
            >
              <option value="">Texto Livre</option>
              <option value="date-time">Data e Hora (date-time ISO 8601)</option>
              <option value="date">Data (date)</option>
              <option value="time">Hora (time)</option>
              <option value="email">Email</option>
              <option value="uuid">UUID</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Valores Permitidos (Enum, separados por vírgula)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ex: PRODUCT, CHANNEL, GENERAL"
              value={propInfo.enum ? propInfo.enum.join(', ') : ''} 
              onChange={e => updateField('enum', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="input-group" style={{ flex: 2 }}>
              <label className="input-label">Pattern (Regex)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: ^[0-9]{11}$"
                value={propInfo.pattern || ''} 
                onChange={e => updateField('pattern', e.target.value)}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Min Length</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Ex: 11"
                value={propInfo.minLength !== undefined ? propInfo.minLength : ''} 
                onChange={e => updateField('minLength', e.target.value)}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Max Length</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Ex: 11"
                value={propInfo.maxLength !== undefined ? propInfo.maxLength : ''} 
                onChange={e => updateField('maxLength', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '0.5rem' }}>
        <label className="checkbox-wrapper">
          <input 
            type="checkbox" 
            checked={isRequired}
            onChange={onToggleRequired}
          />
          <span className="input-label">Campo Obrigatório (Required)</span>
        </label>
      </div>

      {propInfo.type === 'object' && (
        <div style={{ paddingLeft: '1rem', borderLeft: '2px solid rgba(255,255,255,0.1)', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Atributos Internos</h4>
            <button className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={addChildProperty}>
              <Plus size={14} /> Novo Atributo
            </button>
          </div>
          {Object.entries(propInfo.properties || {}).map(([childKey, childProp]) => (
            <PropertyNode
              key={childKey}
              propertyKey={childKey}
              propInfo={childProp}
              isRequired={(propInfo.required || []).includes(childKey)}
              onChangeKey={(o, n) => updateChildKey(o, n)}
              onDelete={() => deleteChild(childKey)}
              onChangeInfo={(newChildInfo) => updateChildInfo(childKey, newChildInfo)}
              onToggleRequired={() => toggleChildRequired(childKey)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [schema, setSchema] = useState<JsonSchema>(initialSchema);
  const [activeTab, setActiveTab] = useState<'schema' | 'payload'>('schema');
  
  // Payload Test State
  const [payloadText, setPayloadText] = useState<string>(initialPayload);
  const [payloadValid, setPayloadValid] = useState<boolean>(true);
  const [payloadErrors, setPayloadErrors] = useState<string>('');

  // Schema Editor State for raw edit mode
  const [schemaText, setSchemaText] = useState<string>(JSON.stringify(initialSchema, null, 2));
  const [schemaValid, setSchemaValid] = useState<boolean>(true);

  // --- Visual Builder Handlers ---
  const handleMetaChange = (field: keyof JsonSchema, value: string | boolean) => {
    const newSchema = { ...schema, [field]: value };
    updateSchema(newSchema);
  };

  const clearSchema = () => {
    if (window.confirm("Tem certeza que deseja limpar todo o modelo?")) {
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
    }
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


  // --- Validation Logic ---
  const validateSchemaObjectRule = (schemaObj: any): string | null => {
    let error: string | null = null;
    const checkObject = (obj: any, path: string) => {
      if (obj && obj.type === 'object') {
        if (!obj.required || obj.required.length === 0) {
          error = `Regra de Schema Inválida: O objeto '${path || 'root'}' DEVE possuir ao menos uma propriedade marcada como obrigatória (required).`;
          return;
        }
        if (obj.properties) {
          for (const key in obj.properties) {
            checkObject(obj.properties[key], path ? `${path}.${key}` : key);
            if (error) return;
          }
        }
      }
    };
    checkObject(schemaObj, '');
    return error;
  };

  const validatePayload = useMemo(() => {
    return (schemaObj: JsonSchema, payloadStr: string) => {
      const schemaRuleError = validateSchemaObjectRule(schemaObj);
      if (schemaRuleError) {
        setPayloadValid(false);
        setPayloadErrors(schemaRuleError);
        return;
      }

      try {
        const data = JSON.parse(payloadStr);
        // Compile schema
        const validate = ajv.compile(schemaObj);
        const valid = validate(data);
        
        if (valid) {
          setPayloadValid(true);
          setPayloadErrors('Payload válido!');
        } else {
          setPayloadValid(false);
          const errors = validate.errors?.map(e => {
            const path = e.instancePath ? `Em '${e.instancePath}': ` : '';
            if (e.keyword === 'additionalProperties') {
              return `${path}Propriedade não esperada no payload ('${e.params.additionalProperty}')`;
            }
            if (e.keyword === 'required') {
              return `${path}Falta a propriedade obrigatória ('${e.params.missingProperty}')`;
            }
            return `${path}${e.message}`;
          }).join(' | ') || 'Erro de validação';
          setPayloadErrors(errors);
        }
      } catch (e: any) {
        setPayloadValid(false);
        setPayloadErrors('JSON Inválido: ' + e.message);
      }
    }
  }, []);

  // Run validation when schema or payload changes
  useEffect(() => {
    try {
      const parsedSchema = JSON.parse(schemaText);
      const schemaRuleError = validateSchemaObjectRule(parsedSchema);
      if (schemaRuleError) {
        setSchemaValid(false);
      } else {
        setSchemaValid(true);
      }
      validatePayload(parsedSchema, payloadText);
    } catch {
      // invalid schema text, skip payload validation
      setSchemaValid(false);
    }
  }, [schemaText, payloadText, validatePayload]);

  const handleSaveToGithub = async () => {
    if (!schema.title) {
      alert("Para salvar, o evento deve ter um 'Title' preenchido, que será usado como nome do arquivo.");
      return;
    }

    const fileName = `${schema.title}.json`;
    const repoUrl = `https://api.github.com/repos/elvismariel/validador/contents/public/canonical/${fileName}`;

    let token = localStorage.getItem('gh_token');
    if (!token) {
      token = prompt('Para salvar diretamente no GitHub, insira seu Personal Access Token (PAT) com permissão de escrita no repositório:');
      if (token) {
        localStorage.setItem('gh_token', token);
      } else {
        return;
      }
    }

    try {
      // 1. Tenta buscar o arquivo para pegar o SHA (necessário para atualizar caso já exista)
      const getRes = await fetch(repoUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let sha;
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      // 2. Prepara o conteúdo Base64 seguro para UTF-8 acentuado
      const contentStr = JSON.stringify(schema, null, 2);
      const utf8Bytes = new TextEncoder().encode(contentStr);
      const base64Content = btoa(Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join(''));
      
      // 3. Envia o arquivo por PUT
      const putRes = await fetch(repoUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `feat(schema): salva schema persistido do validador ${fileName}`,
          content: base64Content,
          ...(sha ? { sha } : {})
        })
      });

      if (putRes.ok) {
        alert('Salvo no diretório public/canonical do GitHub com sucesso!');
      } else {
        const errorData = await putRes.json();
        alert(`Erro ao salvar no repositório: ${errorData.message}`);
        if (errorData.message.includes('Bad credentials') || errorData.message.includes('Requires authentication')) {
          localStorage.removeItem('gh_token');
        }
      }
    } catch (e: any) {
      alert('Erro na requisição ou de conexão: ' + e.message);
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
              <label className="input-label">Title (Nome do Evento)</label>
              <input 
                type="text" 
                className="input-field" 
                value={schema.title} 
                onChange={e => handleMetaChange('title', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <input 
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
                    } catch {}
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
    </div>
  );
}

export default App;
