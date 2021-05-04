/** @namespace 12-product */

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
 * @memberof 12-product
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
 * @memberof 12-product
 */
const fauth= firebase.auth;
/** 
 * The object document in an single variable
 * @constant {Object} d
 * @memberof 12-product
 */
const d= document;
/** 
 * Separate params and save in this variable
 * @constant {URLSearchParams} urlp
 * @memberof 12-product
 */
const urlp = new URLSearchParams(window.location.search);

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 12-product/genCards2 */

/**
 * Create an Bootrap card that content product information
 * @function genCards2
 * @memberof 12-product
 * @param {String} spaceID Space tag id where append card with product info
 * @param {String} templateID tag id where get HTML Card body
 * @param {Object} el Element's list whit all product information
 * @returns null
 */
const genCards2= ( spaceID="" , templateID="" , el={} )=>{
  /**
   * DOM EL where fill all HTML data
   * @const {HTMLElement} $space
   * @memberof 12-product/genCards2
   */
  const $space= d.querySelector(spaceID);
  /**
   * DOM EL that process all HTML data in memory
   * @const {DocumentFragment} $fragment
   * @memberof 12-product/genCards2
   */
  const $fragment= d.createDocumentFragment();
  /**
   * DOM EL template where get all HTML data
   * @const {HTMLElement} $template
   * @memberof 12-product/genCards2
   */
  const $template= d.getElementById(templateID).content;

  /**
    * Variable that check if property clas include word AVAILABLE
    * @const {Boolean} enable
    * @memberof 12-product/genCards2
    */
  const enable= el.clas.toUpperCase() == "AVAILABLE";
  $template.querySelector('img').setAttribute('src',el.purl);
  $template.querySelector('.card-title').textContent= el.mname;
  $template.querySelector('.crd-label').textContent= el.clas;
  $template.querySelector('.crd-edition').textContent= "Edition: " + el.ver;
  $template.querySelector('.crd-year').textContent= "Year: " + el.year;
  $template.querySelector('.crd-cost').textContent= "$ " + getMXN(el.cost);
  $template.querySelector('.crd-desc').textContent= el.desc || el.mname;
  $template.querySelector('.crd-disp').textContent=  `Stock: ${ enable ? el.qty : "0" }`;

  $template.querySelector('.btn-success').dataset.oper= "plus";
  $template.querySelector('.btn-success i').dataset.oper= "plus";
  $template.querySelector('.btn-danger').dataset.oper= "minus";
  $template.querySelector('.btn-danger i').dataset.oper= "minus";
  $template.querySelector('.btn-outline-light2').dataset.oper= "wish";
  $template.querySelector('.btn-outline-light2 i').dataset.oper= "wish";
  $template.querySelector('.btn-info').dataset.oper= enable ? "cart" : "";
  $template.querySelector('.btn-info').style.display= enable ? "unset" : "none";
  $template.querySelector('.btn-info i').dataset.oper= enable ? "cart" : "";
  
  $fragment.appendChild( d.importNode( $template , true ) )
  $space.appendChild($fragment);
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 12-product/watchCards2 */

/**
 * Watch any click enter by client into card zone
 * @function watchCards2
 * @memberof 12-product
 * @param {String} spaceID Space tag id where are card
 * @param {String} uid User unique id
 * @returns null
 */
const watchCards2= ( spaceID="" , uid )=>{ 
   /**
   * DOM EL where check user changes
   * @const {HTMLElement} $space
   * @memberof 12-product/watchCards2
   */
  const $space= d.querySelector(spaceID);
  if( $space.querySelector('div.row') ){
    /**
     * Get max elements in stock
     * @const {Number} max
     * @memberof 12-product/watchCards2
     */
    const max= parseInt( $space.querySelector('.crd-disp').textContent.replace('Stock:',"") );
    /**
     * If user modify count into input text then change this value but with limit
     * @callback $space-onchange 
     * @memberof 12-product/watchCards2
     */
    $space.onchange= (ev)=>{
      if( ev.target.matches('input') ){
        if( ev.target.value > max ) ev.target.value= max;
        if( 1 >= ev.target.value ) ev.target.value= 1;
      }
    };
    /**
     * If user press any button then change count value or modify wish list or modify cart list
     * @callback $space-onclick 
     * @memberof 12-product/watchCards2
     */
    $space.onclick= async (ev)=>{
      /**
       * DOM EL counter input text number
       * @const {HTMLElement} $input
       * @memberof 12-product/watchCards2
       */
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
            /**
             * Include uid, prod id and type list where user wanna save this product
             * @const {Object} send
             * @memberof 12-product/watchCards2
             */
            const send= { 
              "id": uid, 
              "prod": urlp.get('pid'),
              "type": "wish"  
            };
            /**
             * Object that include information get from backend
             * @const {Object} res
             * @memberof 12-product/watchCards2
             */
            const res= await fetch(`${IP}/APIshop/cart/add-once-cli-cart`,{
              method: 'POST',
              body: JSON.stringify(send),
              headers:{ 'Content-Type': 'application/json'  } 
            });
            /**
             * Same information from backend in json format
             * @const {Object} json
             * @memberof 12-product/watchCards2
             */
            const json= await res.json();
    
            if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
            if( !json.status ) throw { status: json.status , message: `${ json.data }` };
  
            /** 
             * Return counter wish list from backend information
             * @const {Number} wish
             * @memberof 12-product/watchCards2
             */
            const { wish }= json.data;
            d.getElementById('lbl_wish').textContent= wish;
          }
          if( ev.target.matches('[data-oper="cart"]') ){
            /**
             * Include uid, prod id and type list where user wanna save this product
             * @const {Object} send
             * @memberof 12-product/watchCards2
             */
            const send= { 
              "id": uid, 
              "prod": urlp.get('pid'),
              "qty": $input.value
            };
            /**
             * Object that include information get from backend
             * @const {Object} res
             * @memberof 12-product/watchCards2
             */
            const res= await fetch(`${IP}/APIshop/cart/add-more-cli-cart`,{
              method: 'PUT',
              body: JSON.stringify(send),
              headers:{ 'Content-Type': 'application/json' } 
            });
            /**
             * Same information from backend in json format
             * @const {Object} json
             * @memberof 12-product/watchCards2
             */
            const json= await res.json();
      
            if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
            if( !json.status ) throw { status: json.status , message: `${ json.data }` };
            
            /** 
             * Return counter cart list from backend information
             * @const {Number} cart
             * @memberof 12-product/watchCards2
             */
            const { cart }= json.data;
            d.getElementById('lbl_cart').textContent= cart;
          }
        } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 120 , err ) };
      }
    };

  };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 12-product/showFirst */

/**
 * Code segment that execute querys backend and show this information in all page
 * @function showFirst
 * @memberof 12-product
 * @returns null
 */
const showFirst= async ()=>{
  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 12-product/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 12-product/showFirst
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /**
     * @const {Array<String>} names Array with all product string names
     * @const {Array<Object>} types Array with all categories names
     * @memberof 12-product/showFirst
     */
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 140 , err ) };

  try {
    /**
     * DOM EL section that show message not result
     * @const {HTMLElement} $sec_nresults
     * @memberof 12-product/showFirst
     */
    const $sec_nresults= d.getElementById('sec_nresults');
    if( urlp.get('pid') ){
      /**
       * Object that include information get from backend
       * @const {Object} res
       * @memberof 12-product/showFirst
       */
      const res= await fetch(`${IP}/APIshop/central/get-article${ window.location.search }`);
      /**
       * Same information from backend in json format
       * @const {Object} json
       * @memberof 12-product/showFirst
       */
      const json= await res.json();
  
      if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
      if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };

      /** 
       * Content all product founded
       * @const {Object} prods
       * @memberof 12-product/showFirst
       */
      const { prod }= json.data;
  
      prod.hasOwnProperty('mname') && genCards2("#sec_body12 div","tmp_card2", prod);
      $sec_nresults.style.display= prod.hasOwnProperty('mname') ? "none" : "unset";
    }else
      $sec_nresults.style.display= "unset";
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 150 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 12-product/watchUser */

/**
 * Code segment that detect user using firebase auth libraries
 * @function watchUser
 * @memberof 12-product
 * @returns null
 */
const watchUser= ()=>{
  fauth().onAuthStateChanged( user => {
    if( user ){
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
      watchCards2("#sec_body12 div", user.uid);
    }
  });
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 12-product/main */

/**
 * Code segment that execute when the page end load
 * @function main
 * @memberof 12-product
 * @returns null
 */
const main= async()=>{
  await showFirst();
  watchUser();
  modalCookie('.modal-cookie');
};

/* ------------------------------------------------------------------------------------------------------------------------ */

window.onload= main;
/**
 * If user press login then redirect google page sign in 
 * @callback $btn_login-onclick 
 * @memberof 12-product
 */
d.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
/**
 * If user press logout then erase current user session
 * @callback $btn_logout-onclick 
 * @memberof 12-product
 */
d.getElementById('btn_logout').onclick= () => fauth().signOut();
