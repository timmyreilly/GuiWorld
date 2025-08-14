# Hub Infrastructure Configuration
# Copy and customize these values for your deployment

environment = "dev"
hub_location = "Central US"

# Network Configuration
hub_vnet_address_space = "10.0.0.0/16"
gateway_subnet_address_prefix = "10.0.1.0/24"
firewall_subnet_address_prefix = "10.0.2.0/24"
bastion_subnet_address_prefix = "10.0.3.0/24"
shared_services_subnet_address_prefix = "10.0.4.0/24"

# Optional Services (disabled for cost optimization in dev)
enable_azure_firewall = false
enable_azure_bastion = false

# Logging Configuration
log_analytics_retention_days = 30

# Tagging
cost_center = "GuiWorld-Hub"
owner_email = ""

additional_tags = {
  Purpose = "HubAndSpoke-Core"
  Team    = "Infrastructure"
}
