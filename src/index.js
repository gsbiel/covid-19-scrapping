const express = require('express');
const routes = require('./routes');
const cors = require('cors');


// app.use(cors({origin:'http://google.com'}));  //Permite apenas acessos do google.
const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);    // Esse comando deve estar sempre abaixo do express.json();

const PORT = 3333;;
const HOST = '0.0.0.0';

app.listen(PORT, HOST);