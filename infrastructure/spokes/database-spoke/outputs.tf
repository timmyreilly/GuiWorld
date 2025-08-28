# Outputs for Database Spoke

# Resource Group Information
output "resource_group_name" {
  description = "Name of the Database spoke resource group"
  value       = azurerm_resource_group.database_spoke.name
}

output "resource_group_id" {
  description = "ID of the Database spoke resource group"
  value       = azurerm_resource_group.database_spoke.id
}

output "location" {
  description = "Location of the Database spoke"
  value       = azurerm_resource_group.database_spoke.location
}

# Virtual Network Information
output "vnet_name" {
  description = "Name of the spoke virtual network"
  value       = azurerm_virtual_network.database_spoke.name
}

output "vnet_id" {
  description = "ID of the spoke virtual network"
  value       = azurerm_virtual_network.database_spoke.id
}

output "vnet_address_space" {
  description = "Address space of the spoke virtual network"
  value       = azurerm_virtual_network.database_spoke.address_space
}

# Subnet Information
output "database_subnet_id" {
  description = "ID of the database subnet"
  value       = azurerm_subnet.database.id
}

output "database_subnet_address_prefix" {
  description = "Address prefix of the database subnet"
  value       = azurerm_subnet.database.address_prefixes[0]
}

# PostgreSQL Server Information
output "postgresql_server_name" {
  description = "Name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "postgresql_server_id" {
  description = "ID of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "postgresql_server_fqdn" {
  description = "FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgresql_version" {
  description = "Version of PostgreSQL"
  value       = azurerm_postgresql_flexible_server.main.version
}

# Database Information
output "database_name" {
  description = "Name of the main database"
  value       = azurerm_postgresql_flexible_server_database.guiworld.name
}

output "additional_database_names" {
  description = "Names of additional databases"
  value       = [for db in azurerm_postgresql_flexible_server_database.additional : db.name]
}

# Connection Information
output "database_admin_username" {
  description = "Database administrator username"
  value       = azurerm_postgresql_flexible_server.main.administrator_login
}

output "database_connection_string" {
  description = "PostgreSQL connection string (password not included)"
  value       = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=${azurerm_postgresql_flexible_server_database.guiworld.name};Username=${azurerm_postgresql_flexible_server.main.administrator_login};SSL Mode=Require"
}

# Security Information
output "nsg_id" {
  description = "ID of the network security group"
  value       = azurerm_network_security_group.database.id
}

output "private_dns_zone_linked" {
  description = "Whether private DNS zone is linked"
  value       = true
}

# Password Storage Information
output "password_stored_in_keyvault" {
  description = "Whether database password is stored in Key Vault"
  value       = var.store_password_in_keyvault
}

output "keyvault_secret_names" {
  description = "Names of secrets stored in Key Vault"
  value = var.store_password_in_keyvault ? [
    azurerm_key_vault_secret.db_password[0].name,
    azurerm_key_vault_secret.db_connection_string[0].name
  ] : []
}

# Hub Connection Information
output "hub_connection" {
  description = "Information about connection to hub"
  value = {
    hub_vnet_id           = data.terraform_remote_state.hub.outputs.hub_vnet_id
    hub_resource_group    = data.terraform_remote_state.hub.outputs.hub_resource_group_name
    peering_spoke_to_hub  = azurerm_virtual_network_peering.spoke_to_hub.name
    peering_hub_to_spoke  = azurerm_virtual_network_peering.hub_to_spoke.name
    dns_zone_linked       = data.terraform_remote_state.hub.outputs.postgres_private_dns_zone_name
  }
}

# Generated Password (sensitive)
output "generated_admin_password" {
  description = "Auto-generated admin password (if password not provided)"
  value       = var.database_admin_password != "" ? null : random_password.db_admin.result
  sensitive   = true
}

# Summary Information
output "spoke_summary" {
  description = "Summary of Database spoke infrastructure"
  value = {
    resource_group     = azurerm_resource_group.database_spoke.name
    location          = azurerm_resource_group.database_spoke.location
    environment       = local.hub_environment
    vnet_name         = azurerm_virtual_network.database_spoke.name
    vnet_address      = azurerm_virtual_network.database_spoke.address_space[0]
    
    postgresql = {
      server_name       = azurerm_postgresql_flexible_server.main.name
      fqdn             = azurerm_postgresql_flexible_server.main.fqdn
      version          = azurerm_postgresql_flexible_server.main.version
      sku              = azurerm_postgresql_flexible_server.main.sku_name
      storage_mb       = azurerm_postgresql_flexible_server.main.storage_mb
      main_database    = azurerm_postgresql_flexible_server_database.guiworld.name
      additional_dbs   = length(azurerm_postgresql_flexible_server_database.additional)
      high_availability = var.enable_high_availability
      geo_backup       = var.geo_redundant_backup_enabled
    }
    
    connectivity = {
      hub_connected     = true
      private_network   = true
      dns_integration   = true
      logging_enabled   = true
    }
    
    security = {
      password_in_keyvault = var.store_password_in_keyvault
      network_restricted   = true
      ssl_enabled         = true
    }
  }
}
