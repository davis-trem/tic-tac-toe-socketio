function invite(){
    let id = socket.id.replace(/\/(lobby|waitingRoom|game)#/,'');
    let email = document.getElementById('friendEmail').value;
    if(email.length > 0){
        socket.emit('sendEmail', email, window.location.href+'game/'+id);
        window.location.href = '/game/' + id;
    }else{
        document.getElementById('friendEmail').placeholder = 'You don\'t have friends? I said enter an email!';
    }
    
}