# Hub and Spoke Architecture Deployment Guide

This guide explains how to deploy the hub and spoke architecture with distributed Azure resources across multiple regions.

## Architecture Overview

This infrastructure implements an Azure Hub and Spoke architecture with:

- **Hub (Central US)**: Core networking, shared services, private DNS zones, optional firewall and bastion
- **Key Vault Spoke (South Central US)**: Secure key management with private endpoints
- **Database Spoke (East US)**: PostgreSQL Flexible Server with private networking
- **Storage Spoke (West US)**: Storage accounts with blob, file, table, and queue services

## Prerequisites

1. **Azure CLI**: Install and login to Azure
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Terraform**: Install Terraform (>= 1.0)
   ```bash
   # Ubuntu/Debian
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

3. **Azure Permissions**: Ensure your account has:
   - Contributor role on the subscription
   - User Access Administrator (for role assignments)

## Deployment Steps

### Step 1: Deploy the Hub Infrastructure

The hub must be deployed first as all spokes depend on it.

```bash
# Navigate to hub directory
cd infrastructure/hub

# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy the hub
terraform apply

# Note the outputs - spokes will reference these
terraform output
```

**Expected Hub Outputs:**
- Virtual network ID and subnets
- Private DNS zones for Key Vault, PostgreSQL, and Storage
- Log Analytics workspace
- Optional firewall and bastion host

### Step 2: Deploy the Key Vault Spoke

```bash
# Navigate to Key Vault spoke directory  
cd ../spokes/keyvault-spoke

# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy the Key Vault spoke
terraform apply

# Verify the deployment
terraform output
```

### Step 3: Deploy the Database Spoke

```bash
# Navigate to Database spoke directory
cd ../database-spoke

# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy the Database spoke
terraform apply

# Verify the deployment and note database details
terraform output
```

### Step 4: Deploy the Storage Spoke

```bash
# Navigate to Storage spoke directory
cd ../storage-spoke

# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy the Storage spoke
terraform apply

# Verify the deployment
terraform output
```

## Configuration Customization

### Environment-Specific Settings

Each component has a `terraform.tfvars` file with environment-specific settings:

1. **Hub Configuration** (`infrastructure/hub/terraform.tfvars`):
   - Environment name and region
   - VNet address spaces
   - Enable/disable firewall and bastion
   - Log Analytics settings

2. **Key Vault Configuration** (`infrastructure/spokes/keyvault-spoke/terraform.tfvars`):
   - Key Vault region and network settings
   - Access policies and permissions
   - Enable/disable public access

3. **Database Configuration** (`infrastructure/spokes/database-spoke/terraform.tfvars`):
   - PostgreSQL server settings and region
   - Database configuration and users
   - Backup and maintenance settings

4. **Storage Configuration** (`infrastructure/spokes/storage-spoke/terraform.tfvars`):
   - Storage account types and region
   - Containers, file shares, tables, and queues
   - Security and access settings

## Automated Deployment

Use the provided Makefile for automated deployment:

```bash
# Deploy all components in order
make deploy-all

# Deploy individual components
make deploy-hub
make deploy-keyvault-spoke
make deploy-database-spoke
make deploy-storage-spoke

# Clean up everything
make destroy-all
```

## Network Connectivity

### Private DNS Resolution

All services use private endpoints with DNS resolution through the hub:

- **Key Vault**: `*.vault.azure.net` → private IP
- **PostgreSQL**: `*.postgres.database.azure.net` → private IP  
- **Storage**: `*.blob.core.windows.net`, `*.file.core.windows.net` → private IPs

### VNet Peering

Each spoke VNet is peered with the hub VNet:

- **Hub VNet**: `10.0.0.0/16` (Central US)
- **Key Vault Spoke VNet**: `10.1.0.0/16` (South Central US)
- **Database Spoke VNet**: `10.2.0.0/16` (East US)
- **Storage Spoke VNet**: `10.3.0.0/16` (West US)

## Security Configuration

### Network Security Groups

Each spoke has restrictive NSGs:

- Only necessary ports are open
- Traffic limited to VirtualNetwork scope
- Default deny rules for all other traffic

### Private Endpoints

Private endpoints are used for all Azure PaaS services:

- Eliminates internet exposure
- All traffic stays within Azure backbone
- DNS automatically resolves to private IPs

### Key Management

Secrets are centrally managed:

- Database admin password stored in Key Vault
- Storage connection strings stored in Key Vault
- Applications retrieve secrets via managed identity

## Monitoring and Logging

### Centralized Logging

All components send diagnostics to the hub Log Analytics workspace:

- Key Vault access logs
- PostgreSQL audit logs
- Storage operation logs
- Network security group flow logs

### Azure Monitor Integration

- Metrics and alerts configured
- Diagnostic settings enabled
- Log queries available for troubleshooting

## Troubleshooting

### Common Issues

1. **State File Dependencies**:
   ```bash
   # If remote state is not found, check paths in variables.tf
   # Default paths assume deployment from spoke directories
   hub_state_path = "../../hub/terraform.tfstate"
   ```

2. **DNS Resolution**:
   ```bash
   # Test private endpoint connectivity from a VM in the hub
   nslookup your-keyvault.vault.azure.net
   nslookup your-postgres.postgres.database.azure.net
   ```

3. **Permission Issues**:
   ```bash
   # Ensure service principal has required permissions
   az role assignment list --assignee $(az account show --query user.name -o tsv)
   ```

### Validation Commands

```bash
# Check VNet peerings
az network vnet peering list --resource-group rg-guiworld-hub-dev-* --vnet-name vnet-guiworld-hub-*

# Verify private endpoints
az network private-endpoint list --resource-group rg-guiworld-*

# Test Key Vault access
az keyvault secret list --vault-name kv-guiworld-*

# Check PostgreSQL connectivity  
az postgres flexible-server list --resource-group rg-guiworld-database-*
```

## Cleanup

### Individual Component Cleanup

```bash
# Destroy in reverse order (spokes first, then hub)
cd infrastructure/spokes/storage-spoke && terraform destroy
cd ../database-spoke && terraform destroy  
cd ../keyvault-spoke && terraform destroy
cd ../../hub && terraform destroy
```

### Complete Cleanup

```bash
# Use Makefile for automated cleanup
make destroy-all
```

## Next Steps

After deployment, you can:

1. **Connect Applications**: Use the private endpoints and connection strings
2. **Configure Monitoring**: Set up alerts and dashboards in Azure Monitor
3. **Add Security**: Implement Azure Policy and Security Center recommendations
4. **Scale Resources**: Adjust spoke configurations as needed
5. **Add More Spokes**: Follow the pattern to add additional spoke networks

## Cost Optimization

- Use Azure Cost Management to monitor spending
- Consider using Azure Reserved Instances for predictable workloads
- Review and optimize storage tiers based on access patterns
- Scale down development environments when not in use
