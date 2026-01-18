import { Button } from '@mui/material'
import { useNavigate } from 'react-router'
import SettingGroup from './SettingGroup'
import SettingEntry from './SettingEntry'

function DatabaseConfigGroup() {
  const navigate = useNavigate()

  return (
    <SettingGroup title="Database Configuration">
      <SettingEntry
        label="Database Configuration"
        action={
          <Button variant="text" onClick={() => navigate('/config')}>
            Configure
          </Button>
        }
      />
    </SettingGroup>
  )
}

export default DatabaseConfigGroup

