var request = require('request');
var cheerio = require('cheerio');
var dummy = require('./dummy');
var fs = require('fs');

request('https://saude.es.gov.br/Not%C3%ADcia/secretaria-da-saude-divulga-33o-boletim-da-covid-19', function(err, resp, html) {
        if (!err){
            const $ = cheerio.load(html);
            // const paragraphs = $('div.clearfix').find('p');
            // paragraphs.each( (i,e) => {
            //     console.log($(e).text())
            // });
            const dataMined = [];
            const table = $('div.clearfix').find('table');
            const tableRows = table.find('tr');
            tableRows.each((i,tr)=>{
                if(i>0){
                    const tableDatas = $(tr).find('td');
                    const paragraphs = tableDatas.find('p');
                    let dados_municipio = {
                        nome:"",
                        casos_confirmados: 0,
                        casos_descartados: 0,
                        casos_suspeitos: 0,
                        total_notificacoes:0
                    }
                    paragraphs.each((i,p) => {
                        if(i==0){ // Nome do Município
                            dados_municipio.nome = $(p).text();
                        }
                        if(i==1){ // Casos confirmados
                            dados_municipio.casos_confirmados = $(p).text();
                        }
                        if(i==2){ // Casos descartados
                            dados_municipio.casos_descartados = $(p).text();
                        }
                        if(i==3){ // Casos suspeitos
                            dados_municipio.casos_suspeitos = $(p).text();
                        }
                        if(i==4){ // Total de notificações
                            dados_municipio.total_notificacoes = $(p).text();
                            //console.log(dados_municipio);
                            dataMined.push(dados_municipio);
                            dados_municipio = {
                                nome:"",
                                casos_confirmados: 0,
                                casos_descartados: 0,
                                casos_suspeitos: 0,
                                total_notificacoes:0
                            }
                        }
                    });
                }
            });
            // Aqui tenho acesso à variável <<dataMined>> preenchida com os dados da mineração.
            console.log(dataMined);
            fs.writeFile('./datamined.json', JSON.stringify(dataMined), err => {
                if (err) {
                    console.log('Error writing file', err)
                } else {
                    console.log('Successfully wrote file');
                }
            });     
        }
});

console.log(`Total de municípios: ${dummy.length}`)

