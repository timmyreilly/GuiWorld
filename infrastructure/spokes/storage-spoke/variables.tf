# Storage Spoke Variables

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

variable "spoke_location" {
  description = "Azure region for the storage spoke"
  type        = string
  default     = "West US"
}

variable "spoke_vnet_address_space" {
  description = "Address space for the storage spoke VNet"
  type        = string
  default     = "10.3.0.0/16"
}

variable "storage_subnet_address_prefix" {
  description = "Address prefix for the storage subnet"
  type        = string
  default     = "10.3.1.0/24"
}

variable "storage_account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
  
  validation {
    condition     = contains(["Standard", "Premium"], var.storage_account_tier)
    error_message = "Storage account tier must be either 'Standard' or 'Premium'."
  }
}

variable "storage_replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "LRS"
  
  validation {
    condition     = contains(["LRS", "GRS", "RAGRS", "ZRS", "GZRS", "RAGZRS"], var.storage_replication_type)
    error_message = "Storage replication type must be one of: LRS, GRS, RAGRS, ZRS, GZRS, RAGZRS."
  }
}

variable "storage_account_kind" {
  description = "Storage account kind"
  type        = string
  default     = "StorageV2"
  
  validation {
    condition     = contains(["Storage", "StorageV2", "BlobStorage", "FileStorage", "BlockBlobStorage"], var.storage_account_kind)
    error_message = "Storage account kind must be one of: Storage, StorageV2, BlobStorage, FileStorage, BlockBlobStorage."
  }
}

variable "allow_public_access" {
  description = "Whether to allow public access to the storage account"
  type        = bool
  default     = false
}

variable "storage_containers" {
  description = "List of storage containers to create"
  type        = list(string)
  default = [
    "webgui-data",
    "application-assets",
    "user-uploads",
    "backup-data"
  ]
}

variable "file_shares" {
  description = "Map of file shares to create with their configurations"
  type = map(object({
    quota_gb    = number
    access_tier = string
  }))
  default = {
    "webgui-shared" = {
      quota_gb    = 100
      access_tier = "Hot"
    }
    "application-files" = {
      quota_gb    = 50
      access_tier = "Hot"
    }
  }
}

variable "storage_tables" {
  description = "List of storage tables to create"
  type        = list(string)
  default     = []
}

variable "storage_queues" {
  description = "List of storage queues to create"
  type        = list(string)
  default     = []
}

variable "enable_versioning" {
  description = "Enable blob versioning"
  type        = bool
  default     = true
}

variable "enable_change_feed" {
  description = "Enable blob change feed"
  type        = bool
  default     = true
}

variable "enable_static_website" {
  description = "Enable static website hosting"
  type        = bool
  default     = false
}

variable "static_website_index_document" {
  description = "Index document for static website"
  type        = string
  default     = "index.html"
}

variable "static_website_error_document" {
  description = "Error document for static website"
  type        = string
  default     = "error.html"
}

variable "store_connection_string_in_keyvault" {
  description = "Whether to store storage connection strings in Key Vault"
  type        = bool
  default     = true
}

variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
