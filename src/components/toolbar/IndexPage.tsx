import { Typography, Box, Card, CardContent, CardActionArea, Container } from '@mui/material'
import { useNavigate } from 'react-router'
import Layout from '../Layout'
import SearchIcon from '@mui/icons-material/Search'
import ArticleIcon from '@mui/icons-material/Article'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import MenuBookIcon from '@mui/icons-material/MenuBook'

function IndexPage() {
  const navigate = useNavigate()

  const navigationCards = [
    {
      title: 'Search',
      description: 'Search and explore your literature database',
      icon: <SearchIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/search'
    },
    {
      title: 'Articles',
      description: 'Manage your research articles and references',
      icon: <ArticleIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      path: '/article'
    },
    {
      title: 'Entities',
      description: 'Browse and organize research entities',
      icon: <AccountTreeIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      path: '/entity'
    },
    {
      title: 'Signatures',
      description: 'Manage authors and affiliations',
      icon: <PeopleIcon sx={{ fontSize: 48, color: 'info.main' }} />,
      path: '/signature'
    },
    {
      title: 'Settings',
      description: 'Configure your preferences and system settings',
      icon: <SettingsIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
      path: '/settings'
    }
  ]

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 8
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3 }}>
            <MenuBookIcon sx={{ fontSize: 120, color: 'primary.main' }} />
          </Box>

          {/* Software Name */}
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Kotomiref
          </Typography>

          {/* Tagline */}
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 6, textAlign: 'center', maxWidth: 600 }}
          >
            Your intelligent literature management system for research excellence
          </Typography>

          {/* Navigation Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 3,
              width: '100%',
              maxWidth: 1200
            }}
          >
            {navigationCards.map((card) => (
              <Card
                key={card.path}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardActionArea
                  onClick={() => navigate(card.path)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 3
                  }}
                >
                  <CardContent sx={{ width: '100%', p: 0 }}>
                    {/* Icon */}
                    <Box sx={{ mb: 2 }}>
                      {card.icon}
                    </Box>

                    {/* Title and Arrow */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1
                      }}
                    >
                      <Typography variant="h5" component="h2" fontWeight={600}>
                        {card.title}
                      </Typography>
                      <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      </Container>
    </Layout>
  )
}

export default IndexPage
