const socket = io.connect('/lobby');
let rooms = [];
let roomslist = document.getElementById('roomlist');

//
socket.on('displayRoom', (roomTag)=>{
    if( !rooms.find((tag)=>{return tag == roomTag}) ){
        rooms.push(roomTag);
        roomslist.innerHTML += '<li><a href="/game/'+roomTag+'">ROOM '+roomTag+'</a></li>';
    }
});

//
socket.on('removeRoom', (roomTag)=>{
    rooms = rooms.filter((tag)=>{return tag != roomTag});
    roomslist.innerHTML = '';
    for(let i = 0; i < rooms.length; i++){
        roomslist.innerHTML += '<li><a href="/game/'+rooms[i]+'">ROOM '+rooms[i]+'</a></li>';
    }
});

function invite(){
    let id = socket.id.replace('/lobby#','');
    let email = document.getElementById('friendEmail').innerHTML;
    socket.emit('sendEmail', email, id);
    window.location.href = '/game/' + id;
}