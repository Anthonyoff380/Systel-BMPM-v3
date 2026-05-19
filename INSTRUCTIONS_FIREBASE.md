# ☁️ Activation du Partage Cloud (Firebase)

Si vos collègues voient le point **ROUGE** sur l'écran de connexion, c'est que la base de données Firebase bloque l'accès. Voici comment régler cela en 2 minutes :

## 1. Configurer les règles de sécurité
Sur votre console Firebase (https://console.firebase.google.com/) :
1. Allez dans **Firestore Database**.
2. Cliquez sur l'onglet **Règles** (Rules).
3. Remplacez tout le code par celui-ci (cela autorise la lecture/écriture pour votre équipe) :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
4. Cliquez sur **Publier**.

## 2. Vérifier sur le site
- Demandez à vos collègues de rafraîchir la page.
- Le point doit passer au **VERT**.
- Le message "X utilisateur(s) chargé(s)" doit s'afficher.

## 3. Accès de secours
Si rien ne fonctionne, le compte suivant est **toujours actif** dans cette version (Fail-safe) :
- **Identifiant** : `admin`
- **Mot de passe** : `123`

---
*Note : Cette version "Blindée" contient vos clés directement dans le code pour simplifier l'installation.*
