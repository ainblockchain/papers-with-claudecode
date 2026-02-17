'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold text-lms-blue-600">Hackathon LMS</h1>
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

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <section className="mb-8">
            <h2 className="mb-2 text-3xl font-bold">반갑습니다! 👋</h2>
            <p className="text-gray-600">학습을 시작해볼까요?</p>
          </section>

          {/* Course Cards */}
          <section>
            <h3 className="mb-4 text-xl font-semibold">내 강좌</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Sample Course Card 1 */}
              <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                <div className="mb-4 h-40 rounded-md bg-gradient-to-r from-lms-blue-400 to-lms-blue-600" />
                <h4 className="mb-2 text-lg font-semibold">Python 기초</h4>
                <p className="mb-4 text-sm text-gray-600">
                  프로그래밍의 기초부터 시작하는 Python 강좌
                </p>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[30%] bg-lms-blue-500" />
                  </div>
                </div>
                <Link
                  href="/courses/1"
                  className="inline-block w-full rounded-md bg-lms-blue-500 py-2 text-center text-white transition-colors hover:bg-lms-blue-600"
                >
                  계속 학습하기
                </Link>
              </div>

              {/* Sample Course Card 2 */}
              <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                <div className="mb-4 h-40 rounded-md bg-gradient-to-r from-purple-400 to-purple-600" />
                <h4 className="mb-2 text-lg font-semibold">데이터 분석 입문</h4>
                <p className="mb-4 text-sm text-gray-600">
                  데이터를 다루는 기본 기술을 배웁니다
                </p>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[65%] bg-purple-500" />
                  </div>
                </div>
                <Link
                  href="/courses/2"
                  className="inline-block w-full rounded-md bg-purple-500 py-2 text-center text-white transition-colors hover:bg-purple-600"
                >
                  계속 학습하기
                </Link>
              </div>

              {/* Sample Course Card 3 */}
              <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                <div className="mb-4 h-40 rounded-md bg-gradient-to-r from-green-400 to-green-600" />
                <h4 className="mb-2 text-lg font-semibold">웹 개발 기초</h4>
                <p className="mb-4 text-sm text-gray-600">
                  HTML, CSS, JavaScript를 활용한 웹 개발
                </p>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[10%] bg-green-500" />
                  </div>
                </div>
                <Link
                  href="/courses/3"
                  className="inline-block w-full rounded-md bg-green-500 py-2 text-center text-white transition-colors hover:bg-green-600"
                >
                  계속 학습하기
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
