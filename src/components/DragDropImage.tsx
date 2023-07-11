import React from 'react'

interface Props {
  handleDrop: (e: React.DragEvent<HTMLLabelElement>) => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function DragDropImage({ handleDrop, handleChange }: Props) {
  return (
    <label
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onDrop={handleDrop}
    >
      이미지를 업로드하세요.
      <input style={{ display: 'none' }} type="file" accept="image/*" onChange={handleChange} />
    </label>
  )
}
