const { config }= require('firebase-functions');
const { Router } = require("express");
const router= Router();

const { firestore }= require('firebase-admin');
const products= firestore().collection('prods');
const clients= firestore().collection('clis');
const sales= firestore().collection('sales');

let access_token= "";
let IP= ["",""]
if (process.env.NODE_ENV !== 'production') {
  const { "test-access_token": atoken }= require('./keys/mercadoKey.json');
  access_token= atoken;
  IP= [`http://localhost:5000`,`http://localhost:5001`,`http://localhost:8080`,];
}else{
  access_token= config().test.access_token;  ///  keys = functions.config().keys;
  IP= [`https://myportfolio-94.web.app/`];
};

const mp= require('mercadopago');
mp.configure({ access_token });

const { userSearch , getMXN }= require('../helper.js');

router.post('/create-session', async (req, res) => {                     //If user save your checkout id then page show...
  let status= false;
  let data= { url: "" };
  try {
    if( req.body ){
      const { uid , ship , name, email, phone , addr } = req.body;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        const cliSnap= await clients.where('__name__', '==' , uid ).select('cart','sid').get();
        const { cart } = cliSnap.docs[0].data();
        if( cart && cart.length > 0 ){
          const ids= cart.map( el=> el[0] );
          const prodSnap= await products.select('purl','cost','mname','desc','type').where('__name__','in',ids).get();

          const preference= { 
            items: [],
            auto_return: "approved",
            statement_descriptor: "La liga: Coleccionables",
            back_urls: {
              "success": `${ IP[0] }/APIshop/check/endok-session?uid=${ uid }&ship=${ ship }`,
              "failure": `${ IP[0] }/projects/eshop94/pages/cart/index.html`,
            },
            "payment_methods": {
              "installments": 1
            },
            payer: !ship ? {} : {
              name: name,
              email: email,
              phone: {
                number: Number(phone)
              },
              address: {
                street_name: addr.street_name,
                street_number: Number(addr.street_number),
                zip_code: addr.zip_code
              }
            },
            shipments: !ship ? {} : {
              cost: 100,
              mode: "not_specified",
              //mode: "me2",
              //dimensions: "30x30x30,500",
              receiver_address: addr
            }
          }; 

          prodSnap.forEach( snap =>{
            const qty= cart.filter( prod => prod[0] == snap.id )[0][1];
            const article= snap.data();
            preference.items.push({                                       //fill array with each product from cart array 
              id: snap.id,
              title: article.mname,
              currency_id: "MXN",
              picture_url: article.purl,
              description: article.desc.slice(0,50) ,
              category_id: article.type,
              quantity: qty,
              unit_price: Number(article.cost),
            });
          });

          const { body: resBody }= await mp.preferences.create( preference );
          data.url= resBody.init_point;

          ship && (addr.lpref_id= resBody.id);
          ship && await clients.doc(uid).update({ uaddr: preference.shipments.receiver_address, uphone: phone });
        }
      }
    }
    status= true;
  } catch (err) { data= err.message; status= false; console.log(100, err); };
  res.json({ status , data });
});

router.get('/endok-session', async (req, res) => {
  let stats= false;
  let data= "";
  try {
    if( req.query.status && req.query.status == "approved" ){ 
      const { uid, ship, status, merchant_order_id, payment_id, preference_id }= req.query;

      const { body }= await mp.merchant_orders.findById( merchant_order_id );
      const { collector , total_amount , items }= body;

      const cliSnap= await clients.where('__name__', '==' , uid ).select('cart','mid','udata.displayName','udata.photoURL','uphone').get();
      let { cart , mid , udata , uphone } = cliSnap.docs[0].data();

      if( items && items.length > 0 && cart && cart.length > 0 ){
        const ids= cart.map( el=> el[0] );
        const prodSnap= await products.select('mname','qty','clas').where('__name__','in',ids).get();
  
        const allCart= [];
        prodSnap.forEach( snap =>{
          const select= cart.filter( prod => prod[0] == snap.id )[0];
          const article= snap.data();
          article.id= select['0'];
          article.cliQty= select['1'];
          article.equal= false;
          allCart.push(article);
        });
  
        const allEqual= allCart.map( article =>{
          const found= items.filter( el => el.id == article.id && el.quantity == article.cliQty );
          return found[0] ? true : false;
        }).reduce( (acc, el) => acc && el );

        if( allEqual ){
          const myPromises= [];

          allCart.forEach( article => {
            const qty= article.qty - article.cliQty;
            const clas= qty > 0 ? article.clas : "pronto en stock"
            const proms= products.doc( article.id ).update({ qty: qty , clas: clas });
            myPromises.push( proms );
          });

          if( mid && mid.length > 0 ){
            const found= mid.filter( el=> el.id == collector.id );
            !(found[0]) && mid.push(collector);
          }else{
            mid= [];
            mid.push(collector);
          }
          myPromises.push( clients.doc(uid).update({ cart: [] , mid }) );

          let pref;
          let pay;
          ship && (pref= await mp.preferences.findById( preference_id ));
          ship && (pay= await mp.payment.findById( payment_id ));

          const newSale= {  
            adata: {        //address data
              ship:         ship,
              phone:        ship && uphone ? uphone : null,
              address:      ship ? pref.body.shipments.receiver_address : null,
              amount:       ship ? pay.body.shipping_amount : null
            },    
            cdata: {        //cart data
              total:        total_amount,
              prod:         cart
            },
            mdata:{         //mercado libre data
              cid:          merchant_order_id,
              pay_id:       payment_id,
              pref_id:      preference_id,
              status:       status,
              mid:          collector,
            },
            udata: {        //user data
              uid:          uid,
              displayName:  udata.displayName,
              photoURL:     udata.photoURL
            }
          };
          myPromises.push( sales.add( newSale ) );

          const resProms= await Promise.all(myPromises);

          data= `${ newSale.mdata.cid }--${ resProms[ resProms.length - 1 ].id }`;
          stats= true;
        }
      }
    }
  } catch (err) { data= err.message; stats= false; console.log(190, err); };
  res.redirect( stats ? `${IP[0]}/projects/eshop94/pages/cart/resume.html?type=ML&id=${ data }` : `${IP[0]}/projects/eshop94/404.html` );
});

router.get('/resume', async (req, res) => {
  let status= false;
  let data= {  };
  try {
    if( req.query.type && req.query.id && req.query.id.length > 30 ){
      if( req.query.type == "ML" ){
        const { id }= req.query;
        const checkoutID= id.slice(0,10);
        const { body }= await mp.merchant_orders.findById( checkoutID );
        const { total_amount , items }= body;
  
        const salesID= id.substr(12);
        const salSnap= await sales.where('__name__', '==' , salesID ).select('adata','udata').get();
        if( salSnap.size > 0 ){
          //const cliSnap= await clients.where('__name__', '==' , salSnap.docs[0].data().uid ).select('udata.displayName','udata.photoURL').get();
          const { adata, udata }= salSnap.docs[0].data();

          const ship= adata && adata.ship;

          ship && (data.ship= adata.amount);
  
          data.name= udata.displayName.split(" ")[0];
          data.purl= udata.photoURL;
          data.products= items.map( el => { 
            return { 
              id:           el.id,
              //category_id:  el.category_id,
              //currency_id:  el.currency_id,
              //description:  el.description,
              //picture_url:  el.picture_url,
              //picture_id:   el.picture_id,
              title:        el.title,
              quantity:     el.quantity,
              unit_price:   getMXN(el.unit_price)
            }
          });
          data.total = getMXN( ship ? (data.ship + total_amount) : total_amount );
          data.tid= id
          status= true;

        }else throw { message: "Transaccion no identificada" }
      }else throw { message: "URL con parametros incorrectos" };
    }else throw { message: "URL de origen no aceptado" };

  } catch (err) { data= err.message; status= false; console.log(240, err); };
  res.json({ status , data });
});

module.exports = router;


(async()=>{
  //get list product in body.items  maybe body.shipment  
  //const { body }= await mp.preferences.findById('748655332-b29f46f7-8b3e-4646-832f-59418096dcbf');
  //console.log( body )

  //get card detail, status pay, total pay, client email info
  //const { body }= await mp.payment.findById('1236185310');
  //console.log( body )

  //checkout code....
  //const algo= await mp.merchant_orders.findById('2594165302');
  //console.log( algo.body )
})();
