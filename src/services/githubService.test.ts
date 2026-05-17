import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveSchemaToGithub } from './githubService';

describe('githubService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw an error if schema does not have a title', async () => {
    const schema = { type: 'object' } as any;
    await expect(saveSchemaToGithub(schema, 'token')).rejects.toThrow("Para salvar, o evento deve ter um 'Title' preenchido");
  });

  it('should create a new file if it does not exist', async () => {
    const schema = { title: 'TestEvent', type: 'object' } as any;
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await saveSchemaToGithub(schema, 'token');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, "https://api.github.com/repos/elvismariel/validador/contents/public/canonical/TestEvent.json", {
      headers: { Authorization: "Bearer token" }
    });
    
    // Check PUT call
    expect(global.fetch).toHaveBeenNthCalledWith(2, "https://api.github.com/repos/elvismariel/validador/contents/public/canonical/TestEvent.json", expect.objectContaining({
      method: 'PUT',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json'
      }
    }));
  });

  it('should update an existing file', async () => {
    const schema = { title: 'TestEvent', type: 'object' } as any;
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'existing-sha' })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await saveSchemaToGithub(schema, 'token');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as any).mock.calls[1][1].body).toContain('"sha":"existing-sha"');
  });

  it('should throw an error if PUT fails', async () => {
    const schema = { title: 'TestEvent', type: 'object' } as any;
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    }).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'API Error' })
    });

    await expect(saveSchemaToGithub(schema, 'token')).rejects.toThrow('API Error');
  });

  it('should throw network errors', async () => {
    const schema = { title: 'TestEvent', type: 'object' } as any;
    
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(saveSchemaToGithub(schema, 'token')).rejects.toThrow('Erro na requisição ou de conexão: Network error');
  });
});
