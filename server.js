// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente ou 3000 como fallback

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta atual
app.use(express.static('.'));

// Configurar multer para salvar na pasta 'fotos'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Usar a pasta 'fotos' que já existe
    cb(null, 'fotos/');
  },
  filename: function (req, file, cb) {
    // Nome único baseado no timestamp
    const uniqueName = 'img-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  }
});

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  console.log('Enviando index:', filePath);
  res.sendFile(filePath);
});

// Rota de teste
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Se quiser manter o JSON de teste:
app.get('/status', (req, res) => {
  res.json({ message: 'Backend do Archaeology World funcionando!', status: '✅ Online' });
});


// Rota para upload de imagens
app.post('/upload', upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Nenhum arquivo foi enviado' 
      });
    }

    console.log('✅ Imagem salva em:', req.file.path);
    
    // Retornar sucesso com o caminho da imagem
    res.json({
      success: true,
      message: 'Imagem salva na pasta fotos!',
      filename: req.file.filename,
      imageUrl: `fotos/${req.file.filename}`,
      path: req.file.path
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota para listar imagens na pasta fotos
app.get('/fotos', (req, res) => {
  fs.readdir('fotos', (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao ler pasta fotos' });
    }
    
    const imagens = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `fotos/${file}`,
        fullPath: path.join(__dirname, 'fotos', file)
      }));
    
    res.json({
      total: imagens.length,
      imagens: imagens
    });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('===================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Pasta de fotos: ${path.join(__dirname, 'fotos')}`);
  console.log('===================================');
});