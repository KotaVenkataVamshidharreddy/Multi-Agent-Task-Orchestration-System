import React from 'react'
import TaskForm from './components/TaskForm.jsx'
import PipelineVisualizer from './components/PipelineVisualizer.jsx'
import AgentCard from './components/AgentCard.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import ReviewFeedback from './components/ReviewFeedback.jsx'
import { submitTask, streamTask } from './lib/api.js'

export default function App() {
  const [taskId, setTaskId] = React.useState(null)
  const [taskData, setTaskData] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const streamCleanupRef = React.useRef(null)

  const startStream = (id) => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current()
      streamCleanupRef.current = null
    }
    const cleanup = streamTask(id, (data) => setTaskData(data))
    streamCleanupRef.current = cleanup
  }

  const handleSubmit = async (requestText) => {
    try {
      setIsLoading(true)
      setTaskData(null)
      const id = await submitTask(requestText)
      setTaskId(id)
      startStream(id)
    } catch (e) {
      console.error('Failed to submit task:', e)
      alert('Failed to submit task. Is the backend running on port 8000?')
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (taskData && isLoading) setIsLoading(false)
  }, [taskData, isLoading])

  const handleNewTask = () => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current()
      streamCleanupRef.current = null
    }
    setTaskId(null)
    setTaskData(null)
  }

  React.useEffect(() => {
    return () => { if (streamCleanupRef.current) streamCleanupRef.current() }
  }, [])

  const agentResults = taskData?.agent_results || []
  const isDone = taskData?.status === 'DONE'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050508', color: '#f5f5f5', position: 'relative', overflow: 'hidden' }}>

      {/* Animated background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          animation: 'float-bg-1 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '-10%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          animation: 'float-bg-2 13s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', left: '30%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)',
          animation: 'float-bg-3 11s ease-in-out infinite',
        }} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '52px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(5,5,8,0.85)',
        backdropFilter: 'blur(20px)',
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '15px', fontWeight: 700, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Multi-Agent Orchestrator
            </span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#333355' }} />
            <span style={{ fontSize: '11px', color: '#444466', fontWeight: 500 }}>v1.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#555577' }}>Backend:</span>
            <span style={{ color: '#9999bb', fontFamily: 'monospace' }}>localhost:8000</span>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00ff88',
              boxShadow: '0 0 6px rgba(0,255,136,0.8)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1, paddingTop: '52px' }}>

        {/* LANDING PAGE */}
        {!taskId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 52px)', padding: '40px 24px', gap: '40px' }}>
            <div style={{ textAlign: 'center', maxWidth: '600px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{
                  display: 'inline-block',
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '20px',
                  padding: '4px 14px', marginBottom: '20px',
                  background: 'rgba(0,212,255,0.06)',
                }}>
                  AI Pipeline Engine
                </span>
              </div>
              <h1 style={{
                fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700,
                letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '20px',
                color: '#ffffff',
              }}>
                Orchestrate{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Intelligence
                </span>
              </h1>
              <p style={{ fontSize: '17px', color: '#8888aa', lineHeight: 1.65, maxWidth: '480px', margin: '0 auto' }}>
                Deploy a team of AI agents that plan, research, write, and review — collaborating in real time to produce expert reports.
              </p>
            </div>
            <TaskForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {/* PIPELINE VIEW */}
        {taskId && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 32px 60px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Agent network + activity log side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

              {/* LEFT: pipeline + activity log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <PipelineVisualizer agentResults={agentResults} taskStatus={taskData?.status} />
                <ReviewFeedback agentResults={agentResults} />

                {/* Activity log */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444466', marginBottom: '14px' }}>
                    Activity Log
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {agentResults.length === 0 && (
                      <p style={{ fontSize: '13px', color: '#444466', padding: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '14px', height: '14px', border: '2px solid #444466', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                        Initialising pipeline...
                      </p>
                    )}
                    {agentResults.map((result, idx) => (
                      <AgentCard key={`${result.agent_name}-${idx}`} agentResult={result} isLast={idx === agentResults.length - 1} />
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: live report */}
              <div style={{ position: 'sticky', top: '72px' }}>
                <ResultsPanel task={taskData} agentResults={agentResults} />
              </div>
            </div>

            {/* New task button */}
            {isDone && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  onClick={handleNewTask}
                  style={{
                    background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
                    color: '#00d4ff', borderRadius: '10px', padding: '10px 28px',
                    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)' }}
                >
                  Start New Task
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}