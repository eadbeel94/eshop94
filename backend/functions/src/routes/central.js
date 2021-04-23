
const { config }= require('firebase-functions');
const { Router } = require("express");
const router= Router();

const { firestore , auth }= require('firebase-admin');
const categories= firestore().collection('cats');
const products= firestore().collection('prods');
//const clients= firestore().collection('clis');
//const sales= firestore().collection('sales');

let IP= ["",""]
if (process.env.NODE_ENV !== 'production') {
  IP= [`http://localhost:8080`,`http://localhost:5001`];
}else{
  IP= [``,``];
};

router.get('/get-same', async (req,res)=>{      // common
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

router.get('/get-news', async (req,res)=>{      //  news
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

router.get('/get-article', async (req,res)=>{    //getArticle
  let status= false;
  let data;
  try {
    if(req.query.pid){ 
      const pid = req.query.pid;
      const prodSnap= await products.select('clas','cost','desc','mname','purl','qty','type','ver','year').where('__name__', '==' , pid).get();
      const prod = prodSnap.size > 0 ? prodSnap.docs[0].data() : {};

      data= { prod };
      status= true;
    }
  } catch (err) { data= err.message; status= false; console.log(160, err); };
  res.json({ status , data });
});

router.get('/search-articles', async (req,res)=>{ //articles
  let status= false;
  let data= { prods: false };
  try {
    if( req.query.fr && ( req.query.fr == "c" || req.query.fr == "p" || req.query.fr == "s" || req.query.fr == "t" ) ){
      let { fr: type , cr: criterio }= req.query;

      let prodSnap= { size: 0 };
      if( type == "c" ){
        prodSnap= await products.select('purl','cost','mname','ver','clas','type').where('clas','==',criterio).get();
      }
      if(type == "p" && !isNaN( criterio ) ){
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
    }
    status= true      //  }else throw { message: "Solicitud imposible de procesar" }
  } catch (err) { data= err.message; status= false; console.log(200, err); };
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