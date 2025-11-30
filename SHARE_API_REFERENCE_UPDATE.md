# Share API - Reference Field Implementation

## Summary

Updated the Share API to use the `reference` field instead of `id` for all API endpoints and operations. This aligns with the project's coding standard that entities should use "reference" to identify objects in URLs/API endpoints.

## Changes Made

### 1. AbstractEntity (`backend/src/Entity/AbstractEntity.php`)
- Added serialization groups to the `$reference` field: `['share:read', 'share:created']`
- This ensures the reference is included in API responses

### 2. ShareRepository (`backend/src/Repository/ShareRepository.php`)
- Added `findByReference(string $reference): ?Share` method
- This method queries shares by their reference field instead of ID

### 3. ShareProvider (`backend/src/State/ShareProvider.php`)
- **Changed**: `$uriVariables['id']` → `$uriVariables['reference']`
- Updated error message: "Share ID is required" → "Share reference is required"
- Updated reference validation regex: `/^share-[0-9a-f]{32}$/` → `/^share-[0-9A-Z]{26}$/i`
  - The new regex matches ULID format in base32 (26 characters)
- Updated log messages to use 'reference' instead of 'id'

### 4. ShareTest (`backend/tests/Api/ShareTest.php`)
- Updated all test assertions to check for `reference` field instead of `id`
- Updated regex pattern to validate reference format: `/^share-[0-9A-Z]{26}$/i`
- Renamed variables: `$shareId` → `$shareReference`
- Updated test method names and assertions accordingly

## API Endpoints

### POST /api/shares
**Request:**
```json
{
  "encryptedData": "base64_encoded_encrypted_data",
  "expiresIn": 3600
}
```

**Response (201 Created):**
```json
{
  "@context": "/api/contexts/Share",
  "@id": "/api/shares/share-01JBCD2EFGH3JKLMNPQRSTVWXY",
  "@type": "Share",
  "reference": "share-01JBCD2EFGH3JKLMNPQRSTVWXY",
  "expiresAt": "2024-12-31T23:59:59+00:00"
}
```

### GET /api/shares/{reference}
**Example:** `GET /api/shares/share-01JBCD2EFGH3JKLMNPQRSTVWXY`

**Response (200 OK):**
```json
{
  "@context": "/api/contexts/Share",
  "@id": "/api/shares/share-01JBCD2EFGH3JKLMNPQRSTVWXY",
  "@type": "Share",
  "reference": "share-01JBCD2EFGH3JKLMNPQRSTVWXY",
  "encryptedData": "base64_encoded_encrypted_data"
}
```

**Response (404 Not Found):**
- Share not found
- Share has expired
- Invalid reference format

## Reference Format

References are generated using ULID (Universally Unique Lexicographically Sortable Identifier) in base32 format:
- **Pattern**: `{prefix}-{ulid_base32}`
- **Example**: `share-01JBCD2EFGH3JKLMNPQRSTVWXY`
- **Prefix**: Defined by `getReferencePrefix()` method in each entity
- **ULID**: 26 characters in base32 (0-9, A-Z, case-insensitive)

## Frontend Compatibility

The frontend was already using the `reference` field correctly:
- `ShareResponse` interface uses `reference: string`
- `createShare()` returns `{ url, key, reference }`
- `getShare(shareId)` accepts the reference as parameter
- URL routing uses `/share/{reference}#encryption_key` format

## Testing

Run the test suite to verify all changes:
```bash
cd backend
php bin/phpunit tests/Api/ShareTest.php
```

All tests have been updated to use the reference field and should pass successfully.
