# Hub and Spoke Infrastructure Makefile
# Automates deployment and management of the entire infrastructure

.PHONY: help init-all plan-all deploy-all destroy-all
.PHONY: deploy-hub deploy-keyvault-spoke deploy-database-spoke deploy-storage-spoke
.PHONY: destroy-hub destroy-keyvault-spoke destroy-database-spoke destroy-storage-spoke
.PHONY: plan-hub plan-keyvault-spoke plan-database-spoke plan-storage-spoke
.PHONY: output-all validate-all clean-all status

# Default target
help:
	@echo "Hub and Spoke Infrastructure Management"
	@echo "======================================="
	@echo ""
	@echo "Deployment Commands:"
	@echo "  deploy-all           - Deploy all infrastructure (hub first, then spokes)"
	@echo "  deploy-hub           - Deploy only the hub infrastructure"
	@echo "  deploy-keyvault-spoke - Deploy only the Key Vault spoke"
	@echo "  deploy-database-spoke - Deploy only the Database spoke"
	@echo "  deploy-storage-spoke  - Deploy only the Storage spoke"
	@echo ""
	@echo "Planning Commands:"
	@echo "  plan-all             - Show plan for all components"
	@echo "  plan-hub             - Show plan for hub"
	@echo "  plan-keyvault-spoke  - Show plan for Key Vault spoke"
	@echo "  plan-database-spoke  - Show plan for Database spoke"
	@echo "  plan-storage-spoke   - Show plan for Storage spoke"
	@echo ""
	@echo "Management Commands:"
	@echo "  init-all             - Initialize Terraform for all components"
	@echo "  output-all           - Show outputs from all deployed components"
	@echo "  validate-all         - Validate all Terraform configurations"
	@echo "  status               - Show status of all deployments"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  destroy-all          - Destroy all infrastructure (spokes first, then hub)"
	@echo "  destroy-storage-spoke - Destroy only the Storage spoke"
	@echo "  destroy-database-spoke - Destroy only the Database spoke"
	@echo "  destroy-keyvault-spoke - Destroy only the Key Vault spoke"
	@echo "  destroy-hub          - Destroy only the hub infrastructure"
	@echo "  clean-all            - Clean Terraform state and cache files"

# Color definitions for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Initialize all Terraform configurations
init-all:
	@echo "$(BLUE)Initializing all Terraform configurations...$(NC)"
	@cd hub && terraform init
	@cd spokes/keyvault-spoke && terraform init
	@cd spokes/database-spoke && terraform init
	@cd spokes/storage-spoke && terraform init
	@echo "$(GREEN)All Terraform configurations initialized$(NC)"

# Validate all configurations
validate-all:
	@echo "$(BLUE)Validating all Terraform configurations...$(NC)"
	@cd hub && terraform validate
	@cd spokes/keyvault-spoke && terraform validate
	@cd spokes/database-spoke && terraform validate
	@cd spokes/storage-spoke && terraform validate
	@echo "$(GREEN)All Terraform configurations are valid$(NC)"

# Plan all deployments
plan-all: plan-hub plan-keyvault-spoke plan-database-spoke plan-storage-spoke

plan-hub:
	@echo "$(BLUE)Planning hub deployment...$(NC)"
	@cd hub && terraform plan

plan-keyvault-spoke:
	@echo "$(BLUE)Planning Key Vault spoke deployment...$(NC)"
	@cd spokes/keyvault-spoke && terraform plan

plan-database-spoke:
	@echo "$(BLUE)Planning Database spoke deployment...$(NC)"
	@cd spokes/database-spoke && terraform plan

plan-storage-spoke:
	@echo "$(BLUE)Planning Storage spoke deployment...$(NC)"
	@cd spokes/storage-spoke && terraform plan

# Deploy all infrastructure (proper order: hub first, then spokes)
deploy-all: deploy-hub deploy-keyvault-spoke deploy-database-spoke deploy-storage-spoke
	@echo "$(GREEN)All infrastructure deployed successfully!$(NC)"
	@echo "$(YELLOW)Run 'make output-all' to see all outputs$(NC)"

# Deploy individual components
deploy-hub:
	@echo "$(BLUE)Deploying hub infrastructure...$(NC)"
	@cd hub && terraform init && terraform apply -auto-approve
	@echo "$(GREEN)Hub infrastructure deployed$(NC)"

deploy-keyvault-spoke:
	@echo "$(BLUE)Deploying Key Vault spoke...$(NC)"
	@cd spokes/keyvault-spoke && terraform init && terraform apply -auto-approve
	@echo "$(GREEN)Key Vault spoke deployed$(NC)"

deploy-database-spoke:
	@echo "$(BLUE)Deploying Database spoke...$(NC)"
	@cd spokes/database-spoke && terraform init && terraform apply -auto-approve
	@echo "$(GREEN)Database spoke deployed$(NC)"

deploy-storage-spoke:
	@echo "$(BLUE)Deploying Storage spoke...$(NC)"
	@cd spokes/storage-spoke && terraform init && terraform apply -auto-approve
	@echo "$(GREEN)Storage spoke deployed$(NC)"

# Show outputs from all components
output-all:
	@echo "$(BLUE)=== Hub Outputs ===$(NC)"
	@cd hub && terraform output 2>/dev/null || echo "$(RED)Hub not deployed$(NC)"
	@echo ""
	@echo "$(BLUE)=== Key Vault Spoke Outputs ===$(NC)"
	@cd spokes/keyvault-spoke && terraform output 2>/dev/null || echo "$(RED)Key Vault spoke not deployed$(NC)"
	@echo ""
	@echo "$(BLUE)=== Database Spoke Outputs ===$(NC)"
	@cd spokes/database-spoke && terraform output 2>/dev/null || echo "$(RED)Database spoke not deployed$(NC)"
	@echo ""
	@echo "$(BLUE)=== Storage Spoke Outputs ===$(NC)"
	@cd spokes/storage-spoke && terraform output 2>/dev/null || echo "$(RED)Storage spoke not deployed$(NC)"

# Show deployment status
status:
	@echo "$(BLUE)Infrastructure Deployment Status$(NC)"
	@echo "================================="
	@echo -n "Hub: "
	@if [ -f hub/terraform.tfstate ] && [ -s hub/terraform.tfstate ]; then \
		echo "$(GREEN)Deployed$(NC)"; \
	else \
		echo "$(RED)Not Deployed$(NC)"; \
	fi
	@echo -n "Key Vault Spoke: "
	@if [ -f spokes/keyvault-spoke/terraform.tfstate ] && [ -s spokes/keyvault-spoke/terraform.tfstate ]; then \
		echo "$(GREEN)Deployed$(NC)"; \
	else \
		echo "$(RED)Not Deployed$(NC)"; \
	fi
	@echo -n "Database Spoke: "
	@if [ -f spokes/database-spoke/terraform.tfstate ] && [ -s spokes/database-spoke/terraform.tfstate ]; then \
		echo "$(GREEN)Deployed$(NC)"; \
	else \
		echo "$(RED)Not Deployed$(NC)"; \
	fi
	@echo -n "Storage Spoke: "
	@if [ -f spokes/storage-spoke/terraform.tfstate ] && [ -s spokes/storage-spoke/terraform.tfstate ]; then \
		echo "$(GREEN)Deployed$(NC)"; \
	else \
		echo "$(RED)Not Deployed$(NC)"; \
	fi

# Destroy all infrastructure (reverse order: spokes first, then hub)
destroy-all:
	@echo "$(RED)WARNING: This will destroy ALL infrastructure!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or Enter to continue...$(NC)"
	@read
	@$(MAKE) destroy-storage-spoke
	@$(MAKE) destroy-database-spoke
	@$(MAKE) destroy-keyvault-spoke
	@$(MAKE) destroy-hub
	@echo "$(GREEN)All infrastructure destroyed$(NC)"

# Destroy individual components (in reverse order)
destroy-storage-spoke:
	@echo "$(RED)Destroying Storage spoke...$(NC)"
	@cd spokes/storage-spoke && terraform destroy -auto-approve
	@echo "$(YELLOW)Storage spoke destroyed$(NC)"

destroy-database-spoke:
	@echo "$(RED)Destroying Database spoke...$(NC)"
	@cd spokes/database-spoke && terraform destroy -auto-approve
	@echo "$(YELLOW)Database spoke destroyed$(NC)"

destroy-keyvault-spoke:
	@echo "$(RED)Destroying Key Vault spoke...$(NC)"
	@cd spokes/keyvault-spoke && terraform destroy -auto-approve
	@echo "$(YELLOW)Key Vault spoke destroyed$(NC)"

destroy-hub:
	@echo "$(RED)Destroying hub infrastructure...$(NC)"
	@cd hub && terraform destroy -auto-approve
	@echo "$(YELLOW)Hub infrastructure destroyed$(NC)"

# Clean up Terraform files
clean-all:
	@echo "$(YELLOW)Cleaning up Terraform state and cache files...$(NC)"
	@find . -name "terraform.tfstate*" -delete
	@find . -name ".terraform" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".terraform.lock.hcl" -delete
	@echo "$(GREEN)Cleanup complete$(NC)"

# Utility targets for development
fmt-all:
	@echo "$(BLUE)Formatting all Terraform files...$(NC)"
	@terraform fmt -recursive .
	@echo "$(GREEN)All files formatted$(NC)"

# Quick deployment for development (with auto-approve)
deploy-dev: init-all
	@echo "$(YELLOW)Deploying in development mode (auto-approve enabled)$(NC)"
	@$(MAKE) deploy-all
	@$(MAKE) output-all

# Production deployment (requires manual approval)
deploy-prod: init-all validate-all
	@echo "$(YELLOW)Production deployment - manual approval required$(NC)"
	@cd hub && terraform apply
	@cd spokes/keyvault-spoke && terraform apply
	@cd spokes/database-spoke && terraform apply
	@cd spokes/storage-spoke && terraform apply
	@$(MAKE) output-all
