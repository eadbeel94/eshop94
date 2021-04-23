/** @namespace Frontend/01-login */

import './style.css';

import { Modal } from 'bootstrap/dist/js/bootstrap.bundle';
const { modalShow, getError, fillNavbar, genDropTypes, genSearchBox, genCards, watchCards, IP } = require('../../js/helper.js');

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
const d= document;
const urlp = new URLSearchParams(window.location.search);

if( urlp.get('fr') == "s" ) inp_search.value= urlp.get('cr');
//if( urlp.get('fr') == "s" ) $lbl_title.textContent= "Articulos encontrados";
const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );

  try {
    const $lbl_title= document.getElementById('lbl_title');

    const res= await fetch(`${IP}/APIshop/first/common`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    if( urlp.get('fr') == "t" ) $lbl_title.textContent= `Categoria ${ types.filter( el=> el['type'] == urlp.get('cr') )[0]['name'] }`;
    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 220 , err ) };

  try {
    const $sec_nresults= document.getElementById('sec_nresults');

    const res= await fetch(`${IP}/APIshop/first/articles${window.location.search}`);
    const json= await res.json();
    
    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { prods }= json.data;

    if( !prods || 0 >= prods.length ){
      $sec_nresults.style.display= "unset";
    }else{
      $sec_nresults.style.display= "none";
      genCards( "#sec_body11 div.row" , "tmp_card" , prods );
    }
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 40 , err ) };

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
      '#sec_body11 div.row' , 
      user && user.uid , 
      'lbl_wish' , 
      'lbl_cart' 
    );
  });
  
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();
