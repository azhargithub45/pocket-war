const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const crypto = require("crypto");

const PORT = process.env.PORT || 10000;
const rooms = new Map();

function makeCode() {
  let c;
  do c = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0,5);
  while (rooms.has(c));
  return c;
}

function newGame() {
  return {
    turn: 1, winner: 0,
    units: [
      {id:1,p:1,x:0,y:7,h:10},
      {id:2,p:1,x:1,y:7,h:10},
      {id:3,p:2,x:6,y:0,h:10},
      {id:4,p:2,x:7,y:0,h:10}
    ]
  };
}

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const httpServer = http.createServer((req,res)=>{
  if(req.url === "/" || req.url === "/index.html"){
    res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
    return res.end(html);
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocket.Server({server:httpServer});

function send(ws,obj){
  if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}
function broadcast(room){
  const data = {type:"state", state:room.state};
  for(const p of room.players) send(p.ws,data);
}

wss.on("connection", ws=>{
  ws.on("message", raw=>{
    let m;
    try{m=JSON.parse(raw.toString())}catch{return}

    if(m.type==="create"){
      const code=makeCode();
      const room={code,state:newGame(),players:[]};
      rooms.set(code,room);
      room.players.push({ws,player:1});
      ws.room=room; ws.player=1;
      send(ws,{type:"created",code,player:1});
      broadcast(room);
      return;
    }

    if(m.type==="join"){
      const code=String(m.code||"").toUpperCase();
      const room=rooms.get(code);
      if(!room) return send(ws,{type:"error",message:"Room not found"});
      if(room.players.length>=2) return send(ws,{type:"error",message:"Room is full"});
      room.players.push({ws,player:2});
      ws.room=room; ws.player=2;
      send(ws,{type:"joined",code,player:2});
      broadcast(room);
      return;
    }

    if(m.type==="action"){
      const room=ws.room;
      if(!room || room.state.winner) return;
      const me=ws.player;
      if(me!==room.state.turn) return;

      const u=room.state.units.find(a=>a.id===m.unitId && a.p===me);
      if(!u) return;
      const x=Number(m.x), y=Number(m.y);
      if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>7||y<0||y>7)return;
      if(Math.abs(u.x-x)+Math.abs(u.y-y)!==1)return;

      const target=room.state.units.find(a=>a.x===x&&a.y===y);
      if(target){
        if(target.p===me)return;
        target.h-=5;
        if(target.h<=0) room.state.units=room.state.units.filter(a=>a!==target);
      }else{
        u.x=x;u.y=y;
      }

      if(!room.state.units.some(a=>a.p!==me)) room.state.winner=me;
      else room.state.turn=me===1?2:1;
      broadcast(room);
    }
  });

  ws.on("close",()=>{
    const room=ws.room;
    if(!room)return;
    room.players=room.players.filter(p=>p.ws!==ws);
    if(room.players.length===0) rooms.delete(room.code);
    else broadcast(room);
  });
});

httpServer.listen(PORT,"0.0.0.0",()=>console.log("Pocket War running on "+PORT));
