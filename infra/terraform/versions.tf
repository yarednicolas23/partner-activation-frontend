terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Estado local por ahora (MVP, un solo dev provisionando) — mismo criterio
  # que backend/infra/terraform. Migrar a backend remoto antes de que el
  # equipo crezca o se pase a staging/producción compartida.
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "partner-activation-program"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
