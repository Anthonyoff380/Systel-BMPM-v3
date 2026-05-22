# SYSTEL CENTRE PTR - VERSION PROFESSIONNELLE

Système de gestion opérationnelle pour centre de secours, optimisé pour un déploiement sur **Vercel** avec persistance **Firebase**.

## 🚀 Fonctionnalités
- **Authentification & Rôles** : 
  - `ADMIN` : Accès total, gestion des comptes, configuration centre/engins.
  - `BMPM` : Consultation, modification de son propre planning uniquement.
- **Modules Refondus** : Interventions, Planning, Effectifs, Annuaire.
- **Cartographie** : Intégration de la carte interactive GTA.
- **Persistance** : Sauvegarde automatique en LocalStorage (prêt pour Firebase Firestore).

## 🛠️ Installation & Déploiement

### Local
1. Ouvrez `index.html` dans votre navigateur.
2. Identifiants par défaut :
   - Admin : `admin` / `123`
   - Utilisateur : `k.ianis` / `ptr`

### Déploiement Vercel
1. Créez un nouveau dépôt sur GitHub.
2. Poussez tous les fichiers du dossier `systel/`.
3. Connectez votre GitHub à [Vercel](https://vercel.com).
4. Vercel détectera automatiquement le projet et le déploiera.

### Configuration Firebase
1. Créez un projet sur la console Firebase.
2. Copiez vos identifiants dans `js/firebase-config.js`.
3. Décommentez le code d'importation dans `js/firebase-config.js`.
4. Adaptez les fonctions `sauvegarderDonnees()` et `chargerDonnees()` dans `js/app.js` pour utiliser `getDocs`, `setDoc`, etc.

## ⚙️ Administration
Le panel d'administration permet de :
- Modifier le nom du centre (PTR par défaut).
- Gérer la liste des engins.
- **Créer des comptes utilisateurs** avec attribution de rôles.
- Réinitialiser le système.

---
*Développé pour le Centre PTR - 2026*
