const { createProxyMiddleware } = require('http-proxy-middleware');
const { env } = require('process');
var cors = require('cors');

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : process.env.REACT_APP_SERVER;
    console.log(target)
const context =  [
  "/weatherforecast",
    "/api/drawingsearch/GetDrawingByNumber",
    "/api/drawingsearch/AutoBalloon",
    "/api/drawingsearch/ProcessBalloon",
    "/api/drawingsearch/manualprocess",
    "/api/drawingsearch/saveBalloons",
    "/api/drawingsearch/resetBalloons",
    "/api/drawingsearch/deleteBalloons",
    "/api/drawingsearch/rotate",
    "/api/drawingsearch/SplBalloon",
    "/api/drawingsearch/reOrderBalloons",
    "/api/drawingsearch/specificationUpdate",
    "/api/drawingsearch/saveAllBalloons",
    "/api/drawingsearch/specAutoPopulate",
    "/api/drawingsearch/saveControlledCopy",
    "/api/drawingservice/DrawingUrl/",
    "/api/drawingsearch/getallProjects",
    "/api/fileupload/Download",
    "/api/fileupload/FetchDrawing",
    "/api/fileupload/UploadFile",
    "/api/fileupload/search",
    "/api/fileupload/Uploadorsearch",
    "/api/fileupload/presearch",
    "/api/fileupload/block",
    "/api/users/login",
    "/api/users/create",
    "/api/users/update",
    "/api/users/createOwn",
    "/api/users/getallUser",
    "/api/users/userDelete",
    "/socket",
    "/api/balloon/add-characteristic",
    "/api/balloon/add-unit",


  ];

const onError = (err, req, resp, target) => {
    console.error("xxx"+`${err.message}`);
}
const TIMEOUT = 30 * 60 * 1000;
module.exports = function (app) {
    app.use(function (req, res, next) {
     //   res.header("Access-Control-Allow-Origin", "*");
     //   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
     //   res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
   // let username = "11193446";
   // let password = "60-dayfreetrial";
  ///  const encodedCredentials = btoa(`${username}:${password}`);
  const appProxy = createProxyMiddleware(context, {
      proxyTimeout: TIMEOUT,
      onError: onError,
    target: target,
    secure: false,
    headers: {
        Connection: 'Keep-Alive',
      //  'Authorization': `Basic ${encodedCredentials}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    }
  });
    app.use(cors());
    app.use(appProxy);

};
