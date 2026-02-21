import {
  CloudFrontClient,
  GetDistributionCommand,
  UpdateDistributionCommand,
  UpdateDistributionTenantCommand,
  GetDistributionTenantCommand,
} from "@aws-sdk/client-cloudfront";

const cloudfront = new CloudFrontClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const CF_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const CF_CONNECTION_GROUP_ID = process.env.CLOUDFRONT_CONNECTION_GROUP_ID;

/**
 * Attach a custom domain to an existing CloudFront tenant.
 * This updates the tenant configuration to include the new domain and certificate.
 * 
 * @param {object} params
 * @param {string} params.tenantName - Tenant identifier (site slug)
 * @param {string} params.domain - Custom domain to attach
 * @param {string} params.certificateArn - ACM certificate ARN
 * @returns {Promise<object>} Updated tenant configuration
 */
export async function attachDomainToTenant({ tenantName, domain, certificateArn }) {
  console.log(`[CloudFront] Attaching domain to tenant`);
  console.log(`  Tenant: ${tenantName}`);
  console.log(`  Domain: ${domain}`);
  console.log(`  Certificate: ${certificateArn}`);

  try {
    if (!CF_DISTRIBUTION_ID || !CF_CONNECTION_GROUP_ID) {
      throw new Error("CloudFront configuration is incomplete");
    }

    // Step 1: Get current tenant configuration
    console.log(`[CloudFront] Fetching tenant configuration...`);

    const getTenantCmd = new GetDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Id: tenantName, // Tenant ID is the tenant name
    });

    let tenantConfig;

    try {
      const tenantResponse = await cloudfront.send(getTenantCmd);
      tenantConfig = tenantResponse.DistributionTenant;
      console.log(`[CloudFront] ✓ Tenant found: ${tenantConfig.Id}`);

    } catch (error) {
      if (error.name === "NoSuchDistributionTenant" || error.name === "NoSuchResource") {
        throw new Error(`Tenant "${tenantName}" does not exist. Create tenant first.`);
      }
      throw error;
    }

    // Step 2: Add domain to tenant's domain list
    console.log(`[CloudFront] Updating tenant with new domain...`);

    const existingDomains = tenantConfig.Domains || [];
    const domainExists = existingDomains.some(d => d.Domain === domain);

    if (domainExists) {
      console.log(`[CloudFront] ℹ️  Domain already attached to tenant`);
      return {
        success: true,
        alreadyAttached: true,
        tenantId: tenantConfig.Id,
        domain,
      };
    }

    // Add new domain
    const updatedDomains = [
      ...existingDomains,
      { Domain: domain },
    ];

    // Step 3: Update tenant configuration
    const updateCmd = new UpdateDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Id: tenantName,
      DistributionTenantConfig: {
        ...tenantConfig,
        Domains: updatedDomains,
        // Attach certificate if provided
        ViewerCertificate: certificateArn ? {
          ACMCertificateArn: certificateArn,
          SSLSupportMethod: "sni-only",
          MinimumProtocolVersion: "TLSv1.2_2021",
        } : tenantConfig.ViewerCertificate,
      },
      IfMatch: tenantResponse.ETag, // Optimistic locking
    });

    const updateResponse = await cloudfront.send(updateCmd);

    console.log(`[CloudFront] ✓ Domain attached successfully`);

    // Get connection group endpoint for CNAME instructions
    const cnameTarget = await getConnectionGroupEndpoint();

    return {
      success: true,
      tenantId: updateResponse.DistributionTenant.Id,
      domain,
      cnameTarget,
      certificateAttached: !!certificateArn,
    };

  } catch (error) {
    console.error("[CloudFront] Failed to attach domain:", error);
    throw new Error(`Failed to attach domain to CloudFront: ${error.message}`);
  }
}

/**
 * Get the CloudFront connection group endpoint for CNAME instructions.
 * 
 * @returns {Promise<string>} Connection group endpoint
 */
async function getConnectionGroupEndpoint() {
  try {
    // For multi-tenant distributions, the CNAME target is the connection group endpoint
    // This is typically in the format: <connection-group-id>.cloudfront-tenants.net

    // Try to fetch from distribution configuration
    const getDistCmd = new GetDistributionCommand({
      Id: CF_DISTRIBUTION_ID,
    });

    const response = await cloudfront.send(getDistCmd);
    const distribution = response.Distribution;

    // Return the distribution domain name
    const endpoint = distribution.DomainName;

    console.log(`[CloudFront] Connection endpoint: ${endpoint}`);

    return endpoint;

  } catch (error) {
    console.error("[CloudFront] Failed to get connection endpoint:", error);

    // Fallback: construct endpoint from connection group ID
    return `${CF_CONNECTION_GROUP_ID}.cloudfront.net`;
  }
}

/**
 * Remove a custom domain from a CloudFront tenant.
 * 
 * @param {object} params
 * @param {string} params.tenantName - Tenant identifier
 * @param {string} params.domain - Domain to remove
 * @returns {Promise<object>} Result
 */
export async function removeDomainFromTenant({ tenantName, domain }) {
  console.log(`[CloudFront] Removing domain from tenant`);
  console.log(`  Tenant: ${tenantName}`);
  console.log(`  Domain: ${domain}`);

  try {
    // Get current tenant configuration
    const getTenantCmd = new GetDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Id: tenantName,
    });

    const tenantResponse = await cloudfront.send(getTenantCmd);
    const tenantConfig = tenantResponse.DistributionTenant;

    // Filter out the domain
    const updatedDomains = (tenantConfig.Domains || []).filter(
      d => d.Domain !== domain
    );

    // Update tenant
    const updateCmd = new UpdateDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Id: tenantName,
      DistributionTenantConfig: {
        ...tenantConfig,
        Domains: updatedDomains,
      },
      IfMatch: tenantResponse.ETag,
    });

    await cloudfront.send(updateCmd);

    console.log(`[CloudFront] ✓ Domain removed successfully`);

    return {
      success: true,
      tenantId: tenantConfig.Id,
      domain,
    };

  } catch (error) {
    console.error("[CloudFront] Failed to remove domain:", error);
    throw new Error(`Failed to remove domain from CloudFront: ${error.message}`);
  }
}

/**
 * List all domains attached to a tenant.
 * 
 * @param {string} tenantName - Tenant identifier
 * @returns {Promise<string[]>} List of domain names
 */
export async function listTenantDomains(tenantName) {
  try {
    const getTenantCmd = new GetDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Id: tenantName,
    });

    const response = await cloudfront.send(getTenantCmd);
    const tenantConfig = response.DistributionTenant;

    const domains = (tenantConfig.Domains || []).map(d => d.Domain);

    console.log(`[CloudFront] Tenant ${tenantName} has ${domains.length} domain(s)`);

    return domains;

  } catch (error) {
    console.error("[CloudFront] Failed to list tenant domains:", error);
    return [];
  }
}
