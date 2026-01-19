import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import Layout from '../Layout'
import AuthorTab from './signature/AuthorTab'
import AffiliationTab from './signature/AffiliationTab'

function SignaturePage() {
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Authors" />
            <Tab label="Affiliations" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 3 }}>
          {currentTab === 0 && <AuthorTab />}
          {currentTab === 1 && <AffiliationTab />}
        </Box>
      </Box>
    </Layout>
  )
}

export default SignaturePage
