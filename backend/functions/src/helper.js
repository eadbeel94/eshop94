const { firestore , auth }= require('firebase-admin');
const clients= firestore().collection('clis');

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
        mid: [],
        cart: [],
        wish: [],
        uaddr: {},
        uphone: "",
        udata: udata
      };
      await clients.doc(uid).set(newClient);
      found= true; 
    }
  } catch (err) { message= String(err); found= false; console.log( 30 , err );  };                                      
  return { found , message };                                               //Return if data is found
};

const getMXN= ( num= 0 ) =>{
  return num.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
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
};

module.exports= { userSearch, getMXN, genConters };