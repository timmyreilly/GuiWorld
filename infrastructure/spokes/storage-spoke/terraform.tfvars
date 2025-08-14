# Storage Spoke Configuration
# This configures a Storage Account in West US with private networking

# Hub remote state path
hub_state_path = "../../hub/terraform.tfstate"

# Key Vault spoke remote state path (for storing connection strings)
keyvault_state_path = "../keyvault-spoke/terraform.tfstate"

# Azure region for storage spoke
spoke_location = "West US"

# Network configuration
spoke_vnet_address_space        = "10.3.0.0/16"
storage_subnet_address_prefix   = "10.3.1.0/24"

# Storage account configuration
storage_account_tier        = "Standard"
storage_replication_type    = "LRS"  # Local Redundant Storage for development
storage_account_kind        = "StorageV2"

# Security configuration
allow_public_access = false  # Use private endpoints for secure access

# Storage containers to create
storage_containers = [
  "webgui-data",
  "application-assets", 
  "user-uploads",
  "backup-data",
  "logs"
]

# File shares configuration
file_shares = {
  "webgui-shared" = {
    quota_gb    = 100
    access_tier = "Hot"
  }
  "application-files" = {
    quota_gb    = 50
    access_tier = "Hot"
  }
  "temp-files" = {
    quota_gb    = 25
    access_tier = "Cool"
  }
}

# Optional: Create storage tables
storage_tables = [
  "sessiondata",
  "userprofiles"
]

# Optional: Create storage queues  
storage_queues = [
  "processing-queue",
  "notification-queue"
]

# Blob configuration
enable_versioning   = true
enable_change_feed  = true

# Static website (disable for now)
enable_static_website           = false
static_website_index_document   = "index.html"
static_website_error_document   = "error.html"

# Key Vault integration
store_connection_string_in_keyvault = true

# Additional tags for this spoke
additional_tags = {
  Purpose     = "Web GUI Storage"
  CostCenter  = "Development"
  Owner       = "DevOps Team"
}
