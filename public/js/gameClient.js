const socket = io.connect('/game');
let cover = document.getElementById('cover');
let status = document.getElementById('status');
let roomTag;
let icon;
let isPlayer = false;
let doRematch = [];
let handler = '';


socket.on('connect', ()=>{
    console.log(socket.id);
    roomTag = window.location.pathname.replace('/game/', '');
    socket.emit('requestRoom', roomTag);
});

socket.on('whoFirst', (first)=>{
    isPlayer = true;
    if(socket.id == first){
        icon = 'X';
    }else{
        icon = 'O';
    }
    handler = icon;
    document.getElementById('player').innerHTML = 'You are ' + icon;
    startGame();
});

/*----------SPECTATOR SHIT----------*/
//spectator joined the game, asked server to update board
socket.on('spectating', ()=>{
    if(!isPlayer){
        document.getElementById('player').innerHTML = 'Spectating Game';
        cover.innerHTML = '';
        cover.style.backgroundColor = 'rgba(0,0,0,0)';
        socket.emit('updateSpectatorRequest', roomTag);
        handler = socket.id.replace('/game#','').slice(0,3);
    }
});

//player sends updated board to server
socket.on('updateSpectatorResponse', ()=>{
    if(isPlayer){
        var squares = [];
        for(var i = 0; i < 9; i++){
            squares.push(document.getElementById("square"+i).innerHTML);
        }
        socket.emit('sendSpectatorBoardRequest', roomTag, squares);
    }
});

//spectator updates board
socket.on('sendSpectatorBoardResponse', (squares)=>{
    if(!isPlayer){
        for(var i = 0; i < squares.length; i++){
            document.getElementById("square"+i).innerHTML = squares[i];
        }
        let x = squares.filter((e)=>{return e == 'X'}).length;
        let o = squares.filter((e)=>{return e == 'O'}).length;
        status.innerHTML = (x <= o) ? 'It is X\'s turn' : 'It is O\'s turn';
    }
});
/*----------END SPECTATOR SHIT----------*/

function startGame(){
    cover.innerHTML = '';
    //X goes first
    if(icon == 'X')
        cover.hidden = true;
    status.innerHTML = 'It is X\'s turn';
    //clears board
    for(var i = 0; i < 9; i++){
        document.getElementById("square"+i).innerHTML = '&nbsp;';
        document.getElementById("square"+i).style.cursor = 'pointer';
    }
}

// Made change to board, it is no longer your turn
function moveMade(element){
    if(element.innerHTML == '&nbsp;'){ 
        cover.hidden = false;
        //tell server about your move
        socket.emit('boardChange', roomTag, icon, element.id);
    }
}

//server tell everyone about the move that was made
socket.on('updateBoard', (iconSent, pos)=>{
    document.getElementById(pos).innerHTML = iconSent;
    document.getElementById(pos).style.cursor = 'default';
    //if you are the player that did not make the move, its your turn
    if(isPlayer && icon != iconSent)
        cover.hidden = true;
    status.innerHTML = (iconSent == 'X') ? 'It is O\'s turn' : 'It is X\'s turn';
    isGameOver();
});

function isGameOver(){
    var squares = [];
    for(var i = 0; i < 9; i++){
        squares.push(document.getElementById("square"+i).innerHTML);
    }
    switch(true){
        case ('X' == squares[0] && squares[0] == squares[1] && squares[1] == squares[2]):
        case ('X' == squares[3] && squares[3] == squares[4] && squares[4] == squares[5]):
        case ('X' == squares[6] && squares[6] == squares[7] && squares[7] == squares[8]):
        case ('X' == squares[0] && squares[0] == squares[3] && squares[3] == squares[6]):
        case ('X' == squares[1] && squares[1] == squares[4] && squares[4] == squares[7]):
        case ('X' == squares[2] && squares[2] == squares[5] && squares[5] == squares[8]):
        case ('X' == squares[0] && squares[0] == squares[4] && squares[4] == squares[8]):
        case ('X' == squares[2] && squares[2] == squares[4] && squares[4] == squares[6]):
            done('X');
            console.log("X wins");
            break;
        case ('O' == squares[0] && squares[0] == squares[1] && squares[1] == squares[2]):
        case ('O' == squares[3] && squares[3] == squares[4] && squares[4] == squares[5]):
        case ('O' == squares[6] && squares[6] == squares[7] && squares[7] == squares[8]):
        case ('O' == squares[0] && squares[0] == squares[3] && squares[3] == squares[6]):
        case ('O' == squares[1] && squares[1] == squares[4] && squares[4] == squares[7]):
        case ('O' == squares[2] && squares[2] == squares[5] && squares[5] == squares[8]):
        case ('O' == squares[0] && squares[0] == squares[4] && squares[4] == squares[8]):
        case ('O' == squares[2] && squares[2] == squares[4] && squares[4] == squares[6]):
            done('O');
            console.log("O wins");
            break;
        case (squares[0] != "&nbsp;" && squares[1] != "&nbsp;" && squares[2] != "&nbsp;" 
        && squares[3] != "&nbsp;" && squares[4] != "&nbsp;"&& squares[5] != "&nbsp;" 
        && squares[6] != "&nbsp;" && squares[7] != "&nbsp;" && squares[8] != "&nbsp;"):
            done("DRAW");
            console.log("DRAW");
            break;
    }
}

function done(result){
    cover.hidden = false;
    cover.innerHTML = (result == 'DRAW') ? '<h3>DRAW! Both yall suck</h3>': '<h3>'+result+' WON!</h3>';
    if(isPlayer){
        cover.innerHTML += '<h3>Play Again?</h3><br/>'
            +'<input type="button" value="YES" onclick="requestRematch()">'
            +'<input type="button" value="NO" onclick="kickEveryone()">';
    }
}

/*----------REMATCH SHIT----------*/
//send request to server for rematch
function requestRematch(){
    cover.innerHTML = '<h3>Waiting for Opponent</h3>';
    socket.emit('requestRematch', roomTag, socket.id);
}

//get response from server about rematch
socket.on('responseRematch', (id)=>{
    if(isPlayer){
        doRematch.push(id);
        //if both players agree to rematch then do a rematch
        if(doRematch.length == 2){
            doRematch = [];
            //tell server both players agree to rematch
            socket.emit('rematch', roomTag);
        }
    }
});

//get response from server to comence the rematch
socket.on('setUpRematch', ()=>{
    startGame();
});
/*----------END REMATCH SHIT----------*/

/*----------KICK SHIT----------*/
//requests server to kick everyone from game
function kickEveryone(){
    socket.emit('requestKick', roomTag);
}

//reponse from server to send everyone to home page
socket.on('responseKick', ()=>{
    window.location.href = '/';
});
/*----------END KICK SHIT----------*/

/*----------CHAT SHIT----------*/
function sendChat(){
    let message = handler +': '+ document.getElementById('message').value;
    socket.emit('sendMessage', roomTag, message);
}

socket.on('broadcastMessage', (message)=>{
    document.getElementById('chat').innerHTML += message+'&#10;';
});
/*----------END CHAT SHIT----------*/