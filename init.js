// This will allow the api key and the private key  to be encrypted
const fs = require('fs');
const Util = require("./util/index");
let util = new Util();

const WRX_API_KEY = "<YOUR WRX API KEY GOES HERE>";
const WRX_SECRET_KEY = "<YOUR WRX SECRET KEY GOES HERE>";

util.GenKeyPair().then((res)=>{
    console.log("Copy this to .env as mentioned in readme.md");
    console.log("---------------------------------------------------------------------------------------------------------------------------------------");
    console.log("ENC_API_KEY="+util.encryptStringWithRsaPublicKey(WRX_API_KEY,res.pubKey)+"\n \n");
    console.log("ENC_SEC_KEY="+util.encryptStringWithRsaPublicKey(WRX_SECRET_KEY,res.pubKey)+"\n \n");
    console.log("PASSPHRASE="+res.phrase);
    console.log("REDIS_HOST=your host name goes here eg localhost");
    console.log("REDIS_PORT=your port  goes here eg 6379");
    console.log("---------------------------------------------------------------------------------------------------------------------------------------");
    console.log("Do not share and the pub.key and private.key has been generated in the project directory");
    fs.writeFileSync("pub.key", res.pubKey);
    fs.writeFileSync("private.key", res.pvtKey);
}).catch((error)=>{
    console.log("Error : "+error);
});