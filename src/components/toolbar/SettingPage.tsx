import { Typography, Box } from '@mui/material'
import Layout from '../Layout'

function SettingPage() {
  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Runtime settings and preferences
        </Typography>
      </Box>
    </Layout>
  )
}

export default SettingPage
