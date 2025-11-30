'use client';

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';

export interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  loadingText?: string;
  progressValue?: number;
}

export default function FileUpload({ onFileUpload, isLoading, loadingText, progressValue }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [internalProgress, setInternalProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // プログレスバーのアニメーション制御
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      // 外部からの進捗指定がない場合は自動で進める
      if (progressValue === undefined) {
        setInternalProgress(0);
        interval = setInterval(() => {
          setInternalProgress((prev) => {
            if (prev >= 95) return 95;
            const increment = Math.max(0.5, (95 - prev) / 20);
            return Math.min(95, prev + increment);
          });
        }, 200);
      } else {
        // 外部からの指定がある場合はそれに従う
        setInternalProgress(progressValue);
      }
    } else {
      setInternalProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, progressValue]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileUpload(file);
      } else {
        alert('Excelファイル（.xlsx または .xls）をアップロードしてください');
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileUpload(file);
      } else {
        alert('Excelファイル（.xlsx または .xls）をアップロードしてください');
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayProgress = Math.round(internalProgress);
  const displayText = loadingText || '処理中...';

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
        ファイルをアップロード
      </h2>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200 relative overflow-hidden
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${isLoading ? 'opacity-90 cursor-not-allowed border-blue-200' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center relative z-10 w-full max-w-md mx-auto py-4">
            {/* おしゃれなプログレスバー (Canva風) */}
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4 relative shadow-inner">
              <div 
                className="h-full rounded-full relative transition-all duration-500 ease-out"
                style={{ 
                  width: `${displayProgress}%`,
                  background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #8b5cf6 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'gradientMove 2s linear infinite'
                }}
              >
                {/* キラキラエフェクト */}
                <div className="absolute top-0 left-0 w-full h-full bg-white/30 animate-pulse"></div>
                <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px]"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              {/* スピナーは削除し、プログレスバーのみにする */}
              <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
                {displayText} {displayProgress}%
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-2">AIが内容を解析して原稿を作成しています...</p>
            
            <style jsx>{`
              @keyframes gradientMove {
                0% { background-position: 100% 0%; }
                100% { background-position: 0% 0%; }
              }
            `}</style>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4 transition-transform group-hover:scale-110 duration-300"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-base text-gray-700 mb-2">
              <span className="font-semibold text-blue-600">クリック</span>または
              <span className="font-semibold text-blue-600">ドラッグ＆ドロップ</span>
              でExcelファイルをアップロード
            </p>
            <p className="text-sm text-gray-500">
              対応形式: .xlsx, .xls
            </p>
          </>
        )}
      </div>
    </div>
  );
}