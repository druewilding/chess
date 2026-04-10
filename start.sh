#!/bin/bash
set -a
source .env
set +a

cat > js/firebase-config.js <<EOF
export default {
  apiKey: "$FIREBASE_API_KEY",
  authDomain: "$FIREBASE_AUTH_DOMAIN",
  databaseURL: "$FIREBASE_DATABASE_URL",
  projectId: "$FIREBASE_PROJECT_ID",
  storageBucket: "$FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "$FIREBASE_MESSAGING_SENDER_ID",
  appId: "$FIREBASE_APP_ID",
  vapidKey: "$FIREBASE_VAPID_KEY",
};
EOF

serve .
