import type { ReactNode } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Box, AppBar, Toolbar, Typography, IconButton, Container, Tabs, Tab } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import ArticleIcon from '@mui/icons-material/Article'
import CategoryIcon from '@mui/icons-material/Category'
import PeopleIcon from '@mui/icons-material/People'
import TuneIcon from '@mui/icons-material/Tune'
import { useNavigate, useLocation } from 'react-router'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [version, setVersion] = useState('0.0.0')
  const currentYear = new Date().getFullYear()

  // Map routes to tab indices
  const routeToTab: { [key: string]: number } = useMemo(() => ({
    '/index': 0,
    '/search': 1,
    '/article': 2,
    '/entity': 3,
    '/signature': 4,
    '/settings': 5,
  }), [])

  // Derive current tab from location instead of storing in state
  const currentTab = useMemo(() => {
    const tabIndex = routeToTab[location.pathname]
    return tabIndex !== undefined ? tabIndex : 0
  }, [location.pathname, routeToTab])

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const ver = await window.dev.getVersion()
        setVersion(ver)
      } catch (e) {
        console.error('Failed to get version:', e)
      }
    }
    loadVersion()
  }, [])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/index', '/search', '/article', '/entity', '/signature', '/settings']
    navigate(routes[newValue])
  }

  const handleLogoClick = () => {
    navigate('/index')
  }

  const handleConfigClick = () => {
    navigate('/config')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Top Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ cursor: 'pointer', userSelect: 'none', mr: 3 }}
            onClick={handleLogoClick}
          >
            Kotomiref
          </Typography>

          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ flexGrow: 1 }}
          >
            <Tab icon={<HomeIcon />} label="Index" iconPosition="start" />
            <Tab icon={<SearchIcon />} label="Search" iconPosition="start" />
            <Tab icon={<ArticleIcon />} label="Article" iconPosition="start" />
            <Tab icon={<CategoryIcon />} label="Entity" iconPosition="start" />
            <Tab icon={<PeopleIcon />} label="Author" iconPosition="start" />
            <Tab icon={<TuneIcon />} label="Settings" iconPosition="start" />
          </Tabs>

          <IconButton
            color="inherit"
            onClick={handleConfigClick}
            aria-label="config"
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content Area */}
      <Container
        component="main"
        maxWidth={false}
        sx={{
          flexGrow: 1,
          py: 3,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}
      >
        {children}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 3,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.grey[900],
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Kotomiref v{version}
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {currentYear} Kotomiref Project
        </Typography>
      </Box>
    </Box>
  )
}

export default Layout

