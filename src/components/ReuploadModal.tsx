// Modal component for PDF re-upload when resuming older tests
// Used when test data exists on server but PDF needs to be re-uploaded

import React, { useState, useRef } from 'react'
import { ResumeManager } from '../lib/resumeManager'

interface ReuploadModalProps {
  isOpen: boolean
  onClose: () => void
  testId: string
  testName: string
  onReuploadSuccess: (testData: any) => void
  onReuploadError: (error: string) => void
}

export function ReuploadModal({
  isOpen,
  onClose,
  testId,
  testName,
  onReuploadSuccess,
  onReuploadError
}: ReuploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = ResumeManager.validatePdfFile(file)
    if (!validation.valid) {
      setValidationError(validation.message)
      setSelectedFile(null)
      return
    }

    setValidationError('')
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await ResumeManager.resumeWithReupload(
        testId,
        selectedFile,
        (progress) => setUploadProgress(progress)
      )

      if (result.success && result.testData) {
        onReuploadSuccess(result.testData)
        handleClose()
      } else {
        onReuploadError(result.message || 'Upload failed')
      }
    } catch (error) {
      onReuploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setValidationError('')
    setUploadProgress(0)
    setIsUploading(false)
    onClose()
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const validation = ResumeManager.validatePdfFile(file)
      if (!validation.valid) {
        setValidationError(validation.message)
        return
      }
      setValidationError('')
      setSelectedFile(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              📄 Re-upload PDF to Resume
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              disabled={isUploading}
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            To resume "{testName}", please re-upload the original PDF file.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div>
                <div className="text-green-600 text-4xl mb-2">📄</div>
                <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                  disabled={isUploading}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 text-4xl mb-2">📄</div>
                <p className="text-gray-600 mb-2">
                  Drag and drop your PDF here, or
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  disabled={isUploading}
                >
                  Choose File
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 50MB
                </p>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {/* Validation Error */}
          {validationError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              {validationError}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your progress and answers will be preserved. 
              Only the PDF file needs to be re-uploaded.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              selectedFile && !isUploading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Resume Test'}
          </button>
        </div>
      </div>
    </div>
  )
}
