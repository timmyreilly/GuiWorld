# Outputs for Hub Infrastructure
# These outputs will be used by spoke deployments to reference hub resources

# Resource Group Information
output "hub_resource_group_name" {
  description = "Name of the hub resource group"
  value       = azurerm_resource_group.hub.name
}

output "hub_resource_group_id" {
  description = "ID of the hub resource group"
  value       = azurerm_resource_group.hub.id
}

output "hub_location" {
  description = "Location of the hub"
  value       = azurerm_resource_group.hub.location
}

# Hub Virtual Network Information
output "hub_vnet_name" {
  description = "Name of the hub virtual network"
  value       = azurerm_virtual_network.hub.name
}

output "hub_vnet_id" {
  description = "ID of the hub virtual network"
  value       = azurerm_virtual_network.hub.id
}

output "hub_vnet_address_space" {
  description = "Address space of the hub virtual network"
  value       = azurerm_virtual_network.hub.address_space
}

# Subnet Information
output "gateway_subnet_id" {
  description = "ID of the gateway subnet"
  value       = azurerm_subnet.gateway.id
}

output "firewall_subnet_id" {
  description = "ID of the firewall subnet"
  value       = azurerm_subnet.firewall.id
}

output "bastion_subnet_id" {
  description = "ID of the bastion subnet"
  value       = azurerm_subnet.bastion.id
}

output "shared_services_subnet_id" {
  description = "ID of the shared services subnet"
  value       = azurerm_subnet.shared_services.id
}

# Private DNS Zones for Spokes
output "keyvault_private_dns_zone_name" {
  description = "Name of the Key Vault private DNS zone"
  value       = azurerm_private_dns_zone.keyvault.name
}

output "keyvault_private_dns_zone_id" {
  description = "ID of the Key Vault private DNS zone"
  value       = azurerm_private_dns_zone.keyvault.id
}

output "postgres_private_dns_zone_name" {
  description = "Name of the PostgreSQL private DNS zone"
  value       = azurerm_private_dns_zone.postgres.name
}

output "postgres_private_dns_zone_id" {
  description = "ID of the PostgreSQL private DNS zone"
  value       = azurerm_private_dns_zone.postgres.id
}

output "storage_private_dns_zone_name" {
  description = "Name of the Storage private DNS zone"
  value       = azurerm_private_dns_zone.storage.name
}

output "storage_private_dns_zone_id" {
  description = "ID of the Storage private DNS zone"
  value       = azurerm_private_dns_zone.storage.id
}

# Log Analytics Workspace
output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.hub.id
}

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.hub.name
}

output "log_analytics_workspace_resource_id" {
  description = "Resource ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.hub.id
}

# Shared Infrastructure Information for Spokes
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "resource_suffix" {
  description = "Random suffix used in resource names"
  value       = local.resource_suffix
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Azure Firewall Information (if enabled)
output "azure_firewall_private_ip" {
  description = "Private IP address of Azure Firewall (if enabled)"
  value       = var.enable_azure_firewall ? azurerm_firewall.hub[0].ip_configuration[0].private_ip_address : null
}

output "azure_firewall_name" {
  description = "Name of Azure Firewall (if enabled)"
  value       = var.enable_azure_firewall ? azurerm_firewall.hub[0].name : null
}

# Bastion Information (if enabled)
output "bastion_host_fqdn" {
  description = "FQDN of Azure Bastion (if enabled)"
  value       = var.enable_azure_bastion ? azurerm_bastion_host.hub[0].dns_name : null
}

# Network Security Group
output "shared_services_nsg_id" {
  description = "ID of the shared services network security group"
  value       = azurerm_network_security_group.shared_services.id
}

# Summary Information
output "hub_summary" {
  description = "Summary of hub infrastructure"
  value = {
    resource_group = azurerm_resource_group.hub.name
    location       = azurerm_resource_group.hub.location
    environment    = var.environment
    vnet_name      = azurerm_virtual_network.hub.name
    vnet_address   = azurerm_virtual_network.hub.address_space[0]
    
    services = {
      firewall_enabled = var.enable_azure_firewall
      bastion_enabled  = var.enable_azure_bastion
      log_analytics    = azurerm_log_analytics_workspace.hub.name
    }
    
    dns_zones = {
      keyvault = azurerm_private_dns_zone.keyvault.name
      postgres = azurerm_private_dns_zone.postgres.name
      storage  = azurerm_private_dns_zone.storage.name
    }
  }
}
