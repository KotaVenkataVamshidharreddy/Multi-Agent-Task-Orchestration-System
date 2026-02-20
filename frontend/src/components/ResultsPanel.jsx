import React from 'react'

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(text) {
  if (!text) return ''

  // Fix escaped unicode and literal \n from backend
  text = text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, p) => String.fromCharCode(parseInt(p, 16)))
    .replace(/\\n/g, '\n')

  const lines = text.split('\n')
  const result = []
  let inList = false
  let currentParagraph = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ')
      const processed = escapeHtml(content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      result.push(`<p>${processed}</p>`)
      currentParagraph = []
    }
  }

  const closeList = () => {
    if (inList) { result.push('</ul>'); inList = false }
  }

  for (const line of lines) {
    const t = line.trim()

    if (t.startsWith('### ')) {
      closeList(); flushParagraph()
      result.push(`<h3>${escapeHtml(t.slice(4))}</h3>`)
    } else if (t.startsWith('## ')) {
      closeList(); flushParagraph()
      result.push(`<h2>${escapeHtml(t.slice(3))}</h2>`)
    } else if (t.startsWith('# ')) {
      closeList(); flushParagraph()
      result.push(`<h1>${escapeHtml(t.slice(2))}</h1>`)
    } else if (t.startsWith('- ') || t.startsWith('* ')) {
      flushParagraph()
      if (!inList) { result.push('<ul>'); inList = true }
      const content = escapeHtml(t.slice(2)).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      result.push(`<li>${content}</li>`)
    } else if (t === '') {
      closeList(); flushParagraph()
    } else {
      currentParagraph.push(t)
    }
  }

  closeList(); flushParagraph()
  return result.join('\n')
}

export default function ResultsPanel({ task, agentResults = [] }) {
  const [copied, setCopied] = React.useState(false)
  const isDone = task?.status === 'DONE'

  const handleCopy = async () => {
    if (!task?.final_report) return
    try {
      await navigator.clipboard.writeText(task.final_report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) { console.error('Copy failed', e) }
  }

  // Calculate elapsed seconds correctly
  const seconds = task?.created_at
    ? Math.max(0, Math.round((Date.now() - new Date(task.created_at).getTime()) / 1000))
    : null

  const markdownHtml = isDone ? renderMarkdown(task.final_report) : ''

  // While pipeline is running, show a live preview of the last writer output
  const writerOutput = !isDone
    ? agentResults.filter(r => r.agent_name === 'Writer').slice(-1)[0]?.output
    : null

  return (
    <div style={{
      background: 'rgba(13,13,20,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      minHeight: '300px',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f5', margin: 0 }}>
            {isDone ? 'Final Report' : 'Live Report'}
          </p>
          {!isDone && task?.status && task.status !== 'PENDING' && (
            <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#00d4ff',
                  animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </span>
          )}
        </div>
        {isDone && (
          <button
            onClick={handleCopy}
            style={{
              background: copied ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${copied ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: copied ? '#00ff88' : '#888899',
              borderRadius: '7px', padding: '5px 14px',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* Content */}
      {isDone ? (
        <>
          <div
            className="report-body"
            style={{ padding: '24px 28px', background: '#f9fafb', maxHeight: '520px', overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: markdownHtml }}
          />
          {seconds !== null && (
            <div style={{ padding: '10px 20px', borderTop: '1px solid #e5e7eb', background: '#f3f4f6', fontSize: '11px', color: '#9ca3af' }}>
              Completed in {seconds} seconds
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '16px' }}>
          {!task || task.status === 'PENDING' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', margin: '0 auto 12px', border: '2px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '13px', color: '#444466', margin: 0 }}>Waiting for pipeline...</p>
            </div>
          ) : writerOutput ? (
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#444466', marginBottom: '10px' }}>
                Draft in progress
              </p>
              <pre style={{
                fontSize: '12px', color: '#8888aa', fontFamily: "'Inter', sans-serif",
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7, margin: 0,
                maxHeight: '300px', overflowY: 'auto',
              }}>
                {writerOutput.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-*]\s+/gm, '• ')}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#444466', margin: 0 }}>
                {task.status === 'PLANNING' ? 'Planning your research...' :
                 task.status === 'RESEARCHING' ? 'Gathering information...' :
                 task.status === 'WRITING' ? 'Writing the report...' :
                 task.status === 'REVIEWING' ? 'Reviewing the draft...' :
                 task.status === 'REVISING' ? 'Revising the report...' :
                 'Processing...'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}