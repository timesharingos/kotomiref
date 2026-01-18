import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface SettingEntryProps {
  label: string
  isDangerous?: boolean
  action: ReactNode
}

function SettingEntry({ label, isDangerous = false, action }: SettingEntryProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
      <Typography sx={{ color: isDangerous ? 'error.main' : 'inherit' }}>
        {label}
      </Typography>
      {action}
    </Box>
  )
}

export default SettingEntry
