/** @namespace 17-wish */

import './style.css';

/**
 * Call local methods from helper
 * @typedef {Object} helper
 * @property {Function} modalShow show an Bootstrap modal in fill HMTL in specific area
 * @property {Function} getError get string from error object
 * @property {Function} fillNavbar fill Navbar string base on client information
 * @property {Function} genDropTypes fill dropdown options with categories name
 * @property {Function} genSearchBox fill Searchbox space with links that match with user search
 * @property {Function} modalCookie show an Boostrap modal in un message cookie accept
 * @property {Boolean} prod variable that stablish if project are development or production
 * @property {String} IP varibale that stablish url for fetch request.
 * @memberof 17-wish
 */
const { 
  modalShow, 
  getError, 
  fillNavbar, 
  genDropTypes, 
  genSearchBox, 
  modalCookie, 
  prod, 
  IP 
} = require('../../js/helper.js');

!prod && firebase.initializeApp(require('../../js/firebase.init.json'));
/** 
 * Inlcude properties and methods of firebase authorization librari
 * @const {Object} fauth
 * @memberof 17-wish
 */
const fauth= firebase.auth;
/** 
 * The object document in an single variable
 * @constant {Object} d
 * @memberof 17-wish
 */
const d= document;

d.getElementById('btn_wish').style.display= "none";
/**
 * DOM EL section that show message not result
 * @const {HTMLElement} $sec_nresults
 * @memberof 17-wish
 */
const $sec_nresults= document.getElementById('sec_nresults');
/**
 * DOM EL label title
 * @const {HTMLElement} $lbl_title
 * @memberof 17-wish
 */
const $lbl_title= document.getElementById('lbl_title');

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 17-wish/genCards2 */

/**
 * Create an Bootrap card that content product information
 * @function genCards2
 * @memberof 17-wish
 * @param {String} spaceID Space tag id where append an card for each product into list
 * @param {String} templateID tag id where get HTML Card body
 * @param {Array<Object>} list Element's list whit all products
 * @returns null
 */
const genCards2= ( spaceID="" , templateID="" , list=[] )=>{
  /**
   * DOM EL where fill all HTML data
   * @const {HTMLElement} $space
   * @memberof 17-wish/genCards2
   */
  const $space= d.querySelector(spaceID);
  /**
   * DOM EL that process all HTML data in memory
   * @const {DocumentFragment} $fragment
   * @memberof 17-wish/genCards2
   */
  const $fragment= d.createDocumentFragment();
  /**
   * DOM EL template where get all HTML data
   * @const {HTMLElement} $template
   * @memberof 17-wish/genCards2
   */
  const $template= d.getElementById(templateID).content;
  list.forEach( el =>{
    /**
    * Variable that check if property clas include word AVAILABLE
    * @const {Boolean} enable
    * @memberof 17-wish/genCards2
    */
    const enable= el.clas.toUpperCase() == "AVAILABLE";

    $template.querySelector('div').dataset.id= el.id;
    $template.querySelector('img').setAttribute('src',el.purl);
    $template.querySelector('.crd-label').textContent= el.clas;
    $template.querySelector('.crd-link').textContent= el.mname;
    $template.querySelector('.crd-link').setAttribute('href',`${ prod ? "/projects/eshop94" : "" }/pages/product/?pid=${ el.id }`);
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

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 17-wish/watchCards2 */

/**
 * Watch any click enter by client into cards zone
 * @function watchCards2
 * @memberof 17-wish
 * @param {String} spaceID Space tag id where are all cards
 * @param {String} uid User unique id
 * @returns null
 */
const watchCards2= ( spaceID="" , uid )=>{ 

  /**
   * DOM EL where check any click made for client
   * @const {HTMLElement} $space
   * @memberof 17-wish/watchCards2
   */
  const $space= d.querySelector(spaceID);

  /**
   * If user press any button card, then add to cart list or erase element in wish list
   * @callback $space-onclick 
   * @memberof 17-wish/watchCards2
   */
  $space.onclick= async (ev)=>{
    if( ev.target.matches('button[data-id]') || ev.target.matches('i[data-id]') ){
      try {
        /**
         * DOM EL space where where executed action click
         * @const {HTMLElement} $mainCard
         * @memberof 17-wish/watchCards2
         */
        const $mainCard= $space.querySelector(`div[data-id="${ ev.target.dataset.id }"]`  );

        if( ev.target.matches('[data-oper="plus"]') ){
          /**
           * Include user id and product id
           * @const {Object} info
           * @memberof 17-wish/watchCards2
           */
          const info= { 
            "id": uid, 
            "prod": ev.target.dataset.id
          };
          /**
           * Object that include information get from backend
           * @const {Object} res
           * @memberof 17-wish/watchCards2
           */
          const res= await fetch(`${IP}/APIshop/cart/move-cli-cart`,{
            method: 'PUT',
            body: JSON.stringify(info),
            headers:{ 'Content-Type': 'application/json' } 
          });
          /**
           * Same information from backend in json format
           * @const {Object} json
           * @memberof 17-wish/watchCards2
           */
          const json= await res.json();
    
          if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
          if( !json.status ) throw { status: json.status , message: `${ json.data }` };
          
          d.getElementById('lbl_cart').textContent= json.data.cart;
          $mainCard.outerHTML= "";
        }
        if( ev.target.matches('[data-oper="minus"]') ){
          /**
           * Include user id, product id, operation type, type list and quantity
           * @const {Object} info
           * @memberof 17-wish/watchCards2
           */
          const info= { 
            "id": uid, 
            "prod": ev.target.dataset.id, 
            "oper": "mod",
            "type": "wish",
            "qty": 0
          };
          /**
           * Object that include information get from backend
           * @const {Object} res
           * @memberof 17-wish/watchCards2
           */
          const res= await fetch(`${IP}/APIshop/cart/mod-cli-cart`,{
            method: 'PUT',
            body: JSON.stringify(info),
            headers:{ 'Content-Type': 'application/json' } 
          });
          /**
           * Same information from backend in json format
           * @const {Object} json
           * @memberof 17-wish/watchCards2
           */
          const json= await res.json();
    
          if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
          if( !json.status ) throw { status: json.status , message: `${ json.data }` };
          $mainCard.outerHTML= "";
        }
        if(0 >= $space.querySelectorAll('[data-id]').length){
          $sec_nresults.style.display= "unset";
          $lbl_title.style.display= "none";
        } 
          
      } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 110 , err ) };

    }
  }
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 17-wish/showFirst */

/**
 * Code segment that execute querys backend and show this information in all page
 * @function showFirst
 * @memberof 17-wish
 * @returns null
 */
const showFirst= async ()=>{
  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 17-wish/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 17-wish/showFirst
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /**
     * @const {Array<String>} names Array with all product string names
     * @const {Array<Object>} types Array with all categories names
     * @memberof 17-wish/showFirst
     */
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 130 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 17-wish/watchUser */

/**
 * Code segment that detect user using firebase auth libraries
 * @function watchUser
 * @memberof 17-wish
 * @returns null
 */
const watchUser= ()=>{
  fauth().onAuthStateChanged( async user => {
    if( !user ){
      window.open(`${ prod ? "/projects/eshop94" : "" }/404.html`,'_self');
    }else{
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
        /**
         * Object that include information get from backend
         * @const {Object} res
         * @memberof 17-wish/watchUser
         */
        const res= await fetch(`${IP}/APIshop/cart/get-cli-cart?id=${ user.uid }&type=wish`);
        /**
         * Same information from backend in json format
         * @const {Object} json
         * @memberof 17-wish/watchUser
         */
        const json= await res.json();
    
        if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
        if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
        
        /** 
         * Get wish list counter
         * @const {Number} wish
         * @memberof 17-wish/watchUser
         */
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
      } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 160 , err ) };  
    }
  });
}

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 17-wish/main */

/**
 * Code segment that execute when the page end load
 * @function main
 * @memberof 17-wish
 * @returns null
 */
const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );
  await showFirst();
  watchUser();
  modalCookie('.modal-cookie');
  //setTimeout(() => modalHide(), 500);
};

/* ------------------------------------------------------------------------------------------------------------------------ */

window.onload= main;
/**
 * If user press login then redirect google page sign in 
 * @callback $btn_login-onclick 
 * @memberof 17-wish
 */
d.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
/**
 * If user press logout then erase current user session
 * @callback $btn_logout-onclick 
 * @memberof 17-wish
 */
d.getElementById('btn_logout').onclick= () => fauth().signOut();