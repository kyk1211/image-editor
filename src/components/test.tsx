import React, { useRef } from 'react'

export default function Test() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setFile(file)
          const img = new Image()
          img.onload = () => {
            const canvas = canvasRef.current
            canvas!.width = 100
            canvas!.height = 200
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            const ratio = img.naturalWidth / img.naturalHeight
            if (ratio > 1) {
              const width = 500
              const height = 500 / ratio
              canvas.style.width = '500px'
              canvas.style.height = `${500 / ratio}px`
              ctx.scale(img.naturalWidth / width, img.naturalHeight / height)
            } else {
              const width = 500 * ratio
              const height = 500
              canvas.style.width = `${500 * ratio}px`
              canvas.style.height = '500px'
            }

            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 500, 500)
          }
          img.src = URL.createObjectURL(file)
        }}
      />
      <div>
        <canvas ref={canvasRef}></canvas>
      </div>
      <button
        onClick={() => {
          const link = document.createElement('a')
          link.download = 'image.png'
          link.href = canvasRef.current!.toDataURL()
          link.click()
        }}
      >
        click
      </button>
      <button
        onClick={() => {
          const img = new Image()
          img.onload = () => {
            const canvas = canvasRef.current
            canvas!.width = img.naturalWidth
            canvas!.height = img.naturalHeight
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            // ctx?.rotate((90 * Math.PI) / 180)
            // ctx?.translate(0, -img.naturalHeight)
            canvas.width = 10
            canvas.height = 10
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            if (!ctx) return
            ctx.drawImage(img, 0, 0)
          }
          img.src = URL.createObjectURL(file!)
          // ctx?.restore()
        }}
      >
        click2
      </button>
    </>
  )
}
