import { Typography, Box } from '@mui/material'
import Layout from '../Layout'

function SignaturePage() {
  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Author
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage authors and affiliations
        </Typography>
      </Box>
    </Layout>
  )
}

export default SignaturePage
