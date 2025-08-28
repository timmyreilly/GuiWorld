# Key Vault Spoke Configuration
# Copy and customize these values for your deployment

spoke_location = "South Central US"
hub_state_path = "../../hub/terraform.tfstate"

# Network Configuration
spoke_vnet_address_space = "10.1.0.0/16"
keyvault_subnet_address_prefix = "10.1.1.0/24"

# Key Vault Configuration
key_vault_sku = "standard"
soft_delete_retention_days = 7
enable_purge_protection = false
allow_public_access = true  # Set to false for production

# Tagging
cost_center = "GuiWorld-KeyVault"

additional_tags = {
  Purpose = "SecureKeyManagement"
  Service = "KeyVault"
  Region  = "SouthCentralUS"
}
