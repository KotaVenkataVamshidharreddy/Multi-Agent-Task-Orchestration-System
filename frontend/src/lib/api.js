const BASE_URL = 'http://localhost:8000'

export async function submitTask(requestText) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request: requestText }),
  })

  if (!res.ok) {
    throw new Error('Failed to submit task')
  }

  const data = await res.json()
  return data.task_id
}

export async function getTask(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`)
  if (!res.ok) {
    throw new Error('Failed to fetch task')
  }
  return res.json()
}

export function streamTask(id, onUpdate) {
  // Non-obvious: EventSource is used instead of manual polling to keep the UI simple and reactive.
  const es = new EventSource(`${BASE_URL}/tasks/${id}/stream`)

  es.onmessage = (event) => {
    try {
      // EventSource sends data in event.data as a string
      const data = JSON.parse(event.data)
      onUpdate(data)
    } catch (e) {
      console.error('Failed to parse SSE message', e, event)
    }
  }

  es.onerror = (error) => {
    console.error('SSE error:', error)
    // Close the connection on error to avoid leaking resources.
    es.close()
  }

  es.onopen = () => {
    console.log('SSE stream opened for task:', id)
  }

  return () => {
    console.log('Closing SSE stream for task:', id)
    es.close()
  }
}

