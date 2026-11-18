import { ModeloCadastro } from '../../componentes/cadastro/ModeloCadastro';
import { configLiberacoes } from './config';

export default function Rotas() {
  return <ModeloCadastro config={configLiberacoes} />;
}
