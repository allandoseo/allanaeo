import type { Metadata } from 'next';
import Link from 'next/link';
import { ProseLayout } from '@/components/ProseLayout';

export const metadata: Metadata = {
  title: 'Segurança',
  description: 'Orientações de segurança para visitantes e anunciantes do EscortsBoys: como evitar golpes, proteger seus dados e denunciar anúncios.',
  alternates: { canonical: '/seguranca' },
};

export default function SegurancaPage() {
  return (
    <ProseLayout
      title="Segurança"
      intro={<p>Boas práticas para que o contato entre visitantes e anunciantes aconteça com respeito e segurança. Em caso de emergência, ligue 190.</p>}
      aside={<Link href="/contato?assunto=remocao" className="text-sm font-semibold">Pedir remoção de conteúdo</Link>}
      sections={[
        { id: 'visitantes', title: 'Para visitantes', body: <ul>
          <li>Nunca faça pagamento antecipado (Pix, depósito ou “taxa de reserva”) para quem você não conhece.</li>
          <li>Desconfie de pedidos de dados pessoais, fotos íntimas ou códigos de verificação.</li>
          <li>Combine local e horário com antecedência e avise alguém de confiança.</li>
          <li>O selo “Perfil verificado” indica validação documental pela equipe; sem ele, a identidade não foi confirmada.</li>
          <li>Status de disponibilidade é informado pelo anunciante e expira automaticamente.</li>
        </ul> },
        { id: 'anunciantes', title: 'Para anunciantes', body: <ul>
          <li>Use nome público e um número de telefone exclusivo para atendimento.</li>
          <li>Não informe endereço residencial; indique só bairro ou região.</li>
          <li>Remova a localização (metadados) das fotos antes de enviar.</li>
          <li>Ative a autenticação do seu WhatsApp e não compartilhe códigos recebidos por SMS.</li>
          <li>Você pode pausar o anúncio a qualquer momento pelo painel.</li>
        </ul> },
        { id: 'golpes', title: 'Golpes comuns', body: <ul>
          <li><strong>Falso anunciante:</strong> perfil com fotos de outra pessoa que exige pagamento antecipado.</li>
          <li><strong>Falso suporte:</strong> mensagens dizendo ser da equipe EscortsBoys pedindo senha ou pagamento. Nunca pedimos sua senha.</li>
          <li><strong>Extorsão:</strong> ameaças de expor conversas. Não pague; registre boletim de ocorrência e denuncie.</li>
        </ul> },
        { id: 'denunciar', title: 'Como denunciar', body: <>
          <p>Em cada anúncio há o link “Denunciar este anúncio”. Denúncias de possível menor de idade, imagens sem consentimento e uso indevido de identidade têm prioridade máxima.</p>
          <p>Se você é a pessoa retratada sem autorização, use também o <Link href="/contato?assunto=remocao">pedido de remoção</Link>. Conteúdo envolvendo menores também pode ser denunciado à SaferNet (new.safernet.org.br) e ao Disque 100.</p>
        </> },
      ]}
    />
  );
}
