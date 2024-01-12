import PropTypes from 'prop-types'

// type = 'danger' | 'warning' | 'info' | 'success'
const Notification = ({ text, type }) => {
    const stringClasses = `alert alert-dismissible alert-${type} m-3`
    if (!text) return (null)
    return (
        <div>
            <div className={stringClasses}>
                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                <h4 className="alert-heading">¡Error!</h4>
                <p className="mb-0">{text}</p>
            </div>
        </div>

    )
}

Notification.propTypes = {
    text: PropTypes.string,
    type: PropTypes.string
}


export default Notification