import type { Metadata } from 'next';
import Link from 'next/link';
import { ProseLayout } from '@/components/ProseLayout';

export const metadata: Metadata = {
  title: 'Sobre o EscortsBoys',
  description: 'O que é o EscortsBoys: plataforma de anúncios de acompanhantes masculinos adultos, com moderação, privacidade e controle do anunciante sobre o próprio perfil.',
  alternates: { canonical: '/sobre' },
};

export default function SobrePage() {
  return (
    <ProseLayout
      title="Sobre o EscortsBoys"
      intro={<p>O EscortsBoys é uma plataforma de anúncios classificados de acompanhantes masculinos, exclusiva para maiores de 18 anos. Organizamos os anúncios por cidade e região para que o visitante compare perfis e fale diretamente com o anunciante.</p>}
      sections={[
        { id: 'o-que-fazemos', title: 'O que fazemos', body: <>
          <p>Oferecemos o espaço e as ferramentas para que adultos publiquem seus próprios anúncios: fotos, apresentação, regiões atendidas, disponibilidade, valores e formas de contato.</p>
          <p>Não agenciamos, não intermediamos encontros e não processamos pagamentos entre visitantes e anunciantes. Toda combinação acontece diretamente entre as partes.</p>
        </> },
        { id: 'principios', title: 'Princípios', body: <ul>
          <li><strong>Maioridade sempre:</strong> barreira de acesso, declaração no cadastro e moderação de cada anúncio.</li>
          <li><strong>Consentimento:</strong> só publicamos imagens com autorização declarada de quem aparece nelas.</li>
          <li><strong>Privacidade:</strong> endereços nunca são exibidos e os contatos só são revelados sob demanda.</li>
          <li><strong>Transparência:</strong> selo de verificação apenas após validação real; disponibilidade expira se não for atualizada.</li>
          <li><strong>Respeito:</strong> comunicação inclusiva, discreta e sem julgamentos.</li>
        </ul> },
        { id: 'moderacao', title: 'Moderação', body: <>
          <p>Anúncios novos e edições relevantes passam por análise antes de ficarem públicos. Denúncias são avaliadas com prioridade, e casos envolvendo possível menor de idade levam à remoção imediata e comunicação às autoridades.</p>
          <p>Veja as <Link href="/diretrizes">diretrizes de conteúdo</Link> e as <Link href="/seguranca">orientações de segurança</Link>.</p>
        </> },
        { id: 'empresa', title: 'Responsável pela plataforma', body: <p>Razão social: [a definir] · CNPJ: [a definir] · Endereço: [a definir]. Contato: <Link href="/contato">formulário de contato</Link>.</p> },
      ]}
    />
  );
}
