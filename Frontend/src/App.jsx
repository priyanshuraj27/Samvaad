import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import DebateScreen from './screen/debate_screen'
import APDebateScreen from './screen/APDebateScreen'
import BPDebateScreen from './screen/BPDebateScreen'
import WSDebateScreen from './screen/WSDebateScreen'
import Dashboard from './screen/dashboard'
import BrowseMotions from './screen/browsemotions'
import Adjudicator from './screen/adjudicator'
// Import BrowserRouter, Routes, and Route
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    // Wrap your application's routes within the Router
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/debate" element={<DebateScreen />} />
        <Route path="/ap-debate" element={<APDebateScreen />} />
        <Route path="/bp-debate" element={<BPDebateScreen />} />
        <Route path="/ws-debate" element={<WSDebateScreen />} />
        <Route path="/browse-motions" element={<BrowseMotions />} />
        <Route path="/adjudicator" element={<Adjudicator />} />
      </Routes>
    </Router>
  )
}

export default App