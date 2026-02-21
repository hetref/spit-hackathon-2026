/**
 * CloudFront Function: Multi-Tenant Routing with Key-Value Store
 * 
 * This function must be deployed to your CloudFront distribution as a Viewer Request function
 * and associated with the KVS (Key-Value Store) for dynamic tenant routing.
 * 
 * === DEPLOYMENT INSTRUCTIONS ===
 * 
 * 1. Go to AWS CloudFront Console → Functions
 * 2. Create a new function named "sitepilot-multitenant-router"
 * 3. Copy and paste this code into the function editor
 * 4. Click "Publish" to save the function
 * 5. Go to "Associate" tab and associate with your distribution:
 *    - Distribution: Your CloudFront Distribution ID (E2RGM009VMVUBY)
 *    - Event type: Viewer Request
 *    - Cache behavior: Default (*)
 * 6. Associate the KVS:
 *    - Go to your distribution → Behaviors → Edit Default (*)
 *    - Key value store associations: Select your KVS
 *    - Function associations: Select "sitepilot-multitenant-router" for Viewer Request
 * 7. Save changes and wait for deployment (5-10 minutes)
 * 
 * === HOW IT WORKS ===
 * 
 * Request Flow:
 * 1. User visits: https://my-site.sitepilot.devally.in/
 * 2. CloudFront calls this function
 * 3. Function extracts slug: "my-site"
 * 4. Function looks up in KVS: "my-site" → "sites/userId/businessId/siteId/deployments/deploymentId"
 * 5. Function rewrites request URI to: /sites/userId/.../index.html
 * 6. CloudFront fetches from S3 origin with rewritten path
 * 
 * KVS Structure:
 * - Key: siteSlug (e.g., "my-site", "acme-corp")
 * - Value: S3 prefix (e.g., "sites/user123/tenant456/site789/deployments/dep-abc-123")
 * 
 * === ENVIRONMENT ===
 * 
 * Required CloudFront setup:
 * - Origin: S3 bucket (sitepilot-devally)
 * - KVS ARN: arn:aws:cloudfront::851725466206:key-value-store/d0639b0d-8459-4057-8745-aeed037f85b5
 * - Distribution ID: E2RGM009VMVUBY
 * - Connection Group: cg_39y9v6TFZ1MRXBQCCkKEqN9FIil
 * 
 * === LIMITATIONS ===
 * 
 * CloudFront Functions have constraints:
 * - Max execution time: 1ms
 * - Max memory: 2MB
 * - Max function size: 10KB
 * - No network calls (KVS is local)
 * - No async/await
 * - Subset of JavaScript (ES5.1)
 * 
 * @param {object} event - CloudFront event object
 * @returns {object} Modified request or response
 */

function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var uri = request.uri;

  // Get the Host header to extract subdomain
  var host = headers.host ? headers.host.value : '';

  console.log("Incoming request:", {
    host: host,
    uri: uri,
    method: request.method
  });

  // Base domain for your multi-tenant setup
  var baseDomain = "sitepilot.devally.in";

  // Extract subdomain (tenant slug)
  var siteSlug = null;

  if (host.endsWith(baseDomain)) {
    // Extract everything before .sitepilot.devally.in
    var parts = host.split('.');
    if (parts.length >= 4) {
      // e.g., my-site.sitepilot.devally.in → my-site
      siteSlug = parts[0];
    }
  }

  console.log("Extracted site slug:", siteSlug);

  // If no valid slug found, return 404
  if (!siteSlug) {
    console.log("No valid site slug found, returning 404");
    return {
      statusCode: 404,
      statusDescription: 'Not Found',
      headers: {
        'content-type': { value: 'text/html' }
      },
      body: {
        encoding: 'text',
        data: '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 - Site Not Found</h1><p>The requested site does not exist.</p></body></html>'
      }
    };
  }

  // Look up the S3 prefix from Key-Value Store
  var kv = event.context.kvs;
  var s3Prefix = null;

  try {
    // KVS lookup: siteSlug → S3 prefix
    s3Prefix = kv[siteSlug];
    console.log("KVS lookup result:", {
      key: siteSlug,
      value: s3Prefix
    });
  } catch (e) {
    console.log("KVS lookup error:", e);
  }

  // If no mapping found in KVS, return 404
  if (!s3Prefix) {
    console.log("No KVS mapping found for slug:", siteSlug);
    return {
      statusCode: 404,
      statusDescription: 'Not Found',
      headers: {
        'content-type': { value: 'text/html' }
      },
      body: {
        encoding: 'text',
        data: '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 - Site Not Found</h1><p>This site has not been published yet.</p></body></html>'
      }
    };
  }

  // Rewrite the URI to point to the correct S3 path
  // Original: /about
  // Rewritten: /sites/userId/businessId/siteId/deployments/deploymentId/about

  var newUri = uri;

  // Handle root path
  if (uri === '/' || uri === '') {
    newUri = '/' + s3Prefix + '/index.html';
  }
  // Handle paths without file extension (assume HTML)
  else if (uri.indexOf('.') === -1) {
    // Remove trailing slash if present
    var cleanUri = uri.replace(/\/$/, '');
    newUri = '/' + s3Prefix + cleanUri + '.html';
  }
  // Handle direct file requests
  else {
    newUri = '/' + s3Prefix + uri;
  }

  console.log("URI rewrite:", {
    original: uri,
    rewritten: newUri,
    s3Prefix: s3Prefix
  });

  // Update the request URI
  request.uri = newUri;

  // Add cache headers for better performance
  if (!headers['cache-control']) {
    headers['cache-control'] = {
      value: 'public, max-age=3600'
    };
  }

  console.log("Forwarding modified request to origin");

  return request;
}
