const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");

require("dotenv/config");


const app = express();
let PORT = process.env.PORT || 5500;

const http = require('http');
const server = http.Server(app);
const socketIO = require('socket.io')(server,{
    cors:{
        origin:"*"
    }
});

app.use(cors({origin:"*",preflightContinue:false}));

let users = [];

const addUsers = (socketID,client)=>{
  if(users.length>0){
    users.forEach((user,index) => {
      if(user.client.id == client.id){
        users.splice(index,1);
      }
        users.push({socketID,client})
    });
  }else{
    users.push({socketID,client})
  }
}

const removeFromUsers = (socketID) =>{
    for(let i=0;i<users.length;i++){
        if(users[i].socketID == socketID){
            users.splice(i,1);
        }
    }
}

const userUniqueID = ()=>{
    return Math.floor(Math.random()*100000);
}


socketIO.on("connection",(socket)=>{
    console.log("Connected");

    socket.on("message",(message)=>{
        const data = JSON.parse(message);
        if(data.user){
            addUsers(socket.id,data.user);
        }
    });

    socket.on("send-message",(message)=>{
        let info = message;
        let receiver = users.find(user=>user.client.id==info.to);
        socketIO.emit("chat-message",message);
        if(receiver){
            socketIO.to(receiver.socketID).emit("chat-message",JSON.stringify({to:receiver.client.id,from:info.from,message:info.message}));
        }
    });


    socket.on("send-forum-message",(message)=>{
        let info = message;
        socketIO.emit("forum-message",message);
    });


    socket.on("disconnect",()=>{
        removeFromUsers(socket.id);
        socket.disconnect();
    })

})


app.get("/",(req,res)=>{
    return res.json({"message":"Appworking"});
});

server.listen(PORT,(err)=>{
    if (err) {
        throw err
    }
    console.log("Running on port "+PORT);
})