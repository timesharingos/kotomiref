import { Box, Typography, Divider } from '@mui/material'
import type { ReactNode } from 'react'

interface SettingGroupProps {
  title: string
  isDangerous?: boolean
  children: ReactNode
  showDivider?: boolean
}

function SettingGroup({ title, isDangerous = false, children, showDivider = true }: SettingGroupProps) {
  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            mb: 2,
            color: isDangerous ? 'error.main' : 'inherit'
          }}
        >
          {title}
        </Typography>
        {children}
      </Box>
      {showDivider && <Divider sx={{ my: 3, borderColor: 'grey.700' }} />}
    </>
  )
}

export default SettingGroup
