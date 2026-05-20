# Configuration Firebase — SYSTEL

## 1. Créer un projet Firebase

1. Aller sur https://console.firebase.google.com/
2. Créer un projet
3. Activer Firestore Database
4. Activer Authentication > Anonymous
5. Créer une application Web

---

## 2. Copier la configuration Firebase

Dans Firebase :

Projet > Paramètres > Vos applications

Copier :

```js
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
```

---

## 3. Modifier le fichier

Fichier :

```txt
/js/firebase-config.js
```

Remplacer :

```js
const firebaseConfig = {
  ...
}
```

par votre configuration.

---

## 4. Règles Firestore (développement)

Dans Firestore > Rules :

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

ATTENTION :
Ces règles sont uniquement pour le développement.

---

## 5. Collections utilisées

Le système crée automatiquement :

- systel_users
- systel_engins
- systel_interventions
- systel_feuilles_garde
- systel_planning
- systel_bip_alertes
- systel_config

---

## 6. Important

Le système utilise maintenant :

```txt
Firebase temps réel uniquement
```

Le localStorage ne doit plus être utilisé comme source principale.

---

## 7. Corrections appliquées

- correction synchro feuilles de garde
- correction synchro engins
- suppression du rechargement localStorage cassé
- amélioration synchro temps réel Firebase

---

## 8. Hébergement conseillé

- Firebase Hosting
- Vercel
- Netlify

