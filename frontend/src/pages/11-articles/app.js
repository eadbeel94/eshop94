/** @namespace 11-articles */

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
 * @memberof 11-articles
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
 * @memberof 11-articles
 */
const fauth= firebase.auth;
/** 
 * The object document in an single variable
 * @constant {Object} d
 * @memberof 11-articles
 */
const d= document;
/** 
 * Separate params and save in this variable
 * @constant {URLSearchParams} urlp
 * @memberof 11-articles
 */
const urlp = new URLSearchParams(window.location.search);

if( urlp.get('fr') == "s" ) d.querySelector('#inp_search').value= urlp.get('cr');

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 11-articles/genBtnsPag */

/**
 * Code segment that show group button for pagination
 * @function genBtnsPag
 * @memberof 11-articles
 * @param {String} spaceID Space tag id where append buttons generated
 * @param {Number} max How many products exist
 * @param {Number} curr Current page number
 * @returns null
 */
const genBtnsPag= ( spaceID="", max=0 , curr=0 )=>{
  /** 
   * Get three parts and each part include an button group
   * @const {NodeListOf<Element>} $groups
   * @memberof 11-articles/genBtnsPag
   */
  const $groups= d.getElementById(spaceID).querySelectorAll('.btn-group');
  if( !isNaN( curr ) ){
    /** 
     * Set quantity elements for each page
     * @constant {Number} ppage
     * @memberof 11-articles/genBtnsPag
     */
    const ppage= 4;
    /** 
     * Get new max value
     * @constant {Number} newMax
     * @memberof 11-articles/genBtnsPag
     */
    const newMax= parseInt( max / ppage ) + 1;
    /**
     * Get new current page
     * @var {Number} currPage
     * @memberof 11-articles/genBtnsPag
     */
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

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 11-articles/showFirst */

/**
 * Code segment that execute querys backend and show this information in all page
 * @function showFirst
 * @memberof 11-articles
 * @returns null
 */
const showFirst= async ()=>{
  try {
    /**
     * DOM EL label title
     * @const {HTMLElement} $lbl_title
     * @memberof 11-articles/showFirst
     */
    const $lbl_title= document.getElementById('lbl_title');
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 11-articles/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 11-articles/showFirst
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /**
     * @const {Array<String>} names Array with all product string names
     * @const {Array<Object>} types Array with all categories names
     * @memberof 11-articles/showFirst
     */
    const { names, types }= json.data;
    /**
     * Filter all elements with same type selected previously
     * @const {Array<Object>} unique
     * @memberof 11-articles/showFirst
     */
    const unique= types.filter( el=> el['type'] == urlp.get('cr') );
    if( urlp.get('fr') == "t" && unique.length > 0 ) $lbl_title.textContent= `${ unique[0]['name'] } category`;
    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
    genBtnsPag( "sec_pages" , names.length , urlp.get('cr') );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 70 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 11-articles/showResult */

/**
 * Code segment that execute search request, category selection or page select previously for client, and show products founded
 * @function showResult
 * @memberof 11-articles
 * @returns null
 */
const showResult= async ()=>{
  try {
    /**
     * DOM EL section that show message not result
     * @const {HTMLElement} $sec_nresults
     * @memberof 11-articles/showResult
     */
    const $sec_nresults= document.getElementById('sec_nresults');
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 11-articles/showResult
     */
    const res= await fetch(`${IP}/APIshop/central/search-articles${window.location.search}`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 11-articles/showResult
     */
    const json= await res.json();
    
    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    
    /** 
     * Content all product founded
     * @const {Object} prods
     * @memberof 11-articles/showResult
     */
    const { prods }= json.data;

    if( !prods || 0 >= prods.length ){
      $sec_nresults.style.display= "unset";
    }else{
      $sec_nresults.style.display= "none";
      genCards( "#sec_body11 div.row" , "tmp_card" , prods );
    }
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 90 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 11-articles/watchUser */

/**
 * Code segment that detect user using firebase auth libraries
 * @function watchUser
 * @memberof 11-articles
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
      '#sec_body11 div.row' , 
      user && user.uid , 
      'lbl_wish' , 
      'lbl_cart' 
    );
  });
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 11-articles/main */

/**
 * Code segment that execute when the page end load
 * @function main
 * @memberof 11-articles
 * @returns null
 */
const main= async()=>{
  await showFirst();
  await showResult();
  watchUser();
  modalCookie('.modal-cookie');
};

/* ------------------------------------------------------------------------------------------------------------------------ */

window.onload= main;
/**
 * If user press login then redirect google page sign in 
 * @callback $btn_login-onclick 
 * @memberof 11-articles
 */
d.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
/**
 * If user press logout then erase current user session
 * @callback $btn_logout-onclick 
 * @memberof 11-articles
 */
d.getElementById('btn_logout').onclick= () => fauth().signOut();
