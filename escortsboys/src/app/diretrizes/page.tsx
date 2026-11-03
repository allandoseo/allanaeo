import type { Metadata } from 'next';
import Link from 'next/link';
import { ProseLayout } from '@/components/ProseLayout';

export const metadata: Metadata = {
  title: 'Diretrizes de conteúdo',
  description: 'Regras de conteúdo do EscortsBoys: o que é permitido e proibido em anúncios, fotos e textos, e como funciona a moderação.',
  alternates: { canonical: '/diretrizes' },
};

export default function DiretrizesPage() {
  return (
    <ProseLayout
      title="Diretrizes de conteúdo"
      updated="03/11/2026"
      intro={<p>Estas regras valem para todos os anúncios, perfis e fotos. O descumprimento leva à rejeição, remoção do anúncio ou suspensão da conta.</p>}
      sections={[
        { id: 'quem-pode', title: 'Quem pode anunciar', body: <ul>
          <li>Somente pessoas com 18 anos ou mais.</li>
          <li>Somente a própria pessoa anunciada. Anúncios de terceiros, agências não autorizadas ou perfis falsos são proibidos.</li>
        </ul> },
        { id: 'fotos', title: 'Fotos', body: <ul>
          <li>Devem ser da pessoa anunciada e recentes.</li>
          <li>Todas as pessoas que aparecem devem ser maiores de idade e ter autorizado a publicação.</li>
          <li>Proibido: imagens de terceiros, geradas para simular pessoas reais, com nudez explícita na foto principal, ou que mostrem documentos, placas de veículos ou fachadas identificáveis.</li>
        </ul> },
        { id: 'textos', title: 'Textos e informações', body: <ul>
          <li>Informações verdadeiras sobre idade, região, modalidades e valores.</li>
          <li>Telefones, e-mails e links só nos campos de contato — não no título ou descrição.</li>
          <li>Proibido: endereço residencial, menção a serviços ilegais, drogas, discurso de ódio, conteúdo discriminatório ou que sugira menoridade.</li>
        </ul> },
        { id: 'moderacao', title: 'Moderação', body: <>
          <p>Todo anúncio novo e edições de fotos ou textos passam por análise. A moderação verifica idade declarada, autorização de imagem, contatos embutidos no texto e conformidade com estas regras.</p>
          <p>Rejeições informam o motivo no painel. O anunciante pode corrigir e reenviar.</p>
        </> },
        { id: 'remocao', title: 'Remoção de conteúdo', body: <p>Qualquer pessoa pode denunciar um anúncio. Pessoas retratadas sem autorização podem pedir remoção pela <Link href="/contato?assunto=remocao">página de contato</Link>; o anúncio é pausado durante a análise. Casos envolvendo menores são removidos imediatamente e comunicados às autoridades.</p> },
        { id: 'verificacao', title: 'Selo de verificação', body: <p>O selo “Perfil verificado” só é concedido após validação documental pela equipe. Ele nunca é atribuído automaticamente nem a anúncios de demonstração.</p> },
      ]}
    />
  );
}
