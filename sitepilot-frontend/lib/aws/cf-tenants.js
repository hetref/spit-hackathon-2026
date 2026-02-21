import { updateKVS } from "./s3-publish";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import {
    CloudFrontClient,
    GetDistributionCommand,
    TagResourceCommand,
    CreateDistributionTenantCommand,
} from "@aws-sdk/client-cloudfront";
import fs from "fs/promises";
import path from "path";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// CloudFront client for managing distribution-level operations
const cloudfront = new CloudFrontClient({
    region: "us-east-1", // CloudFront is only available in us-east-1
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.AWS_S3_BUCKET;
const COMING_SOON_KEY = "site-basics/site-coming-soon-template/index.html";
const COMING_SOON_PREFIX = "site-basics/site-coming-soon-template";

// CloudFront configuration from environment variables
const CF_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const CF_DISTRIBUTION_ARN = process.env.CLOUDFRONT_DISTRIBUTION_ARN;
const CF_CONNECTION_GROUP_ID = process.env.CLOUDFRONT_CONNECTION_GROUP_ID;
const CF_KVS_ARN = process.env.CLOUDFRONT_KVS_ARN;

/**
 * Create a CloudFront tenant in the multi-tenant distribution.
 * This is the main entry point for tenant creation via API.
 * 
 * @param {object} params - Tenant creation parameters
 * @param {string} params.tenantName - Unique tenant identifier (site slug)
 * @param {string} params.siteId - Site ID from database
 * @param {string[]} params.domains - Array of domains for this tenant
 * @param {string} params.userId - User ID creating the tenant
 * @returns {Promise<object>} Tenant metadata
 */
export async function createCloudFrontTenant({ tenantName, siteId, domains, userId }) {
    console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  Real CloudFront Tenant Provisioning`);
    console.log(`╚════════════════════════════════════════════════════════════════╝`);
    console.log(`Tenant Name: ${tenantName}`);
    console.log(`Domains: ${domains.join(', ')}`);
    console.log(`Site ID: ${siteId}`);
    console.log(`User ID: ${userId}\n`);

    try {
        // ────────────────────────────────────────────────────────────────────
        // Validate configuration
        // ────────────────────────────────────────────────────────────────────
        if (!CF_DISTRIBUTION_ID || !CF_CONNECTION_GROUP_ID || !CF_KVS_ARN) {
            throw new Error("CloudFront configuration is incomplete. Check environment variables.");
        }

        const domain = domains[0] || `${tenantName}.sitepilot.devally.in`;

        // ────────────────────────────────────────────────────────────────────
        // STEP 1: Create real tenant inside the multi-tenant distribution
        // ────────────────────────────────────────────────────────────────────
        console.log(`[1/3] 🏗️  Provisioning real tenant "${tenantName}"...`);

        const tenantInfo = await createDistributionTenant({
            tenantName,
            distributionId: CF_DISTRIBUTION_ID,
            connectionGroupId: CF_CONNECTION_GROUP_ID,
            domains: [domain],
        });

        console.log(`✅ Tenant ${tenantInfo.alreadyExisted ? 'verified' : 'created'}: ${tenantInfo.id}\n`);

        // ────────────────────────────────────────────────────────────────────
        // STEP 2: Ensure coming-soon template exists in S3
        // ────────────────────────────────────────────────────────────────────
        console.log(`[2/3] 📄 Ensuring default template exists in S3...`);
        await ensureComingSoonTemplate();
        console.log(`✅ Template ready at: ${COMING_SOON_PREFIX}\n`);

        // ────────────────────────────────────────────────────────────────────
        // STEP 3: Map domain → template path in CloudFront KVS
        // ────────────────────────────────────────────────────────────────────
        console.log(`[3/3] 🔑 Mapping domain to template in KVS...`);
        console.log(`   Mapping: ${domain} → ${COMING_SOON_PREFIX}`);

        const kvsResult = await updateKVS(domain, COMING_SOON_PREFIX);

        if (!kvsResult.updated && !kvsResult.skipped) {
            throw new Error("Failed to map domain in Key-Value Store");
        }

        console.log(`✅ KVS mapping complete\n`);

        // ────────────────────────────────────────────────────────────────────
        // Optional: Store metadata for observability
        // ────────────────────────────────────────────────────────────────────
        await registerTenantMetadata(tenantName, {
            siteId,
            userId,
            tenantId: tenantInfo.id,
            domain,
            createdAt: new Date().toISOString(),
        });

        const result = {
            success: true,
            tenantName,
            tenantId: tenantInfo.id,
            tenantArn: tenantInfo.arn,
            domain,
            connectionGroupId: CF_CONNECTION_GROUP_ID,
            kvsMapped: true,
            status: "LIVE",
            alreadyExisted: tenantInfo.alreadyExisted,
        };

        console.log(`╔════════════════════════════════════════════════════════════════╗`);
        console.log(`║  ✅ TENANT PROVISIONED SUCCESSFULLY`);
        console.log(`╚════════════════════════════════════════════════════════════════╝`);
        console.log(`Tenant ID: ${result.tenantId}`);
        console.log(`Domain: ${result.domain}`);
        console.log(`KVS Mapped: Yes\n`);

        return result;

    } catch (error) {
        console.error(`\n❌ Tenant provisioning failed:`, error.message);

        return {
            success: false,
            error: error.message,
            tenantName,
            domain: domains[0],
            kvsMapped: false,
        };
    }
}

/**
 * Create a tenant entry in the CloudFront distribution using SaaS APIs.
 * 
 * @param {object} params
 * @returns {Promise<object>} Tenant configuration
 */
async function createDistributionTenant({
    tenantName,
    distributionId,
    connectionGroupId,
    domains,
}) {
    console.log(`[CloudFront] Calling CreateDistributionTenant for: ${tenantName}`);

    try {
        const command = new CreateDistributionTenantCommand({
            TenantName: tenantName,
            DistributionId: distributionId,
            ConnectionGroupId: connectionGroupId,
            Domains: domains,
        });

        const response = await cloudfront.send(command);
        const tenant = response.DistributionTenant;

        return {
            id: tenant.Id,
            arn: tenant.ARN,
            alreadyExisted: false,
        };

    } catch (error) {
        // Idempotency: Handle case where tenant already exists
        if (error.name === 'DistributionTenantAlreadyExists' ||
            error.message.includes('already exists') ||
            error.name === 'ResourceAlreadyExistsException') {

            console.log(`[CloudFront] ℹ️  Tenant "${tenantName}" already exists. Skipping creation.`);

            // Extract account ID from distribution ARN for fallback
            const accountId = CF_DISTRIBUTION_ARN?.split(':')[4] || '851725466206';

            return {
                id: `tenant-${tenantName}`,
                arn: `arn:aws:cloudfront::${accountId}:tenant/${tenantName}`,
                alreadyExisted: true,
            };
        }

        console.error("[CloudFront] Failed to create distribution tenant:", error);
        throw error;
    }
}


/**
 * Provision a new "Tenant" for a site in the CloudFront multi-tenant distribution.
 * This is a wrapper function for backward compatibility.
 * 
 * @param {string} siteSlug - The unique subdomain identifier for the site
 * @returns {Promise<object>} Tenant metadata including CloudFront IDs and status
 */
export async function provisionSiteTenant(siteSlug) {
    console.log(`[CloudFront] Provisioning tenant (legacy): ${siteSlug}`);

    // Call the new createCloudFrontTenant function
    return await createCloudFrontTenant({
        tenantName: siteSlug,
        siteId: null,
        domains: [`${siteSlug}.sitepilot.devally.in`],
        userId: null,
    });
}

/**
 * Register tenant metadata via distribution tags (optional, for observability).
 * Tags are NOT used for tenant tracking - only for monitoring/debugging.
 * 
 * @param {string} tenantName - The tenant's unique identifier
 * @param {object} metadata - Additional metadata to store
 * @returns {Promise<void>}
 */
async function registerTenantMetadata(tenantName, metadata = {}) {
    try {
        // Store tenant metadata as distribution tags for observability
        const tagCommand = new TagResourceCommand({
            Resource: CF_DISTRIBUTION_ARN,
            Tags: {
                Items: [
                    {
                        Key: `tenant:${tenantName}`,
                        Value: JSON.stringify({
                            ...metadata,
                            registeredAt: new Date().toISOString(),
                        }),
                    },
                ],
            },
        });

        await cloudfront.send(tagCommand);

        console.log(`   ✓ Metadata tagged for observability`);

    } catch (error) {
        console.warn(`   ⚠ Failed to tag metadata (non-critical):`, error.message);
        // Don't throw - tagging is optional, tenant creation succeeded
    }
}

/**
 * Upload the local coming-soon/index.html to S3 if it doesn't exist
 */
async function ensureComingSoonTemplate() {
    try {
        // Check if already exists
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: COMING_SOON_KEY }));
    } catch (err) {
        // If not found, upload it
        const templatePath = path.join(process.cwd(), "public", "coming-soon", "index.html");
        const htmlContent = await fs.readFile(templatePath, "utf-8");

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: COMING_SOON_KEY,
            Body: htmlContent,
            ContentType: "text/html",
            CacheControl: "public, max-age=31536000",
        }));

        console.log("Uploaded global Coming Soon template to S3.");
    }
}
