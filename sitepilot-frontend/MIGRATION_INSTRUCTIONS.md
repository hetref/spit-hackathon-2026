# Forms Migration Instructions

You have existing form data that needs to be migrated from tenant-based to site-based.

## Option 1: Simple Approach (Recommended for Development)

Since you only have 1 form in your database, the simplest approach is:

1. **Backup your form data** (if important):
   - Note down the form name, description, and any important details
   
2. **Reset and push the new schema**:
   ```bash
   cd sitepilot-frontend
   npx prisma db push --force-reset
   ```
   
   ⚠️ **Warning**: This will delete ALL data in your database!

3. **Recreate your form** using the new site-specific forms page

## Option 2: Preserve Data with Manual Migration

If you want to keep your existing form data:

### Step 1: Find your site ID

Run this query in your database:
```sql
SELECT id, name, slug FROM sites;
```

Note the `id` of the site where you want the form to belong.

### Step 2: Run the migration SQL

Execute the SQL file I created:
```bash
# Connect to your database and run:
psql $DATABASE_URL -f sitepilot-frontend/prisma/migrations/manual_forms_migration.sql
```

Or manually run these key commands in your database console:

```sql
-- Add siteId column (nullable first)
ALTER TABLE "forms" ADD COLUMN "siteId" TEXT;

-- Assign forms to first site of their tenant
UPDATE "forms" f
SET "siteId" = (
  SELECT s.id 
  FROM "sites" s 
  WHERE s."tenantId" = f."tenantId" 
  LIMIT 1
);

-- Make siteId required
ALTER TABLE "forms" ALTER COLUMN "siteId" SET NOT NULL;

-- Add foreign key
ALTER TABLE "forms" ADD CONSTRAINT "forms_siteId_fkey" 
  FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE;

-- Drop old tenantId
ALTER TABLE "forms" DROP CONSTRAINT "forms_tenantId_fkey";
ALTER TABLE "forms" DROP COLUMN "tenantId";

-- Update unique constraint
ALTER TABLE "forms" DROP CONSTRAINT "forms_tenantId_slug_key";
ALTER TABLE "forms" ADD CONSTRAINT "forms_siteId_slug_key" UNIQUE ("siteId", "slug");

-- Add schema column to form_versions
ALTER TABLE "form_versions" ADD COLUMN "schema" JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Copy builderData to schema
UPDATE "form_versions" SET "schema" = "builderData";

-- Create form_submissions table
CREATE TABLE "form_submissions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "data" JSONB NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "formId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "form_submissions_formId_idx" ON "form_submissions"("formId");
CREATE INDEX "form_submissions_createdAt_idx" ON "form_submissions"("createdAt");
CREATE INDEX "forms_siteId_idx" ON "forms"("siteId");
```

### Step 3: Generate Prisma Client

After the migration:
```bash
npx prisma generate
```

## Verification

After migration, verify:
1. Forms appear in the site-specific forms page: `/{tenantId}/sites/{siteId}/forms`
2. Forms are isolated per site (forms from Site A don't appear in Site B)
3. You can create new forms successfully

## Recommendation

For a development/hackathon environment with only 1 form, I recommend **Option 1** (force reset). It's cleaner and faster. You can quickly recreate the form after the reset.
