/** @namespace Frontend/01-login */

import './style.css';

import { Collapse } from 'bootstrap/dist/js/bootstrap.bundle';
const { modalShow, getError, fillNavbar, genDropTypes, genSearchBox, modalCookie, prod, IP } = require('../../js/helper.js');

process.env.NODE_ENV === 'development' && firebase.initializeApp(require('../../js/firebase.init.json'));
const fauth= firebase.auth;
const d= document;

const $sec_nresults= d.getElementById('sec_nresults');
const $sec_login= d.getElementById('sec_login');
const $btn_cart= d.getElementById('btn_cart');
const $lbl_qty= d.getElementById('lbl_qty');
const $lbl_subtotal= d.getElementById('lbl_subtotal');
const $lbl_deliv= d.getElementById('lbl_deliv');
const $lbl_total= d.getElementById('lbl_total');
const $btn_toogleL= d.getElementById("btn_toogleL");
const $btn_toogleR= d.getElementById("btn_toogleR");
//const $chk_left1= d.getElementById('chk_left1');
//const $chk_right1= d.getElementById('chk_right1');

const estados= require('../../js/estados.json');
const municipios= require('../../js/estados-municipios.json');

$btn_cart.style.display= "none";

const genCards2= ( spaceID="" , templateID="" , list=[] )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
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

const watchCards2= ( spaceID="" , uid )=>{ 

  const $space= d.querySelector(spaceID);

  const sendChange= async ( info={} ) =>{
    try {
      const res= await fetch(`${IP}/APIshop/cart/mod-cli-cart`,{
        method: 'PUT',
        body: JSON.stringify(info),
        headers:{ 'Content-Type': 'application/json' } 
      });
      const json= await res.json();

      if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
      if( !json.status ) throw { status: json.status , message: `${ json.data }` };
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
    const res= await fetch(`${IP}/APIshop/check/create-session`,{
      method: 'POST',
      body: JSON.stringify(info),
      headers:{ 'Content-Type': 'application/json' } 
    });
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `${ json.data }` };
    const { url }= json.data;
    window.open(url,'_self');

    //const { publicKey , sessionId }= json.data; 
    //await Stripe( publicKey ).redirectToCheckout({ sessionId })
    
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 140 , err ) };
};

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
}

const watchDrp= ( uid, name, email )=>{

  // Collapse selection

  const $collapses= d.querySelectorAll('#sec_login .collapse');
  const $collapseL= new Collapse( $collapses[0] , { toggle: false });
  const $collapseR= new Collapse( $collapses[1] , { toggle: false });

  const getSub= ( mytag )=>{
    let label= mytag.textContent;
    label= label.split(" ");
    label= label[1]
    label= label.replace(",",".");
    label= Number(label)
    return label
  }
  
  $btn_toogleL.onclick= ()=>{
    $collapseL.show();
    $collapseR.hide();
    $lbl_deliv.textContent= `$ 0.00`;
    $lbl_total.textContent= `$ ${ getSub( $lbl_subtotal ) }.00`;
  };
  $btn_toogleR.onclick= ()=>{
    $collapseL.hide();
    $collapseR.show();
    $lbl_deliv.textContent= `$ 100.00`;
    $lbl_total.textContent= `$ ${ getSub( $lbl_subtotal ) + 100 }.00`;
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
    modalShow( "modals" , "tmp_modal" , modalBody4() , 2 , ()=>processPay( send ) );
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

const showFirst= async ()=>{
  try {
    const res= await fetch(`${IP}/APIshop/central/get-same`);
    const json= await res.json();

    if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
    if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
    const { names, types }= json.data;

    genDropTypes( "drp_types" , types );
    genSearchBox( "#sec_navbar .btn-group-vertical" , "inp_search" , names );
  } catch (err) { modalShow( "modals" , "tmp_modal" , getError(err) ); console.log( 240 , err ) };
};

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
  
        const res= await fetch(`${IP}/APIshop/cart/get-cli-cart?id=${ user.uid }&type=cart`);
        const json= await res.json();
    
        if( !res.ok ) throw { status: res.status , message: `Fetch code error -> ${ res.statusText }` };
        if( !json.status ) throw { status: json.status , message: `Server code error -> ${ json.data }` };
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

const main= async()=>{
  await showFirst();
  watchUser();
  modalCookie('.modal-cookie');
};

window.onload= main;
document.getElementById('btn_login').onclick= () => fauth().signInWithRedirect(new fauth.GoogleAuthProvider());
document.getElementById('btn_logout').onclick= () => fauth().signOut();

//new Modal('.modal3').show()
//modalShow( "modals" , "tmp_modal" , "ALGO" )