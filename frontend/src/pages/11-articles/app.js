/** @namespace Frontend/01-login */

import './style.css';
const { 
  modalShow, 
  getError, 
  fillNavbar, 
  genDropTypes, 
  genSearchBox, 
  genCards,
  watchCards, 
  modalCookie, 
  IP 
} = require('../../js/helper.js');

process.env.NODE_ENV === 'development' && firebase.initializeApp(require('../../js/firebase.init.json'));
const fauth= firebase.auth;
const d= document;
const urlp = new URLSearchParams(window.location.search);

if( urlp.get('fr') == "s" ) inp_search.value= urlp.get('cr');

const genBtnsPag= ( spaceID="", max=0 , curr=0 )=>{
  const $groups= d.getElementById(spaceID).querySelectorAll('.btn-group');
  if( !isNaN( curr ) ){
    const ppage= 4;
    const newMax= parseInt( max / ppage ) + 1;

    let currPage= isNaN( curr ) ? 1 : Math.abs( curr );
    currPage= 0 >= currPage ? 1 : currPage; 
    currPage= currPage > newMax ? newMax : currPage;
  
    const $button= d.createElement('a');
    $button.classList.add('btn');
    $button.classList.add('btn-outline-secondary');
  
    $button.textContent= "Atras";
    $button.setAttribute('href',`/projects/eshop94/pages/articles/?fr=p&cr=${ currPage-1 }`)
    currPage > 1 && $groups[0].appendChild( d.importNode( $button , true ) );
    $button.setAttribute('href',`/projects/eshop94/pages/articles/?fr=p&cr=${ currPage+1 }`)
    $button.textContent= "Siguiente";
    newMax > currPage && $groups[2].appendChild( d.importNode( $button , true ) );
  
    for (let i = 1; i < newMax + 1; i++) {
      const $button2= d.createElement('a');
      $button2.classList.add('btn');
      $button2.setAttribute('href',`/projects/eshop94/pages/articles/?fr=p&cr=${ i }`)
      $button2.classList.add( (i) == currPage ? "btn-secondary" : "btn-outline-secondary" );
      $button2.textContent= i;
      $groups[1].appendChild( d.importNode( $button2 , true ) );
    }
  }
};

const showFirst= async ()=>{
  try {
    const $lbl_title= document.getElementById('lbl_title');

    const res= await fetch(`${IP}/APIshop/central/get-same`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    const unique= types.filter( el=> el['type'] == urlp.get('cr') );
    if( urlp.get('fr') == "t" && unique.length > 0 ) $lbl_title.textContent= `${ unique[0]['name'] } category`;
    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
    genBtnsPag( "sec_pages" , names.length , urlp.get('cr') );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 70 , err ) };
};

const showResult= async ()=>{
  try {
    const $sec_nresults= document.getElementById('sec_nresults');

    const res= await fetch(`${IP}/APIshop/central/search-articles${window.location.search}`);
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
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 90 , err ) };
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
    watchCards( 
      '#sec_body11 div.row' , 
      user && user.uid , 
      'lbl_wish' , 
      'lbl_cart' 
    );
  });
};

const main= async()=>{
  await showFirst();
  await showResult();
  watchUser();
  modalCookie('.modal-cookie');
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();
