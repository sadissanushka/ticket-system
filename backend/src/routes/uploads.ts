import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Single file upload
router.post('/', authenticate, (req: AuthRequest, res: Response, next) => {
  console.log('[Upload] POST /api/uploads received');
  next();
}, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      console.warn('[Upload] No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[Upload] File saved: ${req.file.filename}`);
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    res.json({
      id: req.file.filename,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      url: fileUrl,
    });
  } catch (err) {
    console.error('[Upload] Handler error:', err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

export default router;
