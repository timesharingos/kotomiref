import { Typography, Box } from '@mui/material'
import Layout from '../Layout'

function SearchPage() {
  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search literature and technical entities
        </Typography>
      </Box>
    </Layout>
  )
}

export default SearchPage
