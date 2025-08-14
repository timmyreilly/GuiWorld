# Variables for Key Vault Spoke Configuration

variable "spoke_location" {
  description = "Azure region for the Key Vault spoke"
  type        = string
  default     = "South Central US"
  
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
    ], var.spoke_location)
    error_message = "Spoke location must be a valid Azure region."
  }
}

variable "hub_state_path" {
  description = "Path to the hub Terraform state file"
  type        = string
  default     = "../../hub/terraform.tfstate"
}

# Networking Configuration
variable "spoke_vnet_address_space" {
  description = "Address space for the spoke virtual network"
  type        = string
  default     = "10.1.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.spoke_vnet_address_space, 0))
    error_message = "Spoke VNet address space must be a valid CIDR block."
  }
}

variable "keyvault_subnet_address_prefix" {
  description = "Address prefix for the Key Vault subnet"
  type        = string
  default     = "10.1.1.0/24"
  
  validation {
    condition     = can(cidrhost(var.keyvault_subnet_address_prefix, 0))
    error_message = "Key Vault subnet address prefix must be a valid CIDR block."
  }
}

# Key Vault Configuration
variable "key_vault_sku" {
  description = "SKU for the Key Vault"
  type        = string
  default     = "standard"
  
  validation {
    condition     = contains(["standard", "premium"], var.key_vault_sku)
    error_message = "Key Vault SKU must be either 'standard' or 'premium'."
  }
}

variable "soft_delete_retention_days" {
  description = "Number of days to retain deleted keys/secrets/certificates"
  type        = number
  default     = 7
  
  validation {
    condition     = var.soft_delete_retention_days >= 7 && var.soft_delete_retention_days <= 90
    error_message = "Soft delete retention days must be between 7 and 90."
  }
}

variable "enable_purge_protection" {
  description = "Enable purge protection for Key Vault (recommended for production)"
  type        = bool
  default     = false
}

variable "allow_public_access" {
  description = "Allow public network access to Key Vault (set to false for private-only access)"
  type        = bool
  default     = true  # Set to false for production environments
}

# Resource Tagging
variable "additional_tags" {
  description = "Additional tags to apply to spoke resources"
  type        = map(string)
  default     = {}
}

variable "cost_center" {
  description = "Cost center for billing and resource allocation"
  type        = string
  default     = "GuiWorld-KeyVault"
}
