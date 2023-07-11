import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import ImageCrop from './components/ImageCrop'
import Test from './components/Test'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ImageCrop />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
