import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created upload directory:', uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + req.user?.id + '-';
    const filename = uniqueSuffix + file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, filename);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: fileFilter
});

// Middleware for single event image upload
export const uploadEventImage = upload.single('image');

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one image allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field. Use "image" field for file upload.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed.'
    });
  }
  
  next(error);
};

// Helper function to delete uploaded file
export const deleteUploadedFile = (filename) => {
  if (!filename) return;
  
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filename}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export default upload;
