/** @namespace 01-main */

import './style.css';

/**
 * Call local methods from helper
 * @typedef {object} helper
 * @property {Function} modalShow show an Bootstrap modal in fill HMTL in specific area
 * @property {Function} getError get string from error object
 * @property {Function} fillNavbar fill Navbar string base on client information
 * @property {Function} genDropTypes fill dropdown options with categories name
 * @property {Function} genSearchBox fill Searchbox space with links that match with user search
 * @property {Function} genCards create cards for each product
 * @property {Function} watchCards watch user click into card zone
 * @property {Function} modalCookie show an Boostrap modal in un message cookie accept
 * @property {Boolean} prod variable that stablish if project are development or production
 * @property {String} IP varibale that stablish url for fetch request.
 * @memberof 01-main
 */
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

!prod && firebase.initializeApp(require('../../js/firebase.init.json'));
/** 
 * Inlcude properties and methods of firebase authorization librari
 * @const {Object} fauth
 * @memberof 01-main
 */
const fauth= firebase.auth; 
/** 
 * The object document in an single variable
 * @constant {Object} d
 * @memberof 01-main
 */
const d= document;

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 01-main/btnLinks */

/**
 * Buttons group that each btn redirect to other page
 * @function btnLinks
 * @memberof 01-main
 * @returns null
 */
const btnLinks= ()=>{
  /** 
   * Group of buttons into clasify section
   * @type {NodeListOf<Element>}
   * @memberof 01-main/btnLinks
   */
  const $btns= d.querySelectorAll('#sec_clasify .btn');
  //$btns[0].onclick= () => window.open(`${ prod ? "/projects/eshop94" : "" }/pages/articles/?fr=c&cr=preventa`,'_self');
  //$btns[1].onclick= () => window.open(`${ prod ? "/projects/eshop94" : "" }/pages/articles/?fr=t&cr=funkpop`,'_self');
  //$btns[2].onclick= () => window.open('#','_self');
  $btns[0].onclick= () => window.open('#','_self');
  $btns[1].onclick= () => window.open('#','_self');
  $btns[2].onclick= () => window.open('#','_self');
  $btns[3].onclick= () => window.open(`${ prod ? "/projects/eshop94" : "" }/pages/articles/?fr=p&cr=1`,'_self');
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 01-main/showFirst */

/**
 * Code segment that execute querys backend and show this information in all page
 * @function showFirst
 * @memberof 01-main
 * @returns null
 */
const showFirst= async()=>{
  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 01-main/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 01-main/showFirst
     */
    const json= await res.json();
    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /**
     * @const {Array<String>} names Array with all product string names
     * @const {Array<Object>} types Array with all categories names
     * @memberof 01-main/showFirst
     */
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 30 , err ) };

  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 01-main/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-news`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 01-main/showFirst
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /** 
     * Content all product that include attribute new in true
     * @const {Object} news
     * @memberof 01-main/showFirst
     */
    const { news }= json.data;

    genCards( "#sec_body1 div.row" , "tmp_card" , news );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 40 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 01-main/watchUser */

/**
 * Code segment that detect user using firebase auth libraries
 * @function watchUser
 * @memberof 01-main
 * @returns null
 */
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

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 01-main/main */

/**
 * Code segment that execute when the page end load
 * @function main
 * @memberof 01-main
 * @returns null
 */
const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );
  btnLinks();
  showFirst();
  watchUser();
  modalCookie('.modal-cookie');
  //setTimeout(() => modalHide(), 500);
};

/* ------------------------------------------------------------------------------------------------------------------------ */

window.onload= main;
/**
 * If user press login then redirect google page sign in 
 * @callback $btn_login-onclick 
 * @memberof 01-main
 */
d.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
/**
 * If user press logout then erase current user session
 * @callback $btn_logout-onclick 
 * @memberof 01-main
 */
d.getElementById('btn_logout').onclick= () => fauth().signOut();