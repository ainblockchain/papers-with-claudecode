'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Monaco Editor를 동적으로 import (SSR 방지)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center">Loading editor...</div>,
})

export default function EditorPage() {
  const [code, setCode] = useState(`# Python 코드를 작성해보세요!

def hello_world():
    print("Hello, World!")

hello_world()
`)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const handleRunCode = () => {
    setIsRunning(true)
    // 실제 코드 실행은 백엔드 API 연동이 필요합니다
    // 여기서는 데모용으로 간단한 시뮬레이션만 수행
    setTimeout(() => {
      setOutput('Hello, World!\n\n코드 실행이 완료되었습니다.')
      setIsRunning(false)
    }, 1000)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold text-lms-blue-600">
            Hackathon LMS
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-lms-blue-600">
              대시보드
            </Link>
            <Link href="/courses" className="text-gray-700 hover:text-lms-blue-600">
              과정
            </Link>
            <Link href="/editor" className="text-gray-700 hover:text-lms-blue-600">
              에디터
            </Link>
          </nav>
        </div>
      </header>

      {/* Editor Section */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Code Editor */}
        <div className="flex w-1/2 flex-col border-r">
          <div className="flex items-center justify-between border-b bg-gray-100 px-4 py-3">
            <h2 className="font-semibold">코드 에디터</h2>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="rounded-md bg-green-500 px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:bg-gray-400"
            >
              {isRunning ? '실행 중...' : '▶ 실행'}
            </button>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex w-1/2 flex-col">
          <div className="border-b bg-gray-100 px-4 py-3">
            <h2 className="font-semibold">실행 결과</h2>
          </div>
          <div className="flex-1 overflow-auto bg-gray-900 p-4">
            <pre className="font-mono text-sm text-green-400">
              {output || '코드를 실행하면 결과가 여기에 표시됩니다.'}
            </pre>
          </div>
        </div>
      </div>

      {/* Instructions Panel (Optional) */}
      <div className="border-t bg-white p-4">
        <div className="container mx-auto">
          <h3 className="mb-2 font-semibold">💡 학습 가이드</h3>
          <p className="text-sm text-gray-600">
            왼쪽 에디터에서 Python 코드를 작성하고 "실행" 버튼을 클릭하여 결과를 확인하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
