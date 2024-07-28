
const Table = ({ header, lines, onChangeGsi }) => {
  const getValue = (value) => {
    if (typeof value === 'number' && value % 1 !== 0) return value.toFixed(4)
    return value
  }

  const handleInputChange = (e, rowIndex, key) => {
    const newLines = [...lines]
    newLines[rowIndex][key] = e.target.value
    console.log(newLines)
    onChangeGsi(newLines)
  }

  return (
    <div className="mb-3">
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              {header.map((colTitle) => (
                <th key={colTitle} scope="col">{colTitle}</th>
              ))}
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {lines.map((line, index) => (
              <tr key={`linea-gsi-${index}`}>
                {Object.keys(line).map((key) => (
                  <td key={key}>{
                    header.includes('nom_campo') && key === 'nom_campo' ? (
                      <input
                        type="text"
                        className="form-control"
                        value={getValue(line[key])}
                        onChange={(e) => handleInputChange(e, index, key)}
                      />
                    ) : (
                      getValue(line[key])
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