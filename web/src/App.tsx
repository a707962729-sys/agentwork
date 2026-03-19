import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import Skills from './pages/Skills'
import Workflows from './pages/Workflows'
import Agents from './pages/Agents'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const { connect, disconnect } = useWebSocket()

  useEffect(() => {
    // 连接 WebSocket
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
