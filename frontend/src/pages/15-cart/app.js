/** @namespace Frontend/01-login */

import './style.css';

import { Collapse , Modal } from 'bootstrap/dist/js/bootstrap.bundle';
const { modalShow, getError, fillNavbar, genDropTypes, genSearchBox, IP } = require('../../js/helper.js');

process.env.NODE_ENV === 'development' && firebase.initializeApp({
  apiKey: "AIzaSyALOIRaODueInxmXbrnkT6l8aQ5JWgE6Vc",
  authDomain: "driveshop5.firebaseapp.com",
  databaseURL: "https://driveshop5.firebaseio.com",
  projectId: "driveshop5",
  storageBucket: "driveshop5.appspot.com",
  messagingSenderId: "878066266054",
  appId: "1:878066266054:web:0a4e438129c19e070fccc7"
});
const fauth= firebase.auth;
const d= document;

const $sec_nresults= d.getElementById('sec_nresults');
const $sec_login= d.getElementById('sec_login');
const $btn_cart= d.getElementById('btn_cart');
const $lbl_qty= d.getElementById('lbl_qty');
const $lbl_subtotal= d.getElementById('lbl_subtotal');
const $lbl_total= d.getElementById('lbl_total');

const estados= require('../../js/estados.json');
const municipios= require('../../js/estados-municipios.json');

$btn_cart.style.display= "none";

const genCards2= ( spaceID="" , templateID="" , list=[] )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template= d.getElementById(templateID).content;
  list.forEach( (el,ind)=>{
    $template.querySelector('div').dataset.id= el.id;
    $template.querySelector('img').setAttribute('src',el.purl);
    $template.querySelector('.crd-label').textContent= el.clas;
    $template.querySelector('.crd-link').textContent= el.mname;
    $template.querySelector('.crd-link').setAttribute('href',`/pages/product/?pid=${ el.id }`);
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
  })
  $space.appendChild($fragment);
};

const watchCards2= ( spaceID="" , uid )=>{ 

  const $space= d.querySelector(spaceID);

  const sendChange= async ( info={} ) =>{
    try {
      const res= await fetch(`${IP}/APIshop/first/changeCart`,{
        method: 'PUT',
        body: JSON.stringify(info),
        headers:{ 'Content-Type': 'application/json' } 
      });
      const json= await res.json();

      if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
      if( !json.status ) throw { status: json.status , message: `${ json.data }` };
      const { prod , qty , total }= json.data;

      if( prod > 0 )  $space.querySelector(`input[data-id="${ info.prod }"]`).value= prod
      else            $space.querySelector(`div[data-id="${ info.prod }"]`  ).innerHTML= "";

      $lbl_qty.textContent= qty;
      $lbl_subtotal.textContent= `$ ${total},00`;
      $lbl_total.textContent= `$ ${total},00`;

      if( !qty ) {
        $sec_nresults.style.display= "unset";
        $sec_login.style.display= "none";
      }
      
    } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 200 , err ) };
  }
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
    }
  }
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
    }
  }
};

const processPay= async ( info={} ) =>{
  try {
    const res= await fetch(`${IP}/APIshop/first/create-checkout-session`,{
      method: 'POST',
      body: JSON.stringify(info),
      headers:{ 'Content-Type': 'application/json' } 
    });
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `${ json.data }` };
    const { publicKey , sessionId }= json.data; 
    await Stripe( publicKey ).redirectToCheckout({ sessionId })
    
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 200 , err ) };
}

const watchDrp= ( uid, name, email )=>{

  // Collapse selection

  const $collapses= d.querySelectorAll('#sec_login .collapse');
  const $collapseL= new Collapse( $collapses[0] , { toggle: false });
  const $collapseR= new Collapse( $collapses[1] , { toggle: false });
  
  d.getElementById("btn_toogleL").onclick= ()=>{
    $collapseL.show();
    $collapseR.hide();
  };
  d.getElementById("btn_toogleR").onclick= ()=>{
    $collapseL.hide();
    $collapseR.show();
  };

  //Collapse left side

  const $btn_payl= d.getElementById('btn_payl');
  const $chk_left1= d.getElementById('chk_left1');
  $chk_left1.onclick= (ev)=> { $btn_payl.disabled= !ev.target.checked; return undefined; };
  $btn_payl.onclick= ()=> window.open('#','_self');

  $btn_payl.onclick= ()=>{
    const send= {
      uid: uid,
      ship: false,
      name: name,
      email: email,
      phone: undefined,
      addr: undefined
    }
    processPay( send );
  };

  //Collapse right side

  const $inp_nameform= d.getElementById('inp_nameform');
  const $inp_emailform= d.getElementById('inp_emailform');
  const $chk_name= d.getElementById('chk_name');
  const $chk_email= d.getElementById('chk_email');
  $inp_nameform.value= name;
  $inp_emailform.value= email;
  $chk_name.onclick=  (ev)=> { $inp_nameform.disabled=  ev.target.checked; return undefined; };
  $chk_email.onclick= (ev)=> { $inp_emailform.disabled= ev.target.checked; return undefined; };

  const $inp_stateform= d.getElementById('inp_stateform');
  const $inp_substateform= d.getElementById('inp_substateform');
  
  estados.forEach( el=>{
    const $option= d.createElement('option');
    $option.textContent= el.nombre;
    $option.value= el.clave;
    $inp_stateform.appendChild($option);
  });

  $inp_stateform.onchange= ev => {
    const sel= ev.target.selectedIndex;
    $inp_substateform.innerHTML= `<option value="" selected>elegir...</option>`;
    municipios[sel].forEach( el=>{
      const $option= d.createElement('option');
      $option.textContent= el;
      $option.value= el;
      $inp_substateform.appendChild($option);
    });
  };
  
  const $frm_payR= d.getElementById('frm_payR');
  $frm_payR.onsubmit= async (ev)=>{
    ev.preventDefault();
    const send= {
      uid: uid,
      ship: true,
      name: ev.target[1].value,
      email: ev.target[3].value,
      phone: ev.target[4].value || '',
      addr: {
        line1: ev.target[7].value + " #" + ev.target[8].value + " Col: " + ev.target[10].value,
        city: ev.target[6].value,
        country: 'MX',
        line2: ev.target[11].value || " ",
        postal_code: ev.target[9].value,
        state: ev.target[5].value
      } 
    }
    processPay( send );
  };
}

const main= async()=>{
  //const { modalHide }= spinnerShow( Modal , "modals" , "tmp_spinner" );
  try {
    const res= await fetch(`${IP}/APIshop/first/common`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 220 , err ) };

  fauth().onAuthStateChanged( async user => {

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

      const res= await fetch(`${IP}/APIshop/first/getClient?id=${ user.uid }&type=cart`);
      const json= await res.json();
  
      if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
      if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
      const { cart , allQty , total }= json.data;
      //console.log( json.data )

      if( !cart || 0 >= cart.length ) $sec_nresults.style.display= "unset";
      else $sec_login.style.display= "unset";

      $lbl_qty.textContent= allQty;
      $lbl_subtotal.textContent= `$ ${total},00`;
      $lbl_total.textContent= `$ ${total},00`;
      
      genCards2( "#sec_products" , "tmp_card2" , cart );
      watchCards2( "#sec_products" , user.uid );
      watchDrp( user.uid, user.displayName, user.email );

    } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 250 , err ) };
  })
  //setTimeout(() => modalHide(), 500);
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();
