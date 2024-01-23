import PropTypes from 'prop-types'


const TableHeader = ({ headers }) => {
    return (
        <thead>
            <tr className='table-primary'>
                {headers.map((header) => (
                    <th key={header}>{header}</th>
                ))}
            </tr>
        </thead>
    )
}

TableHeader.propTypes = {
    headers: PropTypes.array.isRequired
}


const TableLine = ({ line }) => {
    
    const getValue = (value) => {
        if (typeof value === 'number' && value % 1 !== 0) return value.toFixed(4)
        return value
    }

    return (
        <tr className='table-dark'>
            {Object.keys(line).map((key) => (
                <td key={key}>{getValue(line[key])}</td>
            ))}
        </tr>
    )
}

TableLine.propTypes = {
    line: PropTypes.object.isRequired
}


const Table = ({ title, header, lines }) => {
    return (
        <div className='container'>
            <h3 className='mt-3 mb-3'>{title}</h3>
            <div className='table-responsive'>
                <table className='table table-hover'>
                    <TableHeader headers={header} />
                    <tbody>
                        {lines.map((line, index) => (
                            <TableLine key={`linea_gsi_${index}`} line={line} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

Table.propTypes = {
    title: PropTypes.string,
    header: PropTypes.array.isRequired,
    lines: PropTypes.array.isRequired
}


export default Table