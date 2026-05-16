// import { render, screen } from '@testing-library/react';
// import { describe, it, expect } from 'vitest';
// import App from './App';

// describe('App Component', () => {
//   it('renders without crashing', () => {
//     render(<App />);
//     expect(screen.getByText(/Construtor Visual \(JSON Schema\)/i)).toBeInTheDocument();
//   });
// });

import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

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

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Construtor Visual \(JSON Schema\)/i)).toBeInTheDocument();
  });
});

describe('App Functionalities', () => {

  it('should add a new property to the schema', async () => {
    render(<App />);
    const addButton = screen.getByText(/Nova Propriedade/i);
    await userEvent.click(addButton);
    expect(screen.getAllByText(/New property description/i).length).toBeGreaterThan(0);
  });

  it('should clear the schema when clicking Limpar Tudo', async () => {
    render(<App />);
    window.confirm = () => true;
    const clearButton = screen.getByText(/Limpar Tudo/i);
    await userEvent.click(clearButton);
    expect(screen.getByLabelText(/Title \(Nome do Evento\)/i)).toHaveValue('');
  });

  it('should validate an invalid payload', async () => {
    render(<App />);
    const payloadTab = screen.getByText(/Testar Payload/i);
    await userEvent.click(payloadTab);
    const editor = screen.getByTestId('monaco-editor');
    await userEvent.clear(editor);
    fireEvent.change(editor, { target: { value: '{"invalid": true}' } });
    expect(await screen.findByText(/Falta a propriedade obrigatória/i)).toBeInTheDocument();
  });

  it('should edit the event title', async () => {
    render(<App />);
    const titleInput = screen.getByLabelText(/Title \(Nome do Evento\)/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'NovoEvento');
    expect(titleInput).toHaveValue('NovoEvento');
  });

  it('should switch to payload tab and show payload validation', async () => {
    render(<App />);
    const payloadTab = screen.getByText(/Testar Payload/i);
    await userEvent.click(payloadTab);
    expect(screen.getByText(/Digite um JSON de evento abaixo/i)).toBeInTheDocument();
  });
});
