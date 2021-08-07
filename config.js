import *as firebase from 'firebase'

const firebaseConfig = {
    apiKey: "AIzaSyDNfuo1ymp3FQmTbSnATo-zWVVGfyX7qIg",
    authDomain: "wily-f4da0.firebaseapp.com",
    projectId: "wily-f4da0",
    storageBucket: "wily-f4da0.appspot.com",
    messagingSenderId: "812940587615",
    appId: "1:812940587615:web:54b60b70ef47a7d1d4e1ea"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  export default firebase.firestore()