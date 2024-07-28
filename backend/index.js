require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()
const port = process.env.PORT || 3005

app.use(cors())
app.use(express.static('public'))
app.use(express.static('dist'))

const connection = require('./utils/db-metrolima')


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/api/listas', (req, res) => {
    connection.query('SELECT L.ID_LISTA, L.NOM_LISTA, L.DESCRIPCION, L.ID_RIO, R.NOM_RIO FROM LISTAS L JOIN RIO R ON R.ID_RIO = L.ID_RIO WHERE L.ID_TECLECT = 35 ORDER BY R.ID_RIO, L.NOM_LISTA;',
      (err, rows, fields) => {
        if (err) throw err

        res.json(rows)
      })
})

app.get('/api/sensores-lista/:idLista', (req, res) => {
    const { idLista } = req.params
    connection.query('SELECT LS.ID_LISTA, LS.ID_SENSOR, S.NOM_SENSOR, S.ID_EXTERNO, S.DESCRIPCION, S.ID_SISTEMA, (SELECT CAST(H.LECTURA AS DECIMAL(20, 5)) FROM HISTORICO H WHERE H.ID_SENSOR = S.ID_SENSOR AND H.ID_ESTADO_DATO = 0 AND H.ID_FLAG <> \'F\' ORDER BY H.FECHA_MEDIDA DESC LIMIT 1) AS ULT_LECT, (SELECT H.FECHA_MEDIDA FROM HISTORICO H WHERE H.ID_SENSOR = S.ID_SENSOR AND H.ID_ESTADO_DATO = 0 AND H.ID_FLAG <> \'F\' ORDER BY H.FECHA_MEDIDA DESC LIMIT 1) AS ULT_FECHA, (SELECT II.ID_INC_ESTADO FROM INC_INCIDENCIAS II WHERE II.ID_SENSOR = S.ID_SENSOR AND (II.ID_INC_ESTADO = 10 OR II.ID_INC_ESTADO = 7) ORDER BY II.FECHA_ABIERTA DESC  LIMIT 1) AS ESTADO_ALARMA, (SELECT SM.COMENTARIO FROM SEGUIMIENTO_MANTENIMIENTO SM WHERE SM.ID_SENSOR = S.ID_SENSOR ORDER BY SM.FECHA_SEG DESC LIMIT 1) AS COMENTARIO FROM LISTAS_SENSORES LS JOIN SENSOR S ON LS.ID_SENSOR = S.ID_SENSOR WHERE LS.ID_LISTA = ? AND S.ACTIVO = 1 ORDER BY S.ID_EXTERNO;',
      [idLista],
      (err, rows, fields) => {
        if (err) throw err

        res.json(rows)
      })
})

app.get('/api/nombre-lista/:idLista', (req, res) => {
  const { idLista } = req.params
  connection.query('SELECT L.NOM_LISTA FROM LISTAS AS L WHERE L.ID_LISTA = ?;',
    [idLista],
    (err, rows, fields) => {
      if (err) throw err

      res.json(rows)
    }
  )
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    process.on('SIGINT', () => {
        connection.end()
        console.log('Connection terminated')
        process.exit()
    })
})


