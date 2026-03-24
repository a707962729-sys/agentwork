import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Assets from './pages/Assets'
import Skills from './pages/Skills'
import Config from './pages/Config'
import Chat from './pages/Chat'
import Channels from './pages/Channels'
import Models from './pages/Models'
import ModelRouting from './pages/ModelRouting'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const { connect, disconnect } = useWebSocket()

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/config" element={<Config />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/models" element={<Models />} />
        <Route path="/models/routing" element={<ModelRouting />} />
      </Routes>
    </Layout>
  )
}

export default App
