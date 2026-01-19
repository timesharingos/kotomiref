import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import IndexPage from './components/toolbar/IndexPage'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if config is initialized
    const checkConfig = async () => {
      try {
        const initialized = await window.config.checkInitialized()
        if (!initialized) {
          navigate('/config')
        }
      } catch (e) {
        console.error('Failed to check config:', e)
      }
    }
    checkConfig()
  }, [navigate])

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const config = await window.config.getConfig()
        if (config && config.initialized) {
          window.config.initOnly()
        }
      } catch (e) {
        console.error('Failed to check config:', e)
      }
    }
    checkConfig()
  }, [])

  return <IndexPage />
}

export default App
