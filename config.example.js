// Copie este arquivo para config.js e preencha com os dados públicos do Supabase.
// A anon key é pública por desenho do Supabase, mas a service_role NUNCA deve entrar no frontend.
window.PSICOSAUDE_CONFIG = {
  mode: 'production', // 'demo' ou 'production'
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_ANON_KEY_PUBLICA',
  allowLegacyStateSync: false,
  defaultOrganizationId: '00000000-0000-0000-0000-000000000001'
};
