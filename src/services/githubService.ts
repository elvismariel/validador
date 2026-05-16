import type { JsonSchema } from '../types/schema';

export const saveSchemaToGithub = async (schema: JsonSchema, token: string): Promise<void> => {
  if (!schema.title) {
    throw new Error("Para salvar, o evento deve ter um 'Title' preenchido, que será usado como nome do arquivo.");
  }

  const fileName = `${schema.title}.json`;
  const repoUrl = `https://api.github.com/repos/elvismariel/validador/contents/public/canonical/${fileName}`;

  try {
    const getRes = await fetch(repoUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    let sha;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    const contentStr = JSON.stringify(schema, null, 2);
    const utf8Bytes = new TextEncoder().encode(contentStr);
    const base64Content = btoa(Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join(''));
    
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

    if (!putRes.ok) {
      const errorData = await putRes.json();
      throw new Error(`${errorData.message}`);
    }
  } catch (e) {
    throw new Error('Erro na requisição ou de conexão: ' + (e instanceof Error ? e.message : String(e)));
  }
};
