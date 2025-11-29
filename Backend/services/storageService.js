const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class StorageService {
  constructor() {
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

  // Upload file (local storage only)
  async uploadFile(file, options = {}) {
    const { folder = 'uploads' } = options;
    return await this.uploadToLocal(file, folder);
  }

  // Upload to local storage
  async uploadToLocal(file, folder) {
    const fs = require('fs').promises;
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const uploadPath = path.join(process.cwd(), 'uploads', folder);
    const filePath = path.join(uploadPath, fileName);
    
    try {
      // Ensure directory exists
      await fs.mkdir(uploadPath, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, file.buffer);
      
      return {
        url: `/uploads/${folder}/${fileName}`,
        path: filePath,
        size: file.size,
        provider: 'local'
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete file from local storage
  async deleteFile(filePath) {
    try {
      const fs = require('fs').promises;
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      throw error;
    }
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


}

module.exports = new StorageService();