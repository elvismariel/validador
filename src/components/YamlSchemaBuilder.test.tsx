import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { YamlSchemaBuilder } from './YamlSchemaBuilder';

vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value }: { value: string }) => (
      <textarea 
        data-testid="monaco-editor"
        value={value} 
        readOnly
      />
    )
  };
});

describe('YamlSchemaBuilder Functionalities', () => {
  it('renders initial form and shows generated YAML', () => {
    render(<YamlSchemaBuilder />);
    expect(screen.getByText(/Construtor Visual \(YAML\)/i)).toBeInTheDocument();
    
    const nameInputs = screen.getAllByDisplayValue(/event-dispatcher-service-example/i);
    expect(nameInputs.length).toBeGreaterThan(0);
  });

  it('should change adapter fields when switching from HTTP to Queue', async () => {
    render(<YamlSchemaBuilder />);
    
    // HTTP fields are rendered by default
    expect(screen.getAllByDisplayValue('https://example.com').length).toBeGreaterThan(0);
    
    // Find the adapter select
    const select = screen.getByRole('combobox', { name: /Adapter Type/i });
    await userEvent.selectOptions(select, 'queue');
    
    // Now Queue fields should be visible
    expect(screen.getAllByDisplayValue(/example-queue-name/i).length).toBeGreaterThan(0);
  });

  it('should clear the form when clicking Limpar', async () => {
    render(<YamlSchemaBuilder />);
    const clearButton = screen.getByText('Limpar', { selector: 'button' });
    await userEvent.click(clearButton);
    
    const confirmBtn = screen.getByText('Sim, limpar');
    await userEvent.click(confirmBtn);
    
    // Name input should be empty after clear
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('');
  });

  it('should add a new processor', async () => {
    render(<YamlSchemaBuilder />);
    const processorSelect = screen.getByRole('combobox', { name: /Add Processor/i });
    
    await userEvent.selectOptions(processorSelect, 'addtag');
    
    expect(await screen.findByText(/ADDTAG/)).toBeInTheDocument();
  });
});
