const connection = require('../database/connection');
const cron = require("node-cron");
var request = require('request');
var cheerio = require('cheerio');
var municipios = require('../../etc/municipios');

var currentReport = 37
var dateOfCurrentReport = "04/04/2020, às 19h25"

var fetchedDataCache = {
    forReportNumber:0,
    dataStored: null
};

const data = municipios.slice();
const realData = {
    data: data,
    total_positivo: 0,
    total_negativo: 0,
    total_suspeito:0,
    total_obitos:0,
    launch_date: 0,
    boletim_number: 0
}

// "0 0,4,8,12,16,20 * * *"                         -> de 4 em 4 horas
// "0 0,5,10,15,20,25,30,35,40,45,50,55 * * * *"    -> de 5 em 5 minutos
// "0,20,40 * * * * *"                              -> de 20 em 20 segundos

cron.schedule("0 0,4,8,12,16,20 * * *", function() {
    const time = new Date()

    console.log("-------------------------------------------------")
    console.log("Task: Coleta do boletim COVID19 mais recente.");
    console.log(`Horário: ${time.toString()}`);
    console.log("Coletando...");

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

            if(boletins.length){
                const splitLatest = $(boletins[0]).text().split('º')[0].split(' ');
                const latestNumber = splitLatest[splitLatest.length-1]; // Número do boletim mais recente
                //console.log(`Boletim mais recente: ${latestNumber}`);

                //Busca datas:
                const dateNodes = $('.published');
                const datas = []
                dateNodes.each((index,element) => {
                    const process = $(element).text().split('-')[0].trim().split(' ');
                    datas.push(process);
                });
                const latestData = datas[0].join(', às ');
                // console.log(`Publicado em: ${latestData}`);

                if(currentReport !== latestNumber){
                    currentReport = latestNumber;
                    dateOfCurrentReport = latestData;
                }
            } 
        }
    });

    console.log("Coleta finalizada!");
    console.log(`Boletim mais recente: nº${dateOfCurrentReport}.`);

});

module.exports = {

    async getReport(req, response){
        if(fetchedDataCache.forReportNumber == currentReport){
            // console.log(`Há dados armazenados em chache para o boletim: ${currentReport}, então não será necessário minerar.`)
            return response.json(fetchedDataCache.dataStored);
        }else{
            // console.log(`Não há dados armazenados em chache para o boletim: ${currentReport}. Executando scrapping...`);
            // Minera o boletim
            try{
                request(`https://saude.es.gov.br/Not%C3%ADcia/secretaria-da-saude-divulga-${currentReport}o-boletim-da-covid-19`, function(err, resp, html) {
                    if (!err){
                        const $ = cheerio.load(html);
                        // const paragraphs = $('div.clearfix').find('p');
                        // paragraphs.each( (i,e) => {
                        //     console.log($(e).text())
                        // });
                        let dataMined = [];
                        const table = $('div.clearfix').find('table');
                        const tableRows = table.find('tr');
                        tableRows.each((i,tr)=>{
                            if(i>0){
                                const tableDatas = $(tr).find('td');
                                let paragraphs = 0;
                                if(!tableDatas.find('p').length && tableDatas.length == 6){
                                    const dataLine = minerarTextoDosTableDatas($, tableDatas);
                                    dataMined.push(dataLine[0]);
                                }
                                else if(tableDatas.find('p').length == 6){
                                    paragraphs = tableDatas.find('p');
                                    const dataLine = minerarParagrafosDosTableDatas($, paragraphs); 
                                    dataMined.push(dataLine[0]);
                                }   
                            }
                        });

                        const total_positivoStr = dataMined[(dataMined.length-1)]["casos_confirmados"].split(" ")[0];
                        const total_negativoStr = dataMined[(dataMined.length-1)]["casos_descartados"].split(" ")[0];
                        const total_suspeitoStr = dataMined[(dataMined.length-1)]["casos_suspeitos"].split(" ")[0]; 
                        const total_obitosStr = dataMined[(dataMined.length-1)]["casos_obito"].split(" ")[0]; 

                        const total_positivo = convertToNumber(total_positivoStr);
                        const total_negativo = convertToNumber(total_negativoStr);
                        const total_suspeito = convertToNumber(total_suspeitoStr);
                        const total_obitos = convertToNumber(total_obitosStr);

                        realData.total_positivo = total_positivo;
                        realData.total_negativo = total_negativo;
                        realData.total_suspeito = total_suspeito;
                        realData.total_obitos = total_obitos;
                        realData.launch_date = dateOfCurrentReport;
                        realData.boletim_number = currentReport;
    
                        municipios.forEach((element, index) => {
                            const municipio = dataMined.filter((elementoMinerado)=>{
                                return elementoMinerado["nome"].trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") == element.nome.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            });
                            if(!municipio.length){
                                //console.log(`Município não encontrado: ${element["nome"]}`);
                                realData.data[index] = {
                                    ...realData.data[index],
                                    positivo_abs: 0,
                                    positivo_rel: 0,
                                    negativo_abs: 0,
                                    negativo_rel: 0,
                                    suspeito_abs:  0,
                                    suspeito_rel: 0,
                                    obito_abs: 0,
                                    obito_rel: 0,
                                    total_notificacoes: 0
                            }
                            }else{
                                // console.log(`Municipio Minerado: ${municipio[0]["nome"]}`);
                                // console.log(`Correponde com: ${realData.data[index].nome}`);
                                realData.data[index] = {
                                    ...realData.data[index],
                                    positivo_abs: Number(municipio[0].casos_confirmados),
                                    positivo_rel: Number(municipio[0].casos_confirmados)/total_positivo,
                                    negativo_abs: Number(municipio[0].casos_descartados),
                                    negativo_rel: Number(municipio[0].casos_descartados)/total_negativo,
                                    suspeito_abs: Number(municipio[0].casos_suspeitos),
                                    suspeito_rel: Number(municipio[0].casos_suspeitos)/total_suspeito,
                                    obito_abs: Number(municipio[0].casos_obito),
                                    obito_rel: Number(municipio[0].casos_obito)/total_obitos,
                                    total_notificacoes: Number(municipio[0].total_notificacoes)
                                }
                            }
                        });
                        // //console.log(realData);
                        fetchedDataCache = {
                            dataStored: {...realData},
                            forReportNumber: currentReport
                        }
                        // // console.log(dataMined);
                        response.json(realData);
                    }
                });
            }
            catch(err){
                console.log(err);
                response.status(400).json({error: "Houve um erro na coleta de dados."});
            }
        }
    }
}

const convertToNumber = (numberStr) => {
    if(numberStr.split(" ")[0].split('.').length>=2){
        return parseInt(numberStr.split(" ")[0].split('.').join(""), 10);
    }else{
        return parseInt(numberStr.split(" ")[0],10);
    }
}

const minerarTextoDosTableDatas = ($,tableDatas) => {

    const dataLine = [];

    let dados_municipio = {
        nome:"",
        casos_confirmados: "0",
        casos_descartados: "0",
        casos_suspeitos: "0",
        total_notificacoes:"0",
        casos_obito:"0"
    };

    tableDatas.each((i, td) => {
        if(i==0){ // Nome do Município
            dados_municipio.nome = $(td).text().trim();
        }
        if(i==1){ // Casos confirmados
            dados_municipio.casos_confirmados = $(td).text().trim();
        }
        if(i==2){ // Casos descartados
            dados_municipio.casos_descartados = $(td).text().trim();
        }
        if(i==3){ // Casos suspeitos
            dados_municipio.casos_suspeitos = $(td).text().trim();
        }
        if(i==4){ // Total de notificações
            dados_municipio.total_notificacoes = $(td).text().trim();
            // console.log(dados_municipio);
            if(tableDatas.length == 5){
                dataLine.push(dados_municipio);
                dados_municipio = {
                    nome:"",
                    casos_confirmados: 0,
                    casos_descartados: 0,
                    casos_suspeitos: 0,
                    total_notificacoes:0,
                    casos_obito:0
                }
            }
        }
        if(i==5){
            dados_municipio.casos_obito = $(td).text().trim();
            dataLine.push(dados_municipio);
            dados_municipio = {
                nome:"",
                casos_confirmados: "0",
                casos_descartados: "0",
                casos_suspeitos: "0",
                total_notificacoes:"0",
                casos_obito:"0"
            };
        }
    });
    return dataLine;
}

const minerarParagrafosDosTableDatas = ($, paragraphs) => {

    const dataLine = [];

    let dados_municipio = {
        nome:"",
        casos_confirmados: "0",
        casos_descartados: "0",
        casos_suspeitos: "0",
        total_notificacoes:"0",
        casos_obito:"0"
    };

    paragraphs.each((i,p) => {
        if(i==0){ // Nome do Município
            dados_municipio.nome = $(p).text().trim();
        }
        if(i==1){ // Casos confirmados
            dados_municipio.casos_confirmados = $(p).text().trim();
        }
        if(i==2){ // Casos descartados
            dados_municipio.casos_descartados = $(p).text().trim();
        }
        if(i==3){ // Casos suspeitos
            dados_municipio.casos_suspeitos = $(p).text().trim();
        }
        if(i==4){ // Total de notificações
            dados_municipio.total_notificacoes = $(p).text().trim();
            // console.log(dados_municipio);
            if(paragraphs.length == 5){
                dataLine.push(dados_municipio);
                dados_municipio = {
                    nome:"",
                    casos_confirmados: 0,
                    casos_descartados: 0,
                    casos_suspeitos: 0,
                    total_notificacoes:0,
                    casos_obito:0
                }
            }
        }
        if(i==5){
            dados_municipio.casos_obito = $(p).text().trim();
            dataLine.push(dados_municipio);
            dados_municipio = {
                nome:"",
                casos_confirmados: "0",
                casos_descartados: "0",
                casos_suspeitos: "0",
                total_notificacoes:"0",
                casos_obito:"0"
            };
        }
    });
    return dataLine;
}

