import { createHashRouter } from 'react-router'
import App from './App'
import ConfigPage from './config/ConfigPage'
import IndexPage from './components/toolbar/IndexPage'
import SearchPage from './components/toolbar/SearchPage'
import ArticlePage from './components/toolbar/ArticlePage'
import EntityPage from './components/toolbar/EntityPage'
import SignaturePage from './components/toolbar/SignaturePage'
import SettingPage from './components/toolbar/SettingPage'

const router = createHashRouter([
    {path: "/", Component: App},
    {path: "/index", Component: IndexPage},
    {path: "/search", Component: SearchPage},
    {path: "/article", Component: ArticlePage},
    {path: "/entity", Component: EntityPage},
    {path: "/signature", Component: SignaturePage},
    {path: "/settings", Component: SettingPage},
    {path: "/config", Component: ConfigPage}
])

export default router