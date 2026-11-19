import { setupServer } from 'msw/node';
import { handlers } from '../features/extensoes/api/mocks/handlers';

export const server = setupServer(...handlers);
