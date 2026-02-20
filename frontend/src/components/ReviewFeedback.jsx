import React from 'react'

export default function ReviewFeedback({ agentResults = [] }) {
  const feedback = [...agentResults]
    .reverse()
    .find((r) => r.agent_name === 'Reviewer' && r.status === 'NEEDS_REVISION')

  if (!feedback) return null

  // Clean the feedback text
  const cleanFeedback = feedback.output
    ? feedback.output
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, p) => String.fromCharCode(parseInt(p, 16)))
        .replace(/\\n/g, '\n')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .trim()
    : ''

  return (
    <div style={{
      background: 'rgba(217,119,6,0.06)',
      border: '1px solid rgba(217,119,6,0.25)',
      borderRadius: '12px',
      padding: '14px 18px',
      animation: 'slide-down-fade 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: cleanFeedback ? '10px' : '0' }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: '#d97706',
          boxShadow: '0 0 8px rgba(217,119,6,0.6)',
          animation: 'pulse-glow 1.5s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#d97706', margin: 0 }}>
          Reviewer requested revisions
        </p>
        <span style={{ fontSize: '12px', color: '#7a5a20', marginLeft: 'auto' }}>
          Writer is revising...
        </span>
      </div>

      {cleanFeedback && (
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
        }}>
          <p style={{
            fontSize: '13px', color: '#c49a3a',
            margin: 0, lineHeight: 1.65,
            fontStyle: 'italic',
            whiteSpace: 'pre-wrap',
          }}>
            {cleanFeedback}
          </p>
        </div>
      )}
    </div>
  )
}