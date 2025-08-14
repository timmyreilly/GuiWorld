# Storage Spoke Outputs

# Resource Group Information
output "resource_group_name" {
  description = "Name of the storage spoke resource group"
  value       = azurerm_resource_group.storage_spoke.name
}

output "resource_group_id" {
  description = "ID of the storage spoke resource group"
  value       = azurerm_resource_group.storage_spoke.id
}

output "location" {
  description = "Azure region where resources are deployed"
  value       = azurerm_resource_group.storage_spoke.location
}

# Network Information
output "spoke_vnet_id" {
  description = "ID of the storage spoke virtual network"
  value       = azurerm_virtual_network.storage_spoke.id
}

output "spoke_vnet_name" {
  description = "Name of the storage spoke virtual network"
  value       = azurerm_virtual_network.storage_spoke.name
}

output "storage_subnet_id" {
  description = "ID of the storage subnet"
  value       = azurerm_subnet.storage.id
}

output "storage_subnet_name" {
  description = "Name of the storage subnet"
  value       = azurerm_subnet.storage.name
}

# Storage Account Information
output "storage_account_id" {
  description = "ID of the storage account"
  value       = azurerm_storage_account.main.id
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.main.name
}

output "storage_account_primary_access_key" {
  description = "Primary access key for the storage account"
  value       = azurerm_storage_account.main.primary_access_key
  sensitive   = true
}

output "storage_account_secondary_access_key" {
  description = "Secondary access key for the storage account"
  value       = azurerm_storage_account.main.secondary_access_key
  sensitive   = true
}

output "storage_account_primary_connection_string" {
  description = "Primary connection string for the storage account"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

output "storage_account_secondary_connection_string" {
  description = "Secondary connection string for the storage account"
  value       = azurerm_storage_account.main.secondary_connection_string
  sensitive   = true
}

# Storage Endpoints
output "storage_account_primary_blob_endpoint" {
  description = "Primary blob service endpoint"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "storage_account_primary_file_endpoint" {
  description = "Primary file service endpoint"
  value       = azurerm_storage_account.main.primary_file_endpoint
}

output "storage_account_primary_table_endpoint" {
  description = "Primary table service endpoint"
  value       = azurerm_storage_account.main.primary_table_endpoint
}

output "storage_account_primary_queue_endpoint" {
  description = "Primary queue service endpoint"
  value       = azurerm_storage_account.main.primary_queue_endpoint
}

# Static Website (if enabled)
output "storage_account_primary_web_endpoint" {
  description = "Primary web endpoint for static website"
  value       = azurerm_storage_account.main.primary_web_endpoint
}

output "storage_account_primary_web_host" {
  description = "Primary web host for static website"
  value       = azurerm_storage_account.main.primary_web_host
}

# Private Endpoints
output "storage_blob_private_endpoint_id" {
  description = "ID of the blob storage private endpoint"
  value       = var.allow_public_access ? null : azurerm_private_endpoint.storage_blob[0].id
}

output "storage_file_private_endpoint_id" {
  description = "ID of the file storage private endpoint"
  value       = var.allow_public_access || length(var.file_shares) == 0 ? null : azurerm_private_endpoint.storage_file[0].id
}

# Storage Containers
output "storage_containers" {
  description = "List of created storage containers"
  value       = keys(azurerm_storage_container.containers)
}

# File Shares
output "file_shares" {
  description = "Map of created file shares"
  value = {
    for share_name, share in azurerm_storage_share.shares : share_name => {
      name        = share.name
      quota_gb    = share.quota
      access_tier = share.access_tier
      url         = share.url
    }
  }
}

# Storage Tables
output "storage_tables" {
  description = "List of created storage tables"
  value       = keys(azurerm_storage_table.tables)
}

# Storage Queues
output "storage_queues" {
  description = "List of created storage queues"
  value       = keys(azurerm_storage_queue.queues)
}

# Key Vault Secret Names (if stored)
output "keyvault_secret_names" {
  description = "Names of secrets stored in Key Vault"
  value = var.store_connection_string_in_keyvault ? [
    azurerm_key_vault_secret.storage_connection_string[0].name,
    azurerm_key_vault_secret.storage_access_key[0].name
  ] : []
}

# Network Security Group
output "storage_nsg_id" {
  description = "ID of the storage network security group"
  value       = azurerm_network_security_group.storage.id
}

# Tagging
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.spoke_tags
}

# Spoke Summary
output "spoke_summary" {
  description = "Summary of the storage spoke deployment"
  value = {
    spoke_name          = "Storage Spoke"
    location            = azurerm_resource_group.storage_spoke.location
    resource_group_name = azurerm_resource_group.storage_spoke.name
    vnet_name           = azurerm_virtual_network.storage_spoke.name
    vnet_address_space  = azurerm_virtual_network.storage_spoke.address_space
    storage_account     = azurerm_storage_account.main.name
    private_access_only = !var.allow_public_access
    containers_count    = length(var.storage_containers)
    file_shares_count   = length(var.file_shares)
    tables_count        = length(var.storage_tables)
    queues_count        = length(var.storage_queues)
    static_website      = var.enable_static_website
    keyvault_integration = var.store_connection_string_in_keyvault
  }
}
