/** @namespace Frontend/01-login */

import './style.css';

import { Modal } from 'bootstrap/dist/js/bootstrap.bundle';
const { modalShow, getError, fillNavbar, genDropTypes, genSearchBox, modalCookie, IP } = require('../../js/helper.js');


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

const getMXN= ( num= 0 ) =>{
  return num.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

const fillTable= ( spaceID="", template1ID="", template2ID="", list= [] , total= 0 )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template1= d.getElementById(template1ID).content;
  const $template2= d.getElementById(template2ID).content;

  list.forEach( (el,ind)=>{
    $template1.querySelector('th').textContent= ind+1; 
    $template1.querySelector('td:nth-child(2)').textContent= el.quantity;
    $template1.querySelector('td:nth-child(3)').textContent= el.custom.name;
    $template1.querySelector('td:nth-child(4)').textContent= el.amount;
    $template1.querySelector('td:nth-child(5)').textContent= getMXN( el.quantity * el.amount );

    $fragment.appendChild( d.importNode( $template1 , true ) );
  });
  $template2.querySelector('p').textContent= total;
  $fragment.appendChild( d.importNode( $template2 , true ) );

  $space.appendChild($fragment);
};

const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );

  try {
    const $lbl_title= document.getElementById('lbl_title');

    const res= await fetch(`${IP}/APIshop/central/get-same`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    if( urlp.get('fr') == "t" ) $lbl_title.textContent= `Categoria ${ types.filter( el=> el['type'] == urlp.get('cr') )[0]['name'] }`;
    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 220 , err ) };

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
    /*
    watchCards( 
      '#sec_body11 div.row' , 
      user && user.uid , 
      'lbl_wish' , 
      'lbl_cart' 
    );
    */
  });

  try {
    const res= await fetch(`${IP}/APIshop/check/resume?cid=${ urlp.get('cid') }`);
    const json= await res.json();
  
    if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `${ json.data }` };
    const { name , purl , products , total, tid }= json.data;

    d.getElementById('lbl_uname').textContent= name;
    d.getElementById('spc_uimg').setAttribute('src',purl);
    d.getElementById('lbl_transid').textContent= tid;
    fillTable( "#spc_table","tmp_row1" , "tmp_row2" , products , total );

  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 40 , err ) };

  modalCookie('.modal-cookie');
  
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();
