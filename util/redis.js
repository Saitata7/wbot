require('dotenv').config();
const redis = require('redis');

class Redis{

    constructor(){
        this.client = redis.createClient({
                url: 'redis://'+process.env.REDIS_HOST+':'+process.env.REDIS_PORT
        });
        this.client.on('error', (err) => console.log(err));
        this.client.connect();
    }

    // This fucntion gets the price invested (USDT rate) on from the DB
    GetPriceInvested(){
        return this.client.get("rate");
    }

    // This fucntion sets the price invested (USDT rate) on from the DB
    SetPriceInvested(rate){
        this.client.set("rate",rate);
    }

    GetOpenOrderId(){
        return this.client.get("id");
    }
    
    GetSide(){
        return this.client.get("side");
    }

    SetOpenOrderId(id){
        this.client.set("id",id);
    }
    
    SetSide(side){
        this.client.set("side",side);
    }

    DeleteKey(key){
        this.client.del(key);
    }

    Quit(){
        this.cliet.quit();
    }
}

module.exports=Redis;