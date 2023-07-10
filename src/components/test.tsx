import styled from '@emotion/styled'
import saveAs from 'file-saver'
import React, { useEffect, useRef, useState } from 'react'

const ZOOM_STEP = 0.3
const MAX_ZOOM = ZOOM_STEP * 5 + 1
const MIN_ZOOM = 1

interface Props {
  width?: number
  height?: number
  src: string
}

export default function ImageZoom({ width, height, src }: Props) {
  const imageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [move, setMove] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [isDrag, setIsDrag] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [crop, setCrop] = useState('')

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setIsDrag(true)
    setStartPos({ x: e.clientX - move.x, y: e.clientY - move.y })
  }

  const handleDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDrag) return
    setMove({ x: e.clientX - startPos.x, y: e.clientY - startPos.y })
  }

  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDrag) return
    setIsDrag(false)
    const imageRect = imageRef.current?.getBoundingClientRect() as DOMRect
    const containerRect = containerRef.current?.getBoundingClientRect() as DOMRect
    const bottomOver = move.y < -(imageRect.height - containerRect.height) / 2
    const topOver = move.y > (imageRect.height - containerRect.height) / 2
    const rightOver = move.x < -(imageRect.width - containerRect.width) / 2
    const leftOver = move.x > (imageRect.width - containerRect.width) / 2

    if (bottomOver && rightOver) {
      setMove({ x: -(imageRect.width - containerRect.width) / 2, y: -(imageRect.height - containerRect.height) / 2 })
    } else if (bottomOver && leftOver) {
      setMove({ x: (imageRect.width - containerRect.width) / 2, y: -(imageRect.height - containerRect.height) / 2 })
    } else if (bottomOver) {
      setMove({ ...move, y: -(imageRect.height - containerRect.height) / 2 })
    } else if (topOver && rightOver) {
      setMove({ x: -(imageRect.width - containerRect.width) / 2, y: (imageRect.height - containerRect.height) / 2 })
    } else if (topOver && leftOver) {
      setMove({ x: (imageRect.width - containerRect.width) / 2, y: (imageRect.height - containerRect.height) / 2 })
    } else if (topOver) {
      setMove({ ...move, y: (imageRect.height - containerRect.height) / 2 })
    } else if (rightOver) {
      setMove({ ...move, x: -(imageRect.width - containerRect.width) / 2 })
    } else if (leftOver) {
      setMove({ ...move, x: (imageRect.width - containerRect.width) / 2 })
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY > 0) {
      setZoom((prev) => (prev - ZOOM_STEP < MIN_ZOOM ? prev : prev - ZOOM_STEP))
    } else if (e.deltaY < 0) {
      setZoom((prev) => (prev + ZOOM_STEP > MAX_ZOOM ? prev : prev + ZOOM_STEP))
    }
  }

  const getCrop = () => {
    const imageRect = imageRef.current?.getBoundingClientRect() as DOMRect
    const containerRect = containerRef.current?.getBoundingClientRect() as DOMRect
    const canvas = document.createElement('canvas')
    canvas.width = containerRef.current?.offsetWidth as number
    canvas.height = containerRef.current?.offsetHeight as number
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.onload = () => {
      const ratio = image.width / imageRect.width

      ctx?.drawImage(
        image,
        Math.abs(containerRect.x - imageRect.x) * ratio,
        Math.abs(containerRect.y - imageRect.y) * ratio,
        containerRect.width * ratio,
        containerRect.height * ratio,
        0,
        0,
        canvas.width,
        canvas.height
      )

      canvas.toBlob((blob) => blob && saveAs(blob, `image_${new Date().getTime()}.png`))

      // const imgUrl = canvas.toDataURL();
      // setCrop(imgUrl);
      // saveAs(imgUrl, `image_${new Date().getTime()}.png`);
    }
    image.src = src
  }

  useEffect(() => {
    const image = new Image()
    image.src = src
    image.onload = () => {
      setSize({ w: image.width, h: image.height })
    }
  }, [src])

  return (
    <>
      <Container
        ref={containerRef}
        width={width}
        height={height}
        isDrag={isDrag}
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onWheel={handleWheel}
      >
        <ImgWrapper ref={imageRef} src={src} moveX={move.x} moveY={move.y} zoom={zoom} size={size}></ImgWrapper>
        <Grid></Grid>
      </Container>
      <button onClick={getCrop}>crop</button>
    </>
  )
}

interface ContainerProps {
  width?: number
  height?: number
  isDrag: boolean
}

interface ImgWrap {
  src: string
  moveX: number
  moveY: number
  zoom: number
  size: { w: number; h: number }
}

const Container = styled.div<ContainerProps>(
  {
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ({ width }) => (width ? { width: `${width}px` } : { width: '100%' }),
  ({ height }) => (height ? { height: `${height}px` } : { height: '100%' }),
  ({ isDrag }) => (isDrag ? { cursor: 'move' } : { cursor: 'auto' })
)

const ImgWrapper = styled.div<ImgWrap>(
  {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: `contain`,
    flexShrink: '0',
  },
  ({ src }) => ({ backgroundImage: `url(${src})` }),
  ({ moveX, moveY, zoom }) => ({ transform: `translateX(${moveX}px) translateY(${moveY}px) scale(${zoom})` }),
  ({ size }) =>
    size.w >= size.h
      ? { width: `calc(100% * ${size.w / size.h})`, height: '100%' }
      : { width: '100%', height: `calc(100% * ${size.w / size.h})` }
)

const Grid = styled.div({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  zIndex: '10',
  '&:before': {
    content: "' '",
    boxSizing: 'border-box',
    position: 'absolute',
    width: 'calc(100% / 3)',
    height: '100%',
    transform: 'translateX(-50%)',
    borderLeft: '1px solid white',
    borderRight: '1px solid white',
    display: 'none',
  },
  '&:after': {
    content: "' '",
    boxSizing: 'border-box',
    position: 'absolute',
    height: 'calc(100% / 3)',
    width: '100%',
    transform: 'translateX(-50%) translateY(100%)',
    borderTop: '1px solid white',
    borderBottom: '1px solid white',
    display: 'none',
  },
  '&:hover:before': {
    display: 'inline-block',
  },
  '&:hover:after': {
    display: 'inline-block',
  },
})
