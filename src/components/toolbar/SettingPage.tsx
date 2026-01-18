import { Typography, Box } from '@mui/material'
import Layout from '../Layout'
import DatabaseConfigGroup from './settings/DatabaseConfigGroup'
import DangerousOperationsGroup from './settings/DangerousOperationsGroup'

function SettingPage() {
  return (
    <Layout>
      <Box sx={{ maxWidth: '80%', mx: 'auto', width: '100%' }}>
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
