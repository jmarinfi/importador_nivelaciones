require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3005

app.use(cors())

const connection = require('./utils/db-metrolima')


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/listas', (req, res) => {
    connection.query('SELECT L.ID_LISTA, L.NOM_LISTA, L.DESCRIPCION, L.ID_RIO, R.NOM_RIO, P.NOM_PRESA FROM LISTAS L JOIN PRESA P ON L.ID_PRESA = P.ID_PRESA JOIN RIO R ON R.ID_RIO = L.ID_RIO WHERE L.ID_TECLECT = 35 ORDER BY P.ID_RIO, P.ORDEN;',
      (err, rows, fields) => {
        if (err) throw err

        res.json(rows)
      })
})

app.get('/sensores-lista/:idLista', (req, res) => {
    const { idLista } = req.params
    connection.query('SELECT LS.ID_LISTA, LS.ID_SENSOR, S.NOM_SENSOR, S.ID_EXTERNO, S.DESCRIPCION, S.ID_SISTEMA, (SELECT H.LECTURA FROM HISTORICO H WHERE H.ID_SENSOR = S.ID_SENSOR AND H.ID_ESTADO_DATO = 0 AND H.ID_FLAG <> \'F\' ORDER BY H.FECHA_MEDIDA DESC LIMIT 1) AS ULT_LECT, (SELECT H.FECHA_MEDIDA FROM HISTORICO H WHERE H.ID_SENSOR = S.ID_SENSOR ORDER BY H.FECHA_MEDIDA DESC LIMIT 1) AS ULT_FECHA, (SELECT II.ID_INC_ESTADO FROM INC_INCIDENCIAS II WHERE II.ID_SENSOR = S.ID_SENSOR AND (II.ID_INC_ESTADO = 10 OR II.ID_INC_ESTADO = 7) ORDER BY II.FECHA_ABIERTA DESC  LIMIT 1) AS ESTADO_ALARMA, (SELECT SM.COMENTARIO FROM SEGUIMIENTO_MANTENIMIENTO SM WHERE SM.ID_SENSOR = S.ID_SENSOR ORDER BY SM.FECHA_SEG DESC LIMIT 1) AS COMENTARIO FROM LISTAS_SENSORES LS JOIN SENSOR S ON LS.ID_SENSOR = S.ID_SENSOR WHERE LS.ID_LISTA = ? AND S.ACTIVO = 1 ORDER BY LS.ORDEN;',
      [idLista],
      (err, rows, fields) => {
        if (err) throw err

        res.json(rows)
      })
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    process.on('SIGINT', () => {
        connection.end()
        console.log('Connection terminated')
        process.exit()
    })
})


