
const { config }= require('firebase-functions');
const { Router } = require("express");
const router= Router();

const { firestore , auth }= require('firebase-admin');
//const categories= firestore().collection('cats');
const products= firestore().collection('prods');
const clients= firestore().collection('clis');
const sales= firestore().collection('sales');

let keyStripe= { public: "" , private: "" };
let IP= ["",""]
if (process.env.NODE_ENV !== 'production') {
  keyStripe= require('../keys/secretkeys.json');
  IP= [`http://localhost:8080`,`http://localhost:5001`];
}else{
  keyStripe=  config().keys;
  IP= [``,``];
};

const stripe= require('stripe')(keyStripe.private);
const m= require('dayjs');

const userSearch= async uid => {                   //Function for search user in database
  let found= false;
  let message= "";
  try {
    const cliDoc= await clients.doc( uid ).get();
    found= cliDoc.exists;
    if(!cliDoc.exists){
      const udata= (await auth().getUser(uid)).toJSON();
      delete udata.uid;
      delete udata.providerData;                           //delete array providerDAta
      Object.keys(udata).forEach(key => udata[key] === undefined ? delete udata[key] : {});  //delete undefined fields
      const newClient = {                                     //Create new user object
        sid: "",
        cart: [],
        wish: [],
        uaddr: {},
        uphone: "",
        udata: udata
      };
      await clients.doc(uid).set(newClient);
      found= true; 
    }
  } catch (err) { message= String(err); found= false; console.log(35, err);   }                                      
  return { found , message };                                               //Return if data is found
};

const getMXN= ( num= 0 ) =>{
  return (num/100.0).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

router.post('/create-session', async (req,res)=>{
  let status= false;
  let data= { };
  try {
    if(req.body){ 
      const { uid , ship , name, email, phone , addr } = req.body;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){

        const cliSnap= await clients.where('__name__', '==' , uid ).select('cart','sid').get();
        let { cart , sid } = cliSnap.docs[0].data();
        if( cart && cart.length > 0 ){
          const ids= cart.map( el=> el[0] );
          const prodSnap= await products.select('purl','cost','mname','desc').where('__name__','in',ids).get();

          const line_items= [];
          prodSnap.forEach( snap =>{
            const qty= cart.filter( prod => prod[0] == snap.id )[0][1];
            const item= snap.data();
            line_items.push({                                       //fill array with each product from cart array 
              name: item.mname,
              currency: 'mxn',
              amount: item.cost * 100,
              quantity: qty,
              images: [item.purl],
              description: item.desc || " "
            });
          });

          if( !sid || (sid && 0 >= sid.length ) ){
            const { id: newID } = await stripe.customers.create({
              name: name, 
              email: email, 
              phone: ship ? phone : undefined,
              address: ship ? addr : undefined, 
              shipping: ship ? { address: addr, name: name , phone: phone } : undefined
            });
            await clients.doc(uid).update({
              sid: newID, 
              uaddr:  ship ? addr : {},
              uphone: ship ? phone : {},
            });
            sid= newID;
          }
          const session = await stripe.checkout.sessions.create({          
            payment_method_types: ['card'],                           
            mode: "payment",
            customer: sid,
            line_items: line_items,
            locale: 'auto',
            payment_intent_data: {
              shipping: ship ? { address: addr, name: name , phone: phone } : undefined
            },
            success_url: `${IP[1]}/driveshop5/us-central1/shop/APIshop/check/endok-session?cid={CHECKOUT_SESSION_ID}&hid=${  m().unix() }&ship=${ ship }`,
            cancel_url: `${IP[0]}/pages/cart/index.html`,
          });
          data= { publicKey: keyStripe.public , sessionId: session.id };
          status= true;
        };
      };
    };
  } catch (err) { data= err.message; status= false; console.log(380, err); };
  res.json({ status , data });
});

router.get('/endok-session', async (req,res)=>{
  let status= false;
  let data= "";
  try {
    if(req.query){ 
      const { cid , hid , ship } = req.query;
   
      const { payment_intent , customer , display_items , amount_total } = await stripe.checkout.sessions.retrieve( cid );   //Extract session object form checkout id
      const { shipping } = await stripe.paymentIntents.retrieve( payment_intent );

      const cliSnap= await clients.where('sid', '==' , customer ).select('uid','cart').get();
      const { cart } = cliSnap.docs[0].data();
      const uid= cliSnap.docs[0].id;
      if( uid && cart && cart.length > 0 ){
        const ids= cart.map( el=> el[0] );

        const prodSnap= await products.select('mname','qty','clas').where('__name__','in',ids).get();
  
        let allCart= [];
        prodSnap.forEach( snap =>{
          const select= cart.filter( prod => prod[0] == snap.id )[0];
          const item= snap.data();
          item.id= select['0'];
          item.cliQty= select['1'];
          item.equal= false;
          allCart.push(item);
        });
  
        const allEqual= allCart.map( prod =>{
          const found= display_items.filter( el=> el.custom.name == prod.mname && el.quantity == prod.cliQty );
          return found[0] ? true : false;
        }).reduce( (acc, el) => acc && el );
  
        if(allEqual){
          const myPromises= [];
  
          allCart.forEach( prod => {
            const qty= prod.qty - prod.cliQty;
            const clas= qty > 0 ? prod.clas : "agotado"
            const proms= products.doc( prod.id ).update({ qty: qty , clas: clas });
            myPromises.push( proms );
          });
          const newSale= {                                     //Create new sale object
            uid:          uid,                                          //Save uid client, checkout id, products list and date
            sid:          customer,
            hour_id:      hid,
            checkout_id:  cid,
            pay_id:       payment_intent,
            total:        amount_total,
            products:     cart,
            cliAdrress:   shipping,
            ship:         ship,
            created_at:   m().unix()
          };
          myPromises.push( sales.add( newSale ) );
          myPromises.push( clients.doc(uid).update({ cart: [] }) )
  
          await Promise.all(myPromises); 
          status= true; 
          data= cid;
        };
      };
    };
  } catch (err) { data= err.message; status= false; console.log(450, err); };
  res.redirect( status ? `${IP[0]}/pages/cart/resume.html?cid=${data}` : `${IP[0]}/pages/cart/pages/error/` );
});

router.get('/resume', async (req, res) => {                     //If user save your checkout id then page show...
  let status= false;
  let data= { name: "" , purl: "", products: {} , total: 0 , tid: ""  };
  try {
    if( req.query ){
      const { cid }= req.query;
      const { customer , display_items , amount_total , id } = await stripe.checkout.sessions.retrieve( cid );
      const cliSnap= await clients.where('sid', '==' , customer ).select('udata.displayName','udata.photoURL').get();
      const { udata } = cliSnap.docs[0].data();

      data.name= (udata.displayName.split(" "))[0];
      data.purl= udata.photoURL;
      data.products= display_items.map( el => { 
        return { 
          amount: getMXN( el.amount ),
          currency: el.currency,
          custom: el.custom,
          quantity: el.quantity,
          type: el.type,
        }
      });
      data.total = getMXN( amount_total );
      data.tid= id;
      status= true;
    }
  } catch (err) { data= err.message; status= false; console.log(480, err); };
  res.json({ status , data });
});

module.exports = router;