/** @namespace 08-privacity */

import './style.css';

/**
 * Call local methods from helper
 * @typedef {object} helper
 * @property {Function} modalShow show an Bootstrap modal in fill HMTL in specific area
 * @property {Function} getError get string from error object
 * @property {Function} fillNavbar fill Navbar string base on client information
 * @property {Function} genDropTypes fill dropdown options with categories name
 * @property {Function} genSearchBox fill Searchbox space with links that match with user search
 * @property {String} IP varibale that stablish url for fetch request.
 * @property {Boolean} prod variable that stablish if project are development or production
 * @memberof 08-privacity
 */
const { 
  modalShow, 
  getError, 
  fillNavbar,
  genDropTypes, 
  genSearchBox, 
  prod,
  IP 
} = require('../../js/helper.js');

!prod && firebase.initializeApp(require('../../js/firebase.init.json'));
/** 
 * Inlcude properties and methods of firebase authorization librari
 * @const {Object} fauth
 * @memberof 08-privacity
 */
const fauth= firebase.auth;

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 08-privacity/showFirst */

/**
 * Code segment that execute querys backend and show this information in all page
 * @function showFirst
 * @memberof 08-privacity
 * @returns null
 */
const showFirst= async()=>{
  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 08-privacity/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 08-privacity/showFirst
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /**
     * @const {Array<String>} names Array with all product string names
     * @const {Array<Object>} types Array with all categories names
     * @memberof 08-privacity/showFirst
     */
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 30 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 08-privacity/watchUser */

/**
 * Code segment that detect user using firebase auth libraries
 * @function watchUser
 * @memberof 08-privacity
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
  });
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 08-privacity/main */

/**
 * Code segment that execute when the page end load
 * @function main
 * @memberof 08-privacity
 * @returns null
 */
const main= async()=>{
  showFirst();
  watchUser();
  //modalCookie('.modal-cookie');
};

/* ------------------------------------------------------------------------------------------------------------------------ */

window.onload= main;
/**
 * If user press login then redirect google page sign in 
 * @callback $btn_login-onclick 
 * @memberof 08-privacity
 */
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
/**
 * If user press logout then erase current user session
 * @callback $btn_logout-onclick 
 * @memberof 08-privacity
 */
document.getElementById('btn_logout').onclick= () => fauth().signOut();
