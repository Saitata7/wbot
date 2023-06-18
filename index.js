
const Util = require("./util/index");
require('dotenv').config()
let util = new Util();
const WRX_API_KEY = util.decryptStringWithRsaPrivateKey(process.env.ENC_API_KEY,"private.key",process.env.PASSPHRASE);
const WRX_SEC_KEY = util.decryptStringWithRsaPrivateKey(process.env.ENC_SEC_KEY,"private.key",process.env.PASSPHRASE);
const Redis = require("./util/redis");
let LEVEL = 1; // More the level more the risk
redis = new Redis();

function GetProfit(USDT_AMOUNT,INR_AMOUNT,PriceInvestedOn){
    if(PriceInvestedOn!==-1){
        // Invested , so INR_AMOUNT will be 0
        return USDT_AMOUNT*PriceInvestedOn;
    }else{
        return INR_AMOUNT;
    }
}

async function  GetUSDT_INR_From_Wallet(){
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
    return {
        "INR":Number(INR),
        "USDT":Number(USDT)
    }
}

async function CheckIfOrderIdIsPresentInOpenOrders(OpenOrder){
    let orders = await util.GetOpenOrders(WRX_API_KEY,WRX_SEC_KEY);
    let IsPresent=false;
    for(let i=0;i<orders.length;i++){
        if(orders[i].id===OpenOrder.OpenOrderId){
            IsPresent = true;
        }
    }
    return IsPresent;
}

function getAvg(level,LowPrice,HighPrice){
    var avg =(LowPrice+HighPrice)/2;
    for(let i=0;i<level;i++){
        avg = (avg+HighPrice)/2
    }
    return avg;
}

util.GetCurrentUSDTtoINRdata().then(async(res)=>{
    let {INR,USDT} = await GetUSDT_INR_From_Wallet();
    const  rate = await redis.GetPriceInvested();
    var PriceInvestedOn = Number(rate);
    // Not invested in USDT but I expect INR is less than  50
    if(rate==="-1" && INR<50){
        console.warn("WARNING :In redis is shows rate as -1 and INR in your wallet is less than RS. 50 , please add money in your wazirx account and restart the bot");
    }else if(rate!=="-1" && USDT<0.001){
        // Invested in usdt but 
        console.warn("WARNING :Redis is showing rate as "+rate+" but you have only have "+USDT+" coins , mismatch check if your account if you have INR but not USDT, change redis rate value to -1 and restart the bot");
    }
    if(LEVEL>3){
        console.warn("WARNING : Your level value is more than 3 , potential loss could be possible or investment deadlock would be possible");
    }
    var PriorCurrentValue = Number(res.askPrice) ; 
    var LowPrice = Number(res.lowPrice);
    var HighPrice = Number(res.highPrice);
    let INR_AMOUNT = INR;
    let USDT_AMOUNT = USDT;
    var avg = getAvg(LEVEL,LowPrice,HighPrice);
    let OpenOrder = {
        "OpenOrderId":await redis.GetOpenOrderId(),
        "side":await redis.GetSide()
    };
    
    let CheckIsPresent = await CheckIfOrderIdIsPresentInOpenOrders(OpenOrder);
    let ContinueWithLogic = true;
    if(CheckIsPresent){
        ContinueWithLogic = false;
    }

    console.log(" -------- Started the Bot ---------");
    console.log(" Current rate USDT to INR : "+PriorCurrentValue);
    setInterval(function(){
        util.GetCurrentUSDTtoINRdata().then(async(response)=>{
            let currentPrice = Number(response.askPrice);

            console.log("Time : "+Date.now()+" PROFIT : "+GetProfit(USDT_AMOUNT,INR_AMOUNT,PriceInvestedOn)+" INR , INR  : "+INR_AMOUNT+ " USDT : "+USDT_AMOUNT +" Current rate USDT to INR : "+currentPrice+" PriceInvestedOn : "+PriceInvestedOn+" PriorCurrentValue: "+PriorCurrentValue+" Avg :"+avg+" OpenOrderId: "+OpenOrder.OpenOrderId+" side : "+OpenOrder.side);

            if(OpenOrder.OpenOrderId!==null){
                // Check if that order is in open orders
                let IsPresent = await CheckIfOrderIdIsPresentInOpenOrders(OpenOrder);
                if(!IsPresent){
                    // Order is not present , it got executed
                    if(OpenOrder.side==="buy"){
                        PriceInvestedOn = currentPrice;
                        await redis.SetPriceInvested(currentPrice.toString());
                    }
                    if(OpenOrder.side==="sell"){
                        PriceInvestedOn = -1
                        await redis.SetPriceInvested("-1");
                    }
                    OpenOrder = {
                        "OpenOrderId":null,
                        "side":null
                    };
                    await redis.DeleteKey("id");
                    await redis.DeleteKey("side");
                    // Continue with bot logic
                    ContinueWithLogic = true;
                }else{
                    // The orders are present , wait ... Inform the user 
                    console.log("WARN : Order with "+OpenOrder.OpenOrderId+" is not executed still");
                    ContinueWithLogic = false;
                }
            }
            if(ContinueWithLogic){
                if(PriceInvestedOn!==-1){
                    // Invested
                    if(PriorCurrentValue>currentPrice){
                        if(PriceInvestedOn<currentPrice){
                            //let NewAmount = USDT_AMOUNT*currentPrice;
                            //let OldAmount = USDT_AMOUNT*PriceInvestedOn;
                            //if((NewAmount - OldAmount)< 0.002*NewAmount){
                            //    console.warn("Not placing an order as the Warizx fess > profit ");
                            //}else{
                                //Place an order to convert USDT to INR now
                                console.log("Placing to order to convert USDT to INR now");
                                const response  = util.PlaceSpotOrder('usdtinr','sell',USDT_AMOUNT,currentPrice,WRX_API_KEY,WRX_SEC_KEY);
                                response.then(async(result)=>{
                                    if(result.code===undefined){
                                        OpenOrder.OpenOrderId = result.id;
                                        OpenOrder.side = result.side;
                                        INR_AMOUNT = USDT_AMOUNT*currentPrice;
                                        USDT_AMOUNT = 0;
                                        await redis.SetPriceInvested("-1");
                                        await redis.SetOpenOrderId(result.id.toString());
                                        await redis.SetSide(result.side);
                                    }else{
                                        console.error(result.message);
                                    }
                                }).catch((error)=>{
                                    console.log("Error to place Order INR to USDT now : "+error);
                                })
                            //}
                        }
                    }
                }else{
                    // not invested
                    if(currentPrice<=avg){
                        //Place an order to convert INR to USD now
                        console.log("Placing to order to convert INR to USDT now");
                        const response  = util.PlaceSpotOrder('usdtinr','buy',INR_AMOUNT/currentPrice,currentPrice,WRX_API_KEY,WRX_SEC_KEY);
                        response.then(async(result)=>{
                           if(result.code===undefined){
                                OpenOrder.OpenOrderId = result.id;
                                OpenOrder.side = result.side;
                                USDT_AMOUNT = INR_AMOUNT/currentPrice;
                                INR_AMOUNT = 0 ;
                                await redis.SetPriceInvested(result.price);
                                await redis.SetOpenOrderId(result.id.toString());
                                await redis.SetSide(result.side);
                           }else{
                               console.error(result.message);
                           }
                        }).catch((error)=>{
                            console.log("Error to place Order INR to USDT now : "+error);
                        })
                    }
                }
            }
            PriorCurrentValue = currentPrice;
            LowPrice = Number(response.lowPrice);
            HighPrice = Number(response.highPrice);
            avg = getAvg(LEVEL,LowPrice,HighPrice);
        }).catch((err)=>{
            console.log(err+"Error to query wrx platform");
        });
    }, 30000)
}).catch((err)=>{
    console.log(err+"Error to query wrx platform");
});
