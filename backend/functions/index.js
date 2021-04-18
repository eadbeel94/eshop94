const { https } = require('firebase-functions');
const { initializeApp , credential } = require('firebase-admin');

if (process.env.NODE_ENV !== 'production') {
  console.log('development');
  const serviceAccount = require("./src/keys/driveshop5-firebase-adminsdk-1x7t4-97fb0a9cd5.json"); //Call secret values
  const { databaseURL , storageBucket } = require("./src/keys/main.json");
  initializeApp({ credential: credential.cert(serviceAccount), databaseURL, storageBucket });
}else{
  console.log('production');
  initializeApp();
};

exports.shop = https.onRequest( require('./src/main') );