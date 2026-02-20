import React from 'react'

// Strips ALL markdown so output reads as clean plain text.
// Handles indented markdown too — backend sends "    ## Heading" style.
function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, p) => String.fromCharCode(parseInt(p, 16)))
    .replace(/\\n/g, '\n')
    // Strip headings even when indented with spaces or tabs
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    // Remove bold **text** and __text__
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic *text* and _text_
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Convert list markers (even indented) to bullet
    .replace(/^[ \t]*[-*][ \t]+/gm, '• ')
    // Remove any remaining lone # at start of line
    .replace(/^[ \t]*#+[ \t]*/gm, '')
    // Reduce excessive leading whitespace (4+ spaces → 2)
    .replace(/^[ \t]{4,}/gm, '  ')
    // Collapse 3+ blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getTimelineDotColor(status) {
  if (!status) return '#333355'
  if (status === 'APPROVED' || status === 'DRAFT_REVISED') return '#00ff88'
  if (status === 'NEEDS_REVISION') return '#d97706'
  if (status === 'FAILED') return '#ef4444'
  return '#00d4ff'
}

function getBadgeStyle(status) {
  if (!status) return { background: 'rgba(255,255,255,0.05)', color: '#555577' }
  if (status === 'APPROVED' || status === 'DRAFT_REVISED')
    return { background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)' }
  if (status === 'NEEDS_REVISION')
    return { background: 'rgba(217,119,6,0.1)', color: '#d97706', border: '1px solid rgba(217,119,6,0.25)' }
  if (status === 'FAILED')
    return { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }
  return { background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }
}

export default function AgentCard({ agentResult, isLast }) {
  const [open, setOpen] = React.useState(false)
  if (!agentResult) return null

  const { agent_name, status, input, output, timestamp } = agentResult
  const date = timestamp ? new Date(timestamp) : null
  const dotColor = getTimelineDotColor(status)
  const badgeStyle = getBadgeStyle(status)

  const cleanInput = stripMarkdown(input)
  const cleanOutput = stripMarkdown(output)

  return (
    <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
      {/* Timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', flexShrink: 0, paddingTop: '16px' }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          backgroundColor: dotColor,
          boxShadow: `0 0 8px ${dotColor}`,
          flexShrink: 0, zIndex: 1,
          transition: 'all 0.3s ease',
        }} />
        {!isLast && (
          <div style={{ width: '1px', flex: 1, minHeight: '24px', background: 'rgba(255,255,255,0.06)', marginTop: '4px' }} />
        )}
      </div>

      {/* Card */}
      <div style={{ flex: 1, marginBottom: isLast ? 0 : '4px', paddingBottom: isLast ? 0 : '12px' }}>
        <div
          onClick={() => setOpen(p => !p)}
          style={{
            background: open ? 'rgba(255,255,255,0.03)' : 'transparent',
            borderRadius: '8px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
        >
          <div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#e8e8f0' }}>{agent_name}</span>
            {date && (
              <span style={{ fontSize: '11px', color: '#444466', marginLeft: '10px' }}>
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '3px 9px', borderRadius: '20px', ...badgeStyle,
            }}>
              {status}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#444466" strokeWidth="1.5"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="2,4 6,8 10,4"/>
            </svg>
          </div>
        </div>

        {/* Expanded content */}
        {open && (
          <div style={{
            padding: '4px 14px 14px',
            animation: 'slide-down-fade 0.2s ease',
          }}>
            {/* Input */}
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#333355', marginBottom: '6px' }}>
                Input
              </p>
              <div style={{
                background: '#0a0a10',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '6px', padding: '10px 12px',
                maxHeight: '140px', overflowY: 'auto',
              }}>
                <pre style={{ fontSize: '12px', color: '#666688', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>
                  {cleanInput}
                </pre>
              </div>
            </div>

            {/* Output */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#333355', marginBottom: '6px' }}>
                Output
              </p>
              <div style={{
                background: '#0a0a10',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '6px', padding: '10px 12px',
                maxHeight: '180px', overflowY: 'auto',
              }}>
                <pre style={{ fontSize: '12px', color: '#aaaacc', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.7 }}>
                  {cleanOutput}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}