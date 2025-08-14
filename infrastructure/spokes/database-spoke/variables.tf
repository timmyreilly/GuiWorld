# Variables for Database Spoke Configuration

variable "spoke_location" {
  description = "Azure region for the Database spoke"
  type        = string
  default     = "East US"
  
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

variable "keyvault_state_path" {
  description = "Path to the Key Vault spoke Terraform state file"
  type        = string
  default     = "../keyvault-spoke/terraform.tfstate"
}

variable "store_password_in_keyvault" {
  description = "Store database password in Key Vault (requires Key Vault spoke to be deployed first)"
  type        = bool
  default     = false
}

# Networking Configuration
variable "spoke_vnet_address_space" {
  description = "Address space for the spoke virtual network"
  type        = string
  default     = "10.2.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.spoke_vnet_address_space, 0))
    error_message = "Spoke VNet address space must be a valid CIDR block."
  }
}

variable "database_subnet_address_prefix" {
  description = "Address prefix for the database subnet"
  type        = string
  default     = "10.2.1.0/24"
  
  validation {
    condition     = can(cidrhost(var.database_subnet_address_prefix, 0))
    error_message = "Database subnet address prefix must be a valid CIDR block."
  }
}

# PostgreSQL Configuration
variable "postgresql_sku" {
  description = "SKU for PostgreSQL Flexible Server"
  type        = string
  default     = "B_Standard_B1ms"  # Burstable, 1 vCore, 2GB RAM for development
  
  validation {
    condition = can(regex("^(B_Standard_B[124]ms|GP_Standard_D[248]s_v3|MO_Standard_E[248]s_v3)$", var.postgresql_sku))
    error_message = "PostgreSQL SKU must be a valid flexible server SKU."
  }
}

variable "postgresql_storage_mb" {
  description = "Storage size in MB for PostgreSQL"
  type        = number
  default     = 32768  # 32GB
  
  validation {
    condition     = var.postgresql_storage_mb >= 20480 && var.postgresql_storage_mb <= 16777216
    error_message = "PostgreSQL storage must be between 20GB and 16TB (20480 to 16777216 MB)."
  }
}

variable "postgresql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
  
  validation {
    condition     = contains(["11", "12", "13", "14", "15"], var.postgresql_version)
    error_message = "PostgreSQL version must be 11, 12, 13, 14, or 15."
  }
}

variable "database_admin_username" {
  description = "Administrator username for PostgreSQL"
  type        = string
  default     = "guiworld_admin"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{2,63}$", var.database_admin_username))
    error_message = "Database admin username must be 3-64 characters, start with a letter, and contain only letters, numbers, and underscores."
  }
}

variable "database_admin_password" {
  description = "Administrator password for PostgreSQL (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
  
  validation {
    condition = var.database_admin_password == "" || can(regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,128}$", var.database_admin_password))
    error_message = "Database admin password must be 12-128 characters with at least one lowercase letter, one uppercase letter, one digit, and one special character, or leave empty for auto-generation."
  }
}

variable "database_name" {
  description = "Name of the main database to create"
  type        = string
  default     = "guiworld"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{0,62}$", var.database_name))
    error_message = "Database name must start with a letter and contain only letters, numbers, and underscores (max 63 characters)."
  }
}

variable "additional_databases" {
  description = "List of additional databases to create"
  type        = list(string)
  default     = []
}

variable "database_timezone" {
  description = "Timezone for the database"
  type        = string
  default     = "UTC"
}

# Backup and High Availability
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 14
  
  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Backup retention days must be between 7 and 35."
  }
}

variable "geo_redundant_backup_enabled" {
  description = "Enable geo-redundant backups"
  type        = bool
  default     = false
}

variable "enable_high_availability" {
  description = "Enable high availability (zone redundant)"
  type        = bool
  default     = false
}

# Maintenance Window
variable "maintenance_window_day" {
  description = "Day of week for maintenance window (0=Sunday, 6=Saturday)"
  type        = number
  default     = 0
  
  validation {
    condition     = var.maintenance_window_day >= 0 && var.maintenance_window_day <= 6
    error_message = "Maintenance window day must be between 0 (Sunday) and 6 (Saturday)."
  }
}

variable "maintenance_window_hour" {
  description = "Hour for maintenance window (24-hour format)"
  type        = number
  default     = 3
  
  validation {
    condition     = var.maintenance_window_hour >= 0 && var.maintenance_window_hour <= 23
    error_message = "Maintenance window hour must be between 0 and 23."
  }
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
  default     = "GuiWorld-Database"
}
