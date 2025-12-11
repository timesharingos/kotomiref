import { createHashRouter } from 'react-router'
import About from './toolbar/About'
import App from './App'

const router = createHashRouter([
    {path: "/", Component: App},
    {path: "/about", Component: About}
]) 

export default router