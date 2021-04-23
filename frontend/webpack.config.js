const { join }= require('path');
const { readFileSync }= require('fs');
const prod= process.env.NODE_ENV === 'production';

const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin= require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const orgPath= './src/pages/';
const desPath= './www/';
const outFiles= [{},[]];
const inpFiles= [
  ['main','01-main','/index.html'],
  ['error','05-error','/404.html'],
  ['about','07-about','/pages/about/index.html'],
  ['privacity','08-privacity','/pages/privacity/index.html'],
  ['articles','11-articles','/pages/articles/index.html'],
  ['product','12-product','/pages/product/index.html'],
  ['cart','15-cart','/pages/cart/index.html'],
  ['resume','16-resume','/pages/cart/resume.html'],
  ['wish','17-wish','/pages/wish/index.html']
]
outFiles[0]['common']= './src/js/common.js';

inpFiles.forEach( r =>{  
  //fse.readdirSync( path.join(__dirname, orgPath) ).forEach( name =>{
  outFiles[0][`${r[0]}`]= orgPath + r[1] + '/app.js';
  outFiles[1].push( new HtmlWebpackPlugin({
    template: join( __dirname, orgPath, r[1], 'index.html' ),
    filename: join( __dirname, desPath, r[2] ),
    chunks: ['common',`${r[0]}`],
    templateParameters: {
      htmlWebpackPlugin: {
        tags: {
          title: "Eshop 94",
          header: readFileSync( join( __dirname, './src/template/header.html' ) ),
          footer: readFileSync( join( __dirname, './src/template/footer.html' ) ),
          icon: `<link rel="icon" href="/img/favicon.ico">`,
          tcard: readFileSync( join( __dirname, './src/template/t_card.html' ) ),
          tmodal: readFileSync( join( __dirname, './src/template/t_modal.html' ) ),
          tspinner: readFileSync( join( __dirname, './src/template/t_spinner.html' ) ),
          tscripts: readFileSync( join( __dirname, `./src/template/t_script${ prod ? "P" : "D" }.html` ) ),
          modcookie: readFileSync( join( __dirname, './src/template/t_modCookie.html' ) )
          //IP: prod ? '' : 'http://localhost:3300'
        },
      }
    },
    minify: prod ? {
      collapseWhitespace: true, removeComments: true, removeRedundantAttributes: true,
      removeScriptTypeAttributes: true, removeStyleLinkTypeAttributes: true, useShortDoctype: true
    } : {},
  }) );
});

module.exports= {
  entry: outFiles[0],
  mode: prod ? 'production' : 'development',
  output: {
    path: join(__dirname, 'www'),
    filename: 'js/[name].bundle.js',
    publicPath: '/'
  },
  devServer: {
    contentBase: join(__dirname, 'www') //, hot: false, inline: false,
  },
  module : {
    rules: [
      {
        test: /\.(sass|css|scss)$/,
        use: [prod ? MiniCssExtractPlugin.loader : 'style-loader','css-loader']
      },{
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [{loader: 'file-loader', options:{ outputPath: 'fonts/', name: '[name].[ext]' }}],
      },{
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        use: [{loader: 'file-loader', options:{ outputPath: 'img/', name: '[name].[ext]' }}],
      },
    ]
  },
  plugins: prod ? [ new MiniCssExtractPlugin({ filename: 'css/[name].bundle.css' }) ].concat(outFiles[1]) : outFiles[1],
  optimization: prod ? {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ]
  } : {},
  devtool: 'source-map'
};