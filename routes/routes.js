'use strict'

module.exports = function(app){
    app.get('/', (req, res)=>{
        res.render('index');
    });

    app.get('/waitingroom', (req, res)=>{
        res.render('waitingroom');
    });

    app.get('/game/*', (req, res)=>{
        res.render('game');
    });
}