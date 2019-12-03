var request = require('request');
var fs = require('fs');   //fs是node.js的核心模块，不用下载安装，可以直接引入  
var WebSocketClient = require('websocket').client;

var headers = {
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Origin': 'https://puracolle.jp',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Referer': 'https://puracolle.jp/index.php',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': '_ga=GA1.2.1794978527.1551770578; default_handed=right; _gid=GA1.2.899523340.1574645995; default_volume=0; uuid=0f46a618-8880-4306-b451-8485eef26281; ssid=5de07a3aa1234; _gat_gtag_UA_135560016_1=1'
};


var page = 1;
var dataString = 'size=100&country=en&lang=zh&page=' + page;
var options = {
    url: 'https://puracolle.jp/api/cranelist_v2.php',
    method: 'POST',
    headers: headers,
    body: dataString
};
function initOptions() {
    dataString = 'size=100&country=en&lang=zh&page=' + page;
    console.log(dataString);
    options = {
        url: 'https://puracolle.jp/api/cranelist_v2.php',
        method: 'POST',
        headers: headers,
        body: dataString
    };
}
var List = [];
var data = [];
var giftList=new Array();
function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        for (let i = 0; i < body.items.length; i++) {
            data.push(body.items[i]);
        }
        if (body.next != 0 && body.next != undefined) {
            // fs.writeFile('aaa.json',JSON.stringify(body),'utf8',function(error){
            //     if(error){
            //         console.log(error);
            //         return false;
            //     }
            //     console.log('写入成功');
            // })
            page += 1;
            initOptions();
            request(options, callback);
            List = data;
            giftList = new Array(); 
            for(var i=0;i<List.length;i++){
                if(i==0){
                    giftList.push({
                        "st": List[i].cranename,
                        "giftname": List[i].giftname,
                        "craneid": List[i].craneid
                    });
                }
                else{
                    if(List[i].cranename != List[i-1].cranename){
                        giftList.push({
                            "st": List[i].cranename,
                            "giftname": List[i].giftname,
                            "craneid": List[i].craneid
                        });
                    }
                }
            }

            fs.writeFile('data.json', JSON.stringify(data), 'utf8', function (error) {
                if (error) {
                    console.log(error);
                    return false;
                }
                console.log('写入成功');
            })
        }
        else {
            page = 0;
            data = [];
        }

    }
}

var client = new WebSocketClient();
client.connect('wss://status.puracolle.jp:8443/');
client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            var jo = JSON.parse(message.utf8Data);
            var d = new Date();
            if (jo.itemcount != undefined) { //リスト出力のみ
                //	(0=通常(プレイ可能)、1=通常(プレイ中)、2=獲得あり、3=メンテナンス中、4=景品補充中、5=景品在庫切れ、6=景品未割当)
                for (let i = 0; i < jo.itemcount; i++) {
                    giftList.forEach(element => AA(element));
                    function AA(target) {
                        if (jo.items[i].craneid == target.craneid) {

                            if (jo.items[i].cranestatus == 1) {
                                console.log(d.toLocaleString() + ' ST' + JSON.stringify(jo.items[i].craneid) + ' ：' + target.giftname)
                            }
                            // 獲獎
                            else if (jo.items[i].cranestatus == 4) {
                                //應該要存在sql

                                let message = d.toLocaleString() + ' ST' + JSON.stringify(jo.items[i].craneid) + ' ：' + target.giftname;
                                console.log(message);


                                fs.appendFile('aword.json', message + '\r\n', 'utf8', function (error) {
                                    if (error) {
                                        console.log(error);
                                        return false;
                                    }
                                })

                            }
                            
                        }
                    }
                }

            }




        }
    });

    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});

// var ws = new WebSocket("wss://status.puracolle.jp:8443/");
// var JSONdata = new Object();
// JSONdata.uuid = '';
// ws.onopen = function() {
//     ws.send(JSON.stringify(JSONdata));
//     ws.onmessage = function (e) {
//         var jo = JSON.parse(e.data);
//             console.log(e);

//         if (jo.itemcount != undefined){ //リスト出力のみ
//             //	(0=通常(プレイ可能)、1=通常(プレイ中)、2=獲得あり、3=メンテナンス中、4=景品補充中、5=景品在庫切れ、6=景品未割当)
//             $.each(jo.items, function(i, v) {
//                 // 遊玩中
//                 console.log(v);
//                 if(this.cranestatus == 1){

//                 }
//                 // 獲獎
//                 else if(this.cranestatus == 4){

//                 }
//             });
//         }
//     };
//     ws.onclose = function(e){
//         ws.close();
//     };
// }


function start() {
    console.log('aaa');
    request(options, callback)
}
start();
setInterval(start, 60 * 60 * 1000);
