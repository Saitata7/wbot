var crypto = require("crypto");
const { generateKeyPair } = require('crypto');
var path = require("path");
var fs = require("fs");
const https = require('https')


function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function GetRequest(options){
    return new Promise((resolve, reject) => {
          
        const req = https.request(options, res => {
            let str = "";

            res.on('data', function (chunk) {
                str += chunk.toString();
            });

            res.on('end', d => {
                try{
                    let json = JSON.parse(str);
                    resolve(json);
                }catch(err){
                    reject("Some malformed JSON has been returned by wrx as "+ err);
                }
            })
        })
          
        req.on('error', error => {
            reject(error);
        })
          
        req.end()
    });
          
}

function GenKeyPair(){
    return new Promise((resolve, reject) => {
        const passphrase = randomString(50);
        generateKeyPair('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
            },
            privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: passphrase
            }
        }, (err, publicKey, privateKey) => {
            if(err){
                reject(err);
            }else{
                resolve({
                    pubKey:publicKey,
                    pvtKey:privateKey,
                    phrase:passphrase
                });
            }
        });
    });
}

class Util{

    GenKeyPair(){
        return GenKeyPair();
    }

    encryptStringWithRsaPublicKey(toEncrypt, publicKey) {
        var buffer = Buffer.from(toEncrypt);
        var encrypted = crypto.publicEncrypt(publicKey, buffer);
        return encrypted.toString("base64");
    }

    decryptStringWithRsaPrivateKey(toDecrypt, relativeOrAbsolutePathtoPrivateKey,passp) {
        var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
        var privateKey = fs.readFileSync(absolutePath, "utf8");
        var buffer = Buffer.from(toDecrypt, "base64");
        var decrypted = crypto.privateDecrypt({key:privateKey,passphrase:passp}, buffer);
        return decrypted.toString("utf8");
    }

    GetCurrentUSDTtoINRdata(){
        const options = {
            hostname: 'api.wazirx.com',
            path: '/sapi/v1/ticker/24hr?symbol=usdtinr',
            method: 'GET'
        }
        return GetRequest(options);
    }

    GetOpenOrders(WRX_API_KEY,WRX_SEC_KEY){
        const Payload ={
            'symbol':'usdtinr',
            'limit':2,
            'recvWindow':20000,
            'timestamp':Date.now()
        }
        const signature =crypto.createHmac('sha256', WRX_SEC_KEY).update('symbol='+Payload.symbol+'&limit='+Payload.limit+'&recvWindow='+Payload.recvWindow+'&timestamp='+Payload.timestamp).digest('hex');
        const options = {
            hostname: 'api.wazirx.com',
            path: '/sapi/v1/openOrders?symbol='+Payload.symbol+'&limit='+Payload.limit+'&recvWindow='+Payload.recvWindow+'&timestamp='+Payload.timestamp+'&signature='+signature,
            method: 'GET',
            headers: {
                'X-Api-Key': WRX_API_KEY
            }
        }
        return GetRequest(options);
    }

    // Get the USDT amount available in your wrx amount
    GetCurrentFundsFromWallet(WRX_API_KEY,WRX_SEC_KEY){
        const Payload ={
            'recvWindow':20000,
            'timestamp':Date.now()
        }
        const signature =crypto.createHmac('sha256', WRX_SEC_KEY).update('recvWindow='+Payload.recvWindow+'&timestamp='+Payload.timestamp).digest('hex');
        const options = {
            hostname: 'api.wazirx.com',
            path: '/sapi/v1/funds?recvWindow='+Payload.recvWindow+'&timestamp='+Payload.timestamp+'&signature='+signature,
            method: 'GET',
            headers: {
                'X-Api-Key': WRX_API_KEY
            }
        }
        return GetRequest(options);
    }

    //Place order to the wrx api
    PlaceSpotOrder(FromTo,side,amount,rate,WRX_API_KEY,WRX_SEC_KEY){
        const Payload ={
            'symbol' : FromTo,
            'side' : side,
            'type' : "stop_limit",
            'quantity' : amount,
            'price' : rate,
            'stop_price' : rate,
            'recvWindow':20000,
            'timestamp':Date.now()
        }
        const signature =crypto.createHmac('sha256', WRX_SEC_KEY).update('symbol='+Payload.symbol+"&side="+Payload.side+"&type="+Payload.type+"&quantity="+Payload.quantity+"&price="+Payload.price+"&stop_price="+Payload.stop_price+"&recvWindow="+Payload.recvWindow+"&timestamp="+Payload.timestamp).digest('hex');
        const options = {
            hostname: 'api.wazirx.com',
            path: '/sapi/v1/order?symbol='+Payload.symbol+"&side="+Payload.side+"&type="+Payload.type+"&quantity="+Payload.quantity+"&price="+Payload.price+"&stop_price="+Payload.stop_price+"&recvWindow="+Payload.recvWindow+"&timestamp="+Payload.timestamp+'&signature='+signature,
            method: 'POST',
            headers: {
                'X-Api-Key': WRX_API_KEY
            }
        }
        return GetRequest(options);

    }

}

module.exports = Util;