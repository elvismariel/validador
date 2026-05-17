import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
      <textarea 
        data-testid="monaco-editor"
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)} 
      />
    )
  };
});

describe('App Component', () => {
  it('renders without crashing and defaults to JSON Builder', () => {
    render(<App />);
    expect(screen.getByText(/Construtor Visual \(JSON Schema\)/i)).toBeInTheDocument();
  });

  it('switches to YAML Builder when tab is clicked', async () => {
    render(<App />);
    const yamlTab = screen.getByText(/YAML Event Dispatcher Builder/i);
    await userEvent.click(yamlTab);
    expect(screen.getByText(/Construtor Visual \(YAML\)/i)).toBeInTheDocument();
  });

  it('switches back to JSON Builder when tab is clicked', async () => {
    render(<App />);
    const yamlTab = screen.getByText(/YAML Event Dispatcher Builder/i);
    await userEvent.click(yamlTab);
    const jsonTab = screen.getByText(/JSON Schema Builder/i);
    await userEvent.click(jsonTab);
    expect(screen.getByText(/Construtor Visual \(JSON Schema\)/i)).toBeInTheDocument();
  });
});
