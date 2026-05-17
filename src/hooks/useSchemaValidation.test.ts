import { renderHook } from '@testing-library/react';
import { useSchemaValidation } from './useSchemaValidation';
import { describe, it, expect } from 'vitest';

describe('useSchemaValidation', () => {
  it('should validate a correct schema and payload', () => {
    const schema = JSON.stringify({ type: 'object', required: ['name'], properties: { name: { type: 'string' } } });
    const payload = JSON.stringify({ name: 'test' });
    const { result } = renderHook(() => useSchemaValidation(schema, payload));
    
    expect(result.current.schemaValid).toBe(true);
    expect(result.current.payloadValid).toBe(true);
  });

  it('should invalidate incorrect payload json', () => {
    const schema = JSON.stringify({ type: 'object', required: ['name'], properties: { name: { type: 'string' } } });
    const payload = '{ name: test }'; // Invalid JSON
    const { result } = renderHook(() => useSchemaValidation(schema, payload));
    
    expect(result.current.payloadValid).toBe(false);
    expect(result.current.payloadErrors).toContain('JSON Inválido:');
  });

  it('should invalidate incorrect schema json', () => {
    const schema = '{ type: object }'; // Invalid JSON
    const payload = '{}';
    const { result } = renderHook(() => useSchemaValidation(schema, payload));
    
    expect(result.current.schemaValid).toBe(false);
  });

  it('should invalidate payload missing required property', () => {
    const schema = JSON.stringify({ type: 'object', required: ['name'], properties: { name: { type: 'string' } } });
    const payload = JSON.stringify({});
    const { result } = renderHook(() => useSchemaValidation(schema, payload));
    
    expect(result.current.payloadValid).toBe(false);
    expect(result.current.payloadErrors).toContain('Falta a propriedade obrigatória');
  });

  it('should invalidate payload with additional properties', () => {
    const schema = JSON.stringify({ type: 'object', required: ['name'], additionalProperties: false, properties: { name: { type: 'string' } } });
    const payload = JSON.stringify({ name: 'test', extra: 1 });
    const { result } = renderHook(() => useSchemaValidation(schema, payload));
    
    expect(result.current.payloadValid).toBe(false);
    expect(result.current.payloadErrors).toContain('Propriedade não esperada no payload');
  });

  it('should invalidate payload with type mismatch (generic error message)', () => {
    const schema = JSON.stringify({ type: 'object', required: ['name'], properties: { name: { type: 'string' } } });
    const payload = JSON.stringify({ name: 123 }); // Expect string, got number
    const { result } = renderHook(() => useSchemaValidation(schema, payload));
    
    expect(result.current.payloadValid).toBe(false);
    expect(result.current.payloadErrors).toContain('must be string');
  });
});
