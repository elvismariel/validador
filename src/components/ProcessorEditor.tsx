import { Trash2, Plus, GripVertical } from 'lucide-react';
import type { AnyProcessor } from '../types/processors';

interface ProcessorEditorProps {
  processor: AnyProcessor;
  update: (newProc: AnyProcessor) => void;
  remove: () => void;
  setDraggable: (id: string | null) => void;
}

export function ProcessorEditor({ processor, update, remove, setDraggable }: ProcessorEditorProps) {
  const handleChange = (field: string, value: unknown) => {
    update({ ...processor, [field]: value } as AnyProcessor);
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div 
            style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setDraggable(processor.id)}
            onMouseLeave={() => setDraggable(null)}
          >
            <GripVertical size={18} />
          </div>
          <h4 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>{processor.type.toUpperCase()}</h4>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Order: {processor.order}</span>
          <button className="btn-secondary" style={{ padding: '4px 8px', borderColor: 'transparent' }} onClick={remove}>
            <Trash2 size={16} color="#ef4444" />
          </button>
        </div>
      </div>

      {processor.type === 'filter_version' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Mode</label>
            <select className="input-field" value={processor.mode} onChange={e => handleChange('mode', e.target.value)}>
              <option value="allow">ALLOW</option>
              <option value="reject">REJECT</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Versions (comma separated)</label>
            <input type="text" className="input-field" value={processor.versions} onChange={e => handleChange('versions', e.target.value)} placeholder="ex: 2, 4" />
          </div>
        </div>
      )}

      {processor.type === 'filter_attribute' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Mode</label>
              <select className="input-field" value={processor.mode} onChange={e => handleChange('mode', e.target.value)}>
                <option value="allow">allow</option>
                <option value="reject">reject</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Operation</label>
              <select className="input-field" value={processor.operation} onChange={e => handleChange('operation', e.target.value)}>
                <option value="and">and</option>
                <option value="or">or</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="input-label">Rules</label>
              <button 
                className="btn" 
                style={{ padding: '2px 6px', fontSize: '0.8rem' }} 
                onClick={() => handleChange('rules', [...processor.rules, { path: '', type: 'regex', value: '' }])}
              >
                <Plus size={14} /> Add Rule
              </button>
            </div>
            {processor.rules.map((rule, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" className="input-field" placeholder="Path" value={rule.path} onChange={e => {
                  const newRules = [...processor.rules];
                  newRules[idx].path = e.target.value;
                  handleChange('rules', newRules);
                }} />
                <input type="text" className="input-field" placeholder="Type" value={rule.type} onChange={e => {
                  const newRules = [...processor.rules];
                  newRules[idx].type = e.target.value;
                  handleChange('rules', newRules);
                }} />
                <input type="text" className="input-field" placeholder="Value" value={rule.value} onChange={e => {
                  const newRules = [...processor.rules];
                  newRules[idx].value = e.target.value;
                  handleChange('rules', newRules);
                }} />
                <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => {
                  const newRules = [...processor.rules];
                  newRules.splice(idx, 1);
                  handleChange('rules', newRules);
                }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {processor.type === 'addtag' && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="input-label">Tags</label>
            <button 
              className="btn" 
              style={{ padding: '2px 6px', fontSize: '0.8rem' }} 
              onClick={() => handleChange('tags', [...processor.tags, { key: '', value: '' }])}
            >
              <Plus size={14} /> Add Tag
            </button>
          </div>
          {processor.tags.map((tag, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" className="input-field" placeholder="Key" value={tag.key} onChange={e => {
                const newTags = [...processor.tags];
                newTags[idx].key = e.target.value;
                handleChange('tags', newTags);
              }} />
              <input type="text" className="input-field" placeholder="Value" value={tag.value} onChange={e => {
                const newTags = [...processor.tags];
                newTags[idx].value = e.target.value;
                handleChange('tags', newTags);
              }} />
              <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => {
                const newTags = [...processor.tags];
                newTags.splice(idx, 1);
                handleChange('tags', newTags);
              }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {processor.type === 'replace' && (
        <>
          <div className="input-group">
            <label className="checkbox-wrapper" style={{ marginTop: '0.5rem' }}>
              <input type="checkbox" checked={processor.force_marshal} onChange={e => handleChange('force_marshal', e.target.checked)} />
              <span className="input-label">Force Marshal</span>
            </label>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="input-label">Targets</label>
              <button 
                className="btn" 
                style={{ padding: '2px 6px', fontSize: '0.8rem' }} 
                onClick={() => handleChange('targets', [...processor.targets, { find: '', field: '', replace: '' }])}
              >
                <Plus size={14} /> Add Target
              </button>
            </div>
            {processor.targets.map((tgt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" className="input-field" placeholder="Find (regex)" value={tgt.find} onChange={e => {
                  const newTgt = [...processor.targets];
                  newTgt[idx].find = e.target.value;
                  handleChange('targets', newTgt);
                }} />
                <input type="text" className="input-field" placeholder="Field" value={tgt.field} onChange={e => {
                  const newTgt = [...processor.targets];
                  newTgt[idx].field = e.target.value;
                  handleChange('targets', newTgt);
                }} />
                <input type="text" className="input-field" placeholder="Replace" value={tgt.replace} onChange={e => {
                  const newTgt = [...processor.targets];
                  newTgt[idx].replace = e.target.value;
                  handleChange('targets', newTgt);
                }} />
                <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => {
                  const newTgt = [...processor.targets];
                  newTgt.splice(idx, 1);
                  handleChange('targets', newTgt);
                }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {processor.type === 'regexreplace' && (
        <>
          <div className="input-group">
            <label className="checkbox-wrapper" style={{ marginTop: '0.5rem' }}>
              <input type="checkbox" checked={processor.force_marshal} onChange={e => handleChange('force_marshal', e.target.checked)} />
              <span className="input-label">Force Marshal</span>
            </label>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="input-label">Targets</label>
              <button 
                className="btn" 
                style={{ padding: '2px 6px', fontSize: '0.8rem' }} 
                onClick={() => handleChange('targets', [...processor.targets, { find: '', replace: '' }])}
              >
                <Plus size={14} /> Add Target
              </button>
            </div>
            {processor.targets.map((tgt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" className="input-field" placeholder="Find (regex)" value={tgt.find} onChange={e => {
                  const newTgt = [...processor.targets];
                  newTgt[idx].find = e.target.value;
                  handleChange('targets', newTgt);
                }} />
                <input type="text" className="input-field" placeholder="Replace" value={tgt.replace} onChange={e => {
                  const newTgt = [...processor.targets];
                  newTgt[idx].replace = e.target.value;
                  handleChange('targets', newTgt);
                }} />
                <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => {
                  const newTgt = [...processor.targets];
                  newTgt.splice(idx, 1);
                  handleChange('targets', newTgt);
                }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {processor.type === 'transform' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Content Type</label>
              <input type="text" className="input-field" value={processor.contentType} onChange={e => handleChange('contentType', e.target.value)} placeholder="ex: application/json" />
            </div>
            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '1.5rem' }}>
              <label className="checkbox-wrapper">
                <input type="checkbox" checked={processor.acceptUnknownNamespace} onChange={e => handleChange('acceptUnknownNamespace', e.target.checked)} />
                <span className="input-label">Accept Unknown Namespace</span>
              </label>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Default Template (JSON or Text)</label>
            <textarea 
              className="input-field" 
              rows={5} 
              value={processor.templates} 
              onChange={e => handleChange('templates', e.target.value)} 
              style={{ resize: 'vertical', fontFamily: 'monospace' }}
              placeholder={`{\n  "user_id": "{{ .user_id }}"\n}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
