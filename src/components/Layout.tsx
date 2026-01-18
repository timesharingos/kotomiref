import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Box, AppBar, Toolbar, Typography, IconButton, Container } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useNavigate } from 'react-router'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const [version, setVersion] = useState('0.0.0')
  const currentYear = new Date().getFullYear()

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

  const handleSettingsClick = () => {
    navigate('/config')
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Top Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={handleLogoClick}
          >
            Kotomiref
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            color="inherit"
            onClick={handleSettingsClick}
            aria-label="settings"
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

