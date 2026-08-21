# Infraestructura AWS — frontend (App Runner)

Provisiona el frontend Next.js en AWS App Runner, misma región `eu-central-1` que
`backend/infra/terraform`.

## Prerrequisitos

- AWS CLI configurado localmente.
- Docker + `docker buildx` corriendo localmente.
- Terraform >= 1.7.
- El OIDC provider `token.actions.githubusercontent.com` ya existe en la cuenta (creado por
  `backend/infra/terraform/github-actions.tf`) — este state solo lo referencia (`data`), no lo
  crea de nuevo.

## Setup

```bash
terraform init
```

## Orden de aplicación (importante)

Igual que el backend: App Runner necesita la imagen ya en ECR antes del primer apply completo.

1. **Crear solo el ECR repo primero:**
   ```bash
   terraform apply -target=aws_ecr_repository.frontend
   ```
2. **Build y push de la imagen** (`scripts/push-image.sh` — lee `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` de `frontend/.env`, las inlinea en el build vía `--build-arg`):
   ```bash
   ./scripts/push-image.sh latest
   ```
3. **Apply completo:**
   ```bash
   terraform apply
   ```

## NEXT_PUBLIC_* vs. runtime env vars

`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` se inlinean en el bundle del
navegador durante `next build` (Dockerfile ARGs) — cambiar su valor requiere rebuild + push de
imagen nueva, no alcanza con cambiar la config de App Runner. `BACKEND_URL` sí es runtime normal
(se lee server-side en cada request) y se puede cambiar solo con `terraform apply` sin rebuild.

## CI/CD

`.github/workflows/deploy.yml` en este repo hace build+push automático en cada push a `main`,
usando el rol `github_actions_deploy` (OIDC, sin access keys guardadas). Configurar el secret
`AWS_DEPLOY_ROLE_ARN` en GitHub con el output `github_actions_role_arn`, y
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` como secrets también (no son
sensibles, pero mismo mecanismo que el resto).
