import React, { useCallback, useEffect, useRef, useState, MouseEvent } from 'react'
import styled from 'styled-components'
const MAX_CANVAS_WIDTH = 800
const MAX_CANVAS_HEIGHT = 800

const RIGHT_ANGLE = 5
const STRAIGHT_ANGLE = 180
const COMPLETE_ANGLE = 360

const BLUR_FILTER = 'blur(10px)'

const LEFT_CLICK = 1

const HIGHEST_ENCODING_QUALITY = 1

const INITIAL_AREA: BlurryArea = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
}

interface Size {
  width: number
  height: number
}

interface Rectangle extends Size {
  x: number
  y: number
}

interface BlurryArea extends Rectangle {
  blurryImage?: ImageData
}

export default function ImageCrop() {
  const blurLayer = useRef<HTMLCanvasElement>(null)
  const imageLayer = useRef<HTMLCanvasElement>(null)
  const dragLayer = useRef<HTMLCanvasElement>(null)

  const [isRotateMode, setIsRotateMode] = useState(false)
  const [isBlurMode, setIsBlurMode] = useState(false)

  const [originFile, setOriginFile] = useState<File | null>(null)
  const [originSize, setOriginSize] = useState<Size>({ width: 0, height: 0 })
  const [imgSrc, setImgSrc] = useState('')
  const [rotate, setRotate] = useState(0)

  const [blurArea, setBlurArea] = useState<Rectangle>({ x: 0, y: 0, width: 0, height: 0 })
  const [blurAreas, setBlurAreas] = useState<BlurryArea[]>([])

  function createImageElement(source: string) {
    const image = new Image()
    image.src = source
    return image
  }

  function resizeCanvas(canvas: HTMLCanvasElement | null, { width, height }: Size) {
    if (canvas === null) return
    ;[canvas.width, canvas.height] = [width, height]
  }

  function getRotatedCanvasSize({ width, height }: Size, rotationAngle: number): Size {
    return {
      width: rotationAngle % STRAIGHT_ANGLE ? height : width,
      height: rotationAngle % STRAIGHT_ANGLE ? width : height,
    }
  }

  function locateImage(image: HTMLImageElement, rotationAngle: number): Rectangle {
    const canvasSize = getRotatedCanvasSize({ width: MAX_CANVAS_WIDTH, height: MAX_CANVAS_HEIGHT }, rotationAngle)
    const isLongerWidth = image.width > image.height + (canvasSize.width - canvasSize.height)

    const width = isLongerWidth ? canvasSize.width : (image.width * canvasSize.height) / image.height
    const height = isLongerWidth ? (image.height * canvasSize.width) / image.width : canvasSize.height
    const x = -Math.floor(rotationAngle / STRAIGHT_ANGLE) * width
    const y = -Math.floor(((rotationAngle + RIGHT_ANGLE) % COMPLETE_ANGLE) / STRAIGHT_ANGLE) * height
    return { x, y, width, height }
  }
  const drawImage = useCallback(() => {
    const canvas = imageLayer.current as HTMLCanvasElement
    if (canvas === null || imgSrc === '') return

    const context = canvas.getContext('2d') as CanvasRenderingContext2D

    const image = new Image()
    image.src = imgSrc

    image.onload = () => {
      const { x, y, width, height } = locateImage(image, rotate)
      const canvasSize = getRotatedCanvasSize({ width, height }, rotate)
      resizeCanvas(canvas, canvasSize)
      context.rotate(rotate * (Math.PI / 180))
      context.drawImage(image, x, y, width, height)

      blurAreas
        .filter(({ blurryImage }) => blurryImage !== undefined)
        .forEach(({ blurryImage, ...area }) => {
          const left = area.width > 0 ? area.x : area.x + area.width
          const top = area.height > 0 ? area.y : area.y + area.height
          context?.putImageData(blurryImage as ImageData, left, top)
        })
      context.restore()
    }
  }, [blurAreas, imgSrc, rotate])

  const blurImage = useCallback(() => {
    const canvas = blurLayer.current as HTMLCanvasElement
    if (canvas === null || imgSrc === '') return

    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const image = createImageElement(imgSrc)
    image.onload = () => {
      const { x, y, width, height } = locateImage(image, rotate)
      const canvasSize = getRotatedCanvasSize({ width, height }, rotate)
      resizeCanvas(canvas, canvasSize)
      context.rotate((rotate * Math.PI) / 180)
      context.filter = BLUR_FILTER
      context.drawImage(image, x, y, width, height)
      context.restore()
    }
  }, [imgSrc, rotate])

  const drawDragLayer = useCallback(() => {
    const canvas = dragLayer.current
    if (canvas === null || imgSrc === '') return

    const image = createImageElement(imgSrc)
    image.onload = fitCanvasToImage

    function fitCanvasToImage() {
      const { width, height } = locateImage(image, rotate)
      const canvasSize = getRotatedCanvasSize({ width, height }, rotate)
      resizeCanvas(canvas, canvasSize)
    }
  }, [imgSrc, rotate])

  const drawDragArea = useCallback(() => {
    const canvas = dragLayer.current
    const context = canvas?.getContext('2d')
    if (canvas) context?.clearRect(0, 0, canvas.width, canvas.height)
    if (context) context.fillStyle = 'rgba(255, 255, 255, 0.2)'
    context?.fillRect(blurArea.x, blurArea.y, blurArea.width, blurArea.height)
  }, [blurArea])

  function handleMouseDown({ buttons, clientX, clientY }: MouseEvent<HTMLCanvasElement>) {
    if (!isBlurMode) return
    if (buttons !== LEFT_CLICK) return
    const canvasPosition = dragLayer.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0)
    setBlurArea({
      ...INITIAL_AREA,
      x: clientX - canvasPosition.x,
      y: clientY - canvasPosition.y,
    })
  }

  function handleMouseMove({ buttons, clientX, clientY }: MouseEvent<HTMLCanvasElement>) {
    if (!isBlurMode) return
    if (buttons !== LEFT_CLICK) return
    const canvasPosition = dragLayer.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0)
    setBlurArea((area) => ({
      ...area,
      width: clientX - area.x - canvasPosition.x,
      height: clientY - area.y - canvasPosition.y,
    }))
  }

  function handleMouseUp() {
    if (!isBlurMode) return

    const canvas = blurLayer.current
    const context = canvas?.getContext('2d')
    if (blurArea.width !== 0 && blurArea.height !== 0) {
      setBlurAreas((areas) => [
        ...areas,
        {
          ...blurArea,
          blurryImage: context?.getImageData(blurArea.x, blurArea.y, blurArea.width, blurArea.height),
        },
      ])
    }
    setBlurArea(INITIAL_AREA)
  }

  function handleMouseLeave({ buttons }: MouseEvent<HTMLCanvasElement>) {
    if (buttons !== LEFT_CLICK) return
    handleMouseUp()
  }

  function handleClear() {
    setBlurAreas([])
    setRotate(0)
    setIsBlurMode(false)
    setIsRotateMode(false)
    setImgSrc('')
  }

  function handleSave() {
    const link = document.createElement('a')
    link.download = ''

    link.href = imgSrc
    link.click()
  }

  function handleRotate() {
    if (isRotateMode) {
      setImgSrc(imageLayer.current?.toDataURL('image/png', HIGHEST_ENCODING_QUALITY) ?? '')
      setRotate(0)
    }
    setIsRotateMode((rotationMode) => !rotationMode)
  }
  function handleRotateRight() {
    setRotate((angle) => (angle + RIGHT_ANGLE) % COMPLETE_ANGLE)
  }
  function handleRotateLeft() {
    setRotate((angle) => (angle + COMPLETE_ANGLE - RIGHT_ANGLE) % COMPLETE_ANGLE)
  }

  function handleBlur() {
    if (isBlurMode) {
      setImgSrc(imageLayer.current?.toDataURL('image/png', HIGHEST_ENCODING_QUALITY) ?? '')
      setBlurAreas([])
    }
    setIsBlurMode((blurMode) => !blurMode)
  }

  function getCropImage() {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context === null) return
    const image = createImageElement(URL.createObjectURL(originFile!))
    image.onload = () => {
      const { x, y, width, height } = locateImage(image, rotate)
      const canvasSize = getRotatedCanvasSize({ width, height }, rotate)
      resizeCanvas(canvas, canvasSize)
      context.rotate((rotate * Math.PI) / 180)
      context.drawImage(image, x, y, width, height)
      context.restore()
      const cropImage = canvas.toDataURL('image/png', HIGHEST_ENCODING_QUALITY)
      setImgSrc(cropImage)
    }
  }

  useEffect(() => {
    drawImage()
  }, [drawImage])

  useEffect(() => {
    blurImage()
  }, [blurImage])

  useEffect(() => {
    drawDragLayer()
  }, [drawDragLayer])

  useEffect(() => {
    drawDragArea()
  }, [drawDragArea])

  return (
    <>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container>
          {imgSrc ? (
            <>
              <Canvas ref={blurLayer} />
              <Canvas ref={imageLayer} />
              <Canvas
                ref={dragLayer}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              />
            </>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files === null) return
                setOriginFile(e.target.files?.[0])
                setImgSrc(URL.createObjectURL(e.target.files?.[0]))
                const image = createImageElement(URL.createObjectURL(e.target.files?.[0]))
                image.onload = () => {
                  setOriginSize({ width: image.naturalWidth, height: image.naturalHeight })
                }
              }}
            />
          )}
        </Container>
      </div>
      <div>
        <button
          onClick={() => {
            handleRotate()
          }}
        >
          Rotate
        </button>
        <button
          onClick={() => {
            handleBlur()
          }}
        >
          blur
        </button>
        <button onClick={handleRotateLeft} disabled={!isRotateMode}>
          {'<'}
        </button>
        <button onClick={handleRotateRight} disabled={!isRotateMode}>
          {'>'}
        </button>
        <button
          onClick={() => {
            handleSave()
          }}
        >
          save
        </button>
      </div>
    </>
  )
}

const Container = styled.div`
  width: 900px;
  height: 900px;
  position: relative;
  background-color: #f5f5f5;
`

const Canvas = styled.canvas`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`
