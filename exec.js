const libIMEI = require("./lib/index");
const async = require("async");

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

    var Q = async.queue(async function(imei, callback){
        console.log("::Q:: Running function for " + imei);
        
        var startTime = Date.now();
        var isClosed = false;
        var isDone = false;
        
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
            
        }catch(ex){
            console.log("#####", ex);
        }

        // if(!isClosed){
        //     if(!response1){
        //         console.log("NO RESPONSE YOOOOO");
        //     }
        //     console.log("::IMEI::" + imei + "::" + response1);
        //     callback();
        // }else{
        //     console.log("++++++ SHOULD NOT GET HERE !!!! +++++");
        // }

    }, 3);

    Q.drain = function(){
        console.log("WAT????");
    }

    batch.forEach(async (imei) => {
        Q.push(imei);
        
    });

}

libIMEI.init().then(function(){
    run();
});
