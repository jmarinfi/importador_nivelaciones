import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'

import Root, { action as rootAction } from './routes/root'
import ErrorPage from './error-page'
import Estadillos, { loader as estadillosLoader } from './routes/estadillos'
import EstadillosLista, { loader as estadillosListaLoader } from './routes/estadillos_lista'
import Gsi from './routes/gsi'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
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
        action: rootAction,
      }
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
