import { Typography, Box } from '@mui/material'
import Layout from '../Layout'

function ArticlePage() {
  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Article
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and browse literature
        </Typography>
      </Box>
    </Layout>
  )
}

export default ArticlePage
