import { Typography, Box } from '@mui/material'
import Layout from '../Layout'
import DatabaseConfigGroup from './settings/DatabaseConfigGroup'
import DangerousOperationsGroup from './settings/DangerousOperationsGroup'

function SettingPage() {
  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        <DatabaseConfigGroup />
        <DangerousOperationsGroup />
      </Box>
    </Layout>
  )
}

export default SettingPage
