'use client';

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';

interface FileUploadProps {
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

  // progressValueが親から渡されている場合はそれを優先、なければinternalProgressを使用
  const finalProgress = progressValue !== undefined ? progressValue : internalProgress;
  const displayProgress = Math.max(5, Math.min(100, Math.round(finalProgress)));
  const displayText = loadingText || '処理中...';

  // ローディング状態の表示を完全に分離
  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
          ファイルをアップロード
        </h2>
        
        <div className="border-2 border-dashed border-blue-200 rounded-lg p-12 bg-gray-50 opacity-90 cursor-not-allowed">
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto py-4 space-y-4">
            {/* プログレスバー - より目立つデザインに */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${displayProgress}%` }}
              >
                {/* キラッと光るエフェクト */}
                <div className="w-full h-full bg-white/30 animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold text-gray-700 animate-pulse">
                {displayText}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {displayProgress}%
              </p>
              <p className="text-xs text-gray-400">
                AIが内容を解析して原稿を執筆中...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 通常状態の表示
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
        />
        
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
      </div>
    </div>
  );
}

