# Outputs for Key Vault Spoke

# Resource Group Information
output "resource_group_name" {
  description = "Name of the Key Vault spoke resource group"
  value       = azurerm_resource_group.keyvault_spoke.name
}

output "resource_group_id" {
  description = "ID of the Key Vault spoke resource group"
  value       = azurerm_resource_group.keyvault_spoke.id
}

output "location" {
  description = "Location of the Key Vault spoke"
  value       = azurerm_resource_group.keyvault_spoke.location
}

# Virtual Network Information
output "vnet_name" {
  description = "Name of the spoke virtual network"
  value       = azurerm_virtual_network.keyvault_spoke.name
}

output "vnet_id" {
  description = "ID of the spoke virtual network"
  value       = azurerm_virtual_network.keyvault_spoke.id
}

output "vnet_address_space" {
  description = "Address space of the spoke virtual network"
  value       = azurerm_virtual_network.keyvault_spoke.address_space
}

# Subnet Information
output "keyvault_subnet_id" {
  description = "ID of the Key Vault subnet"
  value       = azurerm_subnet.keyvault.id
}

output "keyvault_subnet_address_prefix" {
  description = "Address prefix of the Key Vault subnet"
  value       = azurerm_subnet.keyvault.address_prefixes[0]
}

# Key Vault Information
output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "key_vault_resource_id" {
  description = "Resource ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

# Private Endpoint Information (if created)
output "private_endpoint_ip" {
  description = "Private IP address of the Key Vault private endpoint"
  value       = var.allow_public_access ? null : azurerm_private_endpoint.keyvault[0].private_service_connection[0].private_ip_address
}

output "private_endpoint_fqdn" {
  description = "FQDN of the Key Vault private endpoint"
  value       = var.allow_public_access ? null : azurerm_private_endpoint.keyvault[0].custom_dns_configs[0].fqdn
}

# Network Security Group
output "nsg_id" {
  description = "ID of the network security group"
  value       = azurerm_network_security_group.keyvault.id
}

# Hub Connection Information
output "hub_connection" {
  description = "Information about connection to hub"
  value = {
    hub_vnet_id           = data.terraform_remote_state.hub.outputs.hub_vnet_id
    hub_resource_group    = data.terraform_remote_state.hub.outputs.hub_resource_group_name
    peering_spoke_to_hub  = azurerm_virtual_network_peering.spoke_to_hub.name
    peering_hub_to_spoke  = azurerm_virtual_network_peering.hub_to_spoke.name
    dns_zone_linked       = data.terraform_remote_state.hub.outputs.keyvault_private_dns_zone_name
  }
}

# Summary Information
output "spoke_summary" {
  description = "Summary of Key Vault spoke infrastructure"
  value = {
    resource_group     = azurerm_resource_group.keyvault_spoke.name
    location          = azurerm_resource_group.keyvault_spoke.location
    environment       = local.hub_environment
    vnet_name         = azurerm_virtual_network.keyvault_spoke.name
    vnet_address      = azurerm_virtual_network.keyvault_spoke.address_space[0]
    
    key_vault = {
      name              = azurerm_key_vault.main.name
      uri               = azurerm_key_vault.main.vault_uri
      sku               = azurerm_key_vault.main.sku_name
      public_access     = var.allow_public_access
      purge_protection  = var.enable_purge_protection
    }
    
    connectivity = {
      hub_connected     = true
      private_endpoint  = !var.allow_public_access
      dns_integration   = true
      logging_enabled   = true
    }
  }
}
