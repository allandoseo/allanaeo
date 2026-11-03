-- Catálogos iniciais (sem anúncios: dados demonstrativos existem apenas no adaptador local).
insert into public.cities (slug, name, state) values
  ('rio-de-janeiro', 'Rio de Janeiro', 'RJ'), ('sao-paulo', 'São Paulo', 'SP'), ('belo-horizonte', 'Belo Horizonte', 'MG'),
  ('brasilia', 'Brasília', 'DF'), ('curitiba', 'Curitiba', 'PR'), ('porto-alegre', 'Porto Alegre', 'RS'),
  ('salvador', 'Salvador', 'BA'), ('recife', 'Recife', 'PE')
on conflict do nothing;

insert into public.regions (city_slug, slug, name) values
  ('rio-de-janeiro', 'copacabana', 'Copacabana'), ('rio-de-janeiro', 'ipanema', 'Ipanema'), ('rio-de-janeiro', 'leblon', 'Leblon'),
  ('rio-de-janeiro', 'botafogo', 'Botafogo'), ('rio-de-janeiro', 'flamengo', 'Flamengo'), ('rio-de-janeiro', 'barra-da-tijuca', 'Barra da Tijuca'),
  ('rio-de-janeiro', 'recreio', 'Recreio'), ('rio-de-janeiro', 'tijuca', 'Tijuca'), ('rio-de-janeiro', 'centro', 'Centro'),
  ('rio-de-janeiro', 'lapa', 'Lapa'), ('rio-de-janeiro', 'niteroi', 'Niterói'),
  ('sao-paulo', 'jardins', 'Jardins'), ('sao-paulo', 'pinheiros', 'Pinheiros'), ('sao-paulo', 'vila-madalena', 'Vila Madalena'),
  ('sao-paulo', 'moema', 'Moema'), ('sao-paulo', 'itaim-bibi', 'Itaim Bibi'), ('sao-paulo', 'consolacao', 'Consolação'),
  ('sao-paulo', 'republica', 'República'), ('sao-paulo', 'vila-mariana', 'Vila Mariana'), ('sao-paulo', 'santana', 'Santana'),
  ('sao-paulo', 'tatuape', 'Tatuapé'),
  ('belo-horizonte', 'savassi', 'Savassi'), ('belo-horizonte', 'lourdes', 'Lourdes'), ('belo-horizonte', 'funcionarios', 'Funcionários'),
  ('belo-horizonte', 'centro', 'Centro'), ('belo-horizonte', 'pampulha', 'Pampulha'), ('belo-horizonte', 'buritis', 'Buritis'),
  ('brasilia', 'asa-sul', 'Asa Sul'), ('brasilia', 'asa-norte', 'Asa Norte'), ('brasilia', 'lago-sul', 'Lago Sul'), ('brasilia', 'aguas-claras', 'Águas Claras'),
  ('curitiba', 'batel', 'Batel'), ('curitiba', 'centro', 'Centro'), ('curitiba', 'agua-verde', 'Água Verde'),
  ('porto-alegre', 'moinhos-de-vento', 'Moinhos de Vento'), ('porto-alegre', 'cidade-baixa', 'Cidade Baixa'), ('porto-alegre', 'centro-historico', 'Centro Histórico'),
  ('salvador', 'barra', 'Barra'), ('salvador', 'rio-vermelho', 'Rio Vermelho'), ('salvador', 'pituba', 'Pituba'),
  ('recife', 'boa-viagem', 'Boa Viagem'), ('recife', 'casa-forte', 'Casa Forte'), ('recife', 'gracas', 'Graças')
on conflict do nothing;

insert into public.categories (slug, name, description) values
  ('local-proprio', 'Local próprio', 'Atende em local reservado próprio.'),
  ('hotel', 'Hotel ou motel', 'Atende em hotel ou motel escolhido em comum acordo.'),
  ('desloca-se', 'Desloca-se', 'Vai até o cliente dentro da região atendida.'),
  ('eventos', 'Companhia para eventos', 'Acompanha em jantares e eventos sociais.'),
  ('viagens', 'Viagens', 'Aceita acompanhar em viagens, mediante combinação.'),
  ('online', 'Atendimento online', 'Chamadas de vídeo e conteúdo combinado previamente.')
on conflict do nothing;

-- Preços nulos = "valor a definir" pela administração.
insert into public.plans (id, name, description, price_cents, period_days, features, highlight) values
  ('basico', 'Básico', 'Um anúncio ativo com fotos e contatos.', null, 30, array['1 anúncio ativo', 'Até 12 fotos', 'Atualização de disponibilidade', 'Estatísticas de visualizações e contatos'], false),
  ('destaque', 'Destaque', 'Mais exposição nas listagens da sua cidade.', null, 30, array['Tudo do Básico', 'Prioridade na ordenação "Mais relevantes"', 'Até 3 anúncios ativos'], true),
  ('premium', 'Premium', 'Para quem atende em mais de uma cidade.', null, 30, array['Tudo do Destaque', 'Anúncios em até 3 cidades', 'Suporte prioritário'], false)
on conflict do nothing;
