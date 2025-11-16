const AWS = require('aws-sdk');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'cloudinary'; // 'cloudinary' or 's3'
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
    this.allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  // Configure multer for different file types
  getMulterConfig(options = {}) {
    const storage = multer.memoryStorage();
    
    const fileFilter = (req, file, cb) => {
      const { fileType = 'any', maxSize = this.maxFileSize } = options;
      
      if (fileType === 'image' && !this.allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error('Only image files are allowed'), false);
      }
      
      if (fileType === 'video' && !this.allowedVideoTypes.includes(file.mimetype)) {
        return cb(new Error('Only video files are allowed'), false);
      }
      
      if (fileType === 'document' && !this.allowedDocTypes.includes(file.mimetype)) {
        return cb(new Error('Only document files are allowed'), false);
      }
      
      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: options.maxSize || this.maxFileSize
      }
    });
  }

  // Upload file to chosen provider
  async uploadFile(file, options = {}) {
    const { folder = 'uploads', transformation, quality = 'auto' } = options;
    
    if (this.provider === 'cloudinary') {
      return await this.uploadToCloudinary(file, folder, transformation, quality);
    } else {
      return await this.uploadToS3(file, folder);
    }
  }

  // Upload to Cloudinary
  async uploadToCloudinary(file, folder, transformation, quality) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        public_id: `${folder}/${uuidv4()}`,
        quality,
        resource_type: 'auto'
      };

      if (transformation) {
        uploadOptions.transformation = transformation;
      }

      // Upload file buffer to Cloudinary
      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
            provider: 'cloudinary'
          });
        }
      }).end(file.buffer);
    });
  }

  // Upload to AWS S3
  async uploadToS3(file, folder) {
    const fileName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    try {
      const result = await s3.upload(params).promise();
      
      return {
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        size: file.size,
        provider: 's3'
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileIdentifier, provider = this.provider) {
    if (provider === 'cloudinary') {
      return await this.deleteFromCloudinary(fileIdentifier);
    } else {
      return await this.deleteFromS3(fileIdentifier);
    }
  }

  // Delete from Cloudinary
  async deleteFromCloudinary(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      throw error;
    }
  }

  // Delete from S3
  async deleteFromS3(key) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Generate signed URL for private files (S3 only)
  generateSignedUrl(key, expiresIn = 3600) {
    if (this.provider !== 's3') {
      throw new Error('Signed URLs are only available for S3 storage');
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    return s3.getSignedUrl('getObject', params);
  }

  // Transform image (Cloudinary only)
  async transformImage(publicId, transformations) {
    if (this.provider !== 'cloudinary') {
      throw new Error('Image transformation is only available for Cloudinary storage');
    }

    const transformedUrl = cloudinary.url(publicId, {
      transformation: transformations
    });

    return transformedUrl;
  }

  // Get image transformations for different use cases
  getImageTransformations() {
    return {
      thumbnail: { width: 150, height: 150, crop: 'fill' },
      small: { width: 300, height: 300, crop: 'limit' },
      medium: { width: 600, height: 600, crop: 'limit' },
      large: { width: 1200, height: 1200, crop: 'limit' },
      storyboard: { width: 800, height: 450, crop: 'fill' }, // 16:9 aspect ratio
      profile: { width: 200, height: 200, crop: 'fill', gravity: 'face' }
    };
  }

  // Upload multiple files
  async uploadMultipleFiles(files, options = {}) {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return await Promise.all(uploadPromises);
  }

  // Validate file type and size
  validateFile(file, options = {}) {
    const { 
      maxSize = this.maxFileSize, 
      allowedTypes = [...this.allowedImageTypes, ...this.allowedVideoTypes, ...this.allowedDocTypes] 
    } = options;

    const errors = [];

    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get file info
  async getFileInfo(identifier, provider = this.provider) {
    if (provider === 'cloudinary') {
      return await this.getCloudinaryFileInfo(identifier);
    } else {
      return await this.getS3FileInfo(identifier);
    }
  }

  // Get Cloudinary file info
  async getCloudinaryFileInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        url: result.secure_url,
        size: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        provider: 'cloudinary'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get S3 file info
  async getS3FileInfo(key) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    try {
      const result = await s3.headObject(params).promise();
      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        provider: 's3'
      };
    } catch (error) {
      throw error;
    }
  }

  // Create backup of file
  async createBackup(sourceIdentifier, backupFolder = 'backups') {
    // This would implement backup logic based on your needs
    // For now, just copy to backup folder
    if (this.provider === 'cloudinary') {
      // Cloudinary doesn't have a direct copy method, so we'd need to download and re-upload
      // This is a simplified implementation
      return `${backupFolder}/${sourceIdentifier}`;
    } else {
      // S3 copy object
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        CopySource: `${process.env.S3_BUCKET_NAME}/${sourceIdentifier}`,
        Key: `${backupFolder}/${sourceIdentifier}`
      };

      try {
        const result = await s3.copyObject(params).promise();
        return result.CopyObjectResult;
      } catch (error) {
        throw error;
      }
    }
  }
}

module.exports = new StorageService();