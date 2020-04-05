var request = require('request');
var cheerio = require('cheerio');

request(`https://saude.es.gov.br/Noticias`, function(err, resp, html) {
    if(!err){
        const $ = cheerio.load(html);

        //Busca Notícias:
        const noticias = $('.title-list').find('a');
        const boletins = noticias.map((index, element)=>{
            const innerHTML = $(element).text();
            if(innerHTML.includes('divulga') && innerHTML.includes('boletim') && innerHTML.includes('Covid-19')){
                return element;
            }     
        });
        const splitLatest = $(boletins[0]).text().split('º')[0].split(' ');
        const latestNumber = splitLatest[splitLatest.length-1]; // Número do boletim mais recente

        //Busca datas:
        const dateNodes = $('.published');
        const datas = []
        dateNodes.each((index,element) => {
            const process = $(element).text().split('-')[0].trim().split(' ');
            datas.push(process);
        });
        const latestData = datas[0];

    }
});