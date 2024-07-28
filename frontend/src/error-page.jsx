import { useRouteError } from 'react-router-dom'

const ErrorPage = () => {
    const error = useRouteError()
    console.error(error)

    return (
        <div className='container alert alert-danger mt-3' id='error-page'>
            <h1>¡Ups!</h1>
            <p>Perdón, ha sucedido un error inesperado:</p>
            <p>
                <i>{error.message || error.statusText}</i>
            </p>
        </div>
    )
}

export default ErrorPage