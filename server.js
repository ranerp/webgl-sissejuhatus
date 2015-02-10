var express = require('express'),
    server = express();

server.use('/', express.static(__dirname + '/public'));
server.use('/shaders', express.static(__dirname + '/lessons/shaders'));
server.use('/assets', express.static(__dirname + '/lessons/assets'));

server.listen(9000);
console.log('Listening on port 9000');