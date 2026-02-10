const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid');

/**
 * Cloudflare R2 Storage Service
 * Uses S3-compatible API
 */
class R2StorageService {
  constructor() {
    // Initialize S3 client for Cloudflare R2
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    });
    
    this.bucketName = config.r2.bucketName;
  }

  /**
   * Upload JSON file to R2
   * @param {string} packageName - App package name
   * @param {string} screenName - Screen name
   * @param {object} jsonContent - JSON content to upload
   * @param {string} version - Version number (optional)
   * @returns {Promise<{filePath: string, fileSize: number}>}
   */
  async uploadJsonFile(packageName, screenName, jsonContent, version = '1.0.0') {
    try {
      // Create file path: apps/{packageName}/{screenName}/latest.json
      const latestPath = `apps/${packageName}/${screenName}/latest.json`;
      // Versioned path: apps/{packageName}/{screenName}/v{version}.json
      const versionedPath = `apps/${packageName}/${screenName}/v${version}.json`;

      // Convert JSON to string
      const jsonString = JSON.stringify(jsonContent, null, 2);
      const buffer = Buffer.from(jsonString, 'utf-8');

      const metadata = {
        version: version,
        screenName: screenName,
        packageName: packageName,
        uploadedAt: new Date().toISOString()
      };

      // Upload versioned copy
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: versionedPath,
        Body: buffer,
        ContentType: 'application/json',
        Metadata: metadata
      }));

      // Upload/overwrite latest copy
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: latestPath,
        Body: buffer,
        ContentType: 'application/json',
        Metadata: metadata
      }));

      console.log(`JSON file uploaded: ${versionedPath} + ${latestPath}`);

      return {
        filePath: latestPath,
        versionedFilePath: versionedPath,
        fileSize: buffer.length
      };
    } catch (error) {
      console.error('Error uploading JSON to R2:', error);
      throw new Error(`Failed to upload JSON file: ${error.message}`);
    }
  }

  /**
   * Retrieve JSON file from R2
   * @param {string} filePath - Full file path in R2
   * @returns {Promise<object>} - JSON content
   */
  async getJsonFile(filePath) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const response = await this.client.send(command);

      // Convert stream to string
      const streamToString = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        });

      const jsonString = await streamToString(response.Body);
      const jsonContent = JSON.parse(jsonString);

      return jsonContent;
    } catch (error) {
      console.error('Error retrieving JSON from R2:', error);
      
      if (error.name === 'NoSuchKey') {
        throw new Error('JSON file not found');
      }
      
      throw new Error(`Failed to retrieve JSON file: ${error.message}`);
    }
  }

  /**
   * Delete JSON file from R2
   * @param {string} filePath - Full file path in R2
   * @returns {Promise<boolean>}
   */
  async deleteJsonFile(filePath) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.client.send(command);
      console.log(`JSON file deleted successfully: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error deleting JSON from R2:', error);
      throw new Error(`Failed to delete JSON file: ${error.message}`);
    }
  }

  /**
   * Check if file exists in R2
   * @param {string} filePath - Full file path in R2
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * List all JSON files for an app
   * @param {string} packageName - App package name
   * @returns {Promise<Array>} - List of file keys
   */
  async listAppFiles(packageName) {
    try {
      const prefix = `apps/${packageName}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      return response.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      }));
    } catch (error) {
      console.error('Error listing app files from R2:', error);
      throw new Error(`Failed to list app files: ${error.message}`);
    }
  }

  /**
   * Update existing JSON file (new version upload)
   * Archives current version and updates latest
   * @param {string} packageName - App package name
   * @param {string} screenName - Screen name
   * @param {object} jsonContent - New JSON content
   * @param {string} version - New version number
   * @returns {Promise<{filePath: string, versionedFilePath: string, fileSize: number}>}
   */
  async updateJsonFile(packageName, screenName, jsonContent, version) {
    // Re-use uploadJsonFile which handles both latest + versioned copies
    return this.uploadJsonFile(packageName, screenName, jsonContent, version);
  }

  /**
   * Get a specific versioned JSON file from R2
   * Falls back to legacy path format for pre-versioning data
   * @param {string} packageName - App package name
   * @param {string} screenName - Screen name
   * @param {string} version - Version to retrieve
   * @returns {Promise<object>} - JSON content
   */
  async getVersionedJsonFile(packageName, screenName, version) {
    // Try new versioned path first
    const versionedPath = `apps/${packageName}/${screenName}/v${version}.json`;
    try {
      return await this.getJsonFile(versionedPath);
    } catch (error) {
      // Fallback: try legacy flat path (pre-versioning format)
      const legacyPath = `apps/${packageName}/${screenName}.json`;
      try {
        console.log(`Version file not found at ${versionedPath}, trying legacy path: ${legacyPath}`);
        return await this.getJsonFile(legacyPath);
      } catch (legacyError) {
        // Neither path exists
        throw new Error(`Version ${version} file not found in storage`);
      }
    }
  }

  /**
   * List all version files for a screen in R2
   * @param {string} packageName - App package name
   * @param {string} screenName - Screen name
   * @returns {Promise<Array>} - List of version files
   */
  async listScreenVersionFiles(packageName, screenName) {
    try {
      const prefix = `apps/${packageName}/${screenName}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      return response.Contents
        .filter(item => item.Key.includes('/v') && item.Key.endsWith('.json'))
        .map(item => {
          // Extract version from path like apps/pkg/screen/v1.0.0.json
          const fileName = item.Key.split('/').pop();
          const version = fileName.replace('v', '').replace('.json', '');
          return {
            version,
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified
          };
        })
        .sort((a, b) => {
          // Sort by version descending
          const partsA = a.version.split('.').map(Number);
          const partsB = b.version.split('.').map(Number);
          for (let i = 0; i < 3; i++) {
            if ((partsB[i] || 0) !== (partsA[i] || 0)) return (partsB[i] || 0) - (partsA[i] || 0);
          }
          return 0;
        });
    } catch (error) {
      console.error('Error listing screen versions from R2:', error);
      throw new Error(`Failed to list screen versions: ${error.message}`);
    }
  }

  /**
   * Delete all files for a screen (latest + all versions + legacy)
   * @param {string} packageName - App package name
   * @param {string} screenName - Screen name
   * @returns {Promise<number>} - Number of files deleted
   */
  async deleteAllScreenFiles(packageName, screenName) {
    try {
      const prefix = `apps/${packageName}/${screenName}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);
      let deletedCount = 0;

      if (response.Contents) {
        for (const item of response.Contents) {
          await this.deleteJsonFile(item.Key);
          deletedCount++;
        }
      }

      // Also try to delete legacy flat path
      const legacyPath = `apps/${packageName}/${screenName}.json`;
      try {
        if (await this.fileExists(legacyPath)) {
          await this.deleteJsonFile(legacyPath);
          deletedCount++;
        }
      } catch (e) {
        // Ignore — legacy file may not exist
      }

      return deletedCount;
    } catch (error) {
      console.error('Error deleting screen files from R2:', error);
      throw new Error(`Failed to delete screen files: ${error.message}`);
    }
  }

  /**
   * Archive the current version to its versioned path in R2
   * Reads from existing filePath (latest or legacy) and saves as v{version}.json
   * @param {string} packageName - App package name
   * @param {string} screenName - Screen name
   * @param {string} currentFilePath - Current file path (may be legacy format)
   * @param {string} version - Version to archive
   * @returns {Promise<boolean>} - Whether archiving was successful
   */
  async archiveCurrentVersion(packageName, screenName, currentFilePath, version) {
    const versionedPath = `apps/${packageName}/${screenName}/v${version}.json`;

    // Check if already archived at versioned path
    if (await this.fileExists(versionedPath)) {
      return true;
    }

    // Try to read from current filePath and copy to versioned path
    try {
      const jsonContent = await this.getJsonFile(currentFilePath);
      const jsonString = JSON.stringify(jsonContent, null, 2);
      const buffer = Buffer.from(jsonString, 'utf-8');

      await this.client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: versionedPath,
        Body: buffer,
        ContentType: 'application/json',
        Metadata: {
          version,
          screenName,
          packageName,
          archivedAt: new Date().toISOString()
        }
      }));

      console.log(`Archived version ${version} to ${versionedPath}`);
      return true;
    } catch (error) {
      // Also try legacy path as fallback
      const legacyPath = `apps/${packageName}/${screenName}.json`;
      if (currentFilePath !== legacyPath) {
        try {
          const jsonContent = await this.getJsonFile(legacyPath);
          const jsonString = JSON.stringify(jsonContent, null, 2);
          const buffer = Buffer.from(jsonString, 'utf-8');

          await this.client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: versionedPath,
            Body: buffer,
            ContentType: 'application/json',
            Metadata: {
              version,
              screenName,
              packageName,
              archivedAt: new Date().toISOString()
            }
          }));

          console.log(`Archived version ${version} from legacy path to ${versionedPath}`);
          return true;
        } catch (legacyError) {
          console.warn(`Could not archive version ${version}: file not found at either path`);
          return false;
        }
      }
      console.warn(`Could not archive version ${version}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get file metadata
   * @param {string} filePath - Full file path in R2
   * @returns {Promise<object>} - File metadata
   */
  async getFileMetadata(filePath) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const response = await this.client.send(command);

      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        metadata: response.Metadata
      };
    } catch (error) {
      console.error('Error getting file metadata from R2:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new R2StorageService();
