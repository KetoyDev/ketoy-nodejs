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
      // Create file path: apps/{packageName}/{screenName}.json
      const fileName = `${screenName}.json`;
      const filePath = `apps/${packageName}/${fileName}`;

      // Convert JSON to string
      const jsonString = JSON.stringify(jsonContent, null, 2);
      const buffer = Buffer.from(jsonString, 'utf-8');

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: buffer,
        ContentType: 'application/json',
        Metadata: {
          version: version,
          screenName: screenName,
          packageName: packageName,
          uploadedAt: new Date().toISOString()
        }
      });

      await this.client.send(command);

      console.log(`JSON file uploaded successfully: ${filePath}`);

      return {
        filePath,
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
   * Update existing JSON file
   * @param {string} filePath - Full file path in R2
   * @param {object} jsonContent - New JSON content
   * @param {string} version - Version number (optional)
   * @returns {Promise<{filePath: string, fileSize: number}>}
   */
  async updateJsonFile(filePath, jsonContent, version) {
    try {
      // Check if file exists
      const exists = await this.fileExists(filePath);
      if (!exists) {
        throw new Error('File does not exist');
      }

      // Upload new version
      const jsonString = JSON.stringify(jsonContent, null, 2);
      const buffer = Buffer.from(jsonString, 'utf-8');

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: buffer,
        ContentType: 'application/json',
        Metadata: {
          version: version || '1.0.0',
          updatedAt: new Date().toISOString()
        }
      });

      await this.client.send(command);

      console.log(`JSON file updated successfully: ${filePath}`);

      return {
        filePath,
        fileSize: buffer.length
      };
    } catch (error) {
      console.error('Error updating JSON in R2:', error);
      throw new Error(`Failed to update JSON file: ${error.message}`);
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
