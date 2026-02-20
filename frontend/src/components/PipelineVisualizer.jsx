import React from 'react'

const AGENT_THEMES = {
  Planner: { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', aura: 'rgba(59, 130, 246, 0.08)' },
  Researcher: { color: '#22d3ee', glow: 'rgba(34, 211, 238, 0.5)', aura: 'rgba(34, 211, 238, 0.12)' },
  Writer: { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)', aura: 'rgba(244, 63, 94, 0.08)' },
  Reviewer: { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', aura: 'rgba(168, 85, 247, 0.08)' },
}

const ICONS = {
  Planner: (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="1" width="10" height="14" rx="1.5"/>
      <line x1="6" y1="5" x2="10" y2="5"/><line x1="6" y1="8" x2="10" y2="8"/>
    </svg>
  ),
  Researcher: (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/>
    </svg>
  ),
  Writer: (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 2L14 5L5 14H2V11L11 2Z"/>
    </svg>
  ),
  Reviewer: (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 1L14 4V8C14 11.5 11 14 8 15C5 14 2 11.5 2 8V4L8 1Z"/>
      <polyline points="5.5,8 7,9.5 10.5,6"/>
    </svg>
  ),
}

const W = 400
const H = 300
const R = 32 // Larger node radius for a premium feel

const NODES = [
  { key: 'Planner',    cx: 110, cy: 90  },
  { key: 'Researcher', cx: 290, cy: 75  },
  { key: 'Writer',     cx: 160, cy: 220 },
  { key: 'Reviewer',   cx: 310, cy: 210 },
]

const EDGES = [
  { from: 'Planner',    to: 'Researcher', cpx: 200, cpy: 40  },
  { from: 'Planner',    to: 'Writer',     cpx: 110, cpy: 160 },
  { from: 'Researcher', to: 'Reviewer',   cpx: 340, cpy: 140 },
  { from: 'Writer',     to: 'Reviewer',   cpx: 235, cpy: 240 },
  { from: 'Planner',    to: 'Reviewer',   cpx: 210, cpy: 150, id: 'pr-mid' },
]

function getAgentState(agentKey, agentResults, taskStatus) {
  if (!agentResults || agentResults.length === 0) return 'WAITING'
  const hasAny = agentResults.some((r) => r.agent_name === agentKey)
  if (!hasAny) return 'WAITING'
  const last = agentResults[agentResults.length - 1]
  if (last.agent_name === agentKey && taskStatus !== 'DONE' && taskStatus !== 'FAILED') return 'ACTIVE'
  return 'DONE'
}

function curvePath(from, to, edge) {
  return `M ${from.cx} ${from.cy} Q ${edge.cpx} ${edge.cpy} ${to.cx} ${to.cy}`
}

export default function PipelineVisualizer({ agentResults = [], taskStatus }) {
  const nodeMap = {}
  NODES.forEach(n => { nodeMap[n.key] = n })

  const lastResult = agentResults[agentResults.length - 1]
  const activeAgent = (taskStatus !== 'DONE' && taskStatus !== 'FAILED' && lastResult) 
    ? lastResult.agent_name : null

  const doneAgents = new Set(
    agentResults
      .filter((r, idx) => !(r.agent_name === activeAgent && idx === agentResults.length - 1))
      .map(r => r.agent_name)
  )

  function getEdgeState(fromKey, toKey) {
    const fromDone = doneAgents.has(fromKey)
    const toActive = toKey === activeAgent
    const toDone = doneAgents.has(toKey)
    if (fromDone && toActive) return 'ACTIVE'
    if (fromDone && toDone) return 'DONE'
    return 'WAITING'
  }

  return (
    <div style={{
      background: '#080810',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '24px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
    }}>
      {/* Circuit-style background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none',
        backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`,
        backgroundSize: '24px 24px'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', position: 'relative' }}>
        <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555577' }}>
          Neural Orchestration Network
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', position: 'relative' }}>
        <defs>
          {Object.entries(AGENT_THEMES).map(([key, theme]) => (
            <filter id={`glow-${key}`} key={key} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          ))}
        </defs>

        {/* ── Curved edges ── */}
        {EDGES.map((edge) => {
          const from = nodeMap[edge.from]; const to = nodeMap[edge.to]
          const state = getEdgeState(edge.from, edge.to)
          const path = curvePath(from, to, edge)
          const targetTheme = AGENT_THEMES[edge.to]

          return (
            <g key={edge.id || `${edge.from}-${edge.to}`}>
              <path d={path} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
              <path 
                d={path} fill="none" 
                stroke={state === 'WAITING' ? 'rgba(255,255,255,0.05)' : targetTheme.color} 
                strokeWidth={state === 'WAITING' ? 1 : 2}
                style={{ opacity: state === 'DONE' ? 0.4 : 1, transition: 'all 0.5s ease' }}
                strokeDasharray={state === 'ACTIVE' ? '4 4' : 'none'}
              />
              {state === 'ACTIVE' && (
                <circle r="3" fill={targetTheme.color} filter={`url(#glow-${edge.to})`}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
                </circle>
              )}
            </g>
          )
        })}

        {/* ── Nodes ── */}
        {NODES.map((node) => {
          const state = getAgentState(node.key, agentResults, taskStatus)
          const theme = AGENT_THEMES[node.key]
          const isActive = state === 'ACTIVE'
          const isDone = state === 'DONE'

          return (
            <g key={node.key}>
              {/* Large Soft Aura */}
              <circle 
                cx={node.cx} cy={node.cy} r={R + 15} 
                fill={isActive ? theme.aura : 'transparent'} 
                style={{ transition: 'fill 0.5s ease' }}
              />
              
              {/* Outer Glow Ring */}
              <circle 
                cx={node.cx} cy={node.cy} r={R} 
                fill="rgba(13,13,25,0.9)" 
                stroke={isActive || isDone ? theme.color : 'rgba(255,255,255,0.1)'}
                strokeWidth="2"
                filter={isActive ? `url(#glow-${node.key})` : 'none'}
                style={{ transition: 'all 0.5s ease' }}
              />

              {/* Inner Glass Polish */}
              <circle cx={node.cx} cy={node.cy} r={R - 4} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />

              {/* Icon */}
              <foreignObject x={node.cx - 10} y={node.cy - 18} width="20" height="20">
                <div style={{ color: isActive || isDone ? theme.color : '#444466', transition: 'color 0.5s' }}>
                  {ICONS[node.key]}
                </div>
              </foreignObject>

              {/* Label */}
              <text 
                x={node.cx} y={node.cy + 16} textAnchor="middle" 
                fontSize="8" fontWeight="700" letterSpacing="1"
                fill={isActive || isDone ? '#ffffff' : '#444466'}
                style={{ fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}
              >
                {node.key}
              </text>

              {/* Active Pulse Animation */}
              {isActive && (
                <circle cx={node.cx} cy={node.cy} r={R + 8} fill="none" stroke={theme.color} strokeWidth="1" opacity="0.5">
                  <animate attributeName="r" values={`${R};${R+12}`} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          )
        })}
      </svg>

      {/* Footer Info */}
      {activeAgent && (
        <div style={{
          marginTop: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%', 
            backgroundColor: AGENT_THEMES[activeAgent].color,
            boxShadow: `0 0 10px ${AGENT_THEMES[activeAgent].color}`
          }} />
          <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>{activeAgent} is synthesizing data...</span>
        </div>
      )}
    </div>
  )
}