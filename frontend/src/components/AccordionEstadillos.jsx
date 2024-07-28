import { NavLink } from 'react-router-dom'

const AccordionEstadillos = ({ listas }) => {
  const tramos = [...new Set(listas.map((lista) => lista.NOM_RIO))]
  const getListasTramo = (tramo) => listas.filter((lista) => tramo === lista.NOM_RIO)

  return (
    <>
      <div className="container accordion mb-3" id="accordionListas">
        {tramos.map((tramo) => {
          const idTramo = tramo.replace(/\s+/g, '')

          return (
            <div key={idTramo} className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={'#' + idTramo}
                  aria-expanded="false"
                  aria-controls={idTramo}
                >{tramo}</button>
              </h2>
              <div
                id={idTramo}
                className="accordion-collapse collapse"
                data-bs-parent="#accordionListas"
              >
                <div className="accordion-body">
                  <div className="list-group">
                    {getListasTramo(tramo).map((lista) => {
                      return (
                        <NavLink
                          key={String(lista.ID_LISTA)}
                          to={String(lista.ID_LISTA)}
                          className="list-group-item list-group-item-action"
                        >{lista.NOM_LISTA}</NavLink>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>

  )
}

export default AccordionEstadillos