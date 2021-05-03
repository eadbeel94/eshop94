/** @namespace Frontend/01-login */
//import { Modal } from 'bootstrap/dist/js/bootstrap.bundle';
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
  prod, 
  IP 
} = require('../../js/helper.js');

process.env.NODE_ENV === 'development' && firebase.initializeApp(require('../../js/firebase.init.json'));
const fauth= firebase.auth;
const d= document;

const btnLinks= ()=>{
  const $btns= d.querySelectorAll('#sec_clasify .btn');
  //$btns[0].onclick= () => window.open(`${ prod ? "/projects/eshop94" : "" }/pages/articles/?fr=c&cr=preventa`,'_self');
  //$btns[1].onclick= () => window.open(`${ prod ? "/projects/eshop94" : "" }/pages/articles/?fr=t&cr=funkpop`,'_self');
  //$btns[2].onclick= () => window.open('#','_self');
  $btns[0].onclick= () => window.open('#','_self');
  $btns[1].onclick= () => window.open('#','_self');
  $btns[2].onclick= () => window.open('#','_self');
  $btns[3].onclick= () => window.open(`${ prod ? "/projects/eshop94" : "" }/pages/articles/?fr=p&cr=1`,'_self');
};

const showFirst= async()=>{
  try {
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    const json= await res.json();
    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 30 , err ) };

  try {
    const res= await fetch(`${IP}/APIshop/central/get-news`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { news }= json.data;

    genCards( "#sec_body1 div.row" , "tmp_card" , news );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 40 , err ) };
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
      '#sec_body1 div.row' , 
      user && user.uid , 
      'lbl_wish' , 
      'lbl_cart' 
    );
  });
};

const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );
  btnLinks();
  showFirst();
  watchUser();
  modalCookie('.modal-cookie');
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();