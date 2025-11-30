'use client';

import { useState, useCallback, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultDisplay from '@/components/ResultDisplay';

interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  generatedText: string;
  title: string;
}

export default function Home() {
  const [generatedText, setGeneratedText] = useState<string>('');
  const [structuredText, setStructuredText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPhase2Loading, setIsPhase2Loading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<number>(0); // 0: 未開始, 1: フェーズ1完了, 2: フェーズ2完了
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  // 履歴の読み込み
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

  const saveToHistory = (text: string, jsonData: any, fileName: string) => {
    let title = '無題の求人原稿';
    if (jsonData && jsonData['タイトル'] && jsonData['タイトル'] !== '（未入力）') {
      title = jsonData['タイトル'];
    } else {
      const match = text.match(/【タイトル】\s*(.*)/);
      if (match && match[1] && match[1].trim() !== '（未入力）') {
        title = match[1].trim();
      }
    }

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      fileName: fileName || 'unknown.xlsx',
      generatedText: text,
      title: title
    };

    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    localStorage.setItem('jobPostingHistory', JSON.stringify(newHistory));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('この履歴を削除してもよろしいですか？')) {
      const newHistory = history.filter(item => item.id !== id);
      setHistory(newHistory);
      localStorage.setItem('jobPostingHistory', JSON.stringify(newHistory));
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setGeneratedText(item.generatedText);
    setStructuredText(''); // 履歴からの読み込みなのでフェーズ1のテキストはクリアしておく
    setCurrentPhase(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError('');
    setGeneratedText('');
    setStructuredText('');
    setCurrentPhase(0);
    setCurrentFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/generate?phase=1', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('サーバーからの応答が空です');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[ERROR] JSONパースエラー:', parseError);
        console.error('[ERROR] レスポンステキスト:', responseText);
        throw new Error(`サーバーからの応答を解析できませんでした: ${responseText.substring(0, 200)}`);
      }

      console.log('[DEBUG] フェーズ1 APIレスポンス:', data);

      if (!response.ok) {
        console.error('[ERROR] APIエラー:', data);
        throw new Error(data.error || 'エラーが発生しました');
      }

      setStructuredText(data.structuredText || '');
      setCurrentPhase(1);
    } catch (err: any) {
      setError(err.message || 'フェーズ1（テキスト化）に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePhase2 = useCallback(async () => {
    if (!structuredText) {
      setError('テキスト化されたデータがありません');
      return;
    }

    setIsPhase2Loading(true);
    setError('');
    setGeneratedText('');

    try {
      const formData = new FormData();
      formData.append('structuredText', structuredText);

      const response = await fetch('/api/generate?phase=2', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('サーバーからの応答が空です');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[ERROR] JSONパースエラー:', parseError);
        console.error('[ERROR] レスポンステキスト:', responseText);
        throw new Error(`サーバーからの応答を解析できませんでした: ${responseText.substring(0, 200)}`);
      }

      console.log('[DEBUG] フェーズ2 APIレスポンス:', data);

      if (!response.ok) {
        console.error('[ERROR] APIエラー:', data);
        throw new Error(data.error || 'エラーが発生しました');
      }

      if (data.jsonData) {
        console.log('[DEBUG] JSONデータ:', data.jsonData);
        console.log('[DEBUG] JSONデータのキー数:', Object.keys(data.jsonData).length);
      }

      setGeneratedText(data.generatedText);
      setCurrentPhase(2);
      saveToHistory(data.generatedText, data.jsonData, currentFileName);
    } catch (err: any) {
      setError(err.message || 'フェーズ2（マッピング）に失敗しました');
    } finally {
      setIsPhase2Loading(false);
    }
  }, [structuredText, currentFileName, history]);

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center mb-6">
            <img 
              src="/images/versus-logo.png" 
              alt="ヴェルサス" 
              className="h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/tcc-logo.png';
              }}
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2 tracking-tight flex items-center justify-center gap-2">
            <span className="text-gray-900">TCC専用</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-700">ヒアリングシート</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-gray-900">求人原稿</span>
          </h1>
          <p className="text-gray-600 mb-4">
            ヒアリングシート（Excel）をアップロードして、求人サイト用の原稿を自動生成
          </p>
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50/50 border-l-4 border-yellow-400 p-4 max-w-3xl mx-auto text-left rounded-r-lg shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-800">
                <strong className="font-semibold">ご注意：</strong>
                ヒアリングシートのフォーマットが変わった場合は正常に動作しないことがあります。
              </p>
            </div>
          </div>
        </header>

        {/* 履歴セクション（上部に移動） */}
        {history.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              作成履歴
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group relative hover:border-blue-300"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1 pr-6 text-sm" title={item.title}>
                      {item.title}
                    </h3>
                    <button
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="text-gray-400 hover:text-red-500 p-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                    {item.fileName}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(item.timestamp).toLocaleString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <FileUpload
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold mb-1 text-sm">エラー</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* フェーズ1の結果表示 */}
        {currentPhase >= 1 && structuredText && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
              フェーズ1: テキスト化されたデータ
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
                {structuredText}
              </pre>
            </div>
            {currentPhase === 1 && (
              <button
                onClick={handlePhase2}
                disabled={isPhase2Loading}
                className={`
                  mt-6 px-6 py-3 rounded-lg font-medium text-white
                  transition-all duration-200
                  relative overflow-hidden group
                  ${isPhase2Loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-98'
                  }
                `}
              >
                {isPhase2Loading ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>マッピング中...</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </span>
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">
                      <span>求人原稿に変換する</span>
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* フェーズ2の結果表示 */}
        {currentPhase === 2 && generatedText && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <ResultDisplay text={generatedText} />
          </div>
        )}

      </div>
    </div>
  );
}