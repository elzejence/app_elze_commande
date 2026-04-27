# 🍽 SaveursMada — Application de Commande en Ligne (MySQL)

Backend : Node.js + Express + MySQL (Sequelize) | Frontend : React 18

## 🗄 Tables MySQL créées automatiquement

| Table | Description |
|---|---|
| `users` | Clients, employés, admins |
| `menu_items` | Plats du restaurant |
| `orders` | Commandes |
| `order_items` | Lignes de commande |
| `order_status_history` | Historique statuts |
| `messages` | Messagerie bidirectionnelle |
| `activity_logs` | Journal d'activité |

## 🚀 Installation rapide

### 1. Créer la base de données MySQL
```sql
CREATE DATABASE restaurant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Remplir .env avec vos infos MySQL
npm run create-admin   # Créer l'admin via terminal
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

## 👥 Les 3 comptes

| Rôle | Création | URL après login |
|---|---|---|
| Client | Via /register | http://localhost:3000/ |
| Employé | Via dashboard Admin | http://localhost:3000/employee |
| Admin | Via terminal | http://localhost:3000/admin |

## .env à configurer
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=restaurant_db
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=votre_secret
CLIENT_URL=http://localhost:3000
```

## Problèmes fréquents
- **Access denied** → Vérifiez DB_USER et DB_PASSWORD dans .env
- **Unknown database** → Créez la DB: CREATE DATABASE restaurant_db;
- **ECONNREFUSED 3306** → Démarrez MySQL (services ou brew services start mysql)
