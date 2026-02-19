'use client'

import Link from 'next/link'

export default function CoursesPage() {
  const courses = [
    {
      id: 1,
      title: 'Python 기초',
      description: '프로그래밍의 기초부터 시작하는 Python 강좌',
      progress: 30,
      color: 'from-lms-blue-400 to-lms-blue-600',
      buttonColor: 'bg-lms-blue-500 hover:bg-lms-blue-600',
    },
    {
      id: 2,
      title: '데이터 분석 입문',
      description: '데이터를 다루는 기본 기술을 배웁니다',
      progress: 65,
      color: 'from-purple-400 to-purple-600',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 3,
      title: '웹 개발 기초',
      description: 'HTML, CSS, JavaScript를 활용한 웹 개발',
      progress: 10,
      color: 'from-green-400 to-green-600',
      buttonColor: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 4,
      title: '머신러닝 기초',
      description: '인공지능과 머신러닝의 기초 개념',
      progress: 0,
      color: 'from-orange-400 to-orange-600',
      buttonColor: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      id: 5,
      title: '데이터베이스 설계',
      description: 'SQL과 데이터베이스 설계의 기초',
      progress: 45,
      color: 'from-blue-400 to-blue-600',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 6,
      title: 'Git & GitHub',
      description: '버전 관리 시스템의 이해와 활용',
      progress: 80,
      color: 'from-gray-400 to-gray-600',
      buttonColor: 'bg-gray-500 hover:bg-gray-600',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
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
            <Link href="/courses" className="text-lms-blue-600 font-medium">
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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">전체 과정</h1>
            <p className="text-gray-600">다양한 과정을 탐색하고 학습을 시작하세요</p>
          </div>

          {/* Filter/Sort Options */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="rounded-md bg-lms-blue-500 px-4 py-2 text-sm text-white">
                전체
              </button>
              <button className="rounded-md bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                진행 중
              </button>
              <button className="rounded-md bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                완료
              </button>
            </div>
            <select className="rounded-md border bg-white px-4 py-2 text-sm">
              <option>최신순</option>
              <option>인기순</option>
              <option>진행률순</option>
            </select>
          </div>

          {/* Course Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
              >
                <div
                  className={`mb-4 h-40 rounded-md bg-gradient-to-r ${course.color}`}
                />
                <h3 className="mb-2 text-lg font-semibold">{course.title}</h3>
                <p className="mb-4 text-sm text-gray-600">{course.description}</p>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-lms-blue-500 transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/courses/${course.id}`}
                  className={`inline-block w-full rounded-md ${course.buttonColor} py-2 text-center text-white transition-colors`}
                >
                  {course.progress > 0 ? '계속 학습하기' : '시작하기'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
