import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { JsonSchemaBuilder } from './JsonSchemaBuilder';

vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
      <textarea 
        data-testid="monaco-editor"
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    )
  };
});

describe('JsonSchemaBuilder Functionalities', () => {
  it('should add a new property to the schema', async () => {
    render(<JsonSchemaBuilder />);
    const addButton = screen.getByText(/Nova Propriedade/i);
    await userEvent.click(addButton);
    expect(screen.getAllByText(/New property description/i).length).toBeGreaterThan(0);
  });

  it('should clear the schema when clicking Limpar Tudo', async () => {
    render(<JsonSchemaBuilder />);
    const clearButton = screen.getByText(/Limpar Tudo/i);
    await userEvent.click(clearButton);
    
    const confirmBtn = screen.getByText('Sim, limpar');
    await userEvent.click(confirmBtn);
    
    expect(screen.getByLabelText(/Title \(Nome do Evento\)/i)).toHaveValue('');
  });

  it('should validate an invalid payload', async () => {
    render(<JsonSchemaBuilder />);
    const payloadTab = screen.getByText(/Testar Payload/i);
    await userEvent.click(payloadTab);
    const editors = screen.getAllByTestId('monaco-editor');
    const editor = editors[editors.length - 1]; // payload editor
    await userEvent.clear(editor);
    fireEvent.change(editor, { target: { value: '{"invalid": true}' } });
    expect(await screen.findByText(/Falta a propriedade obrigatória/i)).toBeInTheDocument();
  });

  it('should edit the event title', async () => {
    render(<JsonSchemaBuilder />);
    const titleInput = screen.getByLabelText(/Title \(Nome do Evento\)/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'NovoEvento');
    expect(titleInput).toHaveValue('NovoEvento');
  });

  it('should switch to payload tab and show payload validation', async () => {
    render(<JsonSchemaBuilder />);
    const payloadTab = screen.getByText(/Testar Payload/i);
    await userEvent.click(payloadTab);
    expect(screen.getByText(/Digite um JSON de evento abaixo/i)).toBeInTheDocument();
  });
});
