import { Typography, Box } from '@mui/material'
import Layout from '../Layout'

function EntityPage() {
  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Technical Entity
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage technical entities, algorithms, improvements, etc.
        </Typography>
      </Box>
    </Layout>
  )
}

export default EntityPage
