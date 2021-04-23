
const { config }= require('firebase-functions');
const { Router } = require("express");
const router= Router();

const { firestore , auth }= require('firebase-admin');
const categories= firestore().collection('cats');
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

const genConters= list =>{
  const reducer= elements => {
    let accum= 0;
    elements.forEach( el=> accum= accum + Number(el[1]) );
    return accum;
  };
  const wish= list.wish.length > 0 ? reducer(list.wish) : 0;
  const cart= list.cart.length > 0 ? reducer(list.cart) : 0;
  return { wish , cart }
}

const getMXN= ( num= 0 ) =>{
  return (num/100.0).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

router.get('/common', async (req,res)=>{
  let status= false;
  let data;
  try {
    const types= [];
    const catSnap = await categories.select('name','type').orderBy('ord','asc').get();
    const catDocs = catSnap.docs;
    for (const i in catDocs) types.push( catDocs[i].data() );

    const names= [];
    const prodSnap = await products.select('mname').orderBy('mname','asc').get();
    const prodDocs = prodSnap.docs;
    for (const i in prodDocs) names.push( String(prodDocs[i].data().mname).toUpperCase() );

    data= { types , names };
    status= true;
  } catch (err) { data= err.message; status= false; console.log(80, err); };
  res.json({ status , data });
});

router.get('/news', async (req,res)=>{
  let status= false;
  let data;
  try {
    const news= [];
    const newsProdSnap = await products.select('purl','cost','mname','ver','clas','new').where('new','==',true).limit(4).get();    //.where('new','==',true)
    newsProdSnap.docs.forEach( el=>{
      const info= el.data();
      info.id= el.id;   //m( el.updateTime.toMillis() ).format();
      news.push( info );
    });
    data= { news };
    status= true;
  } catch (err) { data= err.message; status= false; console.log(100, err); };
  res.json({ status , data });
});

router.get('/articles', async (req,res)=>{
  let status= false;
  let data;
  try {
    if( req.query.fr && ( req.query.fr == "c" || req.query.fr == "p" || req.query.fr == "s" || req.query.fr == "t" ) ){
      let { fr: type , cr: criterio }= req.query;

      let prodSnap;
      if( type == "c" ){
        prodSnap= await products.select('purl','cost','mname','ver','clas','type').where('clas','==',criterio).get();
      }
      if(type == "p"){
        const compSnap= await products.orderBy('mname').get();
        const qty= 4;
        if( 1 >= criterio )
          prodSnap= await products.select('purl','cost','mname','ver','clas').orderBy('mname').limit(qty).get();
        else{
          let ord= qty * ( criterio - 1 );
          ord= ord > compSnap.size ? compSnap.size - qty : ord;
          const offsetSnap= await products.select('mname').orderBy('mname').limit( ord ).get();
          const lastSnap = offsetSnap.docs[ ord - 1 ];
          prodSnap= await products.select('purl','cost','mname','ver','clas').orderBy('mname').startAfter(lastSnap.data().mname).limit(qty).get();
        }
      }
      if(type == "s"){
        prodSnap= await products.select('mname').get();
        const ids= prodSnap.docs.filter(el => String(el.data().mname).toUpperCase().indexOf(criterio) > -1 ).map( el => el.id );
        if( ids.length > 0 )
          prodSnap= await products.select('purl','cost','mname','ver','clas').where('__name__','in',ids).get();
        else
          prodSnap= [];
      }
      if(type == "t"){
        prodSnap= await products.select('purl','cost','mname','ver','clas','type').where('type','==',criterio).get();
      }
      const prods= [];
      if( prodSnap.size ){
        prodSnap.docs.forEach( el=>{
          const info= el.data();
          info.id= el.id;   //m( el.updateTime.toMillis() ).format();
          prods.push( info );
        });
      }
      data= { prods };
      status= true;
    };
  } catch (err) { data= err.message; status= false; console.log(200, err); };
  res.json({ status , data });
});

router.get('/getCart', async (req,res)=>{
  let status= false;
  let data;
  try {
    if(req.query.id){ 
      const uid = req.query.id;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        const cliSnap= await clients.where('__name__', '==' , uid ).select('cart','wish').get();
        const list = cliSnap.docs[0].data();
        data= genConters( list );
        status= true;
      }
    }
  } catch (err) { data= err.message; status= false; console.log(120, err); };
  res.json({ status , data });
});

router.get('/getClient', async (req,res)=>{
  let status= false;
  let data= { };
  try {
    if(req.query.id && req.query.type){ 
      const { id:uid , type } = req.query;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        data[type]= [];
        
        if( type == "cart" ){
          data.allQty= 0;
          data.total= 0;
        }
        const cliSnap= await clients.where('__name__', '==' , uid ).select( type ).get();
        const list = cliSnap.docs[0].data();
        if( list[type] && list[type].length > 0 ){
          const ids= list[type].map( el=> el[0] );
          const prodSnap= await products.select('purl','cost','mname','ver','clas','desc').where('__name__','in',ids).get();    //select('purl','cost','mname','ver','clas','new')
          //const newCart= [];
          prodSnap.forEach( snap =>{
            const select= list[type].filter( prod => prod[0] == snap.id )[0];
            const item= snap.data();

            item.id= select['0'];
            data[type].push(item);

            if( type == "cart" ){
              item.cliQty= select['1'];
              data.allQty+= item.cliQty;
              data.total+= item.cliQty * item['cost'];
            }
          });
        }
        status= true;
      }
    }
  } catch (err) { data= err.message; status= false; console.log(250, err); };
  res.json({ status , data });
});




router.get('/getArticle', async (req,res)=>{
  let status= false;
  let data;
  try {
    if(req.query.pid){ 
      const pid = req.query.pid;
      const prodSnap= await products.select('clas','cost','desc','mname','purl','qty','type','ver','year').where('__name__', '==' , pid).get();
      const prod = prodSnap.docs[0].data();

      data= { prod };
      status= true;
    }
  } catch (err) { data= err.message; status= false; console.log(160, err); };
  res.json({ status , data });
});

router.post('/addCart', async (req,res)=>{
  let status= false;
  let data;
  try {
    if(req.body.id){ 
      const { id: uid , prod , type }= req.body;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        let amount= 1;
        let same= 0;
        const anyType= type === "cart" ? "cart" : "wish";
        const cliSnap= await clients.where('__name__', '==' , uid ).select(anyType).get();
        const list = cliSnap.docs[0].data()[anyType];

        const found1= list.filter( el => {
          amount= amount + el[1];
          same++;
          if( el[0] == prod && anyType == "cart" ) return el[1]++;
          if( el[0] == prod && anyType != "cart" ) return true;
        });
        !found1.length && list.push({ 0: prod , 1: 1 });
        !found1.length && same++;

        await clients.doc(uid).update({ [anyType]: list });
        data= { [type]: type === "cart" ? amount : same };
        status= true;
      }
    }
  } catch (err) { data= err.message; status= false; console.log(150, err); };
  res.json({ status , data });
});

router.put('/add2Cart', async (req,res)=>{
  let status= false;
  let data= { cart: 0 };
  try {
    if(req.body){ 
      const { id: uid , prod , qty }= req.body;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        const cliSnap= await clients.where('__name__', '==' , uid ).select('cart').get();
        const { cart } = cliSnap.docs[0].data();

        const found1= cart.filter( el => { if( el[0] == prod ) { return el[1]= Number(qty); }; });
        !found1.length && cart.push({ 0: prod , 1: Number(qty) });

        cart.forEach( el => { data.cart= data.cart + el[1] });
        await clients.doc(uid).update({ cart });
        status= true;
      }
    }
  } catch (err) { data= err.message; status= false; console.log(150, err); };
  res.json({ status , data });
});

router.put('/changeCart', async (req,res)=>{
  let status= false;
  let data= { prod: 0, qty: 0 , total: 0 };
  try {
    if(req.body){ 
      const { id: uid , prod , oper, type , qty } = req.body;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        const ids= [];
        const cliSnap= await clients.where('__name__', '==' , uid ).select(type).get();
        let list = cliSnap.docs[0].data();

        list[type]= list[type].map( el=>{
          let newEL= el;
          if( el[0] == prod ){
            if( oper == "plus" )        newEL[1]++;
            else if ( oper == "minus" ) newEL[1]= newEL[1] == 0 ? 0 : newEL[1] - 1;  
            else                        newEL[1]= Number(qty);

            data.prod= newEL[1];
            if( newEL[1] == 0 )         newEL= undefined;
          }
          //data.qty+= newEL ? newEL['1'] : 0;
          return newEL
        }).filter( el =>{ if(el){ data.qty+= Number(el[1]); ids.push( el[0] ); return el; } });

        await clients.doc(uid).update({ [type]: list[type] });

        if( list.cart && list.cart.length > 0 ){
          const prodSnap= await products.select('cost').where('__name__','in',ids).get();
          prodSnap.forEach( snap => list.cart.filter( prod => prod[0] == snap.id && (data.total+= prod[1] * snap.data()['cost']) ))
        }
        status= true;
      };
    };
  } catch (err) { data= err.message; status= false; console.log(290, err); };
  res.json({ status , data });
});

router.put('/moveCart', async (req,res)=>{
  let status= false;
  let data= { };
  try {
    if(req.body){ 
      const { id: uid , prod } = req.body;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        let amount= 1;
        const cliSnap= await clients.where('__name__', '==' , uid ).select('cart','wish').get();
        let { cart, wish } = cliSnap.docs[0].data();

        wish= wish.filter( el=> el[0] != prod );

        const found= cart.filter( el => {
          amount= amount + el[1];
          if( el[0] == prod ) return el[1]++;
        });
        !found.length && cart.push({ 0: prod , 1: 1 });

        await clients.doc(uid).update({ cart , wish });
        data= { cart: amount };
        status= true;
      };
    };
  } catch (err) { data= err.message; status= false; console.log(320, err); };
  res.json({ status , data });
});






router.post('/create-checkout-session', async (req,res)=>{
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
            success_url: `${IP[1]}/driveshop5/us-central1/shop/APIshop/first/endok-checkout-session?cid={CHECKOUT_SESSION_ID}&hid=${  m().unix() }&ship=${ ship }`,
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

router.get('/endok-checkout-session', async (req,res)=>{
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

/*
(async ()=>{
  
  const snapshot = await categories.get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });


  const res = await categories.add({
    name: 'Tokyo',
    country: 'Japan'
  });


  try {
    //const fs= require('fs');
    //const path= require('path');
    //let info= fs.readFileSync( path.join(  __dirname , '../../../../other/la-liga-coleccionable-export.json' ) );

    info = JSON.parse( info.toString() );
    const cats= Object.entries( info.cats ).map( el => el[1] )
    for (let i = 0; i < cats.length; i++) {
      await categories.add({
        ord: cats[i]['number'],
        name: cats[i]['title'],
        type: cats[i]['type']
      })
    }

    info = JSON.parse( info.toString() );
    const prods= Object.entries( info.prod ).map( el => el[1] )
    for (let i = 0; i < 10; i++) {
      await products.add({
        clas:   prods[i]['classify']    || '',
        cpath:  prods[i]['cloudpath']   || '',
        cost:   prods[i]['value']       || '',
        desc:   prods[i]['description'] == "undefined" ? '' : prods[i]['description'],
        mname:  prods[i]['name']        || '',
        nname:  prods[i]['newname']     || '',
        oname:  prods[i]['oldname']     || '',
        new:    true,
        purl:   prods[i]['publicurl']   || '',
        qty:    prods[i]['quantity']    || '',
        type:   prods[i]['type']        || '',
        upl_at: prods[i]['uploaded_at'] || '',
        ver:    prods[i]['version']     || '',
        year:   prods[i]['year']        || ''
      })
    }

  } catch (err) {
    console.log( 27 , err )
  }

})()
*/