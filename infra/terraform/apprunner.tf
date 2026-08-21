# Requiere que la imagen ya exista en ECR con el tag `var.image_tag` antes
# del primer apply. Las NEXT_PUBLIC_* NO van acá — se inlinean en el bundle
# durante `next build` (ver Dockerfile, ARGs), no se pueden inyectar en
# runtime como en el backend.
resource "aws_apprunner_service" "frontend" {
  service_name = "${var.project_name}-${var.environment}-frontend"

  source_configuration {
    auto_deployments_enabled = true

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.frontend.repository_url}:${var.image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"

        runtime_environment_variables = {
          NODE_ENV    = "production"
          PORT        = "3000"
          BACKEND_URL = var.backend_url
        }
      }
    }
  }

  instance_configuration {
    cpu               = var.cpu
    memory            = var.memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  # /login no requiere auth y renderiza sin redirect — sirve tal cual de
  # health check (a diferencia de "/", que redirige a /login).
  health_check_configuration {
    protocol            = "HTTP"
    path                = "/login"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }
}
