const connection = require('../database/connection');

var contador = 0;

module.exports = {

    contador: 0 ,

    async getReport(request, response){
        const template = `Contador: ${contador}`;
        contador += 1;
        return response.json(template);
    }
}