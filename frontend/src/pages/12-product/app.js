/** @namespace Frontend/01-login */

import './style.css';

import { Modal } from 'bootstrap/dist/js/bootstrap.bundle';
const { modalShow, getError, fillNavbar, genDropTypes, genSearchBox, IP } = require('../../js/helper.js');

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

const genCards2= ( spaceID="" , templateID="" , el={} )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template= d.getElementById(templateID).content;

  $template.querySelector('img').setAttribute('src',el.purl);
  $template.querySelector('.card-title').textContent= el.mname;
  $template.querySelector('.crd-label').textContent= el.clas;
  $template.querySelector('.crd-edition').textContent= "Edicion: " + el.ver;
  $template.querySelector('.crd-year').textContent= "Año: " + el.year;
  $template.querySelector('.crd-cost').textContent= "$ " + getMXN(el.cost);
  $template.querySelector('.crd-desc').textContent= el.desc || el.mname;
  $template.querySelector('.crd-disp').textContent= "Disponible: " + el.qty;

  $template.querySelector('.btn-success').dataset.oper= "plus";
  $template.querySelector('.btn-success i').dataset.oper= "plus";
  $template.querySelector('.btn-danger').dataset.oper= "minus";
  $template.querySelector('.btn-danger i').dataset.oper= "minus";
  $template.querySelector('.btn-outline-light2').dataset.oper= "wish";
  $template.querySelector('.btn-outline-light2 i').dataset.oper= "wish";
  $template.querySelector('.btn-outline-info').dataset.oper= "cart";
  $template.querySelector('.btn-outline-info i').dataset.oper= "cart";

  $fragment.appendChild( d.importNode( $template , true ) )
  $space.appendChild($fragment);
};

const watchCards2= ( spaceID="" , uid )=>{ 
  const $space= d.querySelector(spaceID);
  const max= parseInt( $space.querySelector('.crd-disp').textContent.replace('Disponible:',"") );

  $space.onchange= (ev)=>{
    if( ev.target.matches('input') ){
      if( ev.target.value > max ) ev.target.value= max;
      if( 1 >= ev.target.value ) ev.target.value= 1;
    }
  }
  $space.onclick= async (ev)=>{
    const $input= $space.querySelector('input');
    if( ev.target.matches('button') || ev.target.matches('button *') ){
      try {

        if( ev.target.matches('[data-oper="plus"]') ){
          if( $input.value > max ) $input.value= max;
          if( max > $input.value ) $input.value++;
        }
        if( ev.target.matches('[data-oper="minus"]') ){
          if( 1 >= $input.value ) ev.target.value= 1;
          if( $input.value > 1 ) $input.value--;
        }
        if( ev.target.matches('[data-oper="wish"]') ){
          const send= { 
            "id": uid, 
            "prod": urlp.get('pid'),
            "type": "wish"  
          };
          const res= await fetch(`${IP}/APIshop/first/addCart`,{
            method: 'POST',
            body: JSON.stringify(send),
            headers:{ 'Content-Type': 'application/json'  } 
          });
          const json= await res.json();
  
          if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
          if( !json.status ) throw { status: json.status , message: `${ json.data }` };

          const { wish }= json.data;
          d.getElementById('lbl_wish').textContent= wish;
        }
        if( ev.target.matches('[data-oper="cart"]') ){
  
          const send= { 
            "id": uid, 
            "prod": urlp.get('pid'),
            "qty": $input.value
          };
          const res= await fetch(`${IP}/APIshop/first/add2Cart`,{
            method: 'PUT',
            body: JSON.stringify(send),
            headers:{ 'Content-Type': 'application/json' } 
          });
          const json= await res.json();
    
          if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
          if( !json.status ) throw { status: json.status , message: `${ json.data }` };
          
          const { cart }= json.data;
          d.getElementById('lbl_wish').textContent= cart;
        }
      } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 220 , err ) };
    }
  }
  
};

const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );

  try {
    const res= await fetch(`${IP}/APIshop/first/common`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 220 , err ) };

  try {
    const res= await fetch(`${IP}/APIshop/first/getArticle${ window.location.search }`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { prod }= json.data;

    genCards2("#sec_body12 div","tmp_card2", prod);
    
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
    watchCards2("#sec_body12 div", user.uid)
  });
  
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();
