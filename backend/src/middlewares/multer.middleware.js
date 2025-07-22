import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the upload directory exists
const uploadDir = './public/temp';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Multer destination - file:', file);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    console.log('Multer filename - file:', file);
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File filter - mimetype:', file.mimetype);
  console.log('File filter - originalname:', file.originalname);
  console.log('File filter - fieldname:', file.fieldname);
  
  // Check file extension as backup
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.txt'];
  const allowedMimes = ['application/pdf', 'text/plain'];
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    console.log('File accepted');
    cb(null, true);
  } else {
    console.log('File rejected - invalid type');
    cb(new Error('Only PDF and text files are allowed!'), false);
  }
};

// Add error handler for multer
const multerErrorHandler = (error, req, res, next) => {
  console.log('Multer error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected field name. Expected "transcript".' });
    }
  }
  next(error);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export { multerErrorHandler };