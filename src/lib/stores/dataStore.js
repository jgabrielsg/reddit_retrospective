import { writable } from 'svelte/store';

/**
 * Define a estrutura dos dados do Reddit para o VS Code entender.
 * @typedef {Object} RedditData
 * @property {Array<Object>} posts - Lista de posts do CSV
 * @property {Array<Object>} comments - Lista de comentários do CSV
 * @property {Array<Object>} post_votes - Lista de upvotes de posts do usuário
 * @property {Array<Object>} comment_votes - Lista de upvotes dos comentários
 * @property {string|null} user - Nome do usuário (se conseguirmos extrair)
 */

/**
 * Store que guarda os dados processados.
 * @type {import('svelte/store').Writable<RedditData|null>}
 */
export const redditStore = writable(null);

/**
 * Store para controlar o estado de "Carregando..."
 * @type {import('svelte/store').Writable<boolean>}
 */
export const isLoading = writable(false);

/**
 * Store para controlar se já recebeu o zip
 * @type {import('svelte/store').Writable<boolean>}
 */
export const zipAdded = writable(false);