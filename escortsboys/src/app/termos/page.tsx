import type { Metadata } from 'next';
import Link from 'next/link';
import { ProseLayout } from '@/components/ProseLayout';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Termos de uso do EscortsBoys: regras de acesso para maiores de 18 anos, responsabilidades de anunciantes e visitantes, moderação e remoção de conteúdo.',
  alternates: { canonical: '/termos' },
};

export default function TermosPage() {
  return (
    <ProseLayout
      title="Termos de uso"
      updated="03/11/2026"
      intro={<p>Ao acessar ou usar o EscortsBoys, você concorda com estes termos. Se não concordar, não utilize a plataforma.</p>}
      sections={[
        { id: 'maioridade', title: '1. Maioridade', body: <p>O acesso e o cadastro são permitidos somente a maiores de 18 anos. Ao confirmar a barreira de acesso ou criar uma conta, você declara ter 18 anos ou mais. Contas de menores serão encerradas.</p> },
        { id: 'servico', title: '2. O serviço', body: <>
          <p>O EscortsBoys é uma plataforma de anúncios classificados. Não agencia, não intermedeia encontros, não participa de negociações e não processa pagamentos entre visitantes e anunciantes.</p>
          <p>Planos de anúncio, quando contratados, remuneram apenas o espaço e as ferramentas da plataforma.</p>
        </> },
        { id: 'anunciante', title: '3. Responsabilidades do anunciante', body: <ul>
          <li>Anunciar apenas a si mesmo, com informações verdadeiras.</li>
          <li>Ter autorização de todas as pessoas que aparecem nas fotos, todas maiores de idade.</li>
          <li>Respeitar as <Link href="/diretrizes">diretrizes de conteúdo</Link> e a legislação aplicável.</li>
          <li>Manter a disponibilidade e os valores atualizados.</li>
          <li>O anunciante é o único responsável pelo conteúdo que publica e pelos serviços que oferece.</li>
        </ul> },
        { id: 'proibicoes', title: '4. Condutas proibidas', body: <ul>
          <li>Publicar conteúdo envolvendo menores de idade, sem consentimento ou de terceiros.</li>
          <li>Usar identidade falsa, aplicar golpes ou cobrar antecipadamente de forma enganosa.</li>
          <li>Coletar dados de anunciantes de forma automatizada (robôs, scraping).</li>
          <li>Expor endereço ou dados pessoais de outras pessoas.</li>
          <li>Burlar a moderação ou os limites técnicos da plataforma.</li>
        </ul> },
        { id: 'moderacao', title: '5. Moderação e remoção', body: <p>Podemos analisar, recusar, pausar ou remover anúncios e suspender contas que violem estes termos, sem aviso prévio em casos graves. Denúncias podem ser feitas em cada anúncio ou pela <Link href="/contato?assunto=remocao">página de contato</Link>. Conteúdo ilegal será comunicado às autoridades.</p> },
        { id: 'conta', title: '6. Conta e encerramento', body: <p>Você é responsável por manter sua senha em sigilo. Pode excluir sua conta a qualquer momento pelo painel; os dados serão tratados conforme a <Link href="/privacidade">política de privacidade</Link>.</p> },
        { id: 'limitacao', title: '7. Limitação de responsabilidade', body: <p>Não garantimos a veracidade das informações declaradas pelos anunciantes, exceto quando houver selo de verificação, que confirma apenas a identidade e a maioridade. Não respondemos por acordos firmados diretamente entre as partes.</p> },
        { id: 'alteracoes', title: '8. Alterações', body: <p>Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas no site e, para usuários cadastrados, por e-mail.</p> },
        { id: 'foro', title: '9. Lei e foro', body: <p>Aplica-se a legislação brasileira. Fica eleito o foro de [a definir], ressalvado o direito do consumidor de ajuizar ação em seu domicílio.</p> },
      ]}
    />
  );
}
