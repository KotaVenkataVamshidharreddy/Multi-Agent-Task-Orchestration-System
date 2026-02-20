import React from 'react'

export default function TaskForm({ onSubmit, isLoading }) {
  const [value, setValue] = React.useState('')
  const [focused, setFocused] = React.useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || isLoading) return
    onSubmit(value.trim())
  }

  const canSubmit = !isLoading && value.trim().length > 0

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '640px' }}>
      <div style={{
        borderRadius: '18px',
        border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
        background: 'rgba(13,13,20,0.9)',
        backdropFilter: 'blur(12px)',
        padding: '20px 24px',
        transition: 'all 0.3s ease',
        boxShadow: focused
          ? '0 0 0 1px rgba(0,212,255,0.2), 0 0 40px rgba(0,212,255,0.08), 0 20px 60px rgba(0,0,0,0.4)'
          : '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Label */}
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#555577', marginBottom: '12px' }}>
          Research Request
        </p>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isLoading}
          autoFocus
          placeholder="e.g. Research the pros and cons of microservices vs monoliths and produce a summary report"
          rows={4}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            fontSize: '15px', color: '#e8e8f0', lineHeight: 1.65,
            fontFamily: "'Inter', system-ui, sans-serif",
            resize: 'none', display: 'block',
            placeholder: { color: '#444466' },
          }}
        />

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '12px', color: '#333355' }}>
            {value.length > 0 ? `${value.length} chars` : 'Describe your research goal'}
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canSubmit ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: canSubmit ? '#00d4ff' : '#333355',
              borderRadius: '10px', padding: '9px 22px',
              fontSize: '13px', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '8px',
              letterSpacing: '0.02em',
            }}
          >
            {isLoading ? (
              <>
                <span style={{ width: '13px', height: '13px', border: '2px solid rgba(0,212,255,0.3)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Deploying...
              </>
            ) : (
              <>
                Deploy Agents
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hint pills below form */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          'Microservices vs Monoliths',
          'AI trends in 2025',
          'Remote work productivity',
        ].map((hint) => (
          <button
            key={hint}
            type="button"
            onClick={() => setValue(hint)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              color: '#555577', borderRadius: '20px', padding: '5px 14px',
              fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = '#8888aa' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#555577' }}
          >
            {hint}
          </button>
        ))}
      </div>
    </form>
  )
}