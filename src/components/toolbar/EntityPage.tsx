import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import Layout from '../Layout'
import DomainTab from './entity/DomainTab'
import TechEntityTab from './entity/TechEntityTab'
import ExportTemplateTab from './entity/ExportTemplateTab'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`entity-tabpanel-${index}`}
      aria-labelledby={`entity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `entity-tab-${index}`,
    'aria-controls': `entity-tabpanel-${index}`,
  }
}

function EntityPage() {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="entity tabs">
            <Tab label="Domain" {...a11yProps(0)} />
            <Tab label="Tech Entity" {...a11yProps(1)} />
            <Tab label="Export Template" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <DomainTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TechEntityTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ExportTemplateTab />
        </TabPanel>
      </Box>
    </Layout>
  )
}

export default EntityPage
