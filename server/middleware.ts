
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

export function spaFallback(req: Request, res: Response, next: NextFunction) {
  // Se for uma requisição de API, passe adiante
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Se for um arquivo estático, passe adiante
  if (req.path.includes('.') && !req.path.includes('html')) {
    return next();
  }

  // Para rotas SPA, sirva o index.html
  const indexPath = path.join(process.cwd(), 'dist/public/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Em desenvolvimento, deixe o Vite lidar com isso
    next();
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}
