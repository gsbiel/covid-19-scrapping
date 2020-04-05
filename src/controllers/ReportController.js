const connection = require('../database/connection');

module.exports = {
    async getReport(request, response){
        return response.json("Hello World!");
    }
}