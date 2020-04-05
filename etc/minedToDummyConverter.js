// Antes de executar esse script, faça o seguinte: 
// 1) execute o script de mineração "index.js" para gerar o arquivo datamined.json.
// 2) transforme o arquivo datamined.json em um arquivo datamined.js e exporte o seu conteúdo com modules.export
// 3) Execute este script
// 4) Acesse o conteúdo no arquivo realdata.json, criado neste diretório.

const dummy = require('./dummy');
const dataMined = require('./datamined');
const fs = require('fs');

console.log(`Número de municípios minerados: ${dataMined.length}`);
console.log(`Total de municípios: ${dummy.length}`);

const convertToNumber = (numberStr) => {
    if(numberStr.split(" ")[0].split('.').length>=2){
        return parseInt(numberStr.split(" ")[0].split('.').join(""), 10);
    }else{
        return parseInt(numberStr.split(" ")[0],10);
    }
}

const data = dummy.slice();
const realData = {
    data: data,
    total_positivo: 0,
    total_negativo: 0,
    total_suspeito:0
}

const total_positivoStr = dataMined[(dataMined.length-1)]["casos_confirmados"].split(" ")[0];
const total_negativoStr = dataMined[(dataMined.length-1)]["casos_descartados"].split(" ")[0];
const total_suspeitoStr = dataMined[(dataMined.length-1)]["casos_suspeitos"].split(" ")[0];

const total_positivo = convertToNumber(total_positivoStr);
const total_negativo = convertToNumber(total_negativoStr);
const total_suspeito = convertToNumber(total_suspeitoStr);

realData.total_positivo = total_positivo;
realData.total_negativo = total_negativo;
realData.total_suspeito = total_suspeito;

dummy.forEach((element, index) => {
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
            total_notificacoes: 0
        }
    }else{
        console.log('--------------------------------------------')
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
            total_notificacoes: Number(municipio[0].total_notificacoes)
        }
    }
});

//console.log(realData);
// console.log(dataMined);

fs.writeFile('./realdata.json', JSON.stringify(realData), err => {
    if (err) {
        console.log('Error writing file', err)
    } else {
        console.log('Successfully wrote file');
    }
}); 