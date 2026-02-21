import { updateKVS } from "./s3-publish";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.AWS_S3_BUCKET;
const COMING_SOON_KEY = "site-basics/site-coming-soon-template/index.html";
const COMING_SOON_PREFIX = "site-basics/site-coming-soon-template";

/**
 * Provision a new "Tenant" for a site.
 * 1. Ensures the 'coming-soon' template exists in S3 at the shared location.
 * 2. Updates the CloudFront KVS to point the site slug to the template.
 */
export async function provisionSiteTenant(siteSlug) {
    try {
        // 1. Ensure template is in S3 (idempotent check)
        await ensureComingSoonTemplate();

        // 2. Update KVS mapping
        // key: siteSlug
        // value: site-basics/site-coming-soon-template
        const kvsKey = siteSlug;
        await updateKVS(kvsKey, COMING_SOON_PREFIX);

        return {
            success: true,
            domain: `${siteSlug}.sitepilot.devally.in`,
            status: "LIVE",
            cfTenantId: process.env.CLOUDFRONT_DISTRIBUTION_ID || `tenant-${siteSlug}`,
            cfTenantArn: process.env.CLOUDFRONT_DISTRIBUTION_ARN || null,
            cfConnectionGroupId: process.env.CLOUDFRONT_CONNECTION_GROUP_ID || null,
        };
    } catch (error) {
        console.error("Provisioning error:", error);
        throw error;
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
