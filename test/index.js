var assert = require('assert');
const Util = require("../util/index");
const util = new Util();
require('dotenv').config()
const Redis = require("../util/redis");

const WRX_API_KEY = util.decryptStringWithRsaPrivateKey(process.env.ENC_API_KEY,"private.key",process.env.PASSPHRASE);
const WRX_SEC_KEY = util.decryptStringWithRsaPrivateKey(process.env.ENC_SEC_KEY,"private.key",process.env.PASSPHRASE);

describe('Redis test', function() {
    let redis;
    before(async()=>{
        redis = new Redis();
    });

    it('Get rate value in redis',async() => {
        console.log(await redis.GetSide());
    });

    it('Get rate value in redis',async() => {
        await redis.SetPriceInvested("-1");
        const  result = await redis.GetPriceInvested();
        assert.equal("-1",result,"Result is not okay");
    });
});


/*describe('WRX api test', function() {

    it('Get funds',async() => {
        let INR = -1;
        let USDT = -1;
        const result = await util.GetCurrentFundsFromWallet(WRX_API_KEY,WRX_SEC_KEY);
        for(let i=0;i<result.length;i++){
            let asset = result[i].asset;
            if(asset==="inr"){
                INR = result[i].free;
            }
            if(asset==="usdt"){
                USDT = result[i].free;
            }
        }
        assert.notEqual(INR,-1,"INR value is not okay");
        assert.notEqual(USDT,-1,"USDT value is not okay");
    });

    it('Place order INR to USDT ',async() => {
        //Quantity will be taken into usdt
        const data = await util.GetCurrentUSDTtoINRdata();
        const response  = util.PlaceSpotOrder('usdtinr','buy',5,Number(data.askPrice),WRX_API_KEY,WRX_SEC_KEY);
        response.then((result)=>{
            console.log(result);
        }).catch((error)=>{
            console.log(error);
        })
    });

    it('Place order USDT to INR ',async() => {
        //Quantity will be taken into usdt
        const data = await util.GetCurrentUSDTtoINRdata();
        const response  = util.PlaceSpotOrder('usdtinr','sell',5,Number(data.askPrice),WRX_API_KEY,WRX_SEC_KEY);
        response.then((result)=>{
            console.log(result);
        }).catch((error)=>{
            console.log(error);
        })
    });

    
});*/

