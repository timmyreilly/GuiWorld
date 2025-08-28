# Key Vault Spoke Infrastructure
# This deploys a Key Vault in South Central US connected to the hub

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
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
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

# Local values for consistent naming and tagging
locals {
  resource_suffix = random_string.suffix.result
  hub_environment = data.terraform_remote_state.hub.outputs.environment
  hub_tags        = data.terraform_remote_state.hub.outputs.common_tags
  
  spoke_tags = merge(local.hub_tags, {
    Component = "KeyVault-Spoke"
    Region    = var.spoke_location
  }, var.additional_tags)
}

# Key Vault Spoke Resource Group
resource "azurerm_resource_group" "keyvault_spoke" {
  name     = "rg-guiworld-keyvault-${local.hub_environment}-${local.resource_suffix}"
  location = var.spoke_location
  tags     = local.spoke_tags
}

# Spoke Virtual Network
resource "azurerm_virtual_network" "keyvault_spoke" {
  name                = "vnet-guiworld-keyvault-${local.hub_environment}-${local.resource_suffix}"
  address_space       = [var.spoke_vnet_address_space]
  location            = azurerm_resource_group.keyvault_spoke.location
  resource_group_name = azurerm_resource_group.keyvault_spoke.name
  
  tags = local.spoke_tags
}

# Key Vault Subnet
resource "azurerm_subnet" "keyvault" {
  name                 = "snet-keyvault"
  resource_group_name  = azurerm_resource_group.keyvault_spoke.name
  virtual_network_name = azurerm_virtual_network.keyvault_spoke.name
  address_prefixes     = [var.keyvault_subnet_address_prefix]
  
  # Enable private endpoints
  private_endpoint_network_policies_enabled = false
}

# Network Security Group for Key Vault subnet
resource "azurerm_network_security_group" "keyvault" {
  name                = "nsg-keyvault-${local.hub_environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.keyvault_spoke.location
  resource_group_name = azurerm_resource_group.keyvault_spoke.name

  # Allow HTTPS to Key Vault
  security_rule {
    name                       = "AllowKeyVaultHTTPS"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "VirtualNetwork"
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

# Associate NSG with Key Vault subnet
resource "azurerm_subnet_network_security_group_association" "keyvault" {
  subnet_id                 = azurerm_subnet.keyvault.id
  network_security_group_id = azurerm_network_security_group.keyvault.id
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                       = "kv-guiworld-${local.hub_environment}-${local.resource_suffix}"
  location                   = azurerm_resource_group.keyvault_spoke.location
  resource_group_name        = azurerm_resource_group.keyvault_spoke.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = var.key_vault_sku
  soft_delete_retention_days = var.soft_delete_retention_days
  purge_protection_enabled   = var.enable_purge_protection

  # Network access configuration
  public_network_access_enabled = var.allow_public_access
  network_acls {
    bypass         = "AzureServices"
    default_action = var.allow_public_access ? "Allow" : "Deny"
    
    # Allow hub network access
    virtual_network_subnet_ids = [
      azurerm_subnet.keyvault.id,
      data.terraform_remote_state.hub.outputs.shared_services_subnet_id
    ]
  }

  # Access policy for current user/service principal
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Create", "Delete", "Get", "List", "Update", "Import", "Backup", "Restore", "Recover"
    ]

    secret_permissions = [
      "Set", "Get", "Delete", "List", "Backup", "Restore", "Recover"
    ]

    certificate_permissions = [
      "Create", "Delete", "Get", "List", "Update", "Import", "Backup", "Restore", "Recover"
    ]
  }

  tags = local.spoke_tags
}

# Private Endpoint for Key Vault (if public access is disabled)
resource "azurerm_private_endpoint" "keyvault" {
  count = var.allow_public_access ? 0 : 1
  
  name                = "pep-keyvault-${local.hub_environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.keyvault_spoke.location
  resource_group_name = azurerm_resource_group.keyvault_spoke.name
  subnet_id           = azurerm_subnet.keyvault.id

  private_service_connection {
    name                           = "psc-keyvault"
    private_connection_resource_id = azurerm_key_vault.main.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "dns-zone-group"
    private_dns_zone_ids = [data.terraform_remote_state.hub.outputs.keyvault_private_dns_zone_id]
  }

  tags = local.spoke_tags
}

# VNet Peering from Spoke to Hub
resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                      = "peer-keyvault-to-hub"
  resource_group_name       = azurerm_resource_group.keyvault_spoke.name
  virtual_network_name      = azurerm_virtual_network.keyvault_spoke.name
  remote_virtual_network_id = data.terraform_remote_state.hub.outputs.hub_vnet_id
  
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

# VNet Peering from Hub to Spoke (requires separate resource)
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                      = "peer-hub-to-keyvault"
  resource_group_name       = data.terraform_remote_state.hub.outputs.hub_resource_group_name
  virtual_network_name      = data.terraform_remote_state.hub.outputs.hub_vnet_name
  remote_virtual_network_id = azurerm_virtual_network.keyvault_spoke.id
  
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = true
  use_remote_gateways          = false
}

# Link spoke VNet to hub's private DNS zone
resource "azurerm_private_dns_zone_virtual_network_link" "keyvault_spoke" {
  name                  = "keyvault-spoke-link"
  resource_group_name   = data.terraform_remote_state.hub.outputs.hub_resource_group_name
  private_dns_zone_name = data.terraform_remote_state.hub.outputs.keyvault_private_dns_zone_name
  virtual_network_id    = azurerm_virtual_network.keyvault_spoke.id
  registration_enabled  = false

  tags = local.spoke_tags
}

# Diagnostic Settings for Key Vault (send logs to hub Log Analytics)
resource "azurerm_monitor_diagnostic_setting" "keyvault" {
  name                       = "diag-keyvault-${local.hub_environment}-${local.resource_suffix}"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = data.terraform_remote_state.hub.outputs.log_analytics_workspace_id

  enabled_log {
    category = "AuditEvent"
  }

  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }

  depends_on = [azurerm_key_vault.main]
}
