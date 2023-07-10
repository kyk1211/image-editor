import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import ImageCrop from './components/ImageCrop'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ImageCrop />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
