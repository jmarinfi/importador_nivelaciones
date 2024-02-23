import PropTypes from "prop-types"
import Utils from "../services/utilsGsi.js"

const Item = ({ tramo, items }) => {
  const handleOnClickLista = (item) => {
    console.log(item)
    Utils.getSensoresLista(item.ID_LISTA)
      .then(sensores => {
        Utils.getPdfEstadillo(sensores)
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
      <div id={`collapse${tramo}`.replace(' ', '')} className={'accordion-collapse collapse'} aria-labelledby={`heading${tramo}`.replace(' ', '')} data-bs-parent={`#accordionListas`}>
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
  const tramos = [...new Set(items.map((item) => item.NOM_RIO))]
  return (
    <div className={'accordion container mt-3'} id={'accordionListas'}>
      {tramos.map((tramo, index) => <Item key={ `${tramo}-${index}` } tramo={tramo} items={items.filter(item => item.NOM_RIO === tramo)} />)}
    </div>
  )
}

Accordion.propTypes = {
  items: PropTypes.array.isRequired
}

export default Accordion