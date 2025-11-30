'use client';

import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';

interface ResultDisplayProps {
  text: string;
}

export default function ResultDisplay({ text }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  // URLを検出してリンクに変換する関数
  const formatTextWithLinks = useMemo(() => {
    // URLパターン（http://, https://, www.で始まるURL、より包括的なパターン）
    // 括弧、句読点、改行の前で終了するように改善
    const urlPattern = /(https?:\/\/[^\s\)\]\}\.,;:!?]+|www\.[^\s\)\]\}\.,;:!?]+)/gi;
    
    // テキストを行ごとに分割
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const parts: (string | ReactElement)[] = [];
      let lastIndex = 0;
      let match;
      
      // URLを検出してリンクに変換
      while ((match = urlPattern.exec(line)) !== null) {
        // URLの前のテキスト
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        
        // URLをリンクに変換
        let url = match[0];
        let displayUrl = match[0];
        
        // 末尾の句読点を削除（表示用）
        const trailingPunctuation = /[.,;:!?]+$/.exec(url);
        if (trailingPunctuation) {
          displayUrl = url.slice(0, -trailingPunctuation[0].length);
          url = displayUrl;
        }
        
        // www.で始まる場合はhttps://を追加
        if (url.toLowerCase().startsWith('www.')) {
          url = 'https://' + url;
        }
        
        // URLの検証
        let isValidUrl = true;
        try {
          new URL(url);
        } catch {
          isValidUrl = false;
        }
        
        if (isValidUrl) {
          parts.push(
            <a
              key={`link-${lineIndex}-${match.index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {displayUrl}
            </a>
          );
          // 末尾の句読点があれば追加
          if (trailingPunctuation) {
            parts.push(trailingPunctuation[0]);
          }
        } else {
          // 無効なURLの場合はそのまま表示
          parts.push(match[0]);
        }
        
        lastIndex = match.index + match[0].length;
      }
      
      // 残りのテキスト
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      // 行が空の場合は改行を保持
      if (parts.length === 0) {
        return <br key={`line-${lineIndex}`} />;
      }
      
      return (
        <span key={`line-${lineIndex}`}>
          {parts}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
  }, [text]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          生成された求人原稿
        </h2>
        <button
          onClick={handleCopy}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${copied
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {copied ? '✓ コピーしました' : 'コピー'}
        </button>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
          {formatTextWithLinks}
        </div>
      </div>
    </div>
  );
}

