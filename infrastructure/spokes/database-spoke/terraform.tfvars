# Database Spoke Configuration
# Copy and customize these values for your deployment

spoke_location = "East US"
hub_state_path = "../../hub/terraform.tfstate"
keyvault_state_path = "../keyvault-spoke/terraform.tfstate"
store_password_in_keyvault = false  # Set to true after Key Vault spoke is deployed

# Network Configuration
spoke_vnet_address_space = "10.2.0.0/16"
database_subnet_address_prefix = "10.2.1.0/24"

# PostgreSQL Configuration
postgresql_sku = "B_Standard_B1ms"  # Burstable for development
postgresql_storage_mb = 32768       # 32GB
postgresql_version = "15"
database_admin_username = "guiworld_admin"
database_admin_password = ""        # Leave empty to auto-generate

# Database Configuration
database_name = "guiworld"
additional_databases = ["app_logs", "sessions"]
database_timezone = "UTC"

# Backup and HA Configuration
backup_retention_days = 7
geo_redundant_backup_enabled = false
enable_high_availability = false

# Maintenance Window (Sunday 3 AM)
maintenance_window_day = 0
maintenance_window_hour = 3

# Tagging
cost_center = "GuiWorld-Database"

additional_tags = {
  Purpose = "ApplicationDatabase"
  Service = "PostgreSQL"
  Region  = "EastUS"
}
