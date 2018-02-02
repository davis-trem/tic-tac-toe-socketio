'use strict'
const express = require('express');
const routes = require('./routes/routes');
const socket = require('socket.io');
const nodemailer = require('nodemailer');

let app = express();

app.set('port', (process.env.PORT || 5000));
//Allow sever to use static files along side ejs files
app.use(express.static(__dirname + "/public"));
app.set('views', __dirname+'/public');
app.set('view engine', 'ejs');

//sets up routes for web pages
routes(app);

//for sending email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tictactoeonlinejs@gmail.com',
        pass: 'toeTacTic'
    }
});

let server = app.listen(app.get('port'), ()=>{
    console.log('server running...');
});

const io = socket(server);

const lobby = io.of('/lobby');
const waitingRoom = io.of('/waitingRoom');
const gameRoom = io.of('/game');
let rooms = [];

lobby.on('connection', (socket)=>{
    console.log(socket.client.conn.id + ' is in the lobby');
    let roomsClone = rooms;
    for(let i = 0; i < roomsClone.length; i++){
        gameRoom.in(roomsClone[i]).clients((err, clients)=>{
            if(err) throw err;
            //if no ones in the room, remove it from list
            if(clients == 0)
                rooms = rooms.filter((tag)=>{return tag != roomsClone[i]});
            if(clients > 1)
                lobby.emit('displayRoom', roomsClone[i]);
        });
    }

    socket.on('sendEmail', (toEmail, link)=>{
        var mailOptions = {
            from: 'tictactoeonlinejs@gmail.com',
            to: toEmail,
            subject: 'You\'ve Been Invited to Play TicTacToe',
            text: 'Click link to play:' + link
        };
            
        transporter.sendMail(mailOptions, (error, info)=>{
            if(error) {
                console.log(error);
            }else{
                console.log('Email sent: ' + info.response);
            }
        });
    });
});

waitingRoom.on('connection', (socket)=>{
    console.log('someone is waiting', socket.client.conn.id);
    //gets all clients in waiting Room
    waitingRoom.clients((err, clients)=>{
        if(err) throw err;
        console.log('Clients Waiting:', clients);
        //if more than one client, send first two to gameRoom
        if(clients.length > 1)
            waitingRoom.emit('sendToGame', [clients[0].replace('/waitingRoom#',''), clients[1].replace('/waitingRoom#','')]);
    });

});

gameRoom.on('connection', (socket)=>{
    console.log(socket.client.conn.id + ' ready to play');
    //listens for players requesting new room
    socket.on('requestRoom', (roomTag)=>{
        //adds player to room
        socket.join(roomTag, ()=>{
            //adds tag to rooms list, if not already in there
            if( !rooms.find((e)=>{e == roomTag}) ){
                rooms.push(roomTag);
                lobby.emit('displayRoom', roomTag);
            }
            //gets clients in room
            gameRoom.clients((err, clients)=>{
                if(err) throw err;
                console.log('Clients in Room:', roomTag, clients);
                if(clients.length > 1){
                    //if socket first two in room their players, else their spectators
                    if( clients.findIndex((id)=>{return id == socket.id}) < 2 ){
                        let first = (clients[0] > clients[1]) ? clients[0] : clients[1];
                        gameRoom.in(roomTag).emit('whoFirst', first);
                    }else{
                        gameRoom.in(roomTag).emit('spectating');
                    }
                }
            });
        });
    });

    //player is telling server about their move
    socket.on('boardChange', (roomTag, icon, pos)=>{
        //server tells everyone about the move
        gameRoom.in(roomTag).emit('updateBoard', icon, pos);
    });

    //gets request from spectator to update board
    socket.on('updateSpectatorRequest', (roomTag)=>{
        //send response to players for the board
        gameRoom.in(roomTag).emit('updateSpectatorResponse');
    });

    //gets request from player with board
    socket.on('sendSpectatorBoardRequest', (roomTag, squares)=>{
        //send response (board) to spectators
        gameRoom.in(roomTag).emit('sendSpectatorBoardResponse', squares);
    });

    socket.on('requestRematch', (roomTag, id)=>{
        gameRoom.in(roomTag).emit('responseRematch', id);
    });

    socket.on('rematch', (roomTag)=>{
        gameRoom.in(roomTag).emit('setUpRematch');
    });

    socket.on('requestKick', (roomTag)=>{
        //remove room from list
        rooms = rooms.filter((tag)=>{return tag != roomTag});
        //tell lobby to remove room from list
        lobby.emit('removeRoom', roomTag);
        //kick everyone in room
        gameRoom.in(roomTag).emit('responseKick');
    });

    socket.on('sendMessage', (roomTag, message)=>{
        gameRoom.in(roomTag).emit('broadcastMessage', message);
    });
});