/** @namespace 16-resume */

import './style.css';

/**
 * Call local methods from helper
 * @typedef {object} helper
 * @property {Function} modalShow show an Bootstrap modal in fill HMTL in specific area
 * @property {Function} getError get string from error object
 * @property {Function} fillNavbar fill Navbar string base on client information
 * @property {Function} genDropTypes fill dropdown options with categories name
 * @property {Function} genSearchBox fill Searchbox space with links that match with user search
 * @property {Function} modalCookie show an Boostrap modal in un message cookie accept
 * @property {Function} getMXN convert count value in other notation
 * @property {Boolean} prod variable that stablish if project are development or production
 * @property {String} IP varibale that stablish url for fetch request.
 * @memberof 16-resume
 */
const { 
  modalShow, 
  getError, 
  fillNavbar, 
  genDropTypes, 
  genSearchBox, 
  modalCookie, 
  getMXN, 
  prod,
  IP 
} = require('../../js/helper.js');

!prod && firebase.initializeApp(require('../../js/firebase.init.json'));
/** 
 * Inlcude properties and methods of firebase authorization librari
 * @const {Object} fauth
 * @memberof 16-resume
 */
const fauth= firebase.auth;
/** 
 * The object document in an single variable
 * @constant {Object} d
 * @memberof 16-resume
 */
const d= document;
/** 
 * Separate params and save in this variable
 * @constant {URLSearchParams} urlp
 * @memberof 16-resume
 */
const urlp = new URLSearchParams(window.location.search);

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 16-resume/fillTable */

/**
 * Code segment that fill sumary table products after pay process
 * @function fillTable
 * @memberof 16-resume
 * @param {String} spaceID Space tag id where append table content
 * @param {String} template1ID tag id where get HTML common row
 * @param {String} template2ID tag id where get HTML subtotal row
 * @param {String} template3ID tag id where get HTML total row
 * @param {Array<Object>} list All products in a object's group
 * @param {Boolean} ship If user required ship method
 * @param {Number} total value summary products
 */
const fillTable= ( spaceID="", template1ID="", template2ID="", template3ID="", list= [], ship=false , total= 0 )=>{
  /**
   * DOM EL where fill all HTML data
   * @const {HTMLElement} $space
   * @memberof 16-resume/fillTable
   */
  const $space= d.querySelector(spaceID);
  /**
   * DOM EL that process all HTML data in memory
   * @const {DocumentFragment} $fragment
   * @memberof 16-resume/fillTable
   */
  const $fragment= d.createDocumentFragment();
  /**
   * DOM EL template where get first row HTML
   * @const {HTMLElement} $template1
   * @memberof 16-resume/fillTable
   */
  const $template1= d.getElementById(template1ID).content;
  /**
   * DOM EL template where get subtotal row HTML
   * @const {HTMLElement} $template1
   * @memberof 16-resume/fillTable
   */
  const $template2= d.getElementById(template2ID).content;
  /**
   * DOM EL template where get total row HTML
   * @const {HTMLElement} $template1
   * @memberof 16-resume/fillTable
   */
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

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 16-resume/showFirst */

/**
 * Code segment that execute querys backend and show this information in all page
 * @function showFirst
 * @memberof 16-resume
 * @returns null
 */
const showFirst= async ()=>{
  try {
    /**
     * DOM EL label title
     * @const {HTMLElement} $lbl_title
     * @memberof 16-resume/showFirst
     */
    const $lbl_title= document.getElementById('lbl_title');
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 16-resume/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 16-resume/showFirst
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /**
     * @const {Array<String>} names Array with all product string names
     * @const {Array<Object>} types Array with all categories names
     * @memberof 16-resume/showFirst
     */
    const { names, types }= json.data;

    if( urlp.get('fr') == "t" ) $lbl_title.textContent= `Categoria ${ types.filter( el=> el['type'] == urlp.get('cr') )[0]['name'] }`;
    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 60 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 16-resume/watchUser */

/**
 * Code segment that detect user using firebase auth libraries
 * @function watchUser
 * @memberof 16-resume
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
/** @namespace 16-resume/genTable */

/**
 * When page load send request to backend and get list of products, after this fill a table
 * @function genTable
 * @memberof 16-resume
 * @returns null
 */
const genTable= async ()=>{
  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 16-resume/genTable
     */
    const res= await fetch(`${IP}/APIshop/check/resume?type=${ urlp.get('type') }&id=${ urlp.get('id') }`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 16-resume/genTable
     */
    const json= await res.json();
  
    if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `${ json.data }` };
    /**
     * @const {String} name user name
     * @const {String} purl public url user
     * @const {Array<Object>} products All products in a object's group
     * @const {Boolean} ship if user required ship or not
     * @const {Number} total How many summary of all products
     * @const {String} tid transaction id
     * @memberof 16-resume/genTable
     */
    const { name , purl , products , ship , total, tid }= json.data;

    d.getElementById('lbl_uname').textContent= name;
    d.getElementById('spc_uimg').setAttribute('src',purl);
    d.getElementById('lbl_transid').textContent= tid;
    fillTable( "#spc_table","tmp_row1" , "tmp_row2" , "tmp_row3" , products , ship , total );

  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 90 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 16-resume/main */

/**
 * Code segment that execute when the page end load
 * @function main
 * @memberof 16-resume
 * @returns null
 */
const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );
  await showFirst();
  watchUser();
  genTable();
  modalCookie('.modal-cookie');
  //setTimeout(() => modalHide(), 500);
};

/* ------------------------------------------------------------------------------------------------------------------------ */

window.onload= main;
/**
 * If user press login then redirect google page sign in 
 * @callback $btn_login-onclick 
 * @memberof 16-resume
 */
d.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
/**
 * If user press logout then erase current user session
 * @callback $btn_logout-onclick 
 * @memberof 16-resume
 */
d.getElementById('btn_logout').onclick= () => fauth().signOut();
