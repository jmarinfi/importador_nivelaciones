const connection = require('./utils/db-metrolima')


connection.query('SELECT S.ID_SENSOR FROM SENSOR S WHERE S.ID_EXTERNO = "E12N102";', (err, rows, fields) => {
    if (err) throw err

    console.log('The solution is: ', rows[0].ID_SENSOR)
})

connection.end()