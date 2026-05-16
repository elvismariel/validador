import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import type { SchemaProperty, PropertyType } from '../types/schema';

export interface PropertyNodeProps {
  propertyKey: string;
  propInfo: SchemaProperty;
  isRequired: boolean;
  onChangeKey: (oldKey: string, newKey: string) => void;
  onDelete: () => void;
  onChangeInfo: (newInfo: SchemaProperty) => void;
  onToggleRequired: () => void;
}

export const PropertyNode: React.FC<PropertyNodeProps> = ({
  propertyKey, propInfo, isRequired, onChangeKey, onDelete, onChangeInfo, onToggleRequired
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: keyof SchemaProperty, value: any) => {
    const newInfo = { ...propInfo, [field]: value };
    
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
