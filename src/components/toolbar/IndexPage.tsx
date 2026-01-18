import { Typography, Box } from '@mui/material'
import Layout from '../Layout'

function IndexPage() {
  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Index
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to Kotomiref Literature Management System
        </Typography>
      </Box>
    </Layout>
  )
}

export default IndexPage
