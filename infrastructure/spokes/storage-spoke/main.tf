# Storage Spoke Infrastructure
# This deploys a Storage Account in West US connected to the hub

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

# Local values for consistent naming and tagging
locals {
  resource_suffix = random_string.suffix.result
  hub_environment = data.terraform_remote_state.hub.outputs.environment
  hub_tags        = data.terraform_remote_state.hub.outputs.common_tags
  
  spoke_tags = merge(local.hub_tags, {
    Component = "Storage-Spoke"
    Region    = var.spoke_location
  }, var.additional_tags)
}

# Storage Spoke Resource Group
resource "azurerm_resource_group" "storage_spoke" {
  name     = "rg-guiworld-storage-${local.hub_environment}-${local.resource_suffix}"
  location = var.spoke_location
  tags     = local.spoke_tags
}

# Spoke Virtual Network
resource "azurerm_virtual_network" "storage_spoke" {
  name                = "vnet-guiworld-storage-${local.hub_environment}-${local.resource_suffix}"
  address_space       = [var.spoke_vnet_address_space]
  location            = azurerm_resource_group.storage_spoke.location
  resource_group_name = azurerm_resource_group.storage_spoke.name
  
  tags = local.spoke_tags
}

# Storage Subnet
resource "azurerm_subnet" "storage" {
  name                 = "snet-storage"
  resource_group_name  = azurerm_resource_group.storage_spoke.name
  virtual_network_name = azurerm_virtual_network.storage_spoke.name
  address_prefixes     = [var.storage_subnet_address_prefix]
  
  # Enable private endpoints
  private_endpoint_network_policies_enabled = false
}

# Network Security Group for Storage subnet
resource "azurerm_network_security_group" "storage" {
  name                = "nsg-storage-${local.hub_environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.storage_spoke.location
  resource_group_name = azurerm_resource_group.storage_spoke.name

  # Allow HTTPS to Storage
  security_rule {
    name                       = "AllowStorageHTTPS"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }

  # Allow storage services (if needed)
  security_rule {
    name                       = "AllowStorageServices"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
    source_address_prefix      = "Storage"
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

# Associate NSG with Storage subnet
resource "azurerm_subnet_network_security_group_association" "storage" {
  subnet_id                 = azurerm_subnet.storage.id
  network_security_group_id = azurerm_network_security_group.storage.id
}

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "stguiworld${local.hub_environment}${local.resource_suffix}"
  resource_group_name      = azurerm_resource_group.storage_spoke.name
  location                 = azurerm_resource_group.storage_spoke.location
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_replication_type
  account_kind             = var.storage_account_kind
  
  # Security settings
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = var.allow_public_access
  public_network_access_enabled   = var.allow_public_access
  
  # Network rules
  network_rules {
    default_action = var.allow_public_access ? "Allow" : "Deny"
    bypass         = ["AzureServices"]
    
    # Allow hub network access
    virtual_network_subnet_ids = [
      azurerm_subnet.storage.id,
      data.terraform_remote_state.hub.outputs.shared_services_subnet_id
    ]
  }

  # Enable blob versioning and change feed
  blob_properties {
    versioning_enabled       = var.enable_versioning
    change_feed_enabled      = var.enable_change_feed
    change_feed_retention_in_days = var.enable_change_feed ? 7 : null
    
    # Container soft delete
    container_delete_retention_policy {
      days = 7
    }
    
    # Blob soft delete
    delete_retention_policy {
      days = 7
    }
  }

  # Static website (if enabled)
  dynamic "static_website" {
    for_each = var.enable_static_website ? [1] : []
    content {
      index_document     = var.static_website_index_document
      error_404_document = var.static_website_error_document
    }
  }

  tags = local.spoke_tags
}

# Storage Containers
resource "azurerm_storage_container" "containers" {
  for_each = toset(var.storage_containers)
  
  name                  = each.value
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# File Shares
resource "azurerm_storage_share" "shares" {
  for_each = var.file_shares
  
  name                 = each.key
  storage_account_name = azurerm_storage_account.main.name
  quota                = each.value.quota_gb
  access_tier          = each.value.access_tier
}

# Storage Account Tables (if needed)
resource "azurerm_storage_table" "tables" {
  for_each = toset(var.storage_tables)
  
  name                 = each.value
  storage_account_name = azurerm_storage_account.main.name
}

# Storage Account Queues (if needed)
resource "azurerm_storage_queue" "queues" {
  for_each = toset(var.storage_queues)
  
  name                 = each.value
  storage_account_name = azurerm_storage_account.main.name
}

# Private Endpoint for Storage (if public access is disabled)
resource "azurerm_private_endpoint" "storage_blob" {
  count = var.allow_public_access ? 0 : 1
  
  name                = "pep-storage-blob-${local.hub_environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.storage_spoke.location
  resource_group_name = azurerm_resource_group.storage_spoke.name
  subnet_id           = azurerm_subnet.storage.id

  private_service_connection {
    name                           = "psc-storage-blob"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "dns-zone-group"
    private_dns_zone_ids = [data.terraform_remote_state.hub.outputs.storage_private_dns_zone_id]
  }

  tags = local.spoke_tags
}

# Additional private endpoints for file shares (if not allowing public access)
resource "azurerm_private_endpoint" "storage_file" {
  count = var.allow_public_access || length(var.file_shares) == 0 ? 0 : 1
  
  name                = "pep-storage-file-${local.hub_environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.storage_spoke.location
  resource_group_name = azurerm_resource_group.storage_spoke.name
  subnet_id           = azurerm_subnet.storage.id

  private_service_connection {
    name                           = "psc-storage-file"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["file"]
    is_manual_connection           = false
  }

  tags = local.spoke_tags
}

# VNet Peering from Spoke to Hub
resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                      = "peer-storage-to-hub"
  resource_group_name       = azurerm_resource_group.storage_spoke.name
  virtual_network_name      = azurerm_virtual_network.storage_spoke.name
  remote_virtual_network_id = data.terraform_remote_state.hub.outputs.hub_vnet_id
  
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

# VNet Peering from Hub to Spoke
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                      = "peer-hub-to-storage"
  resource_group_name       = data.terraform_remote_state.hub.outputs.hub_resource_group_name
  virtual_network_name      = data.terraform_remote_state.hub.outputs.hub_vnet_name
  remote_virtual_network_id = azurerm_virtual_network.storage_spoke.id
  
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = true
  use_remote_gateways          = false
}

# Link spoke VNet to hub's private DNS zone
resource "azurerm_private_dns_zone_virtual_network_link" "storage_spoke" {
  name                  = "storage-spoke-link"
  resource_group_name   = data.terraform_remote_state.hub.outputs.hub_resource_group_name
  private_dns_zone_name = data.terraform_remote_state.hub.outputs.storage_private_dns_zone_name
  virtual_network_id    = azurerm_virtual_network.storage_spoke.id
  registration_enabled  = false

  tags = local.spoke_tags
}

# Store storage connection string in Key Vault (if Key Vault spoke is deployed)
data "terraform_remote_state" "keyvault" {
  count   = var.store_connection_string_in_keyvault ? 1 : 0
  backend = "local"
  config = {
    path = var.keyvault_state_path
  }
}

resource "azurerm_key_vault_secret" "storage_connection_string" {
  count = var.store_connection_string_in_keyvault ? 1 : 0
  
  name         = "storage-connection-string"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = data.terraform_remote_state.keyvault[0].outputs.key_vault_id

  tags = local.spoke_tags
}

resource "azurerm_key_vault_secret" "storage_access_key" {
  count = var.store_connection_string_in_keyvault ? 1 : 0
  
  name         = "storage-access-key"
  value        = azurerm_storage_account.main.primary_access_key
  key_vault_id = data.terraform_remote_state.keyvault[0].outputs.key_vault_id

  tags = local.spoke_tags
}

# Diagnostic Settings for Storage Account (send logs to hub Log Analytics)
resource "azurerm_monitor_diagnostic_setting" "storage" {
  name                       = "diag-storage-${local.hub_environment}-${local.resource_suffix}"
  target_resource_id         = "${azurerm_storage_account.main.id}/blobServices/default"
  log_analytics_workspace_id = data.terraform_remote_state.hub.outputs.log_analytics_workspace_id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }

  depends_on = [azurerm_storage_account.main]
}
