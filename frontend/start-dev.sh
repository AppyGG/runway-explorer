#!/bin/bash

# Script de démarrage pour Runway Explorer
# Lance le backend et le frontend en parallèle

echo "🚀 Démarrage de Runway Explorer..."
echo ""

# Vérifier que les dépendances du backend sont installées
if [ ! -d "backend-example/node_modules" ]; then
    echo "📦 Installation des dépendances du backend..."
    cd backend-example
    npm install
    cd ..
    echo ""
fi

# Vérifier que le fichier .env existe dans le backend
if [ ! -f "backend-example/.env" ]; then
    echo "⚠️  Attention: backend-example/.env n'existe pas"
    echo "   Copie de .env.example vers .env..."
    cp backend-example/.env.example backend-example/.env
    echo "   ⚠️  N'oubliez pas de configurer votre clé API OpenAIP dans backend-example/.env"
    echo ""
fi

# Vérifier que le fichier .env.local existe pour le frontend
if [ ! -f ".env.local" ]; then
    echo "⚠️  Attention: .env.local n'existe pas"
    if [ -f ".env" ]; then
        echo "   Copie de .env vers .env.local..."
        cp .env .env.local
    fi
    echo ""
fi

echo "🔧 Démarrage du backend sur le port 3008..."
cd backend-example
npm start &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 3

# Vérifier que le backend répond
if curl -s http://localhost:3008/health > /dev/null; then
    echo "✅ Backend démarré avec succès"
else
    echo "❌ Erreur: le backend ne répond pas"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎨 Démarrage du frontend..."
echo ""

# Démarrer le frontend (utilise bun si disponible, sinon npm)
if command -v bun &> /dev/null; then
    bun dev
else
    npm run dev
fi

# Quand on arrête le frontend, arrêter aussi le backend
echo ""
echo "🛑 Arrêt de l'application..."
kill $BACKEND_PID 2>/dev/null
echo "✅ Application arrêtée"
