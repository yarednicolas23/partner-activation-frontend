variable "aws_region" {
  description = "Región AWS — misma que backend/infra/terraform (eu-central-1, ver CLAUDE.md)."
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Prefijo para namespacing de recursos."
  type        = string
  default     = "pap"
}

variable "environment" {
  description = "dev | staging | prod."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment debe ser dev, staging o prod."
  }
}

variable "image_tag" {
  description = "Tag de la imagen en ECR que App Runner debe correr. CI/CD la actualiza en cada deploy."
  type        = string
  default     = "latest"
}

variable "cpu" {
  description = "vCPU para App Runner."
  type        = string
  default     = "0.25 vCPU"
}

variable "memory" {
  description = "Memoria para App Runner."
  type        = string
  default     = "0.5 GB"
}

variable "backend_url" {
  description = "URL del backend NestJS que este frontend consume — server-side (route handlers/server components), nunca llega al navegador. Apunta a Railway mientras el backend en AWS App Runner no esté confirmado estable; actualizar cuando se corte a AWS."
  type        = string
  default     = "https://partner-activation-backend-production.up.railway.app"
}

variable "github_repo" {
  description = "owner/repo de GitHub autorizado a asumir el rol de deploy."
  type        = string
  default     = "yarednicolas23/partner-activation-frontend"
}
