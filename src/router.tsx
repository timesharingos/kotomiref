import { createHashRouter } from 'react-router'
import About from './toolbar/About'
import App from './App'
import ConfigPage from './config/ConfigPage'

const router = createHashRouter([
    {path: "/", Component: App},
    {path: "/about", Component: About},
    {path: "/config", Component: ConfigPage}
])

export default router