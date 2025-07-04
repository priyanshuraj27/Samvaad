import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <div className='items-center justify-center flex flex-col min-h-screen bg-gray-100'>
      <h1 className='text-3xl font-bold mb-4'>AIspire</h1>
     </div>
    </>
  )
}

export default App
