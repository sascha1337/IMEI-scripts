const libIMEI = require("./lib/index");
const async = require("async");

const express = require('express')
var cors = require('cors')

const app = express()
app.use(cors())

var admin = require("firebase-admin");
var serviceAccount = require('./generated-atlas-204402-firebase-adminsdk-eo3xi-64cec1c448.json');

const IMEI_GenCheck = require("imei_gencheck");
const imeigc = new IMEI_GenCheck();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://generated-atlas-204402.firebaseio.com"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();

var usersRef = db.ref("users");
var imeisRef = db.ref("imei");

var Q = null;

async function run(){

    var batch = [
        "861273032479827",
        "357219071541713",
        "359754072203556",
        "354385067850609",
        "359231068884566",
        "359202074342824",
        "356708082742790",
        "861273032479827",
        "357219071541713",
        "359754072203556"
    ];

    Q = async.queue(async function(imei, callback){
        console.log("::Q:: Running function for " + imei);
        
        var startTime = Date.now();
        var isClosed = false;
        var isDone = false;

        var checkRef = db.ref("/imei/" + imei);

        checkRef.update({
            status: "running"
        });
        
        // setTimeout(function(){
        //     console.log("::WARNING:: " + imei + " = TIMEOUT");
        //     var runner = libIMEI.pageInstances.find((obj) => obj.imei === imei);
        //     if(runner && isDone === false){
        //         runner.page.close();
        //         isClosed = true;            
        //         Q.push(imei);
        //         if(callback)
        //             callback();
        //     }else{
        //         console.log("UNEXPECTED WAT ****+++++++xx")
        //     }
        // },60000);
        
        try{

            var response1 = await libIMEI.checkIMEI(imei, "proxy");
            var isDone = true;
            console.log("::IMEI::" + imei + "::" + response1);

            if(response1){
                checkRef.update({
                    status: "done",
                    completed: true,
                    result: response1
                });
            }else{
                checkRef.update({
                    status: "error",
                    completed: false,
                    // result: response1
                });

                Q.push(imei);
            }
            
            
        }catch(ex){
            console.log("#####", ex);   

            checkRef.update({
                status: "error",
                completed: false,
                // result: response1
            });

            Q.push(imei);            
            
        }

    }, 3);

    Q.drain = function(){
        console.log("++++ Queue unloaded... ++++");
    }


    imeisRef.orderByChild("completed").equalTo(false).on("child_added", function(snapshot) {
        // console.log(snapshot.key);
        console.log("GOT ENTRY: ", snapshot.val());
        Q.push(snapshot.val().imei)
        
    });

    
        // batch.forEach(async (imei) => {
        //     // Q.push(imei);
        //     imeigc.findTACInfoByIMEI(imei).then(function(a){
        //         console.log(a);
        //     })
        // });


}

var users = [];
var imeis = [];

app.get('/', (req, res) => res.send('IMEI BROTHERS !'))

app.get('/add/:user/:imei', (req, res) => {

    if(req.params.imei.length !== 15){
        // imeisRef.push({$key: req.params.imei, imei: req.params.imei, status: "new", completed: false, result: "-", user: "admin"  })
        res.send("Malformed IMEI ...");
    }else{

        imeigc.findTACInfoByIMEI(req.params.imei).then(function(tac){
            console.log(tac);
            var device = "";

            if(tac){
                tac = tac[0];
                device = tac.name1 + " " + tac.name2;
            }
            
            var checkRef = db.ref("/imei/" + req.params.imei);
            
            checkRef.once("value", function(xx){
                // console.log("TEST: ",  )
                data = xx.val();
                
                if(data === null){
                    checkRef.set({imei: req.params.imei, status: "new", completed: false, result: "-", user: req.params.user, device,  tac: tac })
                    res.send({msg: "IMEI Added to queue"});
                    
                }else{
                    res.send({msg:"duplicate"});
                }
            });

        })
        
    }

    
})

app.listen(3000, () => {

    console.log('IMEI Toolkit 3000!')

    usersRef.once("value", function(snapshot) {
        console.log(snapshot.val());
    
    });

    
    // var testRef = db.ref("imeis/")

    libIMEI.init().then(function(){
        run();
    });

    imeigc.loadDB().then(rowsCount=>{
            console.log(rowsCount); // Sure no actual need for this, just a way to test that all gone well.
    });
})