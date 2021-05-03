/** @namespace Frontend/01-login */

import './style.css';
const { modalShow, getError, fillNavbar, genDropTypes, genSearchBox, modalCookie, getMXN, IP } = require('../../js/helper.js');

process.env.NODE_ENV === 'development' && firebase.initializeApp(require('../../js/firebase.init.json'));
const fauth= firebase.auth;
const d= document;
const urlp = new URLSearchParams(window.location.search);

const fillTable= ( spaceID="", template1ID="", template2ID="", template3ID="", list= [], ship=false , total= 0 )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template1= d.getElementById(template1ID).content;
  const $template2= d.getElementById(template2ID).content;
  const $template3= d.getElementById(template3ID).content;

  list.forEach( (el,ind)=>{
    $template1.querySelector('th').textContent= ind+1; 
    $template1.querySelector('td:nth-child(2)').textContent= el.quantity;
    $template1.querySelector('td:nth-child(3)').textContent= el.title;
    $template1.querySelector('td:nth-child(4)').textContent= el.unit_price;
    $template1.querySelector('td:nth-child(5)').textContent= getMXN( el.quantity * el.unit_price );

    $fragment.appendChild( d.importNode( $template1 , true ) );
  });

  ship && ($template2.querySelector('p').textContent= getMXN(ship) );
  ship && ($fragment.appendChild( d.importNode( $template2 , true ) ));

  $template3.querySelector('p').textContent= total;
  $fragment.appendChild( d.importNode( $template3 , true ) );

  $space.appendChild($fragment);
};

const showFirst= async ()=>{
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
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 60 , err ) };
};

const watchUser= ()=>{
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
  });
};

const genTable= async ()=>{
  try {
    const res= await fetch(`${IP}/APIshop/check/resume?type=${ urlp.get('type') }&id=${ urlp.get('id') }`);
    const json= await res.json();
  
    if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `${ json.data }` };
    const { name , purl , products , ship , total, tid }= json.data;

    d.getElementById('lbl_uname').textContent= name;
    d.getElementById('spc_uimg').setAttribute('src',purl);
    d.getElementById('lbl_transid').textContent= tid;
    fillTable( "#spc_table","tmp_row1" , "tmp_row2" , "tmp_row3" , products , ship , total );

  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 90 , err ) };
}

const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );
  await showFirst();
  watchUser();
  genTable();
  modalCookie('.modal-cookie');
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();
