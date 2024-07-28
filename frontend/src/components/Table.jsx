
const Table = ({ header, lines }) => {
  const getValue = (value) => {
    if (typeof value === 'number' && value % 1 !== 0) return value.toFixed(4)
    return value
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
                  <td key={key}>{getValue(line[key])}</td>
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