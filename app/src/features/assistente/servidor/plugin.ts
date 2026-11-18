import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';
import type { PedidoAssistente } from '../contrato.ts';
import { configurado, provedorDe, responder, type EnvIA } from './responder.ts';

/**
 * Intermediário do assistente no servidor de desenvolvimento.
 * O navegador chama /api/assistente; só aqui a chave (SCUA_IA_* do .env.local) é lida e usada.
 * As variáveis não têm o prefixo VITE_, então o Vite nunca as coloca no pacote do navegador.
 * No sistema real, este papel é do servidor da Scua (docs/contrato-assistente.md).
 */

const MAXIMO_DO_CORPO = 400_000;

function lerCorpo(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    let tamanho = 0;
    const partes: Buffer[] = [];
    req.on('data', (parte: Buffer) => {
      tamanho += parte.length;
      if (tamanho > MAXIMO_DO_CORPO) { resolve(null); req.destroy(); return; }
      partes.push(parte);
    });
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
    req.on('error', () => resolve(null));
  });
}

function enviar(res: ServerResponse, status: number, corpo: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(corpo));
}

/** Só a própria página pode chamar: um site aberto em outra aba não gasta a chave. */
function mesmaOrigem(req: IncomingMessage): boolean {
  const origem = req.headers.origin;
  if (!origem) return true;
  try {
    return new URL(origem).host === req.headers.host;
  } catch {
    return false;
  }
}

export function assistentePlugin(): Plugin {
  return {
    name: 'scua-assistente',
    configureServer(server) {
      // Lido a cada pedido: dá para colocar ou trocar a chave sem reiniciar o servidor.
      const env = (): EnvIA => loadEnv(server.config.mode, server.config.envDir || server.config.root, 'SCUA_IA_');

      server.middlewares.use('/api/assistente', (req, res) => {
        void (async () => {
          const caminho = (req.url ?? '/').split('?')[0];
          if (!mesmaOrigem(req)) return enviar(res, 403, { motivo: 'configuracao' });

          if (req.method === 'GET' && caminho === '/estado') {
            const atual = env();
            return enviar(res, 200, { ativo: configurado(atual), provedor: configurado(atual) ? provedorDe(atual) : null });
          }
          if (req.method !== 'POST' || caminho !== '/') return enviar(res, 404, { motivo: 'configuracao' });

          const texto = await lerCorpo(req);
          let pedido: PedidoAssistente;
          try {
            if (texto === null) throw new Error('corpo');
            pedido = JSON.parse(texto) as PedidoAssistente;
          } catch {
            return enviar(res, 400, { motivo: 'configuracao' });
          }
          const r = await responder(pedido, env(), fetch);
          if (r.ok) return enviar(res, 200, r.resposta);
          // Só o motivo vai para o log e para o navegador; nunca a chave nem o texto do provedor.
          server.config.logger.warn(`[assistente] ${r.motivo}`);
          return enviar(res, r.status, { motivo: r.motivo });
        })().catch(() => enviar(res, 502, { motivo: 'indisponivel' }));
      });
    },
  };
}
