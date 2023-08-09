const mysql2 = require('mysql2')
const database = require('./db.json')

//Parametros de conexão
const conn = mysql2.createConnection({
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database
});

//Conexão
conn.connect(function(err){
    if(err){
        console.error('Erro ao acessar o banco de dados: ' + err)
    }else{
        console.log('Conectado ao Banco de Dados.')
    }
})

//QUERY consulta
let consultaDados = `SELECT * FROM vrp_users`;

conn.query(consultaDados, (error, results) => {
    if(error){
        console.log('Erro ao buscar os dados no banco: ' + error)
    }else{
        //console.log(results)
        results.forEach((row) => {
            let id = row.id;
            let whitelisted = row.whitelisted;
            let banned = row.banned;
            let ip = row.ip;
            let last_login = row.last_login;

            if(whitelisted === 1){
                whitelisted = 'Whitelist Ativa'
            }else{
                whitelisted = 'Whitelist Inativa'
            }

            //console.log('O id ' + id + ' tem ' + whitelisted + ' no servidor.') 
        })
    }
})

module.exports = {
    conn: conn
};




