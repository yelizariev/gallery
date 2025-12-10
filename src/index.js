import { createRoot } from 'react-dom/client'
import { Suspense } from 'react'
import './styles.css'
import { App } from './App'

function Overlay() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', bottom: 40, left: 40, fontSize: '13px' }}>banana.mydream42.com</div>
          <div style={{ position: 'absolute', top: 40, left: 40, fontSize: '13px' }}><a href={window.APP_CONFIG.Next}>*.mydream42.com</a></div>
      <div style={{ position: 'absolute', bottom: 40, right: 40, fontSize: '13px' }}>tandemm.be</div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <>
    <Suspense fallback={null}>
      <App />
    </Suspense>
    <Overlay />
  </>
)
