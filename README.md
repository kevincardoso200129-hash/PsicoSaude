# PsicoSaúde NR-1

Plataforma digital para gestão psicossocial, saúde mental no trabalho, desenvolvimento organizacional e apoio à adequação à NR-1.

## Versão atual

Esta versão está configurada para demonstração/piloto com Supabase.

Principais recursos:

- Login com Supabase Auth.
- Perfis: Super Admin, Gestão/RH e Colaborador.
- Questionários psicossociais integrados ao Supabase.
- Inventário Psicossocial NR-1 com dimensão de respeito, diversidade e discriminação.
- DASS-21 como rastreio complementar, sem finalidade diagnóstica.
- Devolutiva individual ao colaborador.
- Dashboard e indicadores agregados para gestão.
- Cursos e trilhas de desenvolvimento.
- Registro de conclusão de cursos via avaliação do PsicoSaúde.
- Banco de talentos e oportunidades internas.
- Canal de apoio/ouvidoria.
- Estrutura LGPD com separação entre dados sensíveis e dados profissionais.

## Acesso de demonstração

Após publicar no GitHub Pages, acesse:

`https://kevincardoso200129-hash.github.io/PsicoSaude/`

Usuários de teste:

- Gestão/RH: `gestao.teste@psicosaude.com`
- Colaborador: `colaborador.teste@psicosaude.com`

A senha foi definida diretamente no Supabase Auth durante o cadastro dos usuários teste.

## Segurança

Este repositório contém apenas a `anon key` pública do Supabase, própria para uso no frontend. Nunca incluir `service_role` no frontend ou em repositório público.

## Supabase

Os scripts SQL ficam na pasta `/supabase`.

## Autor

Kevin Cardoso — Psicólogo  
PsicoSaúde NR-1
