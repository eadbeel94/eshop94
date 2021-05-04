/** @namespace route/cart */

const { Router } = require("express");
const router= Router();

const { firestore }= require('firebase-admin');
const products= firestore().collection('prods');
const clients= firestore().collection('clis');

const { 
  userSearch, 
  genConters 
}= require('../helper.js');

/* ------------------------------------------------------------------------------------------------------------------------ */

/**
 * Get wish list and cart list counters
 *
 * @name get-cli-counter
 * @path {GET} /APIshop/cart/get-cli-counters
 * @query {String} [id] get user id for search in database
 * @response {Boolean} status if query database complety successfully
 * @response {Object} data both counters getting from database query result
 * @memberof route/cart
 */
router.get('/get-cli-counters', async (req,res)=>{    //getCart
  let status= false;
  let data;
  try {
    if(req.query.id){ 
      const uid = req.query.id;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message };
      if( found ){
        const cliSnap= await clients.where('__name__', '==' , uid ).select('cart','wish').get();
        const list = cliSnap.docs[0].data();
        data= genConters( list );
        status= true;
      }
    }
  } catch (err) { data= err.message; status= false; console.log(25, err); };
  req.query.accepted && clients.doc(req.query.id).update({ accepted: req.query.accepted }).then();
  res.json({ status , data });
});

/* ------------------------------------------------------------------------------------------------------------------------ */

/**
 * Get list of products from wish or cart list
 *
 * @name get-cli-cart
 * @path {GET} /APIshop/cart/get-cli-cart
 * @query {String} [id] get user id for search in database
 * @query {String} [type] select list from get products
 * @response {Boolean} status if query database complety successfully
 * @response {Object} data all products getting from database query result
 * @memberof route/cart
 */
router.get('/get-cli-cart', async (req,res)=>{
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
  } catch (err) { data= err.message; status= false; console.log(70, err); };
  res.json({ status , data });
});

/* ------------------------------------------------------------------------------------------------------------------------ */

/**
 * Add just a product in database based on client selection
 *
 * @name add-once-cli-cart
 * @path {POST} /APIshop/cart/add-once-cli-cart
 * @body {Object} Include user id, product id and list select
 * @response {Boolean} status if query database complety successfully
 * @response {Object} data return feedback coount
 * @memberof route/cart
 */
router.post('/add-once-cli-cart', async (req,res)=>{
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
  } catch (err) { data= err.message; status= false; console.log(100, err); };
  res.json({ status , data });
});

/* ------------------------------------------------------------------------------------------------------------------------ */

/**
 * Add 1 or more product in database based on client selection
 *
 * @name add-more-cli-cart
 * @path {PUT} /APIshop/cart/add-more-cli-cart
 * @body {Object} Include user id, product id and quantity elements to add
 * @response {Boolean} status if query database complety successfully
 * @response {Object} data return feedback coount
 * @memberof route/cart
 */
router.put('/add-more-cli-cart', async (req,res)=>{
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
  } catch (err) { data= err.message; status= false; console.log(125, err); };
  res.json({ status , data });
});

/* ------------------------------------------------------------------------------------------------------------------------ */

/**
 * Change value count in client product list database
 *
 * @name mod-cli-cart
 * @path {PUT} /APIshop/cart/mod-cli-cart
 * @body {Object} Include user id, product id, type operation and quantity elements to change
 * @response {Boolean} status if query database complety successfully
 * @response {Object} data return final product couent, final summary counts products and final total summary counter
 * @memberof route/cart
 */
router.put('/mod-cli-cart', async (req,res)=>{        //modCart
  let status= false;
  let data= { prod: 0, qty: 0 , total: 0 };
  try {
    if(req.body){ 
      const { id: uid , prod , oper, type , qty: cliQty } = req.body;
      const { found , message } = await userSearch(uid);
      if( message.length > 2 ) throw { status: false, message: message }
      if( found ){
        const ids= [];
        const cliSnap= await clients.where('__name__', '==' , uid ).select(type).get();
        const prodSnap= await products.where('__name__', '==' , prod ).select('qty').get();
        const { qty }= prodSnap.docs[0].data();
        let list = cliSnap.docs[0].data();

        list[type]= list[type].map( el=>{
          let newEL= el;
          if( el[0] == prod ){
            if( oper == "plus" )        newEL[1]++;
            else if ( oper == "minus" ) newEL[1]= 0 >= newEL[1] ? 0 : newEL[1] - 1;  
            else                        newEL[1]= cliQty > qty && qty > 0 ? Number(qty) : Number(cliQty)

            data.prod= newEL[1];
            if( newEL[1] == 0 )         newEL= undefined;
          }
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
  } catch (err) { data= err.message; status= false; console.log(170, err); };
  res.json({ status , data });
});

/* ------------------------------------------------------------------------------------------------------------------------ */

/**
 * Move a product element from wish list to cart list
 *
 * @name move-cli-cart
 * @path {PUT} /APIshop/cart/move-cli-cart
 * @body {Object} Include user id and product id
 * @response {Boolean} status if query database complety successfully
 * @response {Object} data final count product in cart list
 * @memberof route/cart
 */
router.put('/move-cli-cart', async (req,res)=>{       //moveCart
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
  } catch (err) { data= err.message; status= false; console.log(200, err); };
  res.json({ status , data });
});

/* ------------------------------------------------------------------------------------------------------------------------ */

module.exports = router;