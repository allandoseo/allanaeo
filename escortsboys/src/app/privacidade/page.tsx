import type { Metadata } from 'next';
import Link from 'next/link';
import { ProseLayout } from '@/components/ProseLayout';

export const metadata: Metadata = {
  title: 'Política de privacidade (LGPD)',
  description: 'Como o EscortsBoys coleta, usa, armazena e protege dados pessoais, em conformidade com a LGPD (Lei 13.709/2018), e como exercer seus direitos.',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacidadePage() {
  return (
    <ProseLayout
      title="Política de privacidade"
      updated="03/11/2026"
      intro={<p>Esta política explica como tratamos dados pessoais de visitantes e anunciantes, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018). Alguns dados de anunciantes podem revelar aspectos da vida sexual e são tratados como dados sensíveis, com cuidado redobrado.</p>}
      sections={[
        { id: 'controlador', title: 'Controlador e encarregado', body: <>
          <p>Controlador: [razão social a definir], CNPJ [a definir], endereço [a definir].</p>
          <p>Encarregado pelo tratamento de dados (DPO): [a definir]. Contato: <Link href="/contato?assunto=privacidade">formulário de privacidade</Link>.</p>
        </> },
        { id: 'dados', title: 'Dados que coletamos', body: <ul>
          <li><strong>Conta:</strong> nome, e-mail, senha (armazenada com hash irreversível), data de aceite dos termos e declaração de maioridade.</li>
          <li><strong>Anúncio e perfil (anunciantes):</strong> nome público, idade, cidade/região, textos, fotos, valores, agenda e contatos que você decidir exibir.</li>
          <li><strong>Verificação (opcional):</strong> documentos enviados para obter o selo, acessíveis apenas à equipe de moderação.</li>
          <li><strong>Uso:</strong> contagens agregadas de visualizações, cliques em contato e favoritos por anúncio, sem identificar o visitante.</li>
          <li><strong>Denúncias e contato:</strong> conteúdo da mensagem e e-mail, se informado.</li>
          <li><strong>Segurança:</strong> endereço IP, usado temporariamente para limitar abusos (tentativas de login, envio de formulários).</li>
        </ul> },
        { id: 'finalidades', title: 'Finalidades e bases legais', body: <ul>
          <li>Criar e manter sua conta e anúncios — execução de contrato (art. 7º, V).</li>
          <li>Publicar as informações do anúncio — consentimento específico do anunciante (art. 11, I), que pode ser revogado a qualquer momento.</li>
          <li>Moderação, prevenção a fraudes e proteção de menores — legítimo interesse e cumprimento de obrigação legal (art. 7º, II e IX; art. 11, II, “g”).</li>
          <li>Responder solicitações e denúncias — legítimo interesse.</li>
          <li>Guardar registros de acesso — obrigação legal (Marco Civil da Internet, art. 15).</li>
        </ul> },
        { id: 'compartilhamento', title: 'Compartilhamento', body: <>
          <p>Não vendemos dados. Compartilhamos apenas com operadores necessários ao serviço (hospedagem, armazenamento de imagens, envio de e-mail), sob contrato, e com autoridades quando houver obrigação legal ou ordem judicial.</p>
          <p>Os contatos exibidos no anúncio ficam visíveis a quem solicitar, por decisão do anunciante.</p>
        </> },
        { id: 'retencao', title: 'Retenção', body: <ul>
          <li>Dados de conta e anúncios: enquanto a conta existir.</li>
          <li>Após a exclusão da conta: dados removidos, exceto registros de acesso (6 meses) e informações necessárias para defesa em processos ou cumprimento legal.</li>
          <li>Documentos de verificação: excluídos após a conclusão da análise, mantendo apenas o resultado.</li>
        </ul> },
        { id: 'direitos', title: 'Seus direitos', body: <>
          <p>Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamentos e revogação do consentimento (art. 18).</p>
          <p>Anunciantes podem editar ou excluir anúncios e a conta diretamente no painel. Demais pedidos: <Link href="/contato?assunto=privacidade">formulário de privacidade</Link>, com resposta em até 15 dias. Você também pode reclamar à ANPD.</p>
        </> },
        { id: 'cookies', title: 'Cookies e armazenamento local', body: <ul>
          <li><code>eb_session</code> — cookie essencial que mantém você conectado (até 30 dias com “manter conectado”).</li>
          <li><code>eb_age</code> — registra que você confirmou ter 18 anos ou mais (1 ano).</li>
          <li><code>eb_favoritos</code> (armazenamento local do navegador) — guarda favoritos de visitantes sem conta; não é enviado ao servidor até você entrar na sua conta.</li>
          <li>Não usamos cookies de publicidade ou rastreamento de terceiros.</li>
        </ul> },
        { id: 'seguranca', title: 'Segurança', body: <p>Usamos conexão criptografada (HTTPS), senhas com hash, controle de acesso por papéis, registro de ações administrativas e limitação de tentativas. Nenhum sistema é totalmente imune; em caso de incidente relevante, comunicaremos os titulares e a ANPD.</p> },
      ]}
    />
  );
}
