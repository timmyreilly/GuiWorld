# Variables for Hub Infrastructure Configuration

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "hub_location" {
  description = "Azure region for hub infrastructure"
  type        = string
  default     = "Central US"  # Central location for hub
  
  validation {
    condition = contains([
      "East US", "East US 2", "West US", "West US 2", "West US 3",
      "Central US", "North Central US", "South Central US",
      "West Central US", "Canada Central", "Canada East",
      "Brazil South", "North Europe", "West Europe",
      "UK South", "UK West", "France Central", "Germany West Central",
      "Switzerland North", "Norway East", "Sweden Central",
      "Australia East", "Australia Southeast", "Japan East", "Japan West",
      "Korea Central", "South India", "Southeast Asia", "East Asia"
    ], var.hub_location)
    error_message = "Hub location must be a valid Azure region."
  }
}

# Networking Configuration
variable "hub_vnet_address_space" {
  description = "Address space for the hub virtual network"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.hub_vnet_address_space, 0))
    error_message = "Hub VNet address space must be a valid CIDR block."
  }
}

variable "gateway_subnet_address_prefix" {
  description = "Address prefix for the gateway subnet"
  type        = string
  default     = "10.0.1.0/24"
  
  validation {
    condition     = can(cidrhost(var.gateway_subnet_address_prefix, 0))
    error_message = "Gateway subnet address prefix must be a valid CIDR block."
  }
}

variable "firewall_subnet_address_prefix" {
  description = "Address prefix for the Azure Firewall subnet"
  type        = string
  default     = "10.0.2.0/24"
  
  validation {
    condition     = can(cidrhost(var.firewall_subnet_address_prefix, 0))
    error_message = "Firewall subnet address prefix must be a valid CIDR block."
  }
}

variable "bastion_subnet_address_prefix" {
  description = "Address prefix for the Azure Bastion subnet"
  type        = string
  default     = "10.0.3.0/24"
  
  validation {
    condition     = can(cidrhost(var.bastion_subnet_address_prefix, 0))
    error_message = "Bastion subnet address prefix must be a valid CIDR block."
  }
}

variable "shared_services_subnet_address_prefix" {
  description = "Address prefix for the shared services subnet"
  type        = string
  default     = "10.0.4.0/24"
  
  validation {
    condition     = can(cidrhost(var.shared_services_subnet_address_prefix, 0))
    error_message = "Shared services subnet address prefix must be a valid CIDR block."
  }
}

# Optional Services Configuration
variable "enable_azure_firewall" {
  description = "Enable Azure Firewall for centralized security (recommended for production)"
  type        = bool
  default     = false  # Disabled for development to reduce costs
}

variable "enable_azure_bastion" {
  description = "Enable Azure Bastion for secure VM access"
  type        = bool
  default     = false  # Disabled for development to reduce costs
}

# Logging Configuration
variable "log_analytics_retention_days" {
  description = "Number of days to retain logs in Log Analytics"
  type        = number
  default     = 30
  
  validation {
    condition     = var.log_analytics_retention_days >= 30 && var.log_analytics_retention_days <= 730
    error_message = "Log Analytics retention must be between 30 and 730 days."
  }
}

# Resource Tagging
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "cost_center" {
  description = "Cost center for billing and resource allocation"
  type        = string
  default     = "GuiWorld-Hub"
}

variable "owner_email" {
  description = "Email of the resource owner for contact purposes"
  type        = string
  default     = ""
  
  validation {
    condition = var.owner_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.owner_email))
    error_message = "Owner email must be a valid email address or empty string."
  }
}
