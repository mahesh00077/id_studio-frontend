import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ✅ CORRECT ORDER: CSS first, then JS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'  // This enables dropdowns

import './index.css'
import './styles/App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)