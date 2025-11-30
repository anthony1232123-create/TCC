'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  generatedText: string;
  title: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const savedHistory = localStorage.getItem('jobPostingHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('この履歴を削除してもよろしいですか？')) {
      const newHistory = history.filter(item => item.id !== id);
      setHistory(newHistory);
      localStorage.setItem('jobPostingHistory', JSON.stringify(newHistory));
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    // トップページに遷移して表示させるための仕組みが必要
    // クエリパラメータやlocalStorage経由で渡す
    localStorage.setItem('currentJobPosting', JSON.stringify(item));
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center mb-6">
            <Link href="/">
              <img 
                src="/images/versus-logo.png" 
                alt="ヴェルサス" 
                className="h-12 object-contain cursor-pointer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/tcc-logo.png';
                }}
              />
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2 tracking-tight flex items-center justify-center gap-2">
            <span className="text-gray-900">作成履歴一覧</span>
          </h1>
          <div className="mt-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              トップページに戻る
            </Link>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              履歴はありません
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-gray-800 mb-1 truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {item.fileName}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(item.timestamp).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                    className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                    title="削除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
