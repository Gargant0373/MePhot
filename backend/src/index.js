const express = require('express');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FOLDERS_PATH = path.join(__dirname, '../folders');

app.use(cors());

const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/api/images/') && req.query.auth) {
    try {
      const credentials = Buffer.from(req.query.auth, 'base64').toString();
      const [username, password] = credentials.split(':');
      
      if (username === 'user' && password === 'olimpic_carrot') {
        return next(); 
      }
    } catch (error) {
      console.error('Error parsing auth token:', error);
    }
  }

  return basicAuth({
    users: { 'user': 'olimpic_carrot' },
    challenge: true,
    unauthorizedResponse: 'Unauthorized: Authentication required'
  })(req, res, next);
};

app.use(authMiddleware);

app.get('/api/folders', (req, res) => {
  try {
    const folders = fs.readdirSync(FOLDERS_PATH)
      .filter(item => fs.statSync(path.join(FOLDERS_PATH, item)).isDirectory());
    
    res.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

app.get('/api/folders/:folderName', (req, res) => {
  const { folderName } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  
  const folderPath = path.join(FOLDERS_PATH, folderName);
  
  try {
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    const allImages = fs.readdirSync(folderPath)
      .filter(file => {
        const extension = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(extension);
      })
      .sort();
    
    const totalImages = allImages.length;
    const totalPages = Math.ceil(totalImages / pageSize);
    
    const startIndex = (page - 1) * pageSize;
    const paginatedImages = allImages.slice(startIndex, startIndex + pageSize);
    
    res.json({
      folderName,
      images: paginatedImages,
      pagination: {
        page,
        pageSize,
        totalImages,
        totalPages
      }
    });
  } catch (error) {
    console.error(`Error fetching images from folder ${folderName}:`, error);
    res.status(500).json({ error: 'Failed to fetch images from folder' });
  }
});

app.get('/api/images/:folderName/:imageName', (req, res) => {
  const { folderName, imageName } = req.params;
  const imagePath = path.join(FOLDERS_PATH, folderName, imageName);
  
  try {
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error(`Error serving image ${imageName}:`, error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});