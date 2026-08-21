# OIDC federado GitHub Actions → AWS, mismo patrón que
# backend/infra/terraform/github-actions.tf pero para este repo.
#
# NOTA: el OIDC provider es un recurso *global de la cuenta*. El backend ya
# creó uno para token.actions.githubusercontent.com — si Terraform se queja
# de "already exists" al aplicar esto, es porque ambos states (backend y
# frontend) están intentando crear el mismo provider de cuenta; en ese caso
# hay que importarlo acá en vez de crearlo de nuevo (ver README.md).

data "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

# GitHub agrega los IDs numéricos inmutables del owner/repo al claim "sub"
# (repo:<owner>@<ownerId>/<repo>@<repoId>:ref:...), no el simple "owner/repo"
# — confirmado vía CloudTrail en el repo backend (ver su github-actions.tf),
# donde el patrón "owner/repo" sin IDs rechazaba todo intento con
# "Not authorized" a pesar de que trust policy/thumbprint/secret estaban
# bien. IDs de este repo: owner=15717668, repo=1326242877.
variable "github_owner_id" {
  type    = string
  default = "15717668"
}

variable "github_repo_id" {
  type    = string
  default = "1326242877"
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${split("/", var.github_repo)[0]}@${var.github_owner_id}/${split("/", var.github_repo)[1]}@${var.github_repo_id}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.project_name}-${var.environment}-fe-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

data "aws_iam_policy_document" "github_actions_ecr_push" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [aws_ecr_repository.frontend.arn]
  }
}

resource "aws_iam_role_policy" "github_actions_ecr_push" {
  name   = "${var.project_name}-${var.environment}-fe-github-actions-ecr-push"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.github_actions_ecr_push.json
}

output "github_actions_role_arn" {
  description = "ARN a configurar como secret AWS_DEPLOY_ROLE_ARN en GitHub Actions (repo frontend)."
  value       = aws_iam_role.github_actions_deploy.arn
}
