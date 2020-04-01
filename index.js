var request = require('request');
var cheerio = require('cheerio');

request('https://saude.es.gov.br/Not%C3%ADcia/secretaria-da-saude-divulga-33o-boletim-da-covid-19', function(err, resp, html) {
        if (!err){
            const $ = cheerio.load(html);
            // const paragraphs = $('div.clearfix').find('p');
            // paragraphs.each( (i,e) => {
            //     console.log($(e).text())
            // });
            const table = $('div.clearfix').find('table');
            const tableRows = table.find('tr');
            tableRows.each((i,tr)=>{
                if(i>0){
                    const tableDatas = $(tr).find('td');
                    const paragraphs = tableDatas.find('p');
                    paragraphs.each((i,p) => {
                        if(i==0){ // Nome do Município
                            console.log($(p).text())
                        }
                        if(i==1){ // Casos confirmados
                            console.log($(p).text())
                        }
                        if(i==2){ // Casos descartados
                            console.log($(p).text())
                        }
                        if(i==3){ // Casos suspeitos
                            console.log($(p).text())
                        }
                        if(i==4){ // Total de notificações
                            console.log($(p).text())
                        }
                    });
                }
            })
      }
});