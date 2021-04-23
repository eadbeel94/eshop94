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

d.getElementById('btn_wish').style.display= "none";
const $sec_nresults= document.getElementById('sec_nresults');
const $lbl_title= document.getElementById('lbl_title');

const genCards2= ( spaceID="" , templateID="" , list=[] )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template= d.getElementById(templateID).content;
  list.forEach( el =>{
    const enable= el.clas.toUpperCase() == "DISPONIBLE" || el.clas.toUpperCase() == "PREVENTA";

    $template.querySelector('div').dataset.id= el.id;
    $template.querySelector('img').setAttribute('src',el.purl);
    $template.querySelector('.crd-label').textContent= el.clas;
    $template.querySelector('.crd-link').textContent= el.mname;
    $template.querySelector('.crd-link').setAttribute('href',`/pages/product/?pid=${ el.id }`);
    $template.querySelector('.crd-cost').textContent = `$${el.cost},00`; 
    $template.querySelector('.card-body p').textContent = el.desc || el.mname; 
    $template.querySelector('.crd-bottom').textContent = el.ver; 
    $template.querySelector('.btn-success').dataset.id=       enable ? el.id   : "";
    $template.querySelector('.btn-success').style.visibility= enable ? "unset" : "hidden";
    $template.querySelector('.btn-success').disabled= !enable;
    $template.querySelector('.btn-success').dataset.oper=     enable ? "plus"  : "";
    $template.querySelector('.btn-success i').dataset.id=     enable ? el.id   : "" ;
    $template.querySelector('.btn-success i').dataset.oper=   enable ? "plus"  : "";
    $template.querySelector('.btn-danger').dataset.id= el.id;
    $template.querySelector('.btn-danger').dataset.oper= "minus";
    $template.querySelector('.btn-danger i').dataset.id= el.id;
    $template.querySelector('.btn-danger i').dataset.oper= "minus";

    $fragment.appendChild( d.importNode( $template , true ) )
  })
  $space.appendChild($fragment);
};

const watchCards2= ( spaceID="" , uid )=>{ 

  const $space= d.querySelector(spaceID);

  $space.onclick= async (ev)=>{
    if( ev.target.matches('button[data-id]') || ev.target.matches('i[data-id]') ){
      try {
        const $mainCard= $space.querySelector(`div[data-id="${ ev.target.dataset.id }"]`  );

        if( ev.target.matches('[data-oper="plus"]') ){
          const info= { 
            "id": uid, 
            "prod": ev.target.dataset.id
          };
          const res= await fetch(`${IP}/APIshop/cart/move-cli-cart`,{
            method: 'PUT',
            body: JSON.stringify(info),
            headers:{ 'Content-Type': 'application/json' } 
          });
          const json= await res.json();
    
          if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
          if( !json.status ) throw { status: json.status , message: `${ json.data }` };
          
          console.log( json.data );
          d.getElementById('lbl_cart').textContent= json.data.cart;
          $mainCard.outerHTML= "";

        }
        if( ev.target.matches('[data-oper="minus"]') ){
  
          const info= { 
            "id": uid, 
            "prod": ev.target.dataset.id, 
            "oper": "mod",
            "type": "wish",
            "qty": 0
          };
          const res= await fetch(`${IP}/APIshop/cart/mod-cli-cart`,{
            method: 'PUT',
            body: JSON.stringify(info),
            headers:{ 'Content-Type': 'application/json' } 
          });
          const json= await res.json();
    
          if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
          if( !json.status ) throw { status: json.status , message: `${ json.data }` };
          $mainCard.outerHTML= "";
        }
        if(0 >= $space.querySelectorAll('[data-id]').length){
          $sec_nresults.style.display= "unset";
          $lbl_title.style.display= "none";
        } 
          
      } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 200 , err ) };

    }
  }
};

const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );

  try {
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 220 , err ) };

  fauth().onAuthStateChanged( async user => {
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

    try {
      const res= await fetch(`${IP}/APIshop/cart/get-cli-cart?id=${ user.uid }&type=wish`);
      const json= await res.json();
  
      if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
      if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
      const { wish }= json.data;    
      
      if( !wish || 0 >= wish.length ){
        $sec_nresults.style.display= "unset";
        $lbl_title.style.display= "none";
      }else{
        $sec_nresults.style.display= "none";
        $lbl_title.style.display= "unset"
        genCards2( "#sec_products" , "tmp_card2" , wish );
        watchCards2( "#sec_products" , user.uid );
      }
    } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 250 , err ) };

  });

  modalCookie('.modal-cookie');
  
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();