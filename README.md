# TUG - Tiny UnderGround 🎤

Red social para artistas de rap español.

## 🚀 Despliegue en Railway (Todo en Uno)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Despliegue Automático
1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Selecciona este repositorio
4. Añade variable: `JWT_SECRET = tu_clave_secreta`
5. Click Deploy ¡Listo!

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install
cd server && npm install && cd ..

# Desarrollo (frontend + backend separados)
npm run dev          # Frontend en :5173
npm run dev:server   # Backend en :3001

# Producción local
npm run build        # Compila frontend
npm start            # Sirve todo en :3001
```

## 📁 Estructura

```
├── src/              # Frontend React
├── server/           # Backend Express
│   ├── config/       # Database
│   ├── controllers/  # API logic
│   ├── routes/       # Endpoints
│   └── uploads/      # Audio/images
├── dist/             # Frontend compilado
└── railway.toml      # Config despliegue
```

## 🔧 Variables de Entorno

```env
JWT_SECRET=clave_secreta_larga
PORT=3001 (opcional)
```

## ✨ Features

- 🎵 Upload y streaming de música
- 👥 Sistema de follows
- ❤️ Likes y comentarios
- 🤝 Colaboraciones
- 💬 Mensajes privados
- � Notificaciones

---
Creado para la comunidad del rap español 🎤
