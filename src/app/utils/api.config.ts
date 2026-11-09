export const BASE_URL = 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;

// a API devolve caminho relativo (/imagens/itens/arquivo.jpg); o navegador precisa da URL completa
export const urlImagem = (caminho?: string | null): string | null => (caminho ? `${BASE_URL}${caminho}` : null);