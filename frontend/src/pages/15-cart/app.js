/** @namespace 15-cart */

import './style.css';

/** 
 * Call Collapse class from boostrap 
 * @const {Class} Collapse
 * @memberof 15-cart
 */
import { Collapse } from 'bootstrap/dist/js/bootstrap.bundle';
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
 * @memberof 15-cart
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
 * @memberof 15-cart
 */
const fauth= firebase.auth;
/** 
 * The object document in an single variable
 * @constant {Object} d
 * @memberof 15-cart
 */
const d= document;
/**
 * DOM EL section that show message not result
 * @const {HTMLElement} $sec_nresults
 * @memberof 15-cart
 */
const $sec_nresults= d.getElementById('sec_nresults');
/**
 * DOM EL section that show/hide elements based on if user logged
 * @const {HTMLElement} $sec_login
 * @memberof 15-cart
 */
const $sec_login= d.getElementById('sec_login');
/**
 * DOM EL Button cart
 * @const {HTMLElement} $btn_cart
 * @memberof 15-cart
 */
const $btn_cart= d.getElementById('btn_cart');
/**
 * DOM EL label quantity products
 * @const {HTMLElement} $lbl_qty
 * @memberof 15-cart
 */
const $lbl_qty= d.getElementById('lbl_qty');
/**
 * DOM EL label subtotal value
 * @const {HTMLElement} $lbl_subtotal
 * @memberof 15-cart
 */
const $lbl_subtotal= d.getElementById('lbl_subtotal');
/**
 * DOM EL label delivery value
 * @const {HTMLElement} $lbl_deliv
 * @memberof 15-cart
 */
const $lbl_deliv= d.getElementById('lbl_deliv');
/**
 * DOM EL label total value
 * @const {HTMLElement} $lbl_total
 * @memberof 15-cart
 */
const $lbl_total= d.getElementById('lbl_total');
/**
 * DOM EL button toggle left side show
 * @const {HTMLElement} $btn_toogleL
 * @memberof 15-cart
 */
const $btn_toogleL= d.getElementById("btn_toogleL");
/**
 * DOM EL button toogle right side show
 * @const {HTMLElement} $btn_toogleR
 * @memberof 15-cart
 */
const $btn_toogleR= d.getElementById("btn_toogleR");
//const $chk_left1= d.getElementById('chk_left1');
//const $chk_right1= d.getElementById('chk_right1');

/**
 * Get all states in a list array
 * @const {Array<Object>} states
 * @memberof 15-cart
 */
const states= require('../../js/estados.json');
/**
 * Get all citys in a list array
 * @const {Array<Object>} cities
 * @memberof 15-cart
 */
const cities= require('../../js/estados-municipios.json');

$btn_cart.style.display= "none";

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 15-cart/genCards2 */

/**
 * Create an Bootrap card that content product information
 * @function genCards2
 * @memberof 15-cart
 * @param {String} spaceID Space tag id where append an card for each product into list
 * @param {String} templateID tag id where get HTML Card body
 * @param {Array<Object>} list Element's list whit all products
 * @returns null
 */
const genCards2= ( spaceID="" , templateID="" , list=[] )=>{
  /**
   * DOM EL where fill all HTML data
   * @const {HTMLElement} $space
   * @memberof 15-cart/genCards2
   */
  const $space= d.querySelector(spaceID);
  /**
   * DOM EL that process all HTML data in memory
   * @const {DocumentFragment} $fragment
   * @memberof 15-cart/genCards2
   */
  const $fragment= d.createDocumentFragment();
  /**
   * DOM EL template where get all HTML data
   * @const {HTMLElement} $template
   * @memberof 15-cart/genCards2
   */
  const $template= d.getElementById(templateID).content;
  list.forEach( el =>{
    const enable= el.clas.toUpperCase() == "AVAILABLE";
    if( enable ){
      $template.querySelector('div').dataset.id= el.id;
      $template.querySelector('img').setAttribute('src',el.purl);
      $template.querySelector('.crd-label').textContent= el.clas;
      $template.querySelector('.crd-link').textContent= el.mname;
      $template.querySelector('.crd-link').setAttribute('href',`/projects/eshop94/pages/product/?pid=${ el.id }`);
      $template.querySelector('.crd-cost').textContent = `$${el.cost},00`; 
      $template.querySelector('.card-body p').textContent = el.desc || el.mname; 
      $template.querySelector('.crd-bottom').textContent = el.ver; 
      $template.querySelector('.input-group input').value = el.cliQty; 
      $template.querySelector('.input-group input').dataset.id= el.id;
      $template.querySelector('.btn-success').dataset.id= el.id;
      $template.querySelector('.btn-success').dataset.oper= "plus";
      $template.querySelector('.btn-success i').dataset.id= el.id;
      $template.querySelector('.btn-success i').dataset.oper= "plus";
      $template.querySelector('.btn-danger').dataset.id= el.id;
      $template.querySelector('.btn-danger').dataset.oper= "minus";
      $template.querySelector('.btn-danger i').dataset.id= el.id;
      $template.querySelector('.btn-danger i').dataset.oper= "minus";
  
      $fragment.appendChild( d.importNode( $template , true ) )
    }
  })
  $space.appendChild($fragment);
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 15-cart/watchCards2 */

/**
 * Watch any click enter by client into cards zone
 * @function watchCards2
 * @memberof 15-cart
 * @param {String} spaceID Space tag id where are all cards
 * @param {String} uid User unique id
 * @returns null
 */
const watchCards2= ( spaceID="" , uid )=>{ 

  /**
   * DOM EL where fill all HTML data
   * @const {HTMLElement} $space
   * @memberof 15-cart/watchCards2
   */
  const $space= d.querySelector(spaceID);

  /**
   * Change quantity of product and send this change to backend
   * @function sendChange
   * @memberof 15-cart/watchCards2
   * @param {Object} info Element's group that include uid, prod id, type operation, type cart and quantity
   * @returns null
   */
  const sendChange= async ( info={} ) =>{
    try {
      /**
       * Object that include information get from backend
       * @const {Object} res
       * @memberof 15-cart/watchCards2
       */
      const res= await fetch(`${IP}/APIshop/cart/mod-cli-cart`,{
        method: 'PUT',
        body: JSON.stringify(info),
        headers:{ 'Content-Type': 'application/json' } 
      });
      /**
       * Same information from backend in json format
       * @const {Object} json
       * @memberof 15-cart/watchCards2
       */
      const json= await res.json();

      if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
      if( !json.status ) throw { status: json.status , message: `${ json.data }` };
      /**
       * @const {Number} prod quantity product feedback for backend and check availability
       * @const {Number} qty All product quantity into cart list
       * @const {Number} total How many summary of all products
       * @memberof 15-cart/watchCards2
       */
      const { prod , qty , total }= json.data;

      if( prod > 0 )  $space.querySelector(`input[data-id="${ info.prod }"]`).value= prod;
      else            $space.querySelector(`div[data-id="${ info.prod }"]`  ).innerHTML= "";

      $lbl_qty.textContent= qty;
      $lbl_subtotal.textContent= `$ ${total},00`;
      $lbl_total.textContent= `$ ${ $btn_toogleR.checked ? ( total + 100 ) : total },00`;

      if( !qty ) {
        $sec_nresults.style.display= "unset";
        $sec_login.style.display= "none";
        $lbl_deliv.textContent= `$ 0.00`;
        $lbl_total.textContent= `$ 0.00`;
      }
      
    } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 90 , err ) };
  }
  /**
   * If user modify count into input text then change this value but with limit and send this change to backend
   * @callback $space-onchange 
   * @memberof 15-cart/watchCards2
   */
  $space.onchange= (ev)=>{
    if( ev.target.matches('input[data-id]') ){
      const info= { 
        "id": uid, 
        "prod": ev.target.dataset.id, 
        "oper": "mod",
        "type": "cart",
        "qty": ev.target.value 
      };
      sendChange( info );
    };
  };
  /**
   * If user press any button then change count value and send this change to backend
   * @callback $space-onclick 
   * @memberof 15-cart/watchCards2
   */
  $space.onclick= async (ev)=>{
    if( ev.target.matches('button[data-id]') || ev.target.matches('i[data-id]') ){
      const info= { 
        "id": uid, 
        "prod": ev.target.dataset.id, 
        "oper": ev.target.dataset.oper,
        "type": "cart",
        "qty": 1
      };
      sendChange( info );
    };
  };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 15-cart/processPay */

/**
 * Execute request for init pay process
 * @function processPay
 * @memberof 15-cart
 * @param {Object} info include user id and shipment information
 * @returns null
 */
const processPay= async ( info={} ) =>{
  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 15-cart/processPay
     */
    const res= await fetch(`${IP}/APIshop/check/create-session`,{
      method: 'POST',
      body: JSON.stringify(info),
      headers:{ 'Content-Type': 'application/json' } 
    });
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 15-cart/processPay
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `${ json.data }` };
    /** 
     * Get url for redirect to mercado pago page and then user can paid safe form
     * @const {String} url
     * @memberof 15-cart/processPay
     */
    const { url }= json.data;
    window.open(url,'_self');

    //const { publicKey , sessionId }= json.data; 
    //await Stripe( publicKey ).redirectToCheckout({ sessionId })
    
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 140 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 12-product/modalBody4 */

/**
 * Generate modal body
 * @function modalBody4
 * @memberof 15-cart
 * @returns {String} return all HTML Modal body
 */
const modalBody4= ()=>{
  return `
    <h5 class="text-justify mb-3">
      You can test <strong>Mercado Pago</strong> method in correct way using the next information: 
    </h5>

    <table class="table table-dark table-hover">
      <thead>
        <tr>
          <th scope="col">Criterion</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Card</th>
          <td>VISA</td>
        </tr>
        <tr>
          <th scope="row">Number</th>
          <td>4075 5957 1648 3764</td>
        </tr>
        <tr>
          <th scope="row">Security code</th>
          <td>123</td>
        </tr>
        <tr>
          <th scope="row">Due date</th>
          <td>11/25</td>
        </tr>
        <tr>
          <th scope="row"></th>
          <td></td>
        </tr>
        <tr>
          <th scope="row">E-mail<p class="mb-0">user</p></th>
          <td>test_user_69518536 <p class="mb-0">@testuser.com</p></td>
        </tr>
        <tr>
          <th scope="row">Password</th>
          <td>qatest6741</td>
        </tr>
      </tbody>
    </table>

    <h4 class="text-justify text-warning">Note: You dont use real information in this test</h4>
    <h5>More information You can be query entering the next link <a class="text-info" href="https://www.mercadopago.com.mx/developers/es/guides/online-payments/checkout-pro/test-integration#bookmark_tarjetas_de_prueba" target="_blank">mercadopago.com.mx© </a></span></h5>
  `.replace('\n','');
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 15-cart/watchDrp */

/**
 * Check user changes into dropdown area
 * @function watchDrp
 * @memberof 15-cart
 * @param {String} uid user id data
 * @param {String} name user name data
 * @param {String} email user email data
 * @returns null
 */
const watchDrp= ( uid, name, email )=>{

  // Collapse selection
  /**
   * DOM EL inlcude both dropdown, the left and right side
   * @const {HTMLElement} $collapses
   * @memberof 15-cart/watchDrp
   */
  const $collapses= d.querySelectorAll('#sec_login .collapse');
  /**
   * Include method show hide collapse into Left side
   * @const {Object} collapseL
   * @memberof 15-cart/watchDrp
   */
  const collapseL= new Collapse( $collapses[0] , { toggle: false });
  /**
   * Include method show hide collapse into Rigth side
   * @const {Object} collapseR
   * @memberof 15-cart/watchDrp
   */
  const collapseR= new Collapse( $collapses[1] , { toggle: false });

  /**
   * Get subtotal value
   * @function getSub
   * @param {String} mytag user id data
   * @returns {Number} Return integer subtotal value
   * @memberof 15-cart/watchDrp
   */
  const getSub= ( mytag )=>{
    let label= mytag.textContent;
    label= label.split(" ");
    label= label[1]
    label= label.replace(",",".");
    label= Number(label)
    return label
  }
  /**
   * If user press btn toggle left side, then show left HMTL body
   * @callback $btn_toogleL-onclick 
   * @memberof 15-cart/watchDrp
   */
  $btn_toogleL.onclick= ()=>{
    collapseL.show();
    collapseR.hide();
    $lbl_deliv.textContent= `$ 0.00`;
    $lbl_total.textContent= `$ ${ getSub( $lbl_subtotal ) }.00`;
  };
  /**
   * If user press btn toggle left side, then show Right HMTL body
   * @callback $btn_toogleR-onclick 
   * @memberof 15-cart/watchDrp
   */
  $btn_toogleR.onclick= ()=>{
    collapseL.hide();
    collapseR.show();
    $lbl_deliv.textContent= `$ 100.00`;
    $lbl_total.textContent= `$ ${ getSub( $lbl_subtotal ) + 100 }.00`;
  };

  //Collapse left side

  /**
   * DOM EL button pay left side
   * @const {HTMLElement} $btn_payl
   * @memberof 15-cart/watchDrp
   */
  const $btn_payl= d.getElementById('btn_payl');
  /**
   * DOM EL checkbox left side
   * @const {HTMLElement} $chk_left1
   * @memberof 15-cart/watchDrp
   */
  const $chk_left1= d.getElementById('chk_left1');
  /**
   * If user press checkbox left, then change button pay left state
   * @callback $chk_left1-onclick 
   * @memberof 15-cart/watchDrp
   */
  $chk_left1.onclick= (ev)=> { $btn_payl.disabled= !ev.target.checked; return undefined; };
  /**
   * If user press btn pay left, then send request to backend
   * @callback $btn_payl-onclick 
   * @memberof 15-cart/watchDrp
   */
  $btn_payl.onclick= ()=>{
    const send= {
      uid: uid,
      ship: false,
      name: name,
      email: email,
      phone: undefined,
      addr: undefined
    }
    modalShow( "modals" , "tmp_modal" , modalBody4() , 2 , ()=>processPay( send ) );
  };

  //Collapse right side

  /**
   * DOM EL input text full name user
   * @const {HTMLElement} $inp_nameform
   * @memberof 15-cart/watchDrp
   */
  const $inp_nameform= d.getElementById('inp_nameform');
  /**
   * DOM EL input email user
   * @const {HTMLElement} $inp_emailform
   * @memberof 15-cart/watchDrp
   */
  const $inp_emailform= d.getElementById('inp_emailform');
  /**
   * DOM EL checkbox name option
   * @const {HTMLElement} $chk_name
   * @memberof 15-cart/watchDrp
   */
  const $chk_name= d.getElementById('chk_name');
  /**
   * DOM EL checkbox email option
   * @const {HTMLElement} $chk_email
   * @memberof 15-cart/watchDrp
   */
  const $chk_email= d.getElementById('chk_email');
  $inp_nameform.value= name;
  $inp_emailform.value= email;
  $chk_name.onclick=  (ev)=> { $inp_nameform.disabled=  ev.target.checked; return undefined; };
  $chk_email.onclick= (ev)=> { $inp_emailform.disabled= ev.target.checked; return undefined; };

  /**
   * DOM EL select state
   * @const {HTMLElement} $inp_stateform
   * @memberof 15-cart/watchDrp
   */
  const $inp_stateform= d.getElementById('inp_stateform');
  /**
   * DOM EL select city
   * @const {HTMLElement} $inp_substateform
   * @memberof 15-cart/watchDrp
   */
  const $inp_substateform= d.getElementById('inp_substateform');
  
  states.forEach( el=>{
    const $option= d.createElement('option');
    $option.textContent= el.nombre;
    $option.value= el.clave;
    $inp_stateform.appendChild($option);
  });
  /**
   * If user select a state, then fill second select with respective cities
   * @callback $inp_stateform-onchange 
   * @memberof 15-cart/watchDrp
   */
  $inp_stateform.onchange= ev => {
    const sel= ev.target.selectedIndex;
    $inp_substateform.innerHTML= `<option value="" selected>elegir...</option>`;
    cities[sel].forEach( el=>{
      const $option= d.createElement('option');
      $option.textContent= el;
      $option.value= el;
      $inp_substateform.appendChild($option);
    });
  };
  /**
   * DOM EL Form pay into right dropdown
   * @const {HTMLElement} $frm_payR
   * @memberof 15-cart/watchDrp
   */
  const $frm_payR= d.getElementById('frm_payR');
  /**
   * If user fill all fileds into form then request pay to backend
   * @callback $frm_payR-onsubmit 
   * @memberof 15-cart/watchDrp
   */
  $frm_payR.onsubmit= async (ev)=>{
    ev.preventDefault();
    const send= {
      uid: uid,
      ship: true,
      name: ev.target[1].value,
      email: ev.target[3].value,
      phone: ev.target[4].value || '',
      addr: {
        zip_code:       ev.target[9].value,
        street_name:    ev.target[7].value,
        street_number:  Number(ev.target[8].value),
        floor:          ev.target[11].value || " ",
        apartment:      ev.target[10].value,
        city_name:      ev.target[6].value,
        state_name:     ev.target[5].value,
        country_name:   'MX'
      }
    }
    modalShow( "modals" , "tmp_modal" , modalBody4() , 2 , ()=>processPay( send ) );
    //processPay( send );
  };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 15-cart/showFirst */

/**
 * Code segment that execute querys backend and show this information in all page
 * @function showFirst
 * @memberof 15-cart
 * @returns null
 */
const showFirst= async ()=>{
  try {
    /**
     * Object that include information get from backend
     * @const {Object} res
     * @memberof 15-cart/showFirst
     */
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    /**
     * Same information from backend in json format
     * @const {Object} json
     * @memberof 15-cart/showFirst
     */
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    /**
     * @const {Array<String>} names Array with all product string names
     * @const {Array<Object>} types Array with all categories names
     * @memberof 15-cart/showFirst
     */
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 240 , err ) };
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/** @namespace 15-cart/watchUser */

/**
 * Code segment that detect user using firebase auth libraries
 * @function watchUser
 * @memberof 15-cart
 * @returns null
 */
const watchUser= ()=>{
  fauth().onAuthStateChanged( async user => {
    if( !user ){
      window.open(`${ prod ? "/projects/eshop94" : "" }/404.html`,'_self');
    }else{
      d.getElementById('lbl_email').textContent= user.email;

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
         * @memberof 15-cart/watchUser
         */
        const res= await fetch(`${IP}/APIshop/cart/get-cli-cart?id=${ user.uid }&type=cart`);
        /**
         * Same information from backend in json format
         * @const {Object} json
         * @memberof 15-cart/watchUser
         */
        const json= await res.json();
    
        if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
        if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
        /** 
         * @const {Array<Object>} cart Element's list whit all products
         * @const {Number} allQty How many elements are into cart list
         * @const {Number} total Value summary of all products
         * @memberof 15-cart/watchUser
         */
        const { cart , allQty , total }= json.data;
  
        if( !cart || 0 >= cart.length ) $sec_nresults.style.display= "unset";
        else $sec_login.style.display= "unset";
  
        $lbl_qty.textContent= allQty;
        $lbl_subtotal.textContent= `$ ${total},00`;
        $lbl_total.textContent= `$ ${ $btn_toogleR.checked ? ( total + 100 ) : total },00`;
        
        genCards2( "#sec_products" , "tmp_card2" , cart );
        watchCards2( "#sec_products" , user.uid );
        watchDrp( user.uid, user.displayName, user.email );
  
      } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 290 , err ) };
    };
  });
};

/* ------------------------------------------------------------------------------------------------------------------------ */
/* @namespace 15-cart/main */

/**
 * Code segment that execute when the page end load
 * @function main
 * @memberof 15-cart
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
 * @memberof 15-cart
 */
d.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
/**
 * If user press logout then erase current user session
 * @callback $btn_logout-onclick 
 * @memberof 15-cart
 */
d.getElementById('btn_logout').onclick= () => fauth().signOut();

//new Modal('.modal3').show()
//modalShow( "modals" , "tmp_modal" , "ALGO" )