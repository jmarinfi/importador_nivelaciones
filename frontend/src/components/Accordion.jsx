import PropTypes from 'prop-types'
import Utils from '../services/utilsGsi.js'
import Estadillo from './Estadillo.jsx'
import { useState, useEffect, useRef } from 'react'
import { pdf, PDFViewer } from '@react-pdf/renderer'

const Item = ({ tramo, items, handleEstadilloState }) => {

  const handleOnClickLista = (item) => {
    Utils.getSensoresLista(item.ID_LISTA)
      .then(sensores => {
        console.log('sensores', sensores)
        handleEstadilloState({ lista: item, sensores: sensores })
      })
      .catch(error => console.log(error))
  }

  return (
    <div className={'accordion-item'}>
      <h2 className={'accordion-header'} id={`heading${tramo}`.replace(' ', '')}>
        <button className={'accordion-button collapsed'} type={'button'} data-bs-toggle={'collapse'} data-bs-target={`#collapse${tramo}`.replace(' ', '')} aria-expanded={'false'} aria-controls={`collapse${tramo}`.replace(' ', '')}>
          {tramo}
        </button>
      </h2>
      <div id={`collapse${tramo}`.replace(' ', '')} className={'accordion-collapse collapse'} aria-labelledby={`heading${tramo}`.replace(' ', '')} data-bs-parent={'#accordionListas'}>
        <div className={'accordion-body'}>
          <ul className={'list-group'}>
            {items.map((item, index) => {
              return (
                <li key={`${item.ID_LISTA}-${index}`} className={'list-group-item d-flex flex-column'}>
                  <a className={'btn btn-outline-primary btn-sm m-1'} onClick={() => handleOnClickLista(item)}><strong>{item.NOM_LISTA}</strong></a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

Item.propTypes = {
  tramo: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired
}

const Accordion = ({ items }) => {
  const [estadillo, setEstadillo] = useState(null)

  const tramos = [...new Set(items.map((item) => item.NOM_RIO))]

  const handleEstadilloState = (estadillo) => {
    setEstadillo(estadillo)
  }

  useEffect(() => {
    console.log('estadillo', estadillo)
  }, [estadillo])

  return (
    <div>
      <div className={'container'}>
        {estadillo && <Estadillo estadillo={estadillo} />}
      </div>
      <div className={'accordion container mt-3'} id={'accordionListas'}>
        {tramos.map((tramo, index) => <Item key={`${tramo}-${index}`} tramo={tramo}
          items={items.filter(item => item.NOM_RIO === tramo)} handleEstadilloState={handleEstadilloState} />)}
      </div>
    </div>
  )
}

Accordion.propTypes = {
  items: PropTypes.array.isRequired
}

export default Accordion