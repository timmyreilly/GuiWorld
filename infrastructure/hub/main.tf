# Hub Infrastructure - Core Networking Components
# This deploys the central hub with networking components that spokes will connect to

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

# Generate random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Local values for consistent naming and tagging
locals {
  resource_suffix = random_string.suffix.result
  common_tags = merge({
    Environment   = var.environment
    Project      = "GuiWorld"
    ManagedBy    = "Terraform"
    Architecture = "HubAndSpoke"
    Component    = "Hub"
    CreatedDate  = formatdate("YYYY-MM-DD", timestamp())
  }, var.additional_tags)
}

# Hub Resource Group - Central networking and shared services
resource "azurerm_resource_group" "hub" {
  name     = "rg-guiworld-hub-${var.environment}-${local.resource_suffix}"
  location = var.hub_location
  tags     = local.common_tags
}

# Hub Virtual Network - Central network for all spokes to connect to
resource "azurerm_virtual_network" "hub" {
  name                = "vnet-guiworld-hub-${var.environment}-${local.resource_suffix}"
  address_space       = [var.hub_vnet_address_space]
  location            = azurerm_resource_group.hub.location
  resource_group_name = azurerm_resource_group.hub.name
  
  tags = local.common_tags
}

# Gateway Subnet - Required for VPN/ExpressRoute connections
resource "azurerm_subnet" "gateway" {
  name                 = "GatewaySubnet"  # Must be named exactly this
  resource_group_name  = azurerm_resource_group.hub.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [var.gateway_subnet_address_prefix]
}

# Azure Firewall Subnet - For centralized security
resource "azurerm_subnet" "firewall" {
  name                 = "AzureFirewallSubnet"  # Must be named exactly this
  resource_group_name  = azurerm_resource_group.hub.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [var.firewall_subnet_address_prefix]
}

# Azure Bastion Subnet - For secure VM access
resource "azurerm_subnet" "bastion" {
  name                 = "AzureBastionSubnet"  # Must be named exactly this
  resource_group_name  = azurerm_resource_group.hub.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [var.bastion_subnet_address_prefix]
}

# Shared Services Subnet - For hub-based services
resource "azurerm_subnet" "shared_services" {
  name                 = "snet-shared-services"
  resource_group_name  = azurerm_resource_group.hub.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [var.shared_services_subnet_address_prefix]
}

# Network Security Group for Shared Services
resource "azurerm_network_security_group" "shared_services" {
  name                = "nsg-shared-services-${var.environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.hub.location
  resource_group_name = azurerm_resource_group.hub.name

  # Allow HTTPS traffic
  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Allow HTTP traffic (for development)
  security_rule {
    name                       = "AllowHTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    destination_address_prefix = "*"
    source_address_prefix      = var.environment == "prod" ? "VirtualNetwork" : "*"
  }

  tags = local.common_tags
}

# Associate NSG with Shared Services Subnet
resource "azurerm_subnet_network_security_group_association" "shared_services" {
  subnet_id                 = azurerm_subnet.shared_services.id
  network_security_group_id = azurerm_network_security_group.shared_services.id
}

# Log Analytics Workspace - Centralized logging for all spokes
resource "azurerm_log_analytics_workspace" "hub" {
  name                = "law-guiworld-hub-${var.environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.hub.location
  resource_group_name = azurerm_resource_group.hub.name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_analytics_retention_days

  tags = local.common_tags
}

# Azure Firewall (Optional - can be enabled for production)
resource "azurerm_public_ip" "firewall" {
  count = var.enable_azure_firewall ? 1 : 0
  
  name                = "pip-firewall-${var.environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.hub.location
  resource_group_name = azurerm_resource_group.hub.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = local.common_tags
}

resource "azurerm_firewall" "hub" {
  count = var.enable_azure_firewall ? 1 : 0
  
  name                = "afw-guiworld-hub-${var.environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.hub.location
  resource_group_name = azurerm_resource_group.hub.name
  sku_name            = "AZFW_VNet"
  sku_tier            = "Standard"

  ip_configuration {
    name                 = "configuration"
    subnet_id            = azurerm_subnet.firewall.id
    public_ip_address_id = azurerm_public_ip.firewall[0].id
  }

  tags = local.common_tags
}

# Azure Bastion (Optional - for secure VM access)
resource "azurerm_public_ip" "bastion" {
  count = var.enable_azure_bastion ? 1 : 0
  
  name                = "pip-bastion-${var.environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.hub.location
  resource_group_name = azurerm_resource_group.hub.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = local.common_tags
}

resource "azurerm_bastion_host" "hub" {
  count = var.enable_azure_bastion ? 1 : 0
  
  name                = "bastion-guiworld-hub-${var.environment}-${local.resource_suffix}"
  location            = azurerm_resource_group.hub.location
  resource_group_name = azurerm_resource_group.hub.name

  ip_configuration {
    name                 = "configuration"
    subnet_id            = azurerm_subnet.bastion.id
    public_ip_address_id = azurerm_public_ip.bastion[0].id
  }

  tags = local.common_tags
}

# Private DNS Zones for spokes to use
resource "azurerm_private_dns_zone" "keyvault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = azurerm_resource_group.hub.name

  tags = local.common_tags
}

resource "azurerm_private_dns_zone" "postgres" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.hub.name

  tags = local.common_tags
}

resource "azurerm_private_dns_zone" "storage" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.hub.name

  tags = local.common_tags
}

# Link DNS zones to hub VNet
resource "azurerm_private_dns_zone_virtual_network_link" "keyvault_hub" {
  name                  = "keyvault-hub-link"
  resource_group_name   = azurerm_resource_group.hub.name
  private_dns_zone_name = azurerm_private_dns_zone.keyvault.name
  virtual_network_id    = azurerm_virtual_network.hub.id
  registration_enabled  = false

  tags = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres_hub" {
  name                  = "postgres-hub-link"
  resource_group_name   = azurerm_resource_group.hub.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.hub.id
  registration_enabled  = false

  tags = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage_hub" {
  name                  = "storage-hub-link"
  resource_group_name   = azurerm_resource_group.hub.name
  private_dns_zone_name = azurerm_private_dns_zone.storage.name
  virtual_network_id    = azurerm_virtual_network.hub.id
  registration_enabled  = false

  tags = local.common_tags
}
