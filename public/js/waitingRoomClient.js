const socket = io.connect('/waitingRoom');

//sendToGame
socket.on('sendToGame', (players)=>{
    var id = socket.id.replace('/waitingRoom#','');
    if(players[0] == id || players[1] == id){
        window.location.href = '/game/' + players[0] + 'v' + players[1];
    }
});