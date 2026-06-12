const STORAGE_KEY = 'psicosaude_nr1_completo_v2_prod_safe';
const CONFIG = window.PSICOSAUDE_CONFIG || { mode:'demo', supabaseUrl:'', supabaseAnonKey:'', allowLegacyStateSync:false };
const IS_PRODUCTION = CONFIG.mode === 'production';
const MIN_SAMPLE = 5;
const dimensions = ['Sobrecarga e ritmo','Demandas emocionais','Autonomia e controle','Apoio da liderança','Reconhecimento','Conflitos e assédio','Clareza de papel','Segurança psicológica','Equilíbrio trabalho-vida','Respeito, diversidade e discriminação','Estresse','Ansiedade','Depressão'];
const scoreToRisk = (score) => score >= 75 ? 'critico' : score >= 60 ? 'alto' : score >= 40 ? 'moderado' : 'baixo';
const uid = (p='id') => `${p}-${Date.now()}-${Math.random().toString(16).slice(2,7)}`;
const esc = (v='') => String(v).replace(/[&<>"]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

const serviceCatalog = [
  {id:'serv-vila-reencontro',name:'Vila Reencontro',area:'Assistência Social / Moradia Transitória',description:'Serviço de moradia transitória em unidades modulares, 24h, voltado à autonomia, cogestão e saída qualificada.',reference:'Decreto 62.149/2023; Portaria 105/SMADS/2024; Portaria 47/SMADS/2023; Plano de Trabalho ASCOM Vila Guaianases I'},
  {id:'serv-centro-acolhida',name:'Centro de Acolhida',area:'Assistência Social / Acolhimento 24h',description:'Serviço de acolhida para pessoas adultas em situação de rua, com funcionamento contínuo, pernoite, alimentação e acompanhamento socioassistencial.',reference:'Portaria 46/SMADS/2010; Resolução CNAS 109/2009; registros COMAS/SMADS'},
  {id:'serv-cei-creche',name:'CEI / Creche Conveniada',area:'Educação Infantil',description:'Serviço de educação infantil para crianças pequenas, com cuidado, desenvolvimento integral, rotina pedagógica, alimentação e vínculo com famílias.',reference:'Site ASCOM: categoria CRECHES; normas SME e legislação de educação infantil'},
  {id:'serv-cca',name:'CCA / Jovens',area:'Convivência e Fortalecimento de Vínculos',description:'Serviço socioeducativo para crianças, adolescentes e jovens, com convivência, oficinas, atividades culturais, esportivas e apoio às famílias.',reference:'Site ASCOM: categoria JOVENS; Tipificação Nacional dos Serviços Socioassistenciais'},
  {id:'serv-saica-abrigo',name:'Abrigo / SAICA',area:'Acolhimento Crianças e Adolescentes',description:'Serviço de acolhimento institucional para crianças e adolescentes em medida protetiva, com cuidado integral e trabalho de reintegração familiar quando possível.',reference:'Site ASCOM: categoria ABRIGOS; ECA; Tipificação Nacional'},
  {id:'serv-administrativo',name:'Administrativo / Sede',area:'Gestão Institucional',description:'Estrutura administrativa, RH, financeiro, prestação de contas, compras, comunicação, governança e suporte às unidades.',reference:'Estrutura institucional ASCOM'}
];

const functionCatalog = [
  // Vila Reencontro — extraído do plano de trabalho da ASCOM para Vila Guaianases I e Portaria 47/SMADS/2023
  {id:'f-vr-coordenador',serviceTypeId:'serv-vila-reencontro',title:'Coordenador 40h',area:'Gestão do Serviço',description:'Coordena todas as atividades, supervisiona equipe, garante direitos, acompanha indicadores, SISA, articulação institucional, gestão e prestação de contas.',skills:['liderança','gestão de equipe','SISA','articulação de rede','indicadores','prestação de contas'],openPositions:1},
  {id:'f-vr-assistente-social',serviceTypeId:'serv-vila-reencontro',title:'Assistente Social 30h',area:'Equipe Técnica',description:'Realiza acolhimento, escuta, estudos sociais, PIA/PDF, encaminhamentos, referência e contrarreferência e articulação com a rede.',skills:['acolhimento','estudo social','relatórios','articulação de rede','PIA','direitos sociais'],openPositions:4},
  {id:'f-vr-psicologo',serviceTypeId:'serv-vila-reencontro',title:'Psicólogo 40h',area:'Equipe Técnica',description:'Atuação em psicologia comunitária, acolhimento, grupos, integração comunitária, autonomia, referência de casos e cuidado ético.',skills:['escuta qualificada','psicologia comunitária','grupos','saúde mental','mediação','confidencialidade'],openPositions:4},
  {id:'f-vr-aux-admin',serviceTypeId:'serv-vila-reencontro',title:'Auxiliar Administrativo 40h',area:'Administrativo Local',description:'Digitação, planilhas, documentos, agendas, atendimento, prestação de contas e manutenção de dados nos sistemas da SMADS.',skills:['planilhas','documentos','prestação de contas','atendimento','SISA','organização'],openPositions:2},
  {id:'f-vr-pedagogo',serviceTypeId:'serv-vila-reencontro',title:'Pedagogo / Profissional de Ciências Humanas',area:'Educação e Projetos',description:'Elabora, executa e avalia projetos e ações educativas para crianças, adolescentes, jovens e adultos em vulnerabilidade.',skills:['projetos educativos','articulação escolar','oficinas','planejamento','avaliação pedagógica'],openPositions:1},
  {id:'f-vr-supervisor-cogestao',serviceTypeId:'serv-vila-reencontro',title:'Supervisor de Cogestão e Inserção Laboral',area:'Cogestão e Trabalho',description:'Promove participação, cogestão, protagonismo, capacitação, descoberta de talentos e inserção no mundo do trabalho.',skills:['cogestão','inserção laboral','parcerias','capacitação','protagonismo','mediação'],openPositions:1},
  {id:'f-vr-supervisor-saude',serviceTypeId:'serv-vila-reencontro',title:'Supervisor de Saúde, Educação e Acompanhamento Social',area:'Supervisão Técnica',description:'Facilita acesso a serviços básicos, orienta equipe técnica, apoia casos complexos e acompanha famílias após saída qualificada.',skills:['supervisão técnica','saúde','educação','rede de proteção','casos complexos','acompanhamento social'],openPositions:1},
  {id:'f-vr-assistente-campo-dia',serviceTypeId:'serv-vila-reencontro',title:'Assistente de Campo 12x36 Diurno',area:'Atendimento Direto',description:'Suporte às atividades gerais, convivência, registro, distribuição de itens, oficinas, espaços coletivos e rotina da vila.',skills:['rotina','convivência','acolhimento','registro','oficinas','mediação'],openPositions:8},
  {id:'f-vr-assistente-campo-noite',serviceTypeId:'serv-vila-reencontro',title:'Assistente de Campo 12x36 Noturno',area:'Atendimento Direto',description:'Suporte às atividades gerais no período noturno, convivência, segurança relacional, registros e rotina 24h.',skills:['rotina noturna','convivência','acolhimento','registro','mediação','plantão'],openPositions:8},
  {id:'f-vr-cozinheiro',serviceTypeId:'serv-vila-reencontro',title:'Cozinheiro 12x36',area:'Alimentação',description:'Preparo diário de refeições e apoio ao coletivo de cogestão da cozinha e refeitório.',skills:['preparo de alimentos','boas práticas','organização','trabalho em equipe','cozinha coletiva'],openPositions:3},
  {id:'f-vr-aux-cozinha',serviceTypeId:'serv-vila-reencontro',title:'Auxiliar de Cozinha 12x36',area:'Alimentação',description:'Auxilia o cozinheiro na preparação, organização e limpeza do espaço da cozinha.',skills:['higiene','organização','apoio à cozinha','boas práticas','trabalho em equipe'],openPositions:4},
  {id:'f-vr-manutencao',serviceTypeId:'serv-vila-reencontro',title:'Responsável de Manutenção Predial',area:'Infraestrutura',description:'Realiza instalações elétricas, hidráulicas, sanitárias, ar-condicionado e controle de materiais de manutenção.',skills:['elétrica','hidráulica','manutenção','estoque','segurança'],openPositions:2},
  {id:'f-vr-asg',serviceTypeId:'serv-vila-reencontro',title:'Auxiliar de Serviços Gerais',area:'Infraestrutura',description:'Limpeza, organização e manutenção dos espaços, contribuindo com socialização e integração da população atendida.',skills:['limpeza','organização','rotina','trabalho em equipe','cuidado com espaços'],openPositions:2},

  // Centro de Acolhida / Abrigos adultos
  {id:'f-ca-gerente',serviceTypeId:'serv-centro-acolhida',title:'Gerente / Coordenador de Centro de Acolhida',area:'Gestão do Serviço',description:'Gerencia serviço 24h, equipe, fluxos de acolhida, indicadores, articulação com SMADS e rede socioassistencial.',skills:['liderança','gestão 24h','rede socioassistencial','indicadores','gestão de crise'],openPositions:1},
  {id:'f-ca-assistente-social',serviceTypeId:'serv-centro-acolhida',title:'Assistente Social',area:'Equipe Técnica',description:'Atendimento social, encaminhamentos, benefícios, documentação, PIA e articulação com rede.',skills:['atendimento social','benefícios','documentação','relatórios','rede'],openPositions:2},
  {id:'f-ca-psicologo',serviceTypeId:'serv-centro-acolhida',title:'Psicólogo',area:'Equipe Técnica',description:'Acolhimento psicossocial, grupos, manejo de crise, mediação e encaminhamentos sigilosos.',skills:['acolhimento','grupos','manejo de crise','mediação','saúde mental'],openPositions:1},
  {id:'f-ca-orientador',serviceTypeId:'serv-centro-acolhida',title:'Orientador Socioeducativo / Agente Operacional',area:'Atendimento Direto',description:'Apoia a rotina, convivência, acolhidas, registros, mediação e cuidados cotidianos no serviço.',skills:['rotina','convivência','acolhida','registro','mediação'],openPositions:8},
  {id:'f-ca-admin',serviceTypeId:'serv-centro-acolhida',title:'Auxiliar Administrativo',area:'Administrativo Local',description:'Documentos, planilhas, atendimento, controle administrativo, frequência e suporte ao gestor.',skills:['planilhas','documentos','atendimento','organização','controle'],openPositions:1},
  {id:'f-ca-cozinheiro',serviceTypeId:'serv-centro-acolhida',title:'Cozinheiro',area:'Alimentação',description:'Preparo de refeições em rotina coletiva e cumprimento de boas práticas.',skills:['cozinha','boas práticas','organização','trabalho em equipe'],openPositions:2},
  {id:'f-ca-asg',serviceTypeId:'serv-centro-acolhida',title:'Auxiliar de Serviços Gerais',area:'Infraestrutura',description:'Limpeza, organização e manutenção cotidiana dos espaços coletivos.',skills:['limpeza','organização','rotina','cuidado com espaços'],openPositions:3},

  // CEI / Creches
  {id:'f-cei-diretor',serviceTypeId:'serv-cei-creche',title:'Diretor(a) de CEI',area:'Gestão Educacional',description:'Gestão pedagógica, administrativa, equipe, famílias, documentação e relacionamento com SME.',skills:['gestão pedagógica','liderança','famílias','documentação','SME'],openPositions:1},
  {id:'f-cei-coordenador-pedagogico',serviceTypeId:'serv-cei-creche',title:'Coordenador(a) Pedagógico(a)',area:'Pedagógico',description:'Acompanha planejamento pedagógico, formação da equipe, registros e desenvolvimento infantil.',skills:['planejamento pedagógico','formação','registros','desenvolvimento infantil','escuta'],openPositions:1},
  {id:'f-cei-professor',serviceTypeId:'serv-cei-creche',title:'Professor(a) de Educação Infantil',area:'Pedagógico',description:'Organiza experiências de aprendizagem, cuidado, brincadeiras, registros e relação com famílias.',skills:['educação infantil','brincar','observação','registros','famílias'],openPositions:8},
  {id:'f-cei-adi',serviceTypeId:'serv-cei-creche',title:'Auxiliar de Desenvolvimento Infantil',area:'Cuidado e Educação',description:'Apoia cuidado, alimentação, higiene, rotina, brincadeiras e desenvolvimento integral das crianças.',skills:['cuidado infantil','higiene','rotina','brincar','acolhimento'],openPositions:10},
  {id:'f-cei-cozinha',serviceTypeId:'serv-cei-creche',title:'Cozinheiro(a) / Lactarista',area:'Alimentação Escolar',description:'Preparo de refeições e alimentação infantil com atenção a boas práticas e necessidades específicas.',skills:['alimentação infantil','boas práticas','organização','higiene'],openPositions:2},
  {id:'f-cei-asg',serviceTypeId:'serv-cei-creche',title:'Auxiliar de Limpeza',area:'Infraestrutura',description:'Limpeza, organização e cuidado com ambientes de uso infantil.',skills:['limpeza','organização','segurança infantil','rotina'],openPositions:2},

  // CCA / Jovens
  {id:'f-cca-gerente',serviceTypeId:'serv-cca',title:'Gerente de Serviço / CCA',area:'Gestão do Serviço',description:'Coordena serviço socioeducativo, equipe, planejamento, famílias, rede e indicadores.',skills:['liderança','planejamento','rede','indicadores','famílias'],openPositions:1},
  {id:'f-cca-orientador',serviceTypeId:'serv-cca',title:'Orientador Socioeducativo',area:'Socioeducativo',description:'Planeja e executa oficinas, convivência, escuta, mediação e fortalecimento de vínculos.',skills:['oficinas','convivência','escuta','mediação','vínculos'],openPositions:4},
  {id:'f-cca-arte-educador',serviceTypeId:'serv-cca',title:'Arte-Educador / Oficineiro',area:'Socioeducativo',description:'Desenvolve atividades culturais, artísticas, esportivas e de expressão com crianças, adolescentes e jovens.',skills:['arte','cultura','esporte','oficinas','criatividade'],openPositions:2},
  {id:'f-cca-admin',serviceTypeId:'serv-cca',title:'Auxiliar Administrativo',area:'Administrativo Local',description:'Apoio administrativo, listas, documentos, agenda, prestação de informações e registros.',skills:['planilhas','documentos','registros','atendimento'],openPositions:1},

  // SAICA / Abrigos
  {id:'f-saica-coordenador',serviceTypeId:'serv-saica-abrigo',title:'Coordenador(a) de SAICA / Abrigo',area:'Gestão do Serviço',description:'Coordena acolhimento institucional, equipe, PIA, rede de proteção, família e garantia de direitos.',skills:['acolhimento institucional','ECA','liderança','rede de proteção','PIA'],openPositions:1},
  {id:'f-saica-assistente-social',serviceTypeId:'serv-saica-abrigo',title:'Assistente Social',area:'Equipe Técnica',description:'Estudos sociais, família, rede, relatórios, audiências, reintegração familiar e garantia de direitos.',skills:['estudo social','relatórios','família','rede','ECA'],openPositions:1},
  {id:'f-saica-psicologo',serviceTypeId:'serv-saica-abrigo',title:'Psicólogo',area:'Equipe Técnica',description:'Acompanhamento psicossocial de crianças/adolescentes, famílias e equipe, escuta e elaboração de relatórios.',skills:['escuta','infância','família','relatórios','saúde mental'],openPositions:1},
  {id:'f-saica-educador',serviceTypeId:'serv-saica-abrigo',title:'Educador / Cuidador Social',area:'Cuidado Direto',description:'Rotina, cuidado, convivência, acompanhamento diário, proteção, atividades e vínculo com acolhidos.',skills:['cuidado','rotina','convivência','proteção','vínculo'],openPositions:8},
  {id:'f-saica-cozinha',serviceTypeId:'serv-saica-abrigo',title:'Cozinheiro(a)',area:'Alimentação',description:'Preparo de refeições e organização da cozinha do serviço.',skills:['cozinha','boas práticas','organização'],openPositions:1},
  {id:'f-saica-asg',serviceTypeId:'serv-saica-abrigo',title:'Auxiliar de Serviços Gerais',area:'Infraestrutura',description:'Limpeza, lavanderia, organização e cuidado com espaços do abrigo.',skills:['limpeza','lavanderia','organização','rotina'],openPositions:2},

  // Administrativo
  {id:'f-adm-rh',serviceTypeId:'serv-administrativo',title:'Analista de RH',area:'RH Corporativo',description:'Recrutamento, integração, desenvolvimento, clima, indicadores, LGPD e suporte às unidades.',skills:['recrutamento','treinamento','indicadores','LGPD','comunicação'],openPositions:2},
  {id:'f-adm-financeiro',serviceTypeId:'serv-administrativo',title:'Analista Financeiro / Prestação de Contas',area:'Financeiro',description:'Controle financeiro, prestação de contas, compras, notas, orçamento e relatórios.',skills:['financeiro','prestação de contas','planilhas','orçamento','organização'],openPositions:1},
  {id:'f-adm-compras',serviceTypeId:'serv-administrativo',title:'Compras / Almoxarifado',area:'Suprimentos',description:'Compras, controle de estoque, fornecedores, entregas e suporte às unidades.',skills:['compras','estoque','fornecedores','organização','negociação'],openPositions:1},
  {id:'f-adm-diretoria',serviceTypeId:'serv-administrativo',title:'Coordenação / Diretoria Institucional',area:'Governança',description:'Gestão estratégica da OSC, parcerias, contratos, comunicação institucional e governança.',skills:['governança','parcerias','contratos','liderança','estratégia'],openPositions:1}
];

const company = { id:'org-ascom', name:'ASCOM — Associação Comunitária São Mateus', cnpj:'02.620.604/0001-66', segment:'Assistência social, educação, acolhimento e desenvolvimento comunitário', size:'Multiunidades', responsible:'Diretoria / RH', email:'contato@ascom.org.br', phone:'11 2017-2297', description:'Organização sem fins lucrativos com atuação em assistência social, creches, jovens, abrigos, Vilas Reencontro e serviços de acolhimento. Estrutura baseada nas categorias do site institucional da ASCOM e em planos/portarias SMADS.', serviceTypes:serviceCatalog, units:[
  {id:'u-vrg1',name:'Vila Reencontro Guaianases I — Mestre Valentim',area:'Acolhimento / Moradia Transitória',serviceTypeId:'serv-vila-reencontro',employees:41},
  {id:'u-vrct',name:'Vila Reencontro Cidade Tiradentes',area:'Acolhimento / Moradia Transitória',serviceTypeId:'serv-vila-reencontro',employees:34},
  {id:'u-ca-bento',name:'C.A. Bento do Portão',area:'Centro de Acolhida 24h',serviceTypeId:'serv-centro-acolhida',employees:30},
  {id:'u-cei-modelo',name:'CEI / Creche ASCOM',area:'Educação Infantil',serviceTypeId:'serv-cei-creche',employees:24},
  {id:'u-cca-jovens',name:'CCA / Jovens ASCOM',area:'Convivência e Fortalecimento de Vínculos',serviceTypeId:'serv-cca',employees:12},
  {id:'u-abrigo-modelo',name:'Abrigo / SAICA ASCOM',area:'Acolhimento Crianças e Adolescentes',serviceTypeId:'serv-saica-abrigo',employees:16},
  {id:'u-adm',name:'Sede Administrativa ASCOM',area:'Gestão Institucional',serviceTypeId:'serv-administrativo',employees:17}], functions:functionCatalog
};
const employees = [
  ['c-ana','Ana Paula','u-vrct','Assistente Social',['liderança','gestão de conflitos','indicadores'],'Atuar na coordenação de uma unidade socioassistencial.','f-vr-coordenador'],
  ['c-marcos','Marcos Lima','u-vrct','Orientador Socioeducativo',['psicologia','grupos','saúde mental'],'Cursar psicologia e atuar com grupos.','f-vr-psicologo'],
  ['c-livia','Lívia Santos','u-vrg2','Técnica de Referência',['liderança','comunicação','mediação'],'Ser supervisora e melhorar fluxos de equipe.','f-vr-coordenador'],
  ['c-joao','João Pedro','u-vrg2','Auxiliar Administrativo',['recrutamento','treinamento','dados'],'Trabalhar na área de RH.','f-adm-rh'],
  ['c-priscila','Priscila Gomes','u-adm','Analista Administrativo',['LGPD','indicadores','treinamento'],'Desenvolver carreira em gestão de pessoas.','f-adm-rh'],
  ['c-roberto','Roberto Almeida','u-vrct','Educador Social',['comunicação','acolhimento','mediação'],'Ser referência em mediação de conflitos.','f-ca-orientador'],
  ['c-camila','Camila Rocha','u-vrg2','Psicóloga',['liderança','indicadores','saúde mental'],'Liderar projetos de cuidado institucional.','f-vr-coordenador'],
  ['c-daniel','Daniel Costa','u-adm','Assistente de RH',['treinamento','recrutamento','comunicação'],'Atuar com desenvolvimento de pessoas.','f-adm-rh'],
  ['c-bruna','Bruna Martins','u-vrct','Orientadora Social',['acolhimento','rotina','mediação'],'Aprimorar o trabalho com famílias e convivência.','f-ca-orientador'],
  ['c-victor','Victor Nunes','u-vrct','Educador Social',['liderança','comunicação','indicadores'],'Assumir futuramente uma coordenação de turno.','f-vr-coordenador'],
  ['c-renata','Renata Alves','u-vrct','Auxiliar de Limpeza',['treinamento','rotina','comunicação'],'Migrar para função administrativa.','f-adm-rh'],
  ['c-paulo','Paulo Henrique','u-vrg2','Orientador Socioeducativo',['acolhimento','mediação','convivência'],'Fortalecer práticas de mediação na unidade.','f-ca-orientador'],
  ['c-natalia','Natália Pereira','u-vrg2','Assistente Social',['liderança','relatórios','indicadores'],'Atuar na supervisão técnica.','f-vr-coordenador'],
  ['c-gustavo','Gustavo Reis','u-vrg2','Educador Social',['grupos','saúde mental','acolhimento'],'Conduzir grupos e oficinas terapêuticas.','f-vr-psicologo'],
  ['c-simone','Simone Rocha','u-adm','Analista de RH',['LGPD','treinamento','indicadores'],'Implantar universidade corporativa.','f-adm-rh'],
  ['c-elaine','Elaine Moura','u-adm','Financeiro',['dados','comunicação','treinamento'],'Atuar com controles e indicadores de RH.','f-adm-rh'],
  ['c-ricardo','Ricardo Melo','u-adm','Coordenador Administrativo',['liderança','gestão de conflitos','indicadores'],'Apoiar a integração entre unidades.','f-vr-coordenador']
].map(([id,name,unitId,functionTitle,interests,dreams,targetFunctionId])=>({
  id,
  name,
  unitId,
  functionTitle,
  interests,
  dreams,
  targetFunctionId,
  // Associate each collaborator with the current company and a default password.  These fields
  // allow per-company user management and individualized credentials.
  companyId: company.id,
  password: '1234',
  // Indicates whether the collaborator must change their password on first login.
  // Existing demo employees are set to false by default. New hires will be set to true.
  needsPasswordChange: false
}));

// Simple credential mapping for collaborators.  Map each collaborator ID to their password.
// If a password property exists on the employee object, use it; otherwise fall back to '1234'.
const credentials = employees.reduce((acc, e) => { acc[e.id] = e.password || '1234'; return acc; }, {});

// Administrator password (for admin login). In a real system this should be stored securely.
const adminPassword = 'admin123';
const questionnaires = [
  {id:'q-nr1-core',name:'Inventário Psicossocial Organizacional — NR-1',type:'organizational',scale:'1 = Discordo totalmente | 5 = Concordo totalmente',description:'Instrumento operacional baseado em dimensões reconhecidas de risco psicossocial no trabalho. Uso coletivo e preventivo; não gera diagnóstico clínico individual.',questions:[
    ['q1','Sobrecarga e ritmo','Tenho volume de trabalho acima do que consigo realizar com qualidade no tempo disponível.','direct'],['q2','Sobrecarga e ritmo','O ritmo de trabalho exige pressa constante durante a maior parte da jornada.','direct'],['q3','Demandas emocionais','Meu trabalho exige lidar frequentemente com sofrimento, conflito, violência ou situações emocionalmente intensas.','direct'],['q4','Demandas emocionais','Depois do expediente, tenho dificuldade de me desligar emocionalmente das situações do trabalho.','direct'],['q5','Autonomia e controle','Tenho margem para organizar a forma como executo minhas atividades.','reverse'],['q6','Autonomia e controle','Posso participar de decisões que afetam diretamente minha rotina de trabalho.','reverse'],['q7','Apoio da liderança','Recebo apoio da liderança quando surgem dificuldades no trabalho.','reverse'],['q8','Apoio da liderança','A liderança comunica prioridades e mudanças de forma clara.','reverse'],['q9','Reconhecimento','Sinto que meu esforço é reconhecido pela organização.','reverse'],['q10','Reconhecimento','Existe equilíbrio entre as cobranças recebidas e os recursos oferecidos para trabalhar bem.','reverse'],['q11','Conflitos e assédio','Percebo conflitos frequentes, tratamento desrespeitoso ou situações de humilhação no ambiente de trabalho.','direct'],['q12','Conflitos e assédio','Tenho receio de sofrer retaliação ao relatar problemas ou discordar de decisões.','direct'],['q13','Clareza de papel','Tenho clareza sobre minhas responsabilidades, limites de atuação e prioridades.','reverse'],['q14','Clareza de papel','Recebo orientações contraditórias de pessoas ou setores diferentes.','direct'],['q15','Segurança psicológica','Sinto que posso pedir ajuda ou admitir dificuldade sem ser julgado.','reverse'],['q16','Segurança psicológica','Na minha equipe, as pessoas conseguem conversar sobre erros e melhorar processos sem culpabilização.','reverse'],['q17','Equilíbrio trabalho-vida','As demandas do trabalho interferem negativamente no meu descanso, família ou vida pessoal.','direct'],['q18','Equilíbrio trabalho-vida','Consigo me recuperar física e emocionalmente entre uma jornada e outra.','reverse']].map(([id,dimension,text,riskDirection])=>({id,dimension,text,riskDirection}))},
  {id:'q-dass21-screening',name:'DASS-21 — Rastreio complementar',type:'screening',scale:'0 = Não se aplicou | 3 = Aplicou-se muito/na maior parte do tempo',description:'Rastreio complementar de depressão, ansiedade e estresse. Deve ser usado como triagem e orientação de cuidado, não como diagnóstico clínico.',questions:[
    ['d1','Estresse','Tive dificuldade para relaxar nos últimos dias.'],['d2','Ansiedade','Percebi minha boca seca sem motivo aparente.'],['d3','Depressão','Tive dificuldade em sentir entusiasmo por coisas positivas.'],['d4','Ansiedade','Senti dificuldade para respirar sem relação direta com esforço físico.'],['d5','Depressão','Tive dificuldade para iniciar atividades ou tomar iniciativa.'],['d6','Estresse','Tive reações exageradas diante de situações pequenas.'],['d7','Ansiedade','Senti tremores ou agitação corporal.'],['d8','Estresse','Senti que estava gastando muita energia nervosa.'],['d9','Ansiedade','Fiquei preocupado com situações em que poderia entrar em pânico ou perder o controle.'],['d10','Depressão','Senti que não tinha nada positivo para esperar.'],['d11','Estresse','Percebi que estava ficando irritado com facilidade.'],['d12','Estresse','Senti dificuldade para desacelerar.'],['d13','Depressão','Senti tristeza ou desânimo intenso.'],['d14','Estresse','Fiquei intolerante com interrupções ou imprevistos.'],['d15','Ansiedade','Senti-me próximo de entrar em pânico.'],['d16','Depressão','Tive dificuldade de me interessar por qualquer coisa.'],['d17','Depressão','Senti que eu tinha pouco valor como pessoa.'],['d18','Estresse','Senti que estava muito sensível ou prestes a explodir.'],['d19','Ansiedade','Percebi alterações no coração sem esforço físico, como batimentos acelerados.'],['d20','Ansiedade','Senti medo sem uma razão clara.'],['d21','Depressão','Senti que a vida estava sem sentido.']].map(([id,dimension,text])=>({id,dimension,text,riskDirection:'direct'}))}
];
const courses = [
  {id:'course-cnv',title:'Comunicação Não Violenta e Relações de Trabalho',category:'Comunicação e Habilidades Sociais',duration:'4 horas',description:'Curso introdutório sobre Comunicação Não Violenta aplicada ao ambiente de trabalho, com foco em escuta, observação sem julgamento, sentimentos, necessidades, pedidos e manejo de conflitos.',recommendedFor:['Conflitos e assédio','Segurança psicológica','Apoio da liderança','Clareza de papel'],modules:['Fundamentos da Comunicação Não Violenta','Observação sem julgamento','Sentimentos e necessidades','Pedidos possíveis','Escuta empática','Transformação de conflitos','Quiz e atividade prática'],contentUrl:'https://zikbeixejgdbtlsqundn.supabase.co/storage/v1/object/public/course-content/curso1-cnv.html',contentType:'html',sortOrder:1},
  {id:'course-saude-mental',title:'Saúde Mental no Trabalho e Prevenção do Esgotamento',category:'Saúde Mental e Autocuidado',duration:'4 horas',description:'Curso sobre saúde mental no trabalho, reconhecimento de sinais de sofrimento, estresse, sobrecarga e burnout, com estratégias de autocuidado e busca de apoio sem caráter diagnóstico.',recommendedFor:['Sobrecarga e ritmo','Demandas emocionais','Equilíbrio trabalho-vida','Respeito, diversidade e discriminação','Estresse','Ansiedade','Depressão'],modules:['O que é saúde mental no trabalho','Estresse, sofrimento e esgotamento','Sinais físicos, emocionais e comportamentais','Sobrecarga e limites','Recuperação e autocuidado','Quando buscar apoio','Atividade prática e quiz'],contentUrl:'https://zikbeixejgdbtlsqundn.supabase.co/storage/v1/object/public/course-content/curso2-saude-mental.html',contentType:'html',sortOrder:2},
  {id:'course-seguranca-psicologica',title:'Segurança Psicológica, Respeito e Prevenção de Assédio',category:'Clima, Cultura e Prevenção de Assédio',duration:'4 horas',description:'Curso sobre segurança psicológica, respeito nas relações de trabalho, diferenciação entre cobrança, feedback e humilhação, prevenção de assédio e uso de canais de apoio.',recommendedFor:['Segurança psicológica','Conflitos e assédio','Apoio da liderança','Reconhecimento','Clareza de papel'],modules:['O que é segurança psicológica','Respeito nas relações de trabalho','Assédio, discriminação e violência','Cobrança, feedback e humilhação','Como agir como testemunha','Canais de apoio','Responsabilidade coletiva','Quiz e estudo de casos'],contentUrl:'https://zikbeixejgdbtlsqundn.supabase.co/storage/v1/object/public/course-content/curso3-seguranca-psicologica.html',contentType:'html',sortOrder:3}
];

const courseQuizBank = {
  cnv: [
    {q:'Na Comunicação Não Violenta, qual sequência ajuda a reduzir julgamentos e conflitos?', opts:['Acusação, punição, cobrança e silêncio','Observação, sentimento, necessidade e pedido','Ordem, ameaça, comparação e conclusão'], a:1},
    {q:'Qual frase está mais próxima de um pedido claro e respeitoso?', opts:['Você nunca colabora com nada.','Preciso que você entregue o relatório até sexta, consegue me confirmar?','Se você não fizer, vou levar para a coordenação.'], a:1},
    {q:'Escuta empática significa:', opts:['Concordar com tudo que a pessoa diz','Ouvir para responder rapidamente','Tentar compreender antes de julgar ou reagir'], a:2}
  ],
  saude: [
    {q:'O objetivo do curso de saúde mental no trabalho é:', opts:['Diagnosticar colaboradores individualmente','Reconhecer sinais, prevenir esgotamento e orientar busca de apoio','Substituir acompanhamento psicológico ou médico'], a:1},
    {q:'Sinais de esgotamento podem envolver:', opts:['Apenas preguiça ou falta de vontade','Aspectos físicos, emocionais e comportamentais','Somente problemas pessoais fora do trabalho'], a:1},
    {q:'Uma atitude preventiva adequada é:', opts:['Ignorar sinais até passar sozinho','Buscar apoio, pactuar limites e cuidar da recuperação','Expor publicamente quem está sofrendo'], a:1}
  ],
  seguranca: [
    {q:'Segurança psicológica no trabalho significa:', opts:['Ausência de cobrança e metas','Poder falar, pedir ajuda e relatar problemas sem medo de humilhação ou retaliação','Permitir qualquer comportamento sem limite'], a:1},
    {q:'Uma situação de humilhação ou discriminação deve ser:', opts:['Tratada como brincadeira sempre','Ignorada para evitar conflito','Levadas a sério pelos canais responsáveis'], a:2},
    {q:'Feedback adequado deve ser:', opts:['Específico, respeitoso e voltado à melhoria','Público, constrangedor e punitivo','Baseado em rótulos pessoais'], a:0}
  ]
};

function quizKeyForCourse(c){
  const t = (c?.title || '').toLowerCase();
  if (t.includes('comunicação') || t.includes('violenta') || t.includes('cnv')) return 'cnv';
  if (t.includes('saúde mental') || t.includes('esgotamento') || t.includes('burnout')) return 'saude';
  if (t.includes('segurança psicológica') || t.includes('assédio') || t.includes('respeito')) return 'seguranca';
  return 'saude';
}
function quizForCourse(c){ return courseQuizBank[quizKeyForCourse(c)] || courseQuizBank.saude; }

const ombudsmanReports = [
{id:'o-1',unitId:'u-vrct',category:'Comunicação',status:'em análise',anonymous:true,description:'Relato sobre mudanças de escala comunicadas com pouco prazo.',createdAt:new Date().toISOString()},
{id:'o-2',unitId:'u-vrg2',category:'Conflitos',status:'encaminhado',anonymous:true,description:'Solicitação de mediação para conflitos entre turnos.',createdAt:new Date().toISOString()},
{id:'o-3',unitId:'u-adm',category:'Sobrecarga',status:'resolvido',anonymous:true,description:'Pedido de revisão de demandas em período de fechamento.',createdAt:new Date().toISOString()}
];
function generateResponses(){
  const core=questionnaires[0], dass=questionnaires[1];
  const patterns={'u-vrct':[4,4,5,4,2,2,2,2,2,2,4,4,3,4,2,2,4,2],'u-vrg2':[3,4,4,4,3,3,3,3,2,3,3,2,3,3,3,3,4,3],'u-adm':[2,2,2,2,4,4,4,4,3,4,2,1,4,2,4,4,2,4]};
  const dassProfiles={'u-vrct':[2,1,2,1,2,2,1,2,1,2,2,2,2,2,1,2,1,2,1,1,1],'u-vrg2':[1,1,1,0,1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1],'u-adm':[1,0,1,0,0,1,0,1,0,0,1,1,0,1,0,0,0,1,0,0,0]};
  return employees.flatMap((e,ei)=>{
    const coreRows=core.questions.map((q,i)=>({id:`r-${e.id}-${q.id}`,employeeId:e.id,unitId:e.unitId,questionnaireId:core.id,questionId:q.id,dimension:q.dimension,value:Math.max(1,Math.min(5,(patterns[e.unitId]||patterns['u-vrct'])[i]+(((ei+i)%3)-1))),createdAt:new Date(Date.now()-(ei+1)*86400000).toISOString()}));
    const dassRows=ei%2===0?dass.questions.map((q,i)=>({id:`r-${e.id}-${q.id}`,employeeId:e.id,unitId:e.unitId,questionnaireId:dass.id,questionId:q.id,dimension:q.dimension,value:Math.max(0,Math.min(3,(dassProfiles[e.unitId]||dassProfiles['u-vrct'])[i]+((ei+i)%2))),createdAt:new Date(Date.now()-(ei+2)*86400000).toISOString()})):[];
    return [...coreRows,...dassRows];
  });
}
const initialData = {
  company,
  employees,
  questionnaires,
  responses: generateResponses(),
  courses,
  courseEnrollments: [],
  talentProfiles: {},
  ombudsmanReports,
  // List of all companies managed in the system. Initially contains the demo company.
  companies: [company],
  // Currently selected company identifier. Used to switch context when managing multiple companies.
  currentCompanyId: company.id,
  // Track which employee is currently logged in (for collaborator mode)
  currentEmployeeId: null,
  // Internal flag to control whether the collaborator login form is shown on the login screen
  __loginShowCollab: false,
  // Internal flag to control whether the admin login form is shown on the login screen
  __loginShowAdmin: false,
  // Mapping of which collaborators have aceito o termo de ciência/LGPD
  // Each key is the employeeId and the value is a boolean indicating acceptance
  acceptedTerms: {}
};
// Initialize application state. First try to load from localStorage; remote (Supabase) loading occurs asynchronously below.
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || structuredClone(initialData);
// Restore the currently logged-in employee from localStorage if present
const savedEmp = localStorage.getItem('currentEmployeeId');
if (savedEmp) {
  state.currentEmployeeId = savedEmp;
}
// Ensure the acceptedTerms map exists to track LGPD/termo acceptance
if (!state.acceptedTerms || typeof state.acceptedTerms !== 'object') {
  state.acceptedTerms = {};
}

if (!Array.isArray(state.courseEnrollments)) state.courseEnrollments = [];
if (!state.talentProfiles || typeof state.talentProfiles !== 'object' || Array.isArray(state.talentProfiles)) state.talentProfiles = {};

// Ensure the admin login flag exists
if (state.__loginShowAdmin === undefined) {
  state.__loginShowAdmin = false;
}
// Ensure the companies list exists and the current company id is set
if (!state.companies || !Array.isArray(state.companies)) {
  state.companies = [state.company];
}
if (!state.currentCompanyId) {
  state.currentCompanyId = state.company?.id || (state.companies[0] && state.companies[0].id);
}
// Migration for older localStorage versions: add ASCOM service catalog and serviceTypeId links
if (!state.company.serviceTypes || !Array.isArray(state.company.serviceTypes)) {
  state.company.serviceTypes = serviceCatalog;
}
if (!state.company.functions || !state.company.functions.length || !state.company.functions[0].serviceTypeId) {
  state.company.functions = functionCatalog;
}
state.company.units = (state.company.units||[]).map(u => ({...u, serviceTypeId: u.serviceTypeId || (u.name||'').toLowerCase().includes('vila') ? (u.serviceTypeId || 'serv-vila-reencontro') : (u.serviceTypeId || 'serv-administrativo')}));
state.companies = state.companies.map(c => c.id===state.company.id ? state.company : c);
// Determine the initial route. If the stored role is collaborator, start at home; otherwise dashboard.
let role = localStorage.getItem('psicosaude_role') || '';
let route = role === 'Colaborador' ? 'home' : 'dashboard';

// ----- Supabase integration -----
// Supabase client. Em produção, o app usa Supabase Auth e tabelas normalizadas.
// O antigo app_state singleton fica bloqueado por padrão por ser inadequado para LGPD/produção.
const SUPABASE_URL = CONFIG.supabaseUrl || '';
const SUPABASE_ANON_KEY = CONFIG.supabaseAnonKey || '';
const ALLOW_LEGACY_STATE_SYNC = CONFIG.allowLegacyStateSync === true;
let supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Supabase client init failed', err);
  }
}

// Load state from Supabase table `app_state`. Returns true if loaded.
async function loadFromSupabase() {
  if (!supabaseClient || !ALLOW_LEGACY_STATE_SYNC) return false;
  try {
    const { data, error } = await supabaseClient
      .from('app_state')
      .select('state')
      .eq('id', 'singleton')
      .single();
    if (error) {
      console.error('Supabase load error', error);
      return false;
    }
    if (data && data.state) {
      try {
        const remoteState = JSON.parse(data.state);
        if (remoteState) {
          state = remoteState;
          return true;
        }
      } catch (e) {
        console.error('Invalid JSON in remote state', e);
      }
    }
  } catch (err) {
    console.error('Supabase load exception', err);
  }
  return false;
}

// Save current state to Supabase table `app_state`. Ignores errors.
async function saveToSupabase() {
  if (!supabaseClient || !ALLOW_LEGACY_STATE_SYNC) return;
  try {
    await supabaseClient.from('app_state').upsert({ id: 'singleton', state: JSON.stringify(state) });
  } catch (err) {
    console.error('Supabase save error', err);
  }
}
function save(){
  // Persist state locally for offline use
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Also persist state remotely if Supabase is configured
  if (typeof saveToSupabase === 'function') {
    // Fire-and-forget; we do not await to keep UI responsive
    try { saveToSupabase(); } catch(e) { console.error(e); }
  }
}

async function loginSupabaseAuth(){
  if (!supabaseClient) {
    alert('Supabase não configurado. Preencha www/config.js com URL e anon key.');
    return;
  }
  const email = document.getElementById('auth-email')?.value || '';
  const password = document.getElementById('auth-password')?.value || '';
  if (!email || !password) {
    alert('Informe e-mail e senha.');
    return;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Login inválido: ' + error.message);
    return;
  }
  const userId = data?.user?.id;
  if (!userId) {
    alert('Não foi possível identificar o usuário autenticado.');
    return;
  }
  const { data: profile, error: pError } = await supabaseClient
    .from('profiles')
    .select('id, user_id, organization_id, unit_id, job_role_id, role, full_name, email, function_title, accepted_terms_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  if (pError || !profile) {
    alert('Usuário autenticado, mas sem perfil cadastrado no PsicoSaúde.');
    return;
  }
  state.authProfile = profile;
  state.currentEmployeeId = profile.id;
  state.currentCompanyId = profile.organization_id;
  localStorage.setItem('currentEmployeeId', profile.id);
  if (profile.role === 'super_admin') {
    role = 'Admin';
    route = 'companies';
  } else if (profile.role === 'org_admin' || profile.role === 'manager' || profile.role === 'consultant') {
    role = 'Gestão/RH';
    route = 'dashboard';
  } else {
    role = 'Colaborador';
    route = !profile.accepted_terms_at ? 'terms' : 'home';
  }
  await Promise.all([loadCoursesFromSupabase(), loadQuestionnairesFromSupabase(), loadCourseEnrollmentsFromSupabase(), loadOwnTalentProfileFromSupabase()]);
  await loadOwnResponsesFromSupabase();
  localStorage.setItem('psicosaude_role', role);
  save();
  render();
}

async function changePasswordSupabase(newPassword){
  if (!supabaseClient) return false;
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (error) {
    alert('Erro ao atualizar senha: ' + error.message);
    return false;
  }
  // Senha é gerenciada pelo Supabase Auth. Não salvamos senha nem flag sensível no frontend.
  return true;
}

async function acceptTermsSupabase(){
  if (!supabaseClient || !state.authProfile?.id) return false;
  const now = new Date().toISOString();
  const { error } = await supabaseClient.from('profiles').update({ accepted_terms_at: now }).eq('id', state.authProfile.id);
  if (error) {
    alert('Erro ao registrar termo: ' + error.message);
    return false;
  }
  state.authProfile.accepted_terms_at = now;
  return true;
}

function currentProductionOrgId(){
  return state.authProfile?.organization_id || CONFIG.defaultOrganizationId || '00000000-0000-0000-0000-000000000001';
}

function normalizeCourse(row){
  return {
    id: row.id,
    title: row.title || '',
    category: row.category || '',
    duration: row.duration || '',
    description: row.description || '',
    recommendedFor: row.recommended_for || row.recommendedFor || [],
    modules: row.modules || [],
    contentUrl: row.content_url || row.contentUrl || '',
    contentType: row.content_type || row.contentType || 'html',
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
    isActive: row.is_active ?? row.isActive ?? true
  };
}

async function loadCoursesFromSupabase(){
  if (!supabaseClient) return false;
  const orgId = currentProductionOrgId();
  const { data, error } = await supabaseClient
    .from('courses')
    .select('id,title,category,duration,description,recommended_for,modules,content_url,content_type,sort_order,is_active')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });
  if (error) {
    console.warn('Não foi possível carregar cursos do Supabase:', error.message);
    return false;
  }
  if (Array.isArray(data) && data.length) {
    state.courses = data.map(normalizeCourse);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  }
  return false;
}


function normalizeQuestionnaire(row, qs){
  const questions = (qs || [])
    .filter(q => q.questionnaire_id === row.id)
    .sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
    .map(q => ({
      id: q.id,
      code: q.code,
      dimension: q.dimension || '',
      text: q.text || '',
      riskDirection: q.risk_direction || q.riskDirection || 'direct',
      maxValue: q.max_value || q.maxValue || (row.code === 'dass21_screening' ? 3 : 5),
      sortOrder: q.sort_order || 0
    }));
  return {
    id: row.id,
    code: row.code || row.id,
    name: row.name || '',
    type: row.type || '',
    scale: row.scale || row.scale_label || '',
    description: row.description || '',
    isActive: row.is_active ?? true,
    questions
  };
}

function questionnaireMax(qn){
  const vals = (qn?.questions || []).map(q => Number(q.maxValue || q.max_value || 0)).filter(Boolean);
  if (vals.length) return Math.max(...vals);
  return (qn?.code === 'dass21_screening' || qn?.id === 'q-dass21-screening') ? 3 : 5;
}

async function loadQuestionnairesFromSupabase(){
  if (!supabaseClient) return false;
  const orgId = currentProductionOrgId();
  const { data: qns, error } = await supabaseClient
    .from('questionnaires')
    .select('id,organization_id,code,name,type,scale,description,is_active')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) {
    console.warn('Não foi possível carregar questionários do Supabase:', error.message);
    return false;
  }
  if (!Array.isArray(qns) || !qns.length) return false;
  const ids = qns.map(q => q.id);
  const { data: qs, error: qError } = await supabaseClient
    .from('questions')
    .select('id,questionnaire_id,code,dimension,text,risk_direction,max_value,sort_order')
    .in('questionnaire_id', ids)
    .order('sort_order', { ascending: true });
  if (qError) {
    console.warn('Não foi possível carregar perguntas do Supabase:', qError.message);
    return false;
  }
  state.questionnaires = qns.map(row => normalizeQuestionnaire(row, qs || []));
  if (!state.__q || !state.questionnaires.some(q => q.id === state.__q)) {
    const nr1 = state.questionnaires.find(q => q.code === 'nr1_psicossocial_core');
    state.__q = (nr1 || state.questionnaires[0]).id;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return true;
}

async function loadActiveCycleFromSupabase(){
  if (!supabaseClient) return null;
  const orgId = currentProductionOrgId();
  let res = await supabaseClient
    .from('assessment_cycles')
    .select('id,name,status,start_date,end_date')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (res.error) {
    // Compatibilidade com schema antigo, caso a tabela use starts_at/ends_at e status open.
    res = await supabaseClient
      .from('assessment_cycles')
      .select('id,name,status,starts_at,ends_at')
      .eq('organization_id', orgId)
      .eq('status', 'open')
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }
  if (res.error) {
    console.warn('Não foi possível carregar ciclo ativo:', res.error.message);
    return null;
  }
  return res.data || null;
}

async function loadOwnResponsesFromSupabase(){
  if (!supabaseClient || !state.authProfile?.id) return false;
  const { data, error } = await supabaseClient
    .from('psychosocial_responses')
    .select('id,organization_id,cycle_id,profile_id,unit_id,questionnaire_id,question_id,dimension,value,created_at')
    .eq('profile_id', state.authProfile.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('Não foi possível carregar suas respostas do Supabase:', error.message);
    return false;
  }
  state.responses = (data || []).map(r => ({
    id: r.id,
    employeeId: r.profile_id,
    unitId: r.unit_id,
    questionnaireId: r.questionnaire_id,
    questionId: r.question_id,
    dimension: r.dimension,
    value: Number(r.value),
    createdAt: r.created_at,
    cycleId: r.cycle_id
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return true;
}


function currentProfileId(){ return state.authProfile?.id || state.currentEmployeeId || 'local'; }
function enrollmentFor(courseId, profileId=currentProfileId()){
  return (state.courseEnrollments || []).find(e => String(e.courseId||e.course_id) === String(courseId) && String(e.profileId||e.profile_id) === String(profileId));
}
function courseStatusLabel(courseId){
  const e = enrollmentFor(courseId);
  if (!e) return '<span class="pill risk-moderado">avaliação pendente</span>';
  if ((e.status||'') === 'completed') return '<span class="pill risk-baixo">concluído</span>';
  if ((e.status||'') === 'started') return '<span class="pill risk-moderado">em andamento</span>';
  return '<span class="pill risk-moderado">avaliação pendente</span>';
}
function upsertLocalEnrollment(row){
  state.courseEnrollments = state.courseEnrollments || [];
  const idx = state.courseEnrollments.findIndex(e => String(e.courseId) === String(row.courseId) && String(e.profileId) === String(row.profileId));
  if (idx >= 0) state.courseEnrollments[idx] = {...state.courseEnrollments[idx], ...row};
  else state.courseEnrollments.push(row);
  save();
}
async function saveCourseEnrollment(courseId, status='started', progress=10, extra={}){
  const profileId = currentProfileId();
  const now = new Date().toISOString();
  const scorePercent = extra.quizPercent ?? extra.scorePercent ?? null;
  const localRow = {
    courseId, profileId, status, progress,
    progressPercent: status === 'completed' ? 100 : Math.max(progress, 10),
    scorePercent,
    updatedAt: now,
    lastAccessedAt: now,
    ...(status==='completed'?{completedAt: now}:{}),
    ...extra
  };
  upsertLocalEnrollment(localRow);
  if (supabaseClient && IS_PRODUCTION && state.authProfile?.id) {
    const row = {
      course_id: courseId,
      profile_id: state.authProfile.id,
      status,
      progress,
      progress_percent: status === 'completed' ? 100 : Math.max(progress, 10),
      score_percent: scorePercent,
      last_accessed_at: now,
      started_at: now,
      completed_at: status === 'completed' ? now : null,
      attempts: extra.quizScore != null ? 1 : 0,
      quiz_payload: extra.quizScore != null ? { score: extra.quizScore, total: extra.quizTotal, percent: scorePercent, registeredAt: now } : null
    };
    const { error } = await supabaseClient.from('course_enrollments').upsert(row, { onConflict: 'course_id,profile_id' });
    if (error) {
      console.warn('Não foi possível registrar curso no Supabase:', error.message);
      alert('Não consegui registrar o curso no Supabase: ' + error.message);
      return false;
    }
    await loadCourseEnrollmentsFromSupabase();
  }
  return true;
}
async function loadCourseEnrollmentsFromSupabase(){
  if (!supabaseClient || !state.authProfile?.id) return false;
  let query = supabaseClient.from('course_enrollments').select('id,course_id,profile_id,status,progress,progress_percent,score_percent,completed_at,started_at,last_accessed_at,created_at');
  if (state.authProfile.role === 'collaborator') query = query.eq('profile_id', state.authProfile.id);
  const { data, error } = await query;
  if (error) { console.warn('Não foi possível carregar participação em cursos:', error.message); return false; }
  state.courseEnrollments = (data || []).map(e => ({ id:e.id, courseId:e.course_id, profileId:e.profile_id, status:e.status, progress:e.progress, progressPercent:e.progress_percent, scorePercent:e.score_percent, completedAt:e.completed_at, startedAt:e.started_at, lastAccessedAt:e.last_accessed_at, createdAt:e.created_at }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return true;
}
function courseQuizHtml(c){
  const quiz = quizForCourse(c);
  const e = enrollmentFor(c.id);
  const done = e?.status === 'completed';
  return `<section class="section course-quiz"><h2>Concluir curso no PsicoSaúde</h2><p class="notice"><b>Importante:</b> o botão <b>Verificar respostas</b> que aparece dentro do curso apenas corrige o conteúdo. Para registrar a conclusão no sistema, responda esta avaliação do PsicoSaúde e clique em <b>Enviar avaliação e concluir</b>.</p><p class="muted">Para comprovação de conclusão, responda às questões abaixo. O curso será marcado como concluído ao atingir pelo menos 70% de acertos.</p>${done?`<p class="notice good"><b>Curso concluído.</b> Registro gerado em ${esc(new Date(e.completedAt || e.updatedAt || Date.now()).toLocaleString('pt-BR'))}.</p>`:''}${quiz.map((item,i)=>`<div class="question"><b>${i+1}. ${esc(item.q)}</b><div class="q-options">${item.opts.map((op,j)=>`<label class="q-opt"><input type="radio" name="cq-${i}" value="${j}" ${done?'disabled':''}> ${esc(op)}</label>`).join('')}</div></div>`).join('')}<div class="actions"><button class="btn" ${done?'disabled':''} onclick="submitCourseQuiz('${c.id}')">Enviar avaliação e concluir</button></div><div id="course-quiz-result"></div></section>`;
}
async function submitCourseQuiz(courseId){
  const c = state.courses.find(x => String(x.id) === String(courseId));
  if (!c) return;
  const quiz = quizForCourse(c);
  let score = 0;
  for (let i=0;i<quiz.length;i++){
    const checked = document.querySelector(`input[name="cq-${i}"]:checked`);
    if (!checked) { alert('Responda todas as questões da avaliação do curso.'); return; }
    if (Number(checked.value) === Number(quiz[i].a)) score++;
  }
  const percent = Math.round(score / quiz.length * 100);
  const box = document.getElementById('course-quiz-result');
  if (percent >= 70) {
    await saveCourseEnrollment(courseId, 'completed', 100, {quizScore: score, quizTotal: quiz.length, quizPercent: percent});
    if (box) box.innerHTML = `<p class="notice good"><b>Concluído!</b> Você acertou ${score}/${quiz.length} (${percent}%). A conclusão foi registrada.</p>`;
    setTimeout(render, 600);
  } else {
    await saveCourseEnrollment(courseId, 'started', 50, {quizScore: score, quizTotal: quiz.length, quizPercent: percent});
    if (box) box.innerHTML = `<p class="notice warn"><b>Ainda não concluído.</b> Você acertou ${score}/${quiz.length} (${percent}%). Revise o conteúdo e tente novamente.</p>`;
  }
}
function courseCompletionStats(){
  const rows = (state.courses || []).map(c=>{
    const related = (state.courseEnrollments || []).filter(e=>String(e.courseId)===String(c.id));
    const completed = related.filter(e=>e.status==='completed').length;
    const started = related.filter(e=>e.status==='started').length;
    return {course:c, started, completed, total:related.length};
  });
  return rows;
}
function currentTalentProfile(){
  const id = currentProfileId();
  return state.talentProfiles[id] || {profileId:id, interests:[], skills:[], dreams:'', targetFunctionId:''};
}
async function loadOwnTalentProfileFromSupabase(){
  if (!supabaseClient || !state.authProfile?.id) return false;
  const { data, error } = await supabaseClient.from('talent_profiles').select('id,profile_id,interests,skills,dreams,updated_at').eq('profile_id', state.authProfile.id).maybeSingle();
  if (error) { console.warn('Não foi possível carregar perfil de talentos:', error.message); return false; }
  if (data) {
    state.talentProfiles[state.authProfile.id] = {profileId:data.profile_id, interests:data.interests||[], skills:data.skills||[], dreams:data.dreams||'', updatedAt:data.updated_at};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  }
  return false;
}
async function saveTalentProfile(){
  const profileId = currentProfileId();
  const data = {
    profileId,
    interests: val('tal-interests').split(',').map(s=>s.trim()).filter(Boolean),
    skills: val('tal-skills').split(',').map(s=>s.trim()).filter(Boolean),
    dreams: val('tal-dreams'),
    targetFunctionId: val('tal-target'),
    updatedAt: new Date().toISOString()
  };
  state.talentProfiles[profileId] = data;
  if (!state.employees.find(e=>e.id===profileId) && state.authProfile) {
    state.employees.push({id: profileId, name: state.authProfile.full_name || 'Colaborador', unitId: state.authProfile.unit_id || null, functionTitle: state.authProfile.function_title || 'Colaborador', targetFunctionId:data.targetFunctionId, interests:[...data.interests, ...data.skills], dreams:data.dreams});
  } else {
    const e = state.employees.find(e=>e.id===profileId);
    if (e) { e.interests=[...data.interests, ...data.skills]; e.dreams=data.dreams; e.targetFunctionId=data.targetFunctionId; }
  }
  save();
  if (supabaseClient && IS_PRODUCTION && state.authProfile?.id) {
    const row = { profile_id: state.authProfile.id, organization_id: currentProductionOrgId(), interests: data.interests, skills: data.skills, dreams: data.dreams };
    const { error } = await supabaseClient.from('talent_profiles').upsert(row, { onConflict: 'profile_id' });
    if (error) console.warn('Não foi possível salvar perfil de talentos no Supabase:', error.message);
  }
  alert('Perfil profissional salvo. Agora o banco de talentos já consegue calcular aderência.');
  render();
}
function matchCurrentTalentTo(f){
  const tp = currentTalentProfile();
  const declared = new Set([...(tp.interests||[]), ...(tp.skills||[])].map(x=>String(x).toLowerCase()));
  const required = (f.skills||[]).map(x=>String(x));
  const matched = required.filter(s=>declared.has(s.toLowerCase()));
  return {score: Math.round(matched.length / Math.max(required.length,1) * 100), missing: required.filter(s=>!declared.has(s.toLowerCase())), matched};
}

async function submitQuestionnaireToSupabase(employeeId, questionnaireId, qn){
  if (!supabaseClient || !state.authProfile?.id) return false;
  const cycle = await loadActiveCycleFromSupabase();
  if (!cycle?.id) {
    alert('Não encontrei um ciclo ativo no Supabase. Crie um ciclo mensal ativo antes de registrar respostas.');
    return false;
  }
  const profileId = state.authProfile.id;
  const orgId = state.authProfile.organization_id || currentProductionOrgId();
  const unitId = state.authProfile.unit_id || null;
  const rows = qn.questions.map(q => ({
    organization_id: orgId,
    cycle_id: cycle.id,
    profile_id: profileId,
    unit_id: unitId,
    questionnaire_id: qn.id,
    question_id: q.id,
    dimension: q.dimension,
    value: Number(tempAnswers[q.id])
  }));
  const { error } = await supabaseClient
    .from('psychosocial_responses')
    .upsert(rows, { onConflict: 'cycle_id,profile_id,question_id' });
  if (error) {
    alert('Erro ao salvar respostas no Supabase: ' + error.message);
    return false;
  }
  await loadOwnResponsesFromSupabase();
  return true;
}

function openCourse(id){
  const course = state.courses.find(c => c.id === id);
  const url = course?.contentUrl || course?.content_url;
  if (!url) {
    alert('Este curso ainda não possui conteúdo vinculado.');
    return;
  }
  state.__activeCourseId = id;
  saveCourseEnrollment(id, 'started', 10);
  route = 'courseViewer';
  render();
}

function activeCourse(){
  return state.courses.find(c => c.id === state.__activeCourseId) || state.courses[0];
}

function pageCourseViewer(){
  const c = activeCourse();
  if (!c) return `<section class="section"><h1>Curso</h1><p class="muted">Nenhum curso selecionado.</p></section>`;
  const url = c.contentUrl || c.content_url || '';
  return `<section class="section course-viewer-head"><div><h1>${esc(c.title)}</h1><p class="muted">${esc(c.category || 'Trilha de desenvolvimento')} • ${esc(c.duration || '')}</p>${courseStatusLabel(c.id)}</div><div class="actions"><button class="btn secondary" onclick="setRoute('trilhas')">Voltar</button><button class="btn secondary" onclick="window.open('${esc(url)}','_blank','noopener,noreferrer')">Abrir externo</button></div></section>${courseQuizHtml(c)}<section class="section course-viewer-section"><div id="course-loading" class="notice">Carregando curso formatado...</div><iframe id="course-frame" class="course-frame" title="${esc(c.title)}" data-url="${esc(url)}"></iframe></section>`;
}

async function mountCourseViewer(){
  const frame = document.getElementById('course-frame');
  const loading = document.getElementById('course-loading');
  if (!frame) return;
  const url = frame.dataset.url;
  if (!url) return;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const html = await res.text();
    frame.srcdoc = html;
    if (loading) loading.style.display = 'none';
  } catch (err) {
    if (loading) loading.innerHTML = 'Não consegui renderizar o HTML dentro do app. Abrindo em nova aba...';
    frame.src = url;
  }
}
function login(r, empId){
  // Set the global role and persist it
  role = r;
  localStorage.setItem('psicosaude_role', r);
  // If logging in as a collaborator, set the current employee
  if (r === 'Colaborador') {
    state.currentEmployeeId = empId;
    localStorage.setItem('currentEmployeeId', empId);
    // Determine if the collaborator must change their initial password
    const emp = state.employees.find(e => e.id === empId);
    if (emp && emp.needsPasswordChange) {
      // Force password change before any other actions
      route = 'changePassword';
    } else if (state.acceptedTerms && !state.acceptedTerms[empId]) {
      // If terms not yet accepted, show term page
      route = 'terms';
    } else {
      // Otherwise start collaborators at the home page
      route = 'home';
    }
  } else if (r === 'Admin') {
    // Admin does not associate with an employee; clear any collaborator
    state.currentEmployeeId = null;
    localStorage.removeItem('currentEmployeeId');
    // Start administrators at the companies management page
    route = 'companies';
  } else {
    // Management/RH
    state.currentEmployeeId = null;
    localStorage.removeItem('currentEmployeeId');
    // Start management at the dashboard
    route = 'dashboard';
  }
  // Hide any login forms after successful login
  state.__loginShowCollab = false;
  state.__loginShowAdmin = false;
  save();
  render();
}
async function logout(){
  if (supabaseClient && IS_PRODUCTION) { try { await supabaseClient.auth.signOut(); } catch(e){} }
  role = '';
  localStorage.removeItem('psicosaude_role');
  // Clear current employee when logging out
  state.currentEmployeeId = null;
  localStorage.removeItem('currentEmployeeId');
  save();
  render();
}

// Show the collaborator login form on the login page
function showCollaboratorForm(){
  state.__loginShowCollab = true;
  // Hide the admin form when switching to collaborator
  state.__loginShowAdmin = false;
  render();
}

// Show the admin login form on the login page
function showAdminForm(){
  state.__loginShowAdmin = true;
  // Hide collaborator login form when switching to admin
  state.__loginShowCollab = false;
  render();
}

// Handle administrator login: verify password and set admin role
function loginAdmin(){
  const passEl = document.getElementById('admin-password');
  if (!passEl) return;
  const pw = passEl.value;
  if (pw === adminPassword) {
    login('Admin');
  } else {
    alert('Senha do administrador incorreta.');
  }
}

// Handle collaborator login: verify password and set current employee
function loginCollaborator(){
  const selectEl = document.getElementById('collab-id');
  const passEl = document.getElementById('collab-password');
  if (!selectEl || !passEl) return;
  const id = selectEl.value;
  const pw = passEl.value;
  if (credentials[id] && credentials[id] === pw) {
    login('Colaborador', id);
  } else {
    alert('Usuário ou senha incorretos.');
  }
}
function resetDemo(){if(confirm('Restaurar dados de demonstração?')){state=structuredClone(initialData);save();render();}}
function setRoute(r){route=r;render();setTimeout(()=>scrollTo(0,0),0)}
function unitName(id){return state.company.units.find(u=>u.id===id)?.name||'—'}
function serviceName(id){return (state.company.serviceTypes||[]).find(s=>s.id===id)?.name||'—'}
function unitServiceType(unitId){return state.company.units.find(u=>u.id===unitId)?.serviceTypeId||''}
function functionsForUnit(unitId){const sid=unitServiceType(unitId); return (state.company.functions||[]).filter(f=>!sid || f.serviceTypeId===sid || f.serviceTypeId==='serv-administrativo')}
function fnName(id){return state.company.functions.find(f=>f.id===id)?.title||'—'}
function questionMap(){const m=new Map();state.questionnaires.forEach(qn=>qn.questions.forEach(q=>m.set(q.id,q)));return m}
function calcScore(value,dir,max=5){const n=dir==='reverse'?max+1-value:value;return Math.round(((n-1)/(max-1))*100)}
function aggregate({unit='all',func='all'}={}){
  const qm=questionMap();
  const emp=new Map(state.employees.map(e=>[e.id,e]));
  const filtered=state.responses.filter(r=>{
    const e = emp.get(r.employeeId);
    if (!e) return false;
    // Only include responses from employees in the current company (if defined)
    if (e.companyId && state.company && e.companyId !== state.company.id) return false;
    if (unit !== 'all' && e.unitId !== unit) return false;
    if (func !== 'all' && e.functionTitle !== func) return false;
    return true;
  });
  const participants=new Set(filtered.map(r=>r.employeeId)).size;
  const by=new Map();
  filtered.forEach(r=>{const q=qm.get(r.questionId); if(!q)return; const max=r.questionnaireId==='q-dass21-screening'?3:5; const score=calcScore(r.value,q.riskDirection,max); if(!by.has(q.dimension))by.set(q.dimension,[]); by.get(q.dimension).push({score,employeeId:r.employeeId});});
  const rows=dimensions.map(d=>{const vals=by.get(d)||[]; if(!vals.length)return null; const score=Math.round(vals.reduce((s,v)=>s+v.score,0)/vals.length); return {dimension:d,score,risco:scoreToRisk(score),responses:vals.length,participants:new Set(vals.map(v=>v.employeeId)).size,protected:new Set(vals.map(v=>v.employeeId)).size<MIN_SAMPLE}}).filter(Boolean);
  const overall=rows.length?Math.round(rows.reduce((s,r)=>s+r.score,0)/rows.length):0;
  return {rows,overall,overallRisk:scoreToRisk(overall),participants,responseCount:filtered.length,protected:(unit!=='all'||func!=='all')&&participants>0&&participants<MIN_SAMPLE};
}
function byUnit(){return state.company.units.map(u=>{const s=aggregate({unit:u.id});return {unit:u.name,unitId:u.id,score:s.overall,risco:s.overallRisk,participants:s.participants,protected:s.participants<MIN_SAMPLE}})}
function topRisks(rows,limit=5){return [...rows].sort((a,b)=>b.score-a.score).slice(0,limit)}
function actionFor(d,score){const map={'Sobrecarga e ritmo':'Revisar distribuição de tarefas, escalas, prioridades e pausas recuperativas.','Demandas emocionais':'Implantar rodas de cuidado, supervisão técnica e protocolos de descompressão emocional.','Autonomia e controle':'Aumentar participação da equipe nas decisões de rotina e pactuar margens de autonomia.','Apoio da liderança':'Realizar trilha de liderança psicossocialmente segura e rotina de devolutivas coletivas.','Reconhecimento':'Criar rituais de feedback, valorização e reconhecimento institucional.','Conflitos e assédio':'Acionar canal de escuta, mediação, CNV e protocolo de prevenção de assédio.','Clareza de papel':'Revisar descrições de função, fluxos, responsáveis e limites de atuação.','Segurança psicológica':'Fortalecer combinados de equipe e proteção contra retaliação.','Equilíbrio trabalho-vida':'Revisar demandas fora do horário, escalas e períodos de descanso.','Respeito, diversidade e discriminação':'Fortalecer política antidiscriminatória, canais seguros, capacitação e resposta institucional a relatos de preconceito ou desigualdade de tratamento.','Estresse':'Ofertar orientação de autocuidado e avaliar carga de trabalho.','Ansiedade':'Ofertar orientação de regulação emocional e encaminhamento sigiloso quando solicitado.','Depressão':'Ofertar acolhimento sigiloso e encaminhamento para rede quando necessário.'}; return {action:map[d]||'Construir plano de ação com responsáveis, prazo e monitoramento.',deadline:score>=60?'30 a 60 dias':'Até o próximo ciclo',owner:score>=60?'Gestão/RH + liderança da unidade':'RH/Comitê psicossocial'} }
function recommendCourses(risks){
  const ds = risks.map(r=>r.dimension);
  return state.courses
    .map(c=>{
      const recommendedFor = c.recommendedFor || c.recommended_for || [];
      return {...c, recommendedFor, relevance: recommendedFor.filter(d=>ds.includes(d)).length};
    })
    .filter(c=>c.relevance>0)
    .sort((a,b)=>b.relevance-a.relevance || (a.sortOrder||0)-(b.sortOrder||0));
}
function matches(){
  // Only compute matches for employees belonging to the current company
  const relevant = state.employees.filter(e => !e.companyId || (state.company && e.companyId === state.company.id));
  return relevant.map(e => {
    const target = state.company.functions.find(f => f.id === e.targetFunctionId) || state.company.functions[0];
    const interests = new Set((e.interests || []).map(x => x.toLowerCase()));
    const match = (target.skills || []).filter(s => interests.has(s.toLowerCase()));
    return {
      ...e,
      targetFunction: target.title,
      targetArea: target.area,
      openPositions: target.openPositions,
      matchedSkills: match,
      missingSkills: (target.skills || []).filter(s => !interests.has(s.toLowerCase())),
      matchScore: Math.round(match.length / Math.max((target.skills || []).length, 1) * 100)
    };
  });
}
function riskBadge(r){return `<span class="pill risk-${r}">${r}</span>`}
function bar(v){return `<div class="bar"><span style="width:${Math.max(3,Math.min(100,v))}%"></span></div><small>${v}%</small>`}
// Navigation menus for different roles
const navManagement = [
  ['dashboard','Dashboard'],
  ['empresa','Empresa'],
  ['talentos','Talentos'],
  ['questionarios','Participação'],
  ['plano','Plano de ação'],
  ['cursos','Cursos'],
  ['ouvidoria','Ouvidoria'],
  ['relatorio','Relatório'],
  ['governanca','Governança']
];
// Collaborator navigation: each item corresponds to a route defined below
const navCollaborator = [
  ['home','Início'],
  ['profile','Meu Perfil'],
  ['questionarios','Questionários'],
  ['devolutiva','Minha devolutiva'],
  ['trilhas','Minhas Trilhas'],
  ['empresaInfo','Minha Empresa'],
  ['beneficios','Benefícios'],
  ['oportunidades','Oportunidades'],
  ['apoio','Canal de apoio']
];

// Navigation menu for administrators. Allows managing multiple companies.
const navAdmin = [
  ['companies','Empresas']
];

// Terms page for collaborators: display the data protection and LGPD notice
function pageTermsCollaborator(){
  return `<section class="section"><h1>Termo de ciência e LGPD</h1><p>Antes de prosseguir, confirme que você leu e concorda com o uso das informações coletadas no app para fins de prevenção e melhoria das condições de trabalho.</p><p>O Inventário Psicossocial e o rastreio complementar DASS‑21 são instrumentos preventivos. Suas respostas serão utilizadas apenas de forma agregada e anônima para criar indicadores coletivos. Nenhum dado sensível será compartilhado nominalmente com a gestão ou com terceiros.</p><p>Ao aceitar, você declara estar ciente de que:</p><ul><li>As respostas serão utilizadas exclusivamente para fins de gestão de riscos psicossociais e ações de prevenção conforme a NR‑1.</li><li>Os dados são armazenados de forma segura, com controle de acesso e anonimização quando aplicável.</li><li>Você pode registrar relatos anônimos ou identificados no canal de apoio, e somente você poderá ver seus relatos identificados.</li><li>Você pode solicitar a exclusão das suas respostas a qualquer momento.</li></ul><div class="actions"><button class="btn" onclick="acceptTerms()">Aceitar e continuar</button><button class="btn secondary" onclick="logout()">Recusar</button></div></section>`;
}

// Persist acceptance of terms for the current collaborator and proceed to home
async function acceptTerms(){
  if (!state.currentEmployeeId) return;
  if (IS_PRODUCTION && state.authProfile) {
    const ok = await acceptTermsSupabase();
    if (!ok) return;
  }
  if (!state.acceptedTerms) state.acceptedTerms = {};
  state.acceptedTerms[state.currentEmployeeId] = true;
  save();
  route = 'home';
  render();
}

// Page for collaborators to update their initial password on first login
function pageChangePasswordCollaborator(){
  return `<section class="section"><h1>Atualizar senha inicial</h1><p>Para sua segurança, é necessário definir uma nova senha antes de acessar o sistema pela primeira vez. A nova senha deve ter ao menos 4 caracteres.</p><div class="form"><input type="password" id="new-password" class="input" placeholder="Nova senha"><input type="password" id="confirm-password" class="input" placeholder="Confirmar nova senha"><button class="btn" onclick="changePasswordCollaborator()">Atualizar senha</button></div><p class="muted">Após atualizar a senha, você será direcionado à página de termos ou à página inicial.</p></section>`;
}

// Update the collaborator's password and clear the first-login flag
async function changePasswordCollaborator(){
  const newPw = document.getElementById('new-password')?.value || '';
  const confPw = document.getElementById('confirm-password')?.value || '';
  if (newPw.length < 4) {
    alert('A nova senha deve ter pelo menos 4 caracteres.');
    return;
  }
  if (newPw !== confPw) {
    alert('As senhas não coincidem.');
    return;
  }
  const id = state.currentEmployeeId;
  if (IS_PRODUCTION && state.authProfile) {
    const ok = await changePasswordSupabase(newPw);
    if (!ok) return;
  }
  const emp = state.employees.find(e => e.id === id);
  if (!emp && !state.authProfile) return;
  if (emp) emp.password = newPw;
  if (emp) emp.needsPasswordChange = false;
  // Update credentials map as well only in demo/local mode
  if (emp) credentials[id] = newPw;
  save();
  alert('Senha atualizada com sucesso.');
  // After changing the password, send the collaborator to the terms if not yet accepted
  if (state.acceptedTerms && state.acceptedTerms[id]) {
    route = 'home';
  } else {
    route = 'terms';
  }
  render();
}
function layout(inner){
  // Choose the appropriate menu based on the current role
  let menu;
  if (role === 'Colaborador') {
    menu = navCollaborator;
  } else if (role === 'Admin') {
    menu = navAdmin;
  } else {
    menu = navManagement;
  }
  return `<div class="app"><aside class="sidebar"><div class="brand"><div class="brand-icon">Ψ</div><div><small>Programa Integrado</small><strong>PsicoSaúde NR-1</strong></div></div><nav class="nav">${menu.map(([id,label])=>`<button class="${route===id?'active':''}" onclick="setRoute('${id}')">${label}</button>`).join('')}</nav><div class="side-card"><b>${esc(state.company.name)}</b><br><span class="muted">Acesso: ${esc(role)}</span><div class="actions"><button class="btn secondary" onclick="resetDemo()">Restaurar demo</button><button class="btn" onclick="logout()">Sair</button></div></div></aside><main class="main"><header class="topbar"><div><small class="muted">Sistema utilizável • dados salvos no aparelho</small><h2>Saúde psicossocial, NR-1 e desenvolvimento</h2><div class="mobile-nav">${menu.map(([id,label])=>`<button onclick="setRoute('${id}')">${label}</button>`).join('')}</div></div><span class="pill risk-baixo">PWA / APK ready</span></header><div class="content">${inner}</div></main></div>`;
}
function renderLogin(){
  const prodLogin = IS_PRODUCTION ? `<div class="section"><h3>Login seguro — Supabase Auth</h3><p class="muted">Use e-mail e senha cadastrados no Supabase. Senhas não ficam no frontend.</p><input id="auth-email" class="input" placeholder="E-mail"><input id="auth-password" type="password" class="input" placeholder="Senha"><button class="btn" onclick="loginSupabaseAuth()">Entrar com Supabase</button></div>` : '';
  // Build collaborator login form if requested (modo demonstração/local)
  const collabForm = !IS_PRODUCTION && state.__loginShowCollab ? `<div class="collab-login"><select id="collab-id" class="input">${state.employees.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select><input type="password" id="collab-password" class="input" placeholder="Senha"><button class="btn" onclick="loginCollaborator()">Entrar</button></div>` : '';
  // Build admin login form if requested (modo demonstração/local)
  const adminForm = !IS_PRODUCTION && state.__loginShowAdmin ? `<div class="admin-login"><input type="password" id="admin-password" class="input" placeholder="Senha do administrador"><button class="btn" onclick="loginAdmin()">Entrar</button></div>` : '';
  const demoButtons = !IS_PRODUCTION ? `<div class="login-actions"><button class="role-btn" onclick="login('Gestão/RH')">Entrar como Gestão/RH <span>Dashboard, empresa, talentos, plano de ação e relatório.</span></button><button class="role-btn secondary" onclick="showCollaboratorForm()">Entrar como Colaborador <span>Responder questionários, ver cursos e perfil profissional.</span></button><button class="role-btn secondary" onclick="showAdminForm()">Entrar como Administração <span>Cadastrar empresas e gerir organizações.</span></button></div>` : '';
  return `
    <div class="login"><div class="login-grid">
      <section><span class="badge">Programa Integrado de Saúde Psicossocial e NR-1</span><h1>Gestão psicossocial real, sem expor o colaborador.</h1><p>Diagnóstico coletivo, questionários, dashboard anonimizado, plano de ação, ouvidoria, cursos, banco de talentos e relatório técnico.</p><div class="features"><div class="feature"><b>NR-1</b><br>Inventário de riscos</div><div class="feature"><b>LGPD</b><br>Separação de dados</div><div class="feature"><b>Talentos</b><br>Carreira e vagas</div></div></section>
      <section class="login-card"><h2>Entrar no app</h2><p class="muted">${IS_PRODUCTION?'Modo produção habilitado. Autenticação por Supabase Auth.':'Modo demonstração local. Para produção, configure www/config.js.'}</p>
        ${prodLogin}
        ${demoButtons}
        ${collabForm}
        ${adminForm}
        <p class="notice warn">Produção: Supabase Auth + RLS + tabelas separadas. Demonstração: LocalStorage.</p>
      </section>
    </div></div>
  `;
}
function pageDashboard(){const s=aggregate();const units=byUnit();const risks=topRisks(s.rows);const rec=recommendCourses(risks);return `<section class="section"><h1>Dashboard psicossocial</h1><p class="muted">Calculado a partir das respostas preenchidas no formulário do colaborador.</p></section><section class="grid grid-4"><div class="card"><span class="muted">Índice geral</span><div class="stat">${s.overall}%</div>${riskBadge(s.overallRisk)}</div><div class="card"><span class="muted">Participantes</span><div class="stat">${s.participants}</div><small>mínimo por recorte: ${MIN_SAMPLE}</small></div><div class="card"><span class="muted">Respostas</span><div class="stat">${s.responseCount}</div><small>itens respondidos</small></div><div class="card"><span class="muted">Prioridades</span><div class="stat">${risks.filter(r=>r.score>=60).length}</div><small>dimensões em alto/critico</small></div></section><section class="grid grid-2"><div class="section"><h2>Riscos por dimensão</h2><div class="chart">${s.rows.map(r=>`<div class="chart-col"><div class="chart-bar" style="height:${r.score*2}px"></div><div class="chart-label">${esc(r.dimension.split(' ')[0])}<br><b>${r.score}%</b></div></div>`).join('')}</div></div><div class="section"><h2>Unidades</h2><div class="table-wrap"><table><thead><tr><th>Unidade</th><th>Índice</th><th>Risco</th><th>Amostra</th></tr></thead><tbody>${units.map(u=>`<tr><td>${esc(u.unit)}</td><td>${bar(u.score)}</td><td>${riskBadge(u.risco)}</td><td>${u.protected?'Protegido por baixa amostra':u.participants+' participantes'}</td></tr>`).join('')}</tbody></table></div></div></section><section class="grid grid-2"><div class="section"><h2>Principais riscos</h2>${risks.map(r=>`<div class="card" style="margin:10px 0"><b>${esc(r.dimension)}</b><br>${bar(r.score)} ${riskBadge(r.risco)}</div>`).join('')}</div><div class="section"><h2>Conteúdos recomendados</h2>${rec.map(c=>`<div class="card" style="margin:10px 0"><b>${esc(c.title)}</b><p class="muted">${esc(c.description)}</p></div>`).join('')||'<p class="muted">Nenhuma recomendação automática.</p>'}</div></section>`}
function pageCompany(){
  const unitsByService = (state.company.serviceTypes||[]).map(st=>({...st, units:(state.company.units||[]).filter(u=>u.serviceTypeId===st.id)}));
  return `<section class="section"><h1>Empresa, serviços, unidades e cargos</h1><p class="muted">Configure a organização no modelo correto: Empresa → Tipo de Serviço → Unidade → Cargo → Colaborador.</p></section>
  <section class="grid grid-2"><div class="section"><h2>Dados institucionais</h2><div class="form"><input class="input" id="c-name" value="${esc(state.company.name)}" placeholder="Nome"><input class="input" id="c-cnpj" value="${esc(state.company.cnpj)}" placeholder="CNPJ"><input class="input" id="c-seg" value="${esc(state.company.segment)}" placeholder="Segmento"><input class="input" id="c-size" value="${esc(state.company.size)}" placeholder="Porte"><input class="input" id="c-resp" value="${esc(state.company.responsible)}" placeholder="Responsável"><input class="input" id="c-email" value="${esc(state.company.email)}" placeholder="E-mail"><textarea id="c-desc" rows="4">${esc(state.company.description)}</textarea><button class="btn" onclick="saveCompany()">Salvar empresa</button></div></div>
  <div class="section"><h2>Resumo</h2><div class="grid grid-2"><div class="card"><div class="stat">${(state.company.serviceTypes||[]).length}</div><span class="muted">tipos de serviço</span></div><div class="card"><div class="stat">${state.company.units.length}</div><span class="muted">unidades</span></div><div class="card"><div class="stat">${state.company.functions.length}</div><span class="muted">cargos catalogados</span></div><div class="card"><div class="stat">${state.employees.filter(e=>!e.companyId||e.companyId===state.company.id).length}</div><span class="muted">colaboradores</span></div></div></div></section>
  <section class="section"><h2>Tipos de serviço da ASCOM</h2><p class="muted">Baseado nas categorias do site institucional da ASCOM — Assistência, Creches, Jovens e Abrigos — e complementado pelos planos/portarias SMADS encontrados.</p><div class="grid grid-3">${unitsByService.map(st=>`<div class="card"><h3>${esc(st.name)}</h3><small>${esc(st.area)}</small><p>${esc(st.description)}</p><p class="muted"><b>Referência:</b> ${esc(st.reference||'')}</p><span class="pill risk-baixo">${st.units.length} unidade(s)</span></div>`).join('')}</div></section>
  <section class="grid grid-2"><div class="section"><h2>Unidades por serviço</h2>${state.company.units.map(u=>`<div class="card"><input class="input" value="${esc(u.name)}" onchange="updateUnit('${u.id}','name',this.value)"><select class="input" onchange="updateUnit('${u.id}','serviceTypeId',this.value)">${(state.company.serviceTypes||[]).map(st=>`<option value="${st.id}" ${u.serviceTypeId===st.id?'selected':''}>${esc(st.name)}</option>`).join('')}</select><input class="input" value="${esc(u.area)}" onchange="updateUnit('${u.id}','area',this.value)"><input class="input" type="number" value="${u.employees}" onchange="updateUnit('${u.id}','employees',this.value)"><button class="btn danger" onclick="deleteUnit('${u.id}')">Remover</button></div>`).join('')}<h3>Adicionar unidade</h3><div class="form"><input id="u-name" class="input" placeholder="Nome"><select id="u-service" class="input">${(state.company.serviceTypes||[]).map(st=>`<option value="${st.id}">${esc(st.name)}</option>`).join('')}</select><input id="u-area" class="input" placeholder="Área"><input id="u-emps" type="number" class="input" placeholder="Colaboradores"><button class="btn" onclick="addUnit()">Adicionar</button></div></div>
  <div class="section"><h2>Cargos por serviço</h2>${state.company.functions.map(f=>`<div class="card"><input class="input" value="${esc(f.title)}" onchange="updateFn('${f.id}','title',this.value)"><select class="input" onchange="updateFn('${f.id}','serviceTypeId',this.value)">${(state.company.serviceTypes||[]).map(st=>`<option value="${st.id}" ${f.serviceTypeId===st.id?'selected':''}>${esc(st.name)}</option>`).join('')}</select><input class="input" value="${esc(f.area)}" onchange="updateFn('${f.id}','area',this.value)"><input class="input" value="${esc((f.skills||[]).join(', '))}" onchange="updateFn('${f.id}','skills',this.value)"><input class="input" type="number" value="${f.openPositions}" onchange="updateFn('${f.id}','openPositions',this.value)"><textarea onchange="updateFn('${f.id}','description',this.value)">${esc(f.description)}</textarea><button class="btn danger" onclick="deleteFn('${f.id}')">Remover</button></div>`).join('')}<h3>Adicionar cargo</h3><div class="form"><input id="f-title" class="input" placeholder="Cargo"><select id="f-service" class="input">${(state.company.serviceTypes||[]).map(st=>`<option value="${st.id}">${esc(st.name)}</option>`).join('')}</select><input id="f-area" class="input" placeholder="Área"><input id="f-skills" class="input" placeholder="Competências, separadas por vírgula"><input id="f-vagas" class="input" type="number" placeholder="Vagas"><textarea id="f-desc" placeholder="Descrição"></textarea><button class="btn" onclick="addFn()">Adicionar</button></div></div></section>`;
}
function pageTalents(){
  const m=matches().sort((a,b)=>b.matchScore-a.matchScore);
  const employeesList = state.employees.filter(e => !e.companyId || (state.company && e.companyId === state.company.id));
  const currentUnits = state.company.units||[];
  const allFunctions = state.company.functions||[];
  return `<section class="section"><h1>Banco de talentos por serviço</h1><p class="muted">Dados profissionais nominais, separados dos questionários sensíveis. A aderência agora respeita o tipo de serviço da unidade.</p></section>
  <section class="section"><h2>Aderência a oportunidades internas</h2><div class="table-wrap"><table><thead><tr><th>Colaborador</th><th>Serviço / Unidade</th><th>Interesse</th><th>Aderência</th><th>Lacunas</th><th>Vagas</th></tr></thead><tbody>${m.map(e=>{const unit=state.company.units.find(u=>u.id===e.unitId)||{};return `<tr><td><b>${esc(e.name)}</b><br><span class="muted">${esc(e.functionTitle)}</span></td><td>${esc(serviceName(unit.serviceTypeId))}<br><small>${esc(unitName(e.unitId))}</small></td><td><b>${esc(e.targetFunction)}</b><br><small>${esc(e.matchedSkills.join(', ')||'sem competência declarada')}</small></td><td>${bar(e.matchScore)}</td><td><small>${esc(e.missingSkills.join(', '))}</small></td><td>${e.openPositions}</td></tr>`}).join('')}</tbody></table></div></section>
  <section class="grid grid-2"><div class="section"><h2>Adicionar colaborador</h2><div class="notice warn">Ao cadastrar, o sistema gera ID e senha inicial. No primeiro acesso, o colaborador troca a senha antes de aceitar o termo LGPD.</div><div class="form"><input id="e-name" class="input" placeholder="Nome"><select id="e-unit" class="input" onchange="updateTargetOptionsForEmployeeForm()">${currentUnits.map(u=>`<option value="${u.id}">${esc(serviceName(u.serviceTypeId))} • ${esc(u.name)}</option>`).join('')}</select><input id="e-fn" class="input" placeholder="Função atual"><select id="e-target" class="input">${allFunctions.map(f=>`<option value="${f.id}">${esc(serviceName(f.serviceTypeId))} • ${esc(f.title)}</option>`).join('')}</select><input id="e-int" class="input" placeholder="Interesses/competências, separados por vírgula"><textarea id="e-dream" placeholder="Sonhos, planos e objetivos profissionais"></textarea><button class="btn" onclick="addEmployee()">Salvar e gerar acesso</button></div></div>
  <div class="section"><h2>Colaboradores cadastrados</h2>${employeesList.map(e=>{const u=state.company.units.find(x=>x.id===e.unitId)||{};return `<div class="card"><b>${esc(e.name)}</b><br><span class="muted">${esc(e.functionTitle)} • ${esc(serviceName(u.serviceTypeId))} • ${esc(unitName(e.unitId))}</span><p>${esc(e.dreams)}</p><button class="btn danger" onclick="deleteEmployee('${e.id}')">Remover</button></div>`}).join('')}</div></section>`;
}

function updateTargetOptionsForEmployeeForm(){
  const unitId=val('e-unit'); const opts=functionsForUnit(unitId);
  const select=document.getElementById('e-target'); if(!select)return;
  select.innerHTML=opts.map(f=>`<option value="${f.id}">${esc(serviceName(f.serviceTypeId))} • ${esc(f.title)}</option>`).join('');
}
// Management participation status page
function pageQuestionnaires(){
  // Show participation status for each collaborator across questionnaires.
  return `<section class="section"><h1>Participação em questionários</h1><p class="muted">A gestão acompanha a adesão dos colaboradores aos instrumentos. Não é possível responder por eles.</p><div class="notice"><b>Termo de ciência:</b> dados sensíveis são usados apenas para indicadores coletivos e não são exibidos individualmente.</div></section><section class="section"><div class="table-wrap"><table><thead><tr><th>Colaborador</th><th>NR‑1</th><th>DASS‑21</th></tr></thead><tbody>${state.employees
    .filter(emp => !emp.companyId || (state.company && emp.companyId === state.company.id))
    .map(emp=>{
      const resp=state.responses.filter(r=>r.employeeId===emp.id);
      const nr=resp.some(r=>r.questionnaireId==='q-nr1-core');
      const dass=resp.some(r=>r.questionnaireId==='q-dass21-screening');
      return `<tr><td><b>${esc(emp.name)}</b><br><small>${esc(emp.functionTitle)} • ${esc(unitName(emp.unitId))}</small></td><td>${nr?'<span class="pill risk-baixo">Respondido</span>':'<span class="pill risk-alto">Pendente</span>'}</td><td>${dass?'<span class="pill risk-baixo">Respondido</span>':'<span class="pill risk-alto">Pendente</span>'}</td></tr>`;
    }).join('')}</tbody></table></div></section>`;
}
function pageAction(){const s=aggregate();const actions=topRisks(s.rows,6).map(r=>({...r,...actionFor(r.dimension,r.score)}));return `<section class="section"><h1>Plano de ação psicossocial</h1><p class="muted">Medidas geradas a partir das dimensões mais críticas.</p></section><section class="grid grid-3">${actions.map((a,i)=>`<div class="card"><small>Ação ${i+1}</small><h2>${esc(a.dimension)}</h2><div class="stat">${a.score}%</div>${riskBadge(a.risco)}<p><b>Medida:</b> ${esc(a.action)}</p><p class="notice"><b>Prazo:</b> ${esc(a.deadline)}<br><b>Responsável:</b> ${esc(a.owner)}</p></div>`).join('')}</section>`}
function courseCard(c, options={}){
  const recommended = options.recommended ? '<p class="notice warn">Recomendado pelo diagnóstico atual</p>' : '';
  const status = role === 'Colaborador' ? `<p>${courseStatusLabel(c.id)}</p>` : '';
  const openButton = (c.contentUrl || c.content_url) ? `<button class="btn" onclick="openCourse('${c.id}')">Abrir curso</button>` : '<span class="pill risk-moderado">sem conteúdo</span>';
  const removeButton = options.canRemove ? `<button class="btn danger" onclick="deleteCourse('${c.id}')">Remover</button>` : '';
  return `<div class="card"><small>${esc(c.category)}</small><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><b>${esc(c.duration)}</b>${status}${recommended}<ul>${(c.modules||[]).map(m=>`<li>${esc(m)}</li>`).join('')}</ul><div class="actions">${openButton}${removeButton}</div></div>`;
}


function pageCourses(){
  const rec=recommendCourses(topRisks(aggregate().rows));
  const stats = courseCompletionStats();
  return `<section class="section"><h1>Cursos e trilhas</h1><p class="muted">Biblioteca de desenvolvimento ligada ao diagnóstico, com conclusão validada por avaliação do curso.</p><div class="actions"><button class="btn" onclick="loadCoursesFromSupabase().then(ok=>{ if(ok){ render(); alert('Cursos carregados do Supabase.'); } else alert('Não encontrei cursos no Supabase ou ele não está configurado.'); })">Sincronizar cursos do Supabase</button><button class="btn secondary" onclick="loadCourseEnrollmentsFromSupabase().then(()=>{render(); alert('Participação atualizada.');})">Atualizar participação</button></div></section><section class="section"><h2>Participação nos cursos</h2><div class="table-wrap"><table><thead><tr><th>Curso</th><th>Iniciados</th><th>Concluídos por avaliação</th><th>Conclusão</th></tr></thead><tbody>${stats.map(s=>`<tr><td><b>${esc(s.course.title)}</b></td><td>${s.started + s.completed}</td><td>${s.completed}</td><td>${bar(s.total?Math.round((s.completed/s.total)*100):0)}</td></tr>`).join('') || '<tr><td colspan="4">Ainda não há participação registrada.</td></tr>'}</tbody></table></div></section><section class="grid grid-3">${state.courses.map(c=>courseCard(c,{recommended:rec.some(r=>r.id===c.id),canRemove:true})).join('')}</section><section class="section"><h2>Adicionar curso</h2><div class="grid grid-2"><input id="course-title" class="input" placeholder="Título"><input id="course-cat" class="input" placeholder="Categoria"><input id="course-dur" class="input" placeholder="Duração"><input id="course-rec" class="input" placeholder="Dimensões recomendadas, separadas por vírgula"><input id="course-url" class="input" placeholder="URL do conteúdo HTML"><textarea id="course-desc" placeholder="Descrição"></textarea><textarea id="course-mods" placeholder="Módulos, um por linha"></textarea></div><button class="btn" onclick="addCourse()">Adicionar curso</button></section>`}


function pageOmbudsman(){return `<section class="section"><h1>Ouvidoria e canal de apoio</h1><p class="muted">Relatos anônimos/identificados para comunicação, conflitos, assédio, sobrecarga e solicitações de apoio.</p></section><section class="grid grid-2"><div class="section"><h2>Novo relato</h2><div class="form"><select id="o-unit">${state.company.units.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`)}</select><select id="o-cat"><option>Comunicação</option><option>Conflitos</option><option>Assédio</option><option>Sobrecarga</option><option>Acolhimento</option><option>Sugestão</option></select><textarea id="o-desc" rows="6" placeholder="Descreva a situação..."></textarea><label><input id="o-anon" type="checkbox" checked> Registrar como anônimo</label><button class="btn" onclick="addOmbudsman()">Registrar</button></div></div><div class="section"><h2>Acompanhamento</h2>${[...state.ombudsmanReports].reverse().map(o=>`<div class="card"><b>${esc(o.category)} • ${esc(unitName(o.unitId))}</b><p>${esc(o.description)}</p><select onchange="updateOmbudsman('${o.id}',this.value)">${['aberto','em análise','encaminhado','resolvido'].map(st=>`<option ${o.status===st?'selected':''}>${st}</option>`)}</select></div>`).join('')}</div></section>`}
function pageReport(){const s=aggregate();const units=byUnit();const actions=topRisks(s.rows,6).map(r=>({...r,...actionFor(r.dimension,r.score)}));return `<section class="section"><div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><div><h1>Relatório técnico — ciclo NR-1</h1><p class="muted">Gerado a partir das respostas registradas no app.</p></div><div class="actions"><button class="btn" onclick="window.print()">Imprimir / PDF</button><button class="btn secondary" onclick="copyJson()">Copiar JSON</button></div></div></section><section class="section"><h2>1. Identificação</h2><p><b>Empresa:</b> ${esc(state.company.name)}<br><b>Segmento:</b> ${esc(state.company.segment)}<br><b>Responsável:</b> ${esc(state.company.responsible)}<br><b>Contato:</b> ${esc(state.company.email)}</p><p>${esc(state.company.description)}</p></section><section class="section"><h2>2. Síntese</h2><p>Foram considerados <b>${s.participants}</b> participantes e <b>${s.responseCount}</b> respostas. O índice geral é <b>${s.overall}%</b> ${riskBadge(s.overallRisk)}.</p><div class="grid grid-3">${units.map(u=>`<div class="card"><b>${esc(u.unit)}</b><div class="stat">${u.score}%</div>${riskBadge(u.risco)}<p class="muted">${u.participants} participantes</p></div>`).join('')}</div></section><section class="section"><h2>3. Inventário de riscos psicossociais</h2><div class="table-wrap"><table><thead><tr><th>Dimensão</th><th>Índice</th><th>Classificação</th><th>Medida</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td><b>${esc(r.dimension)}</b></td><td>${r.score}%</td><td>${riskBadge(r.risco)}</td><td>${r.score>=60?'Plano de ação prioritário e monitoramento mensal.':'Manter prevenção e reavaliar no próximo ciclo.'}</td></tr>`).join('')}</tbody></table></div></section><section class="section"><h2>4. Plano de ação</h2>${actions.map((a,i)=>`<div class="card"><b>${i+1}. ${esc(a.dimension)}</b><p>${esc(a.action)}</p><small><b>Prazo:</b> ${esc(a.deadline)} • <b>Responsável:</b> ${esc(a.owner)}</small></div>`).join('')}</section>`}
function pageGovernance(){return `<section class="section"><h1>Governança do programa</h1><p class="muted">Desenho institucional para uso ético e sustentável.</p></section><section class="grid grid-3"><div class="card"><h2>1. Diagnóstico</h2><p>Aplicação de instrumentos organizacionais e triagens complementares com finalidade preventiva.</p></div><div class="card"><h2>2. Proteção</h2><p>Gestão visualiza dados coletivos. Respostas sensíveis não são exibidas nominalmente.</p></div><div class="card"><h2>3. Intervenção</h2><p>Plano de ação, cursos, rodas de cuidado, ouvidoria e acompanhamento periódico.</p></div></section><section class="section"><h2>Regras essenciais</h2><ul><li>Separar saúde psicossocial de carreira e banco de talentos.</li><li>Bloquear recortes com menos de ${MIN_SAMPLE} respondentes.</li><li>Usar relatórios para PGR, prevenção e melhoria do trabalho — não para punir indivíduos.</li><li>Manter termo de ciência, política de privacidade e responsável técnico.</li></ul><div class="actions"><button class="btn danger" onclick="resetDemo()">Restaurar dados de demonstração</button></div></section>`}

// ----- Administrator pages -----

// Companies management page for administrators. Lists existing companies and allows adding new ones.
function pageCompaniesAdmin(){
  return `<section class="section"><h1>Empresas cadastradas</h1><p class="muted">Gerencie múltiplas empresas. Selecione uma empresa para administrá-la ou cadastre uma nova.</p></section>
    <section class="section"><h2>Lista de empresas</h2><div class="table-wrap"><table><thead><tr><th>Empresa</th><th>Ações</th></tr></thead><tbody>${
      state.companies && state.companies.length ? state.companies.map(c => `<tr><td>${esc(c.name)}</td><td><button class="btn" onclick="selectCompany('${c.id}')">Selecionar</button></td></tr>`).join('') : '<tr><td colspan="2">Nenhuma empresa cadastrada.</td></tr>'
    }</tbody></table></div></section>
    <section class="section"><h2>Adicionar empresa</h2><div class="form"><input id="comp-name" class="input" placeholder="Nome da empresa"><input id="comp-cnpj" class="input" placeholder="CNPJ"><input id="comp-seg" class="input" placeholder="Segmento"><input id="comp-size" class="input" placeholder="Porte"><input id="comp-resp" class="input" placeholder="Responsável"><input id="comp-email" class="input" placeholder="E-mail"><textarea id="comp-desc" rows="3" placeholder="Descrição"></textarea><button class="btn" onclick="addCompanyAdmin()">Cadastrar</button></div></section>`;
}

// Add a new company to the system and set it as current. Used by admin.
function addCompanyAdmin(){
  const newCompany = {
    id: uid('org'),
    name: val('comp-name'),
    cnpj: val('comp-cnpj'),
    segment: val('comp-seg'),
    size: val('comp-size'),
    responsible: val('comp-resp'),
    email: val('comp-email'),
    phone: '',
    description: val('comp-desc'),
    serviceTypes: structuredClone(serviceCatalog),
    units: [],
    functions: structuredClone(functionCatalog)
  };
  // Initialize arrays if missing
  if (!state.companies) state.companies = [];
  state.companies.push(newCompany);
  // Set as current company for immediate management
  state.company = newCompany;
  state.currentCompanyId = newCompany.id;
  save();
  alert('Empresa cadastrada. Você pode agora configurá-la em "Empresa".');
  render();
}

// Select a company to manage. Sets the company context and switches to management role.
function selectCompany(id){
  const c = state.companies && state.companies.find(x => x.id === id);
  if (c){
    state.company = c;
    state.currentCompanyId = c.id;
    // When a company is selected, switch to the management role to access dashboards and configuration
    role = 'Gestão/RH';
    localStorage.setItem('psicosaude_role', role);
    // Clear any current collaborator
    state.currentEmployeeId = null;
    localStorage.removeItem('currentEmployeeId');
    // Start at the dashboard for the selected company
    route = 'dashboard';
    save();
    alert('Empresa selecionada. Agora você está no modo de gestão.');
    render();
  }
}

// ----- Collaborator-specific pages -----

// Compute scores for a single employee across dimensions
function computeScoresForEmployee(empId){
  const resps = state.responses.filter(r => r.employeeId === empId);
  if (!resps.length) return {results:[], overall:null, overallRisk:null};
  const qm = questionMap();
  const byDim = new Map();
  resps.forEach(r => {
    const q = qm.get(r.questionId);
    if (!q) return;
    const max = r.questionnaireId === 'q-dass21-screening' ? 3 : 5;
    const score = calcScore(r.value, q.riskDirection, max);
    if (!byDim.has(q.dimension)) byDim.set(q.dimension, []);
    byDim.get(q.dimension).push(score);
  });
  const results = dimensions.map(d => {
    const vals = byDim.get(d) || [];
    if (!vals.length) return {dimension: d, score: null, risk: null};
    const score = Math.round(vals.reduce((s,v) => s + v, 0) / vals.length);
    return {dimension: d, score, risk: scoreToRisk(score)};
  });
  const overallScores = results.filter(r => r.score !== null).map(r => r.score);
  const overall = overallScores.length ? Math.round(overallScores.reduce((s,x) => s + x, 0) / overallScores.length) : null;
  return {results, overall, overallRisk: overall !== null ? scoreToRisk(overall) : null};
}

// Home page for collaborators: show welcome and questionnaire completion status
function pageHomeCollaborator(){
  const emp = state.employees.find(e => e.id === state.currentEmployeeId);
  const name = state.authProfile?.full_name || emp?.name || 'Colaborador';
  const responses = state.responses.filter(r => r.employeeId === state.currentEmployeeId || r.employeeId === state.authProfile?.id);
  const questionnaireStatus = state.questionnaires.map(q => {
    const answered = responses.some(r => r.questionnaireId === q.id);
    return {id: q.id, name: q.name, answered};
  });
  const sync = supabaseClient ? `<div class="actions"><button class="btn secondary" onclick="Promise.all([loadQuestionnairesFromSupabase(), loadOwnResponsesFromSupabase()]).then(()=>{render(); alert('Questionários sincronizados.');})">Sincronizar questionários</button></div>` : '';
  return `<section class="section"><h1>Bem-vindo, ${esc(name)}</h1><p class="muted">Acompanhe seu progresso nos questionários e seu desenvolvimento.</p>${sync}</section><section class="grid grid-2">${questionnaireStatus.map(q=>`<div class="card"><b>${esc(q.name)}</b><p>Status: ${q.answered ? 'Respondido' : 'Pendente'}</p><button class="btn secondary" onclick="state.__q='${q.id}';setRoute('questionarios')">${q.answered?'Revisar questionário':'Responder agora'}</button></div>`).join('')}</section>`;
}

// Profile page for collaborators: display static info
function pageProfileCollaborator(){
  const e = state.employees.find(emp => emp.id === state.currentEmployeeId);
  const tp = currentTalentProfile();
  const name = state.authProfile?.full_name || e?.name || 'Colaborador';
  const email = state.authProfile?.email || '';
  const functionTitle = state.authProfile?.function_title || e?.functionTitle || '';
  const unitId = state.authProfile?.unit_id || e?.unitId || '';
  const currentFnOptions = (state.company.functions || []).map(f=>`<option value="${f.id}" ${tp.targetFunctionId===f.id?'selected':''}>${esc(serviceName(f.serviceTypeId))} • ${esc(f.title)}</option>`).join('');
  return `<section class="section"><h1>Meu Perfil</h1><p><b>Nome:</b> ${esc(name)}</p><p><b>E-mail:</b> ${esc(email)}</p><p><b>Função atual:</b> ${esc(functionTitle)}</p><p><b>Unidade:</b> ${esc(unitName(unitId))}</p><p class="notice"><b>Privacidade:</b> suas respostas psicossociais ficam protegidas. As informações abaixo são profissionais e servem para banco de talentos e desenvolvimento.</p></section><section class="section"><h2>Meu Perfil Profissional</h2><p class="muted">Preencha interesses, competências e objetivo profissional para calcular aderência com oportunidades internas.</p><div class="form"><input id="tal-interests" class="input" placeholder="Áreas de interesse, separadas por vírgula" value="${esc((tp.interests||[]).join(', '))}"><input id="tal-skills" class="input" placeholder="Competências, separadas por vírgula" value="${esc((tp.skills||[]).join(', '))}"><select id="tal-target" class="input"><option value="">Selecione uma função desejada</option>${currentFnOptions}</select><textarea id="tal-dreams" rows="4" placeholder="Objetivos profissionais, formações desejadas e planos de carreira">${esc(tp.dreams||'')}</textarea><button class="btn" onclick="saveTalentProfile()">Salvar perfil profissional</button></div></section>`;
}


// Questionnaire page for collaborators
function pageQuestionnairesCollaborator(){
  if (!state.questionnaires?.length) {
    return `<section class="section"><h1>Questionários</h1><p class="muted">Nenhum questionário carregado.</p><button class="btn" onclick="loadQuestionnairesFromSupabase().then(ok=>{render(); if(!ok) alert('Não consegui carregar questionários do Supabase.');})">Sincronizar questionários</button></section>`;
  }
  const qnSel = state.__q || state.questionnaires[0].id;
  const qn = state.questionnaires.find(q => q.id === qnSel) || state.questionnaires[0];
  const max = questionnaireMax(qn);
  const min = max === 3 ? 0 : 1;
  const existing = state.responses.filter(r => (r.employeeId === state.currentEmployeeId || r.employeeId === state.authProfile?.id) && r.questionnaireId === qn.id);
  existing.forEach(r => { if (tempAnswers[r.questionId] === undefined) tempAnswers[r.questionId] = Number(r.value); });
  const scaleButtons = (q) => Array.from({length:max-min+1},(_,n)=>n+min).map(v=>`<button class="${Number(tempAnswers[q.id])===v?'active':''}" data-q="${q.id}" data-v="${v}" onclick="selectAnswer('${q.id}',${v},this)">${v}</button>`).join('');
  const sync = supabaseClient ? `<button class="btn secondary" onclick="loadQuestionnairesFromSupabase().then(ok=>{render(); alert(ok?'Questionários atualizados.':'Não consegui atualizar agora.');})">Sincronizar do Supabase</button>` : '';
  return `<section class="section"><h1>Questionários</h1><p class="muted">Instrumentos ativos carregados do Supabase. As respostas sensíveis são usadas para devolutiva individual e indicadores coletivos protegidos.</p><div class="actions">${sync}</div><div class="grid grid-2"><select onchange="state.__q=this.value;tempAnswers={};render();">${state.questionnaires.map(q=>`<option value="${q.id}" ${q.id===qn.id?'selected':''}>${esc(q.name)}</option>`).join('')}</select></div><p class="muted">${esc(qn.description)}</p><p class="notice warn"><b>Escala:</b> ${esc(qn.scale || (max===3?'0 = Não se aplicou | 3 = Aplicou-se muito':'1 = Discordo totalmente | 5 = Concordo totalmente'))}</p>${qn.questions.map((q,i)=>`<div class="question"><b>${i+1}. ${esc(q.text)}</b><p class="muted">Dimensão: ${esc(q.dimension)}</p><div class="scale">${scaleButtons(q)}</div></div>`).join('')}<button class="btn" onclick="submitQuestionnaire('${state.currentEmployeeId}','${qn.id}')">Enviar respostas e atualizar devolutiva</button></section>`;
}

// Devolutiva (feedback) page for collaborators
function pageDevolutivaCollaborator(){
  const scores = computeScoresForEmployee(state.currentEmployeeId);
  return `<section class="section"><h1>Minha Devolutiva</h1><p class="muted">Resumo dos seus riscos psicossociais respondidos.</p></section><section class="grid grid-3">${scores.results.map(r=>`<div class="card"><b>${esc(r.dimension)}</b><div class="stat">${r.score!==null?r.score+'%':'—'}</div>${r.score!==null?riskBadge(r.risk):'<span class="pill risk-baixo">sem resposta</span>'}</div>`).join('')}</section><section class="section"><h2>Índice geral</h2><p>${scores.overall!==null? scores.overall+'%' : '—'} ${scores.overallRisk? riskBadge(scores.overallRisk):''}</p></section>`;
}

// Courses/trilhas page for collaborators: show recommended courses based on their scores
function pageTrilhasCollaborator(){
  const scores = computeScoresForEmployee(state.currentEmployeeId);
  const risks = scores.results.filter(r => r.score !== null);
  const rec = recommendCourses(risks.map(r=>({dimension:r.dimension, score:r.score, risco:r.risk})));
  return `<section class="section"><h1>Minhas Trilhas</h1><p class="muted">Cursos recomendados de acordo com sua devolutiva.</p></section><section class="grid grid-3">${rec.map(c=>courseCard(c,{canRemove:false})).join('') || '<p class="muted">Nenhum curso recomendado.</p>'}</section>`;
}


// Company info page for collaborators
function pageEmpresaCollaborator(){
  const emp = state.employees.find(e=>e.id===state.currentEmployeeId);
  const myUnit = emp ? state.company.units.find(u=>u.id===emp.unitId) : null;
  const serviceId = myUnit?.serviceTypeId;
  const visibleFunctions = serviceId ? state.company.functions.filter(f=>f.serviceTypeId===serviceId) : state.company.functions;
  return `<section class="section"><h1>Minha Empresa</h1><p><b>Empresa:</b> ${esc(state.company.name)}</p><p><b>Segmento:</b> ${esc(state.company.segment)}</p><p><b>Responsável:</b> ${esc(state.company.responsible)}</p><p><b>Descrição:</b> ${esc(state.company.description)}</p>${myUnit?`<p class="notice"><b>Meu serviço:</b> ${esc(serviceName(serviceId))}<br><b>Minha unidade:</b> ${esc(myUnit.name)}</p>`:''}<h2>Tipos de serviço</h2><ul>${(state.company.serviceTypes||[]).map(st=>`<li><b>${esc(st.name)}</b> — ${esc(st.area)}</li>`).join('')}</ul><h2>Cargos relacionados ao meu serviço</h2><ul>${visibleFunctions.map(f=>`<li>${esc(f.title)} (${f.openPositions} vagas)</li>`).join('')}</ul></section>`;
}

// Benefits page for collaborators (placeholder)
function pageBeneficiosCollaborator(){
  return `<section class="section"><h1>Benefícios</h1><p class="muted">Aqui você encontra informações sobre benefícios corporativos, convênios e datas de pagamento.</p><ul><li>Vale alimentação/refeição</li><li>Plano de saúde</li><li>Vale transporte</li><li>Plano odontológico</li><li>Datas de pagamento divulgadas via comunicação interna</li></ul></section>`;
}

// Opportunities page for collaborators: show open positions and matches
function pageOportunidadesCollaborator(){
  const e = state.employees.find(emp => emp.id === state.currentEmployeeId) || {
    id: state.authProfile?.id,
    name: state.authProfile?.full_name || 'Colaborador',
    unitId: state.authProfile?.unit_id || null,
    functionTitle: state.authProfile?.function_title || 'Colaborador'
  };
  const tp = currentTalentProfile();
  const hasTalent = (tp.interests||[]).length || (tp.skills||[]).length || tp.targetFunctionId;
  const unit = e?.unitId ? state.company.units.find(u=>u.id===e.unitId) : null;
  const serviceId = unit?.serviceTypeId;
  let opportunities = state.company.functions.filter(f=>Number(f.openPositions || 0) > 0);
  if (serviceId) opportunities = opportunities.filter(f=>f.serviceTypeId===serviceId || f.serviceTypeId==='serv-administrativo');
  const intro = !hasTalent ? '<p class="notice warn"><b>Banco de talentos:</b> ainda não há interesses e competências cadastrados para calcular aderência. Preencha em Meu Perfil Profissional.</p>' : '';
  return `<section class="section"><h1>Oportunidades Internas</h1><p class="muted">Vagas disponíveis, priorizando seu perfil profissional e possibilidades internas.</p>${intro}<div class="actions"><button class="btn secondary" onclick="setRoute('profile')">Preencher perfil profissional</button></div></section><section class="section"><div class="table-wrap"><table><thead><tr><th>Serviço</th><th>Função</th><th>Área</th><th>Vagas</th><th>Aderência</th><th>Lacunas</th></tr></thead><tbody>${opportunities.map(f=>{const m=hasTalent?matchCurrentTalentTo(f):null; return `<tr><td>${esc(serviceName(f.serviceTypeId))}</td><td>${esc(f.title)}</td><td>${esc(f.area)}</td><td>${f.openPositions}</td><td>${m?bar(m.score):'<span class="muted">Aguardando perfil de talentos</span>'}</td><td>${m?esc(m.missing.join(', ') || 'Sem lacunas principais'):'-'}</td></tr>`}).join('') || '<tr><td colspan="6">Nenhuma oportunidade aberta cadastrada no momento.</td></tr>'}</tbody></table></div></section>`;
}


// Support/ombudsman page for collaborators: allow new reports and view own submissions
function pageApoioCollaborator(){
  // Only show reports created by this employee (anonymous or not) - for demo we show all anonymous
  // Show only the collaborator's own identified reports or any anonymous reports
  const myReports = state.ombudsmanReports.filter(r => {
    // Include if anonymous
    if (r.anonymous) return true;
    // Include if this report belongs to the current employee
    return r.employeeId && r.employeeId === state.currentEmployeeId;
  });
  return `<section class="section"><h1>Canal de Apoio</h1><p class="muted">Você pode registrar um relato anônimo ou identificado. A gestão analisa de forma agregada e respeita o sigilo.</p></section><section class="grid grid-2"><div class="section"><h2>Novo Relato</h2><div class="form"><select id="o-unit">${state.company.units.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select><select id="o-cat"><option>Comunicação</option><option>Conflitos</option><option>Assédio</option><option>Sobrecarga</option><option>Acolhimento</option><option>Sugestão</option></select><textarea id="o-desc" rows="6" placeholder="Descreva a situação..."></textarea><label><input id="o-anon" type="checkbox" checked> Registrar como anônimo</label><button class="btn" onclick="addOmbudsman()">Registrar</button></div></div><div class="section"><h2>Meus Relatos</h2>${myReports.length ? myReports.map(o=>`<div class="card"><b>${esc(o.category)} • ${esc(unitName(o.unitId))}</b><p>${esc(o.description)}</p><small>Status: ${esc(o.status)}</small></div>`).join('') : '<p class="muted">Nenhum relato registrado ainda.</p>'}</div></section>`;
}
function current(){
  if (role === 'Colaborador') {
    const pagesCol = {
      terms: pageTermsCollaborator,
      changePassword: pageChangePasswordCollaborator,
      home: pageHomeCollaborator,
      profile: pageProfileCollaborator,
      questionarios: pageQuestionnairesCollaborator,
      devolutiva: pageDevolutivaCollaborator,
      trilhas: pageTrilhasCollaborator,
      empresaInfo: pageEmpresaCollaborator,
      beneficios: pageBeneficiosCollaborator,
      oportunidades: pageOportunidadesCollaborator,
      apoio: pageApoioCollaborator,
      courseViewer: pageCourseViewer
    };
    return pagesCol[route] ? pagesCol[route]() : pageHomeCollaborator();
  } else if (role === 'Admin') {
    const pagesAdmin = {
      companies: pageCompaniesAdmin
    };
    return pagesAdmin[route] ? pagesAdmin[route]() : pageCompaniesAdmin();
  } else {
    const pagesMan = {
      dashboard: pageDashboard,
      empresa: pageCompany,
      talentos: pageTalents,
      questionarios: pageQuestionnaires,
      plano: pageAction,
      cursos: pageCourses,
      ouvidoria: pageOmbudsman,
      relatorio: pageReport,
      governanca: pageGovernance,
      courseViewer: pageCourseViewer
    };
    return pagesMan[route] ? pagesMan[route]() : pageDashboard();
  }
}
function render(){document.getElementById('app').innerHTML=role?layout(current()):renderLogin(); if(route==='courseViewer') setTimeout(mountCourseViewer, 50)}
function saveCompany(){state.company.name=val('c-name');state.company.cnpj=val('c-cnpj');state.company.segment=val('c-seg');state.company.size=val('c-size');state.company.responsible=val('c-resp');state.company.email=val('c-email');state.company.description=val('c-desc');save();render()}
function val(id){return document.getElementById(id)?.value||''}
function updateUnit(id,k,v){const u=state.company.units.find(x=>x.id===id);if(u){u[k]=k==='employees'?Number(v):v;save();}}
function deleteUnit(id){if(confirm('Remover unidade e respostas vinculadas?')){state.company.units=state.company.units.filter(u=>u.id!==id);state.responses=state.responses.filter(r=>r.unitId!==id);save();render()}}
function addUnit(){state.company.units.push({id:uid('u'),name:val('u-name'),serviceTypeId:val('u-service'),area:val('u-area'),employees:Number(val('u-emps')||0)});save();render()}
function updateFn(id,k,v){const f=state.company.functions.find(x=>x.id===id);if(f){f[k]=k==='skills'?v.split(',').map(s=>s.trim()).filter(Boolean):k==='openPositions'?Number(v):v;save();}}
function deleteFn(id){if(confirm('Remover função?')){state.company.functions=state.company.functions.filter(f=>f.id!==id);save();render()}}
function addFn(){state.company.functions.push({id:uid('f'),serviceTypeId:val('f-service'),title:val('f-title'),area:val('f-area'),skills:val('f-skills').split(',').map(s=>s.trim()).filter(Boolean),openPositions:Number(val('f-vagas')||0),description:val('f-desc')});save();render()}
function addEmployee(){
  // Generate a new unique ID and a random password for the collaborator
  const newId = uid('c');
  const password = Math.random().toString(36).slice(-8);
  const interestsArr = val('e-int').split(',').map(s=>s.trim()).filter(Boolean);
  state.employees.push({
    id: newId,
    name: val('e-name'),
    unitId: val('e-unit'),
    functionTitle: val('e-fn'),
    targetFunctionId: val('e-target'),
    interests: interestsArr,
    dreams: val('e-dream'),
    companyId: state.company.id,
    password: password,
    // Require the collaborator to update their password upon first login
    needsPasswordChange: true
  });
  // Store credential for login
  credentials[newId] = password;
  save();
  alert('Colaborador cadastrado.\nID: ' + newId + '\nSenha: ' + password);
  render();
}
function deleteEmployee(id){if(confirm('Remover colaborador e respostas dele?')){state.employees=state.employees.filter(e=>e.id!==id);state.responses=state.responses.filter(r=>r.employeeId!==id);save();render()}}
let tempAnswers={};function selectAnswer(qid,v,el){tempAnswers[qid]=v;el.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));el.classList.add('active')}
async function submitQuestionnaire(employeeId, questionnaireId) {
  const qn = state.questionnaires.find(q => q.id === questionnaireId);
  if (!qn) {
    alert('Questionário não encontrado.');
    return;
  }
  if (!qn.questions.every(q => tempAnswers[q.id] !== undefined)) {
    alert('Responda todas as perguntas.');
    return;
  }
  if (IS_PRODUCTION && supabaseClient && state.authProfile?.id) {
    const ok = await submitQuestionnaireToSupabase(employeeId, questionnaireId, qn);
    if (!ok) return;
  } else {
    const emp = state.employees.find(e => e.id === employeeId) || {};
    state.responses = state.responses.filter(r => !(r.employeeId === employeeId && r.questionnaireId === questionnaireId));
    qn.questions.forEach(q => {
      state.responses.push({
        id: uid('r'),
        employeeId,
        unitId: emp.unitId,
        questionnaireId,
        questionId: q.id,
        dimension: q.dimension,
        value: Number(tempAnswers[q.id]),
        createdAt: new Date().toISOString()
      });
    });
  }
  tempAnswers = {};
  save();
  alert('Respostas registradas. Sua devolutiva foi atualizada.');
  setRoute('devolutiva');
}
function addCourse(){state.courses.push({id:uid('course'),title:val('course-title'),category:val('course-cat'),duration:val('course-dur'),description:val('course-desc'),recommendedFor:val('course-rec').split(',').map(s=>s.trim()).filter(Boolean),modules:val('course-mods').split('\n').map(s=>s.trim()).filter(Boolean),contentUrl:val('course-url'),contentType:'html',sortOrder:state.courses.length+1});save();render()}
function deleteCourse(id){state.courses=state.courses.filter(c=>c.id!==id);save();render()}
function addOmbudsman(){
  state.ombudsmanReports.push({
    id: uid('o'),
    unitId: val('o-unit'),
    category: val('o-cat'),
    description: val('o-desc'),
    anonymous: document.getElementById('o-anon').checked,
    status: 'aberto',
    // Associate the report with the current collaborator for filtering purposes
    employeeId: state.currentEmployeeId || null,
    createdAt: new Date().toISOString()
  });
  save();
  render();
}
function updateOmbudsman(id,status){const r=state.ombudsmanReports.find(x=>x.id===id);if(r){r.status=status;r.updatedAt=new Date().toISOString();save();render()}}
function copyJson(){navigator.clipboard?.writeText(JSON.stringify(state,null,2));alert('Dados copiados em JSON.')}
render();
// After initial render, attempt to load the most recent state from Supabase.
// This allows multiuser/cloud storage while preserving offline functionality.
if (typeof loadFromSupabase === 'function') {
  loadFromSupabase().then((loaded) => {
    if (loaded) {
      // Persist the loaded state locally and remotely and re-render UI
      save();
      render();
    }
  });
}

// Em produção, tenta carregar bibliotecas reais do Supabase ao abrir o app.
if (supabaseClient) {
  Promise.all([loadCoursesFromSupabase(), loadQuestionnairesFromSupabase()]).then(()=>render());
}
