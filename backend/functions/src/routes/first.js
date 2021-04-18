
const { Router } = require("express");
const router= Router();

const m= require('dayjs');

const { firestore , auth }= require('firebase-admin');
const categories= firestore().collection('cats');
const products= firestore().collection('prods');
const clients= firestore().collection('clis');

const userSearch= async uid => {                   //Function for search user in database
  let found= false;
  let message= "";
  try {
    //const snap= await clients.where( 'udata.uid' , '==' , uid ).get();
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
        udata: udata
      };
      //console.log( newClient )
      await clients.doc(uid).set(newClient);
      found= true; 
    }
  } catch (err) { message= String(err); found= false; console.log(35, message);   }                                      
  return { found , message };                                               //Return if data is found
};

const genconters= list =>{
  const reducer= elements => {
    let accum= 0;
    elements.forEach( el=> accum= accum + el[1] );
    return accum;
  };
  const wish= list.wish.length > 0 ? reducer(list.wish) : 0;
  const cart= list.cart.length > 0 ? reducer(list.cart) : 0;
  return { wish , cart }
}

router.get('/init', async (req,res)=>{
  let status= false;
  let data;
  try {
    const types= [];
    const catSnap = await categories.select('name','ord').orderBy('ord','asc').get();
    const catDocs = catSnap.docs;
    for (const i in catDocs) types.push( catDocs[i].data() );

    const names= [];
    const prodSnap = await products.select('mname').orderBy('mname','asc').get();
    const prodDocs = prodSnap.docs;
    for (const i in prodDocs) names.push( String(prodDocs[i].data().mname).toUpperCase() );

    const news= [];
    const newsProdSnap = await products.select('purl','cost','mname','ver','clas','new').where('new','==',true).limit(4).get();    //.where('new','==',true)
    newsProdSnap.docs.forEach( el=>{
      const info= el.data();
      info.id= el.id;
      info.algo= m( el.updateTime.toMillis() ).format();
      info.algo2= m().format();
      news.push( info );
    });

    data= { types , names , news };
    status= true;
  } catch (err) { data= err.message; status= false; console.log(60, data); };
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
        data= genconters( list );
        status= true;
      }
    }
  } catch (err) { data= err.message; status= false; console.log(76, data); };
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
        const anytype= type === "cart" ? "cart" : "wish";
        const cliSnap= await clients.where('__name__', '==' , uid ).select(anytype).get();
        const list = cliSnap.docs[0].data()[anytype];

        const found= list.filter( el => {
          amount= amount + el[1];
          if( el[0] == prod ) return el[1]++;
        });
        !found.length && list.push({ 0: prod , 1: 1 });

        clients.doc(uid).update({ [anytype]: list });
        data= { [anytype]: amount }
        status= true;
      }
    }
  } catch (err) { data= err.message; status= false; console.log(76, data); };
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