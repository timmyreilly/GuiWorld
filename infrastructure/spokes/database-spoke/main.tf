# Database Spoke Infrastructure
# This deploys a PostgreSQL database in East US connected to the hub

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Get current Azure client configuration
data "azurerm_client_config" "current" {}

# Reference hub outputs via remote state
data "terraform_remote_state" "hub" {
  backend = "local"
  config = {
    path = var.hub_state_path
  }
}

# Generate random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Generate random password for database admin
resource "random_password" "db_admin" {
  length  = 16
  special = true
}

# Local values for consistent naming and tagging
locals {
  resource_suffix = random_string.suffix.result
  hub_environment = data.terraform_remote_state.hub.outputs.environment
  hub_tags        = data.terraform_remote_state.hub.outputs.common_tags
  
  spoke_tags = merge(local.hub_tags, {
    Component = "Database-Spoke"
    Region    = var.spoke_location
  }, var.additional_tags)
}

# Database Spoke Resource Group
resource "azurerm_resource_group" "database_spoke" {
  name     = "rg-guiworld-database-${local.hub_environment}-${local.resource_suffix}"
  location = var.spoke_location
  tags     = local.spoke_tags
}

# Spoke Virtual Network
resource "azurerm_virtual_network" "database_spoke" {
  name                = "vnet-guiworld-database-${local.hub_environment}-${local.resource_suffix}"
  address_space       = [var.spoke_vnet_address_space]
  location            = azurerm_resource_group.database_spoke.location
  resource_group_name = azurerm_resource_group.database_spoke.name
  
  tags = local.spoke_tags
}

# Database Subnet (delegated to PostgreSQL)
resource "azurerm_subnet" "database" {
  name                 = "snet-database"
  resource_group_name  = azurerm_resource_group.database_spoke.name
  virtual_network_name = azurerm_virtual_network.database_spoke.name
  address_prefixes     = [var.database_subnet_address_prefix]
  
  # Delegate subnet to PostgreSQL flexible server
  delegation {
    name = "postgresql-delegation"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Network Security Group for Database subnet
resource "azurerm_network_security_group" "database" {
  name                = "nsg-database-${local.hub_environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.database_spoke.location
  resource_group_name = azurerm_resource_group.database_spoke.name

  # Allow PostgreSQL from VNet
  security_rule {
    name                       = "AllowPostgreSQL"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }

  # Allow PostgreSQL from hub network
  security_rule {
    name                       = "AllowPostgreSQLFromHub"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = data.terraform_remote_state.hub.outputs.hub_vnet_address_space[0]
    destination_address_prefix = "*"
  }

  # Deny all other inbound traffic
  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = local.spoke_tags
}

# Associate NSG with Database subnet
resource "azurerm_subnet_network_security_group_association" "database" {
  subnet_id                 = azurerm_subnet.database.id
  network_security_group_id = azurerm_network_security_group.database.id
}

# Private DNS Zone for PostgreSQL (created in hub, linked here)
resource "azurerm_private_dns_zone_virtual_network_link" "database_spoke" {
  name                  = "database-spoke-link"
  resource_group_name   = data.terraform_remote_state.hub.outputs.hub_resource_group_name
  private_dns_zone_name = data.terraform_remote_state.hub.outputs.postgres_private_dns_zone_name
  virtual_network_id    = azurerm_virtual_network.database_spoke.id
  registration_enabled  = false

  tags = local.spoke_tags
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psql-guiworld-${local.hub_environment}-${local.resource_suffix}"
  resource_group_name           = azurerm_resource_group.database_spoke.name
  location                      = azurerm_resource_group.database_spoke.location
  
  administrator_login           = var.database_admin_username
  administrator_password        = var.database_admin_password != "" ? var.database_admin_password : random_password.db_admin.result
  
  sku_name                      = var.postgresql_sku
  storage_mb                    = var.postgresql_storage_mb
  version                       = var.postgresql_version
  
  backup_retention_days         = var.backup_retention_days
  geo_redundant_backup_enabled  = var.geo_redundant_backup_enabled
  
  delegated_subnet_id           = azurerm_subnet.database.id
  private_dns_zone_id           = data.terraform_remote_state.hub.outputs.postgres_private_dns_zone_id
  
  # High availability configuration
  dynamic "high_availability" {
    for_each = var.enable_high_availability ? [1] : []
    content {
      mode = "ZoneRedundant"
    }
  }
  
  # Maintenance window
  maintenance_window {
    day_of_week  = var.maintenance_window_day
    start_hour   = var.maintenance_window_hour
    start_minute = 0
  }

  tags = local.spoke_tags
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "guiworld" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Additional databases (if specified)
resource "azurerm_postgresql_flexible_server_database" "additional" {
  for_each = toset(var.additional_databases)
  
  name      = each.value
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# PostgreSQL Configuration
resource "azurerm_postgresql_flexible_server_configuration" "timezone" {
  name      = "timezone"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.database_timezone
}

resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_disconnections" {
  name      = "log_disconnections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# VNet Peering from Spoke to Hub
resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                      = "peer-database-to-hub"
  resource_group_name       = azurerm_resource_group.database_spoke.name
  virtual_network_name      = azurerm_virtual_network.database_spoke.name
  remote_virtual_network_id = data.terraform_remote_state.hub.outputs.hub_vnet_id
  
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

# VNet Peering from Hub to Spoke
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                      = "peer-hub-to-database"
  resource_group_name       = data.terraform_remote_state.hub.outputs.hub_resource_group_name
  virtual_network_name      = data.terraform_remote_state.hub.outputs.hub_vnet_name
  remote_virtual_network_id = azurerm_virtual_network.database_spoke.id
  
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = true
  use_remote_gateways          = false
}

# Store database password in Key Vault (if Key Vault spoke is deployed)
data "terraform_remote_state" "keyvault" {
  count   = var.store_password_in_keyvault ? 1 : 0
  backend = "local"
  config = {
    path = var.keyvault_state_path
  }
}

resource "azurerm_key_vault_secret" "db_password" {
  count = var.store_password_in_keyvault ? 1 : 0
  
  name         = "database-admin-password"
  value        = var.database_admin_password != "" ? var.database_admin_password : random_password.db_admin.result
  key_vault_id = data.terraform_remote_state.keyvault[0].outputs.key_vault_id

  tags = local.spoke_tags
}

resource "azurerm_key_vault_secret" "db_connection_string" {
  count = var.store_password_in_keyvault ? 1 : 0
  
  name  = "database-connection-string"
  value = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=${azurerm_postgresql_flexible_server_database.guiworld.name};Username=${var.database_admin_username};Password=${var.database_admin_password != "" ? var.database_admin_password : random_password.db_admin.result};SSL Mode=Require"
  key_vault_id = data.terraform_remote_state.keyvault[0].outputs.key_vault_id

  tags = local.spoke_tags
}

# Diagnostic Settings for PostgreSQL (send logs to hub Log Analytics)
resource "azurerm_monitor_diagnostic_setting" "postgresql" {
  name                       = "diag-postgresql-${local.hub_environment}-${local.resource_suffix}"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = data.terraform_remote_state.hub.outputs.log_analytics_workspace_id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }

  depends_on = [azurerm_postgresql_flexible_server.main]
}
