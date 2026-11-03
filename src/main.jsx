import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <main className="fatal-error"><span>M</span><h1>Mostor не загрузился</h1><p>{this.state.error.message}</p><button onClick={() => window.location.reload()}>Обновить страницу</button></main>
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
