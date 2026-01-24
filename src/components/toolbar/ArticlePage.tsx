import { Typography, Box } from '@mui/material'
import Layout from '../Layout'
import ArticleTab from './article/ArticleTab'

function ArticlePage() {
  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Article
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage and browse literature
        </Typography>
        <ArticleTab />
      </Box>
    </Layout>
  )
}

export default ArticlePage
