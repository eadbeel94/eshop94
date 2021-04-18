/** @namespace Frontend/service */

const d= document;
const IP= "http://localhost:5001/driveshop5/us-central1/shop";
const { Modal }= require('bootstrap/dist/js/bootstrap.bundle');

const modalShow= ( classModal , spaceID="" , templateID="" , body="" , btns=1 , cb ) =>{            //Create a Html Modal empty
    
  const $sec= d.getElementById(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template= d.getElementById(templateID).content;

  $template.querySelector('.modal-body').innerHTML= body;
  $template.querySelector( btns == 2 ? '.twob' : '.oneb' ).classList.remove('d-none');

  $fragment.appendChild( d.importNode( $template , true ) );
  $sec.innerHTML= "";
  $sec.appendChild($fragment);

  const modal= new classModal(`#${spaceID} .modal`);
  modal.show();

  btns == 2 && ($sec.querySelector('.btn-outline-dark').onclick= ()=>{
    cb(); modal.hide();
  });
  return { modalHide: ()=>modal.hide() };
};

const spinnerShow= ( classModal , spaceID="" , templateID="" ) => {
  const $sec= d.getElementById(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template= d.getElementById(templateID).content;

  $fragment.appendChild( d.importNode( $template , true ) );
  $sec.appendChild($fragment);

  const modal= new classModal(`#${spaceID} .modal`);
  modal.show();
  return { modalHide: ()=>modal.hide() };
};

const getError= ( error ) => {
  let message= "Error: ";
  if( typeof error === 'object' && error !== null ){
    message+= error.hasOwnProperty('message') ? error.message : JSON.stringify( error );
  }else message+= String(error);
  return message;
}

const fillNavbar= async (
  userInfo,
  inpSearchID,
  btnSearchID,
  btnWishID,
  btnCartID,
  btnLoginID,
  btnLogoutID,
  lblAccountID,
  lblWishID,
  lblCartID
)=>{

  const $inp_search= d.getElementById(inpSearchID);
  const $btn_search= d.getElementById(btnSearchID);
  const $btn_wish= d.getElementById(btnWishID);
  const $btn_cart= d.getElementById(btnCartID);
  const $btn_login= d.getElementById(btnLoginID);
  const $btn_logout= d.getElementById(btnLogoutID);
  const $lbl_account = d.getElementById(lblAccountID); 
  const $lbl_wish= d.getElementById(lblWishID);
  const $lbl_cart= d.getElementById(lblCartID);

  $btn_login.disabled = userInfo;
  $btn_logout.disabled = !userInfo; 
  $lbl_account.textContent= "Cuenta";
  $lbl_wish.textContent= 0;
  $lbl_cart.textContent= 0;

  if( userInfo ){
    $lbl_account.textContent= (userInfo.displayName.split(" "))[0];
    $btn_login.disabled= true;
    $btn_logout.disabled= false;
    try {
      const res= await fetch(`${IP}/APIshop/first/getCart?id=${ userInfo.uid }`);
      if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
      const json= await res.json();
      if( !json.status ) throw { status: json.status , message: `${ json.data }` };
      const { cart , wish }= json.data;
      $lbl_wish.textContent= wish;
      $lbl_cart.textContent= cart;
    } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 100 , err ) };
    $btn_wish.onclick= ()=> window.open('/pages/wish','_self');
    $btn_cart.onclick= ()=> window.open('/pages/cart','_self');
  }else{
    const commonModal= ()=> modalShow( Modal , "modals" , "tmp_modal" , "Necesitas iniciar sesion para poder continuar" );
    $btn_wish.onclick= commonModal;
    $btn_cart.onclick= commonModal;
  }
  $btn_search.onclick= () => $inp_search.value.length > 3 && window.open(`/pages/articles/?fr=s&cr=${ $inp_search.value }`,'_self');
};

const genDropTypes= ( dropID="" , list=[] )=>{
  const $dropdown= d.getElementById(dropID);
  const $fragment= d.createDocumentFragment();
  list.forEach( el=>{
    const $li= d.createElement('li');
    $li.innerHTML= `<a class="dropdown-item" href="/pages/articles/?fr=t&cr=${ el.ord }">${ el.name }</a>`;
    $fragment.appendChild($li);
  });
  $dropdown.appendChild($fragment);
};

const genSearchBox= ( spaceID="" , inputID="" , list=[] )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
  const $inputSearch= d.getElementById(inputID);
  $inputSearch.addEventListener('keydown', ev =>{
    const matchs= list.filter( el=> el.indexOf( ev.target.value.toUpperCase() ) > -1 );
    $space.innerHTML= "";
    if( 0 >= matchs.length || 4 > ev.target.value.length )
      $space.style.display= "none";
    else{
      $space.style.display= "unset";
      matchs.forEach( el=> {
        const $a= d.createElement('a'); 
        $a.innerHTML= `<i class="bi bi-search pr-2"></i> ${ el }`;
        $a.setAttribute('href',`/pages/articles/?fr=s&cr=${ el }`);
        $a.classList.add('btn');
        $a.classList.add('btn-outline-light');
        $fragment.appendChild($a)
      });
      $space.appendChild($fragment);
    };
  });
};

const genCards= ( spaceID="" , templateID="" , list=[] )=>{
  const $space= d.querySelector(spaceID);
  const $fragment= d.createDocumentFragment();
  const $template= d.getElementById(templateID).content;
  list.forEach( el=>{
    $template.querySelector('img').setAttribute('src',el.purl)
    $template.querySelector('.card-title').textContent = `$${el.cost},00`;
    $template.querySelector('a').innerHTML= el.mname + `<i class="bi bi-arrow-up-right-square ps-2"></i>`;
    $template.querySelector('a').setAttribute('href',`/pages/product/?pid=${ el.id }`);
    $template.querySelector('.version').textContent= el.ver;
    $template.querySelector('.btn:nth-child(1)').dataset.id= el.id;
    $template.querySelector('.btn:nth-child(1)').dataset.type= "wish";
    $template.querySelector('.btn:nth-child(1) i').dataset.id= el.id;
    $template.querySelector('.btn:nth-child(1) i').dataset.type= "wish";
    $template.querySelector('.btn:nth-child(2)').dataset.id= el.id;
    $template.querySelector('.btn:nth-child(2)').dataset.type= "cart";
    $template.querySelector('.btn:nth-child(2) i').dataset.id= el.id;
    $template.querySelector('.btn:nth-child(2) i').dataset.type= "cart";
    $template.querySelector('.position-absolute').textContent= el.clas;

    $fragment.appendChild( d.importNode( $template , true ) )
  })
  $space.appendChild($fragment);
};

const watchCards= ( spaceID="" , uid , lblWishID="" , lblCartID=""  )=>{ 

  const $space= d.querySelector(spaceID);
  $space.onclick= async (ev)=>{
    if( ev.target.matches('[data-id]') ){
      if( !uid ){
        modalShow( Modal , "modals" , "tmp_modal" , "Necesitas iniciar sesion para poder continuar" );
      }else{
        try {
          const send= { 
            "id": uid, 
            "prod": ev.target.dataset.id, 
            "type": ev.target.dataset.type  
          };
          //console.log( 190, send )
          const res= await fetch(`${IP}/APIshop/first/addCart`,{
            method: 'POST',
            body: JSON.stringify(send),
            headers:{ 'Content-Type': 'application/json'  } 
          });
          if( !res.ok ) throw { status: res.status , message: `${ res.statusText }` };
          const json= await res.json();
          if( !json.status ) throw { status: json.status , message: `${ json.data }` };
  
          json.data.hasOwnProperty('cart') && (d.getElementById(lblCartID).textContent= json.data['cart']);
          json.data.hasOwnProperty('wish') && (d.getElementById(lblWishID).textContent= json.data['wish']);
          
        } catch (err) { modalShow( Modal , "modals" , "tmp_modal" , getError(err) ); console.log( 200 , err ) };
      }

    }
  }
};

module.exports= { modalShow, spinnerShow, getError, fillNavbar, genDropTypes, genSearchBox, genCards, watchCards };
