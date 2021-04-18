const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.urlencoded({extended: false}));                
app.use(express.json()); 
app.use('/APIshop/first', require('./routes/first.js') );    //Only accept one route
//app.use((req, res, next) => {  res.status(404).redirect('/404.html');  });  //If user access to route not declare, this is redirect with error message

module.exports= app;