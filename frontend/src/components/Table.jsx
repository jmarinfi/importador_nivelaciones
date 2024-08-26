import { useLocation } from 'react-router-dom'

const Table = ({ header, lines, onChangeGsi, onDeleteLine }) => {
  const location = useLocation()

  const currentPath = location.pathname

  const getValue = (value, key) => {
    if (typeof value === 'number' && value % 1 !== 0) {
      return value.toFixed(5)
    } 
    return value
  }

  const handleInputChange = (e, rowIndex, key) => {
    const newLines = [...lines]
    newLines[rowIndex][key] = e.target.value
    console.log(newLines)
    onChangeGsi(newLines)
  }

  const handleDeleteLine = (index) => {
    const newLines = [...lines]
    newLines.splice(index, 1)
    onDeleteLine(newLines)
  }

  return (
    <div className="mb-3">
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              {currentPath === '/reporte' && <th scope="col">Acciones</th>}
              {header.map((colTitle) => (
                <th key={colTitle} scope="col">{colTitle}</th>
              ))}
            </tr>
          </thead>
          <tbody className="table-group-divider">
            
            {lines.map((line, index) => (
              <tr key={`linea-gsi-${index}`}>
                {currentPath === '/reporte' && (
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeleteLine(index)}
                    >
                      Eliminar
                    </button>
                  </td>
                )}
                {Object.keys(line).map((key) => (
                  <td key={key} className="text-nowrap">{
                    header.includes('nom_campo') && key === 'nom_campo' && currentPath === '/gsi' ? (
                      <input
                        type="text"
                        className="form-control"
                        value={getValue(line[key])}
                        onChange={(e) => handleInputChange(e, index, key)}
                      />
                    ) : (
                      getValue(line[key], key)
                    )
                  }</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table