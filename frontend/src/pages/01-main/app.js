/** @namespace Frontend/01-login */

import './style.css';
//const d= document;
import { Dropdown , Modal } from 'bootstrap/dist/js/bootstrap.bundle';
const { modalShow, getError, fillNavbar, genDropTypes, genSearchBox, genCards, watchCards } = require('../../js/helper.js');
//[].slice.call(d.querySelectorAll('.dropdown-toggle')).map(  dptoggle => new Dropdown(dptoggle) );
const IP2= "http://localhost:5001/driveshop5/us-central1/shop";
process.env.NODE_ENV === 'development' && firebase.initializeApp({
  apiKey: "AIzaSyALOIRaODueInxmXbrnkT6l8aQ5JWgE6Vc",
  authDomain: "driveshop5.firebaseapp.com",
  databaseURL: "https://driveshop5.firebaseio.com",
  projectId: "driveshop5",
  storageBucket: "driveshop5.appspot.com",
  messagingSenderId: "878066266054",
  appId: "1:878066266054:web:0a4e438129c19e070fccc7"
});
const fauth= firebase.auth;

const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );
  try {
    const res= await fetch(`${IP2}/APIshop/first/init`);
    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    const json= await res.json();
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, news, types }= json.data;

    genDropTypes( "drp_types" , types );
    genCards( "#sec_body1 div.row" , "tmp_card" , news );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 220 , err ) };
  try {
    fauth().onAuthStateChanged( user => {
      fillNavbar(
        user,
        'inp_search',
        'btn_search',
        'btn_wish',
        'btn_cart',
        'btn_login',
        'btn_logout',
        'lbl_account',
        'lbl_wish',
        'lbl_cart'
      );
      watchCards( 
        '#sec_body1 div.row' , 
        user && user.uid , 
        'lbl_wish' , 
        'lbl_cart' 
      );
    });
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 250 , err ) };
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();

/*
(()=>{
  class Modal2 extends Modal {
    constructor( element ){
      super( element );
      this.show2= this.show.bind(this);
      this.hide2= this.hide.bind(this);
    }
    show3( body="" , cb ){
      this._element.querySelector('.modal-body').textContent= body;
      this.show2();
      const $confirm= this._element.querySelector('.btn-outline-dark');
      $confirm.onclick= ()=>{
        cb();
        this.hide2();
      };
    }
  }
  new Modal2('.modal').show3( "algo", () => console.log('perro') );
})()
*/