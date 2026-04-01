#!/bin/bash
# ═══════════════════════════════════════════════════
# PostFlow — Script de déploiement automatique
# Exécute ce script depuis le dossier postflow-app
# ═══════════════════════════════════════════════════

echo "🚀 PostFlow — Préparation du déploiement"
echo ""

# 1. Nettoyer et réinitialiser Git
rm -rf .git
git init -b main

# 2. Créer le commit initial
git add -A
git commit -m "PostFlow v1.0 — Application de gestion LinkedIn pour Talentys RH"

# 3. Créer le repo GitHub et pousser
echo ""
echo "📦 Création du repo GitHub..."
gh repo create postflow-app --private --source=. --remote=origin --push

echo ""
echo "✅ Code poussé sur GitHub !"
echo ""
echo "📋 Prochaine étape :"
echo "   1. Va sur https://render.com"
echo "   2. New → Web Service → Connect ton repo 'postflow-app'"
echo "   3. Configure les variables d'environnement (voir .env.example)"
echo ""
