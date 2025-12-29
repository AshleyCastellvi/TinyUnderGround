# TUG - Tiny UnderGround

Red social para artistas de rap español.

## 🚀 Inicio Rápido

### Frontend (Vite + React)
```bash
npm install
npm run dev
```

### Backend (Express + SQLite)
```bash
cd server
npm install
node index.js
```

## 📁 Estructura del Proyecto

```
TinyUnderGround/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── pages/              # Páginas de la app
│   ├── context/            # Context providers
│   └── services/           # API services
├── server/                 # Backend Express
│   ├── config/             # Database config
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth & upload
│   ├── routes/             # API routes
│   └── uploads/            # Audio & images
└── public/                 # Static assets
```

## 🔧 Variables de Entorno

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

### Backend (server/.env)
```
JWT_SECRET=your_secret_key
PORT=3001
```

## 📦 Despliegue

### Frontend (Vercel/Netlify)
1. Conecta el repositorio
2. Build command: `npm run build`
3. Output: `dist`
4. Configura `VITE_API_URL`

### Backend (Railway)
1. Conecta el repositorio
2. Root: `/server`
3. Start: `npm start`
4. Configura `JWT_SECRET`

## 🎨 Stack

- **Frontend**: Vite, React, Framer Motion, React Router
- **Backend**: Express, SQLite, JWT, Multer
- **Estilos**: CSS con variables, Glassmorphism

## 📄 Licencia

MIT - Creado para la comunidad del rap español 🎤
