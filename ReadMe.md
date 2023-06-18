# Wbot

## Pre Requistes

1) Node version 12.x or above is required
2) Redis https://redis.io/download
3) Recommended : Go to fee settings and enable pay trading fees with WRX to get 50% discount on trading

## How to use it

`npm install`

Head over to wrx and get the api key and private key  

1) Go to `init.js` and add the real key and token which is geenrated by wrx platform , then run

`npm run init > env`

2) In the project folder you will have to genrate  a `.env` file , store the required data as below , this will be generated as you run the above command

```
ENC_API_KEY=
ENC_SEC_KEY=
PASSPHRASE=
REDIS_HOST=example localhost
REDIS_PORT=example 6379
```

You can run 

`mv env .env`

NOTE: change redis host to the real redis host name example `REDIS_HOST=localhost` and `REDIS_PORT=6379`

3) The privatekey file and public key file will be generated in the root of the  project directory 

4) Run `npm run start`


## Note

1) The bot uses redis to get and set the price invested in so if you manuelly change add a order or set a order for usdt to inr , please change the key value 'rate' to the appropiate , or you can set it to -1 ,s o the bot will treat it as not invested. the bot will anyways warn you .

2) This bot is designed to get profits for stable coin USDT to INR, if you wanna be trade more safe please set level to to 1 or max 2 (depnds on the market)

3) While the bot is running , if you go to wrx app to place or remove the order , please restart the bot, as the bot is not designed with that.