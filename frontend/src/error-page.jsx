import { useLocation, useRouteError } from 'react-router-dom'

const ErrorPage = () => {
    const error = useRouteError()
    const location = useLocation()
    const customError = location.state?.error

    console.error(error || customError)

    const errorMessage = customError?.message || error?.statusText || 'Error desconocido'

    return (
        <div className='container alert alert-danger mt-3' id='error-page'>
            <h1>¡Ups!</h1>
            <p>Perdón, ha sucedido un error inesperado:</p>
            <p>
                <i>{errorMessage}</i>
            </p>
        </div>
    )
}

export default ErrorPage