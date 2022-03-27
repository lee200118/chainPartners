const WebSocket = require('ws');

const url     = "wss://api.upbit.com/websocket/v1"; // 업비트 soket url
var jsonData  = "";   // 업비트에서 받은 데이터를 json 으로 변환 하기 위한 변수 
var result    = {};   // 데이터 처리를 하기위한 변수
const ticket  = "test";   // 일반적으로 용도를 식별하기 위해 ticket 이라는 필드값이 필요합니다.
const type    = "orderbook";   // type  현재가 : ticker, 체결 : trade, 호가 : orderbook 
const codes   = `"KRW-BTC","KRW-ETH","KRW-XRP","KRW-DOGE","KRW-ADA"`; // 업비트 마켓에서 가져올 codes


function connectUpBit() {
    const websocket = new WebSocket(url);

    // WebSocket을 이용하여 수신할 수 있는 정보 중 호가 정보만 가져오기
    websocket.on("open", ()=>{
        console.log("Connected!");
        // 업비트에서 지원하는 5가지 마켓에 대한 호가 정보 가져오기
        const orderbook = `[{"ticket":${ticket}},{"type":${type}, "codes":[${codes}] }]`;
        websocket.send(orderbook);
    });  
    websocket.on("close", ()=>{
        console.log("disConnected!");
        websocket.close();
        setTimeout(function() {
            console.log("reConnected!");
            connectUpBit();
        }, 1000);
    });  
    websocket.on("message", (message)=>{
        try {
            //업비트에서 받아온 데이터들을 처리한다.
            var str = message.toString('utf-8');
            jsonData = JSON.parse(str);
            setPair(jsonData.code, jsonData.orderbook_units);

        } catch (e) {
            console.log(e)
        }
    });

    websocket.on("error", (error) => {
        //에러 확인
        console.log("error", error);
    });
}

// 페어를 키 값으로 하고 asks(매도호가들), bids(매수호가들)를 배열로 가지는 데이터 만들기
async function setPair(code, orderbook_units){

  var ask       = [];   // 매도호가들 담기위한 배열 
  var bids      = [];   // 매수 호가들을 담기위한 배열 

  orderbook_units.forEach(data => {
    ask.push({  "price" :  data.ask_price, "quantity" : data.ask_size  });
    bids.push({ "price" :  data.bid_price, "quantity" : data.bid_size  });
  });

  // asks는 price기준으로 오름차순 asc, bids는 price기준으로 내림차순 desc 정렬
  ask.sort((a, b) => { if (a.price < b.price) return -1; if (a.price > b.price) return 1; return 0; });
  bids.sort((a, b) => { if (a.price < b.price) return 1; if (a.price > b.price) return -1; return 0; });

  result[code] = { "ask": ask, "bids" : bids };
}

// 소켓 실행 및 페어 확인 호출 함수
function getPrice() {
	connectUpBit();
    function printPrice(){  
        Object.keys(result).forEach(key => {
          console.log(`${key} :` ,result[key]);
        });
    }
    setInterval(printPrice,5000);
}
getPrice();
