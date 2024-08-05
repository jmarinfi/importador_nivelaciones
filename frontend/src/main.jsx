import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'

import { GsiProvider } from './components/GsiContext'
import Root from './routes/root'
import ErrorPage from './error-page'
import Estadillos, { loader as estadillosLoader } from './routes/estadillos'
import EstadillosLista, { loader as estadillosListaLoader } from './routes/estadillos_lista'
import Gsi from './routes/gsi'
import NavBar from './components/NavBar'
import Reporte from './routes/reporte'

const Layout = () => {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Layout />,
    children: [
      {
        index: true,
        element: <Root />,
      },
      {
        path: "estadillos",
        element: <Estadillos />,
        loader: estadillosLoader,
        children: [
          {
            path: ":listaId",
            element: <EstadillosLista />,
            loader: estadillosListaLoader,
          }
        ]
      },
      {
        path: "gsi",
        element: <Gsi />,
      },
      {
        path: "reporte",
        element: <Reporte />
      },
      {
        path: "csv",
      },
      {
        path: "*",
        element: <ErrorPage />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GsiProvider>
      <RouterProvider router={router} />
    </GsiProvider>
  </React.StrictMode>,
)
