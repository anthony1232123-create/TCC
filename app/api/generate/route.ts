import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    // OpenAI APIキーのチェック
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[ERROR] OPENAI_API_KEY環境変数が設定されていません');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY環境変数が設定されていません' },
        { status: 500 }
      );
    }

    console.log('[DEBUG] APIキーが設定されています（最初の10文字）:', apiKey.substring(0, 10) + '...');

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // クエリパラメータでフェーズを制御
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase') || '1'; // デフォルトはフェーズ1

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const phase2StructuredText = formData.get('structuredText') as string | null; // フェーズ2用

    // フェーズ2の場合はphase2StructuredTextが必要
    if (phase === '2') {
      if (!phase2StructuredText) {
        return NextResponse.json(
          { error: 'フェーズ2にはstructuredTextが必要です' },
          { status: 400 }
        );
      }
      // フェーズ2のみ実行
      return await executePhase2(openai, phase2StructuredText);
    }

    // フェーズ1の場合はfileが必要
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルがアップロードされていません' },
        { status: 400 }
      );
    }

    // Excelファイルを読み込む
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // すべてのシートのデータを取得（「記入例」を含むシートは除外）
    const allData: Record<string, any> = {};
    // 全ての行を読み込む（制限を撤廃） // 最大行数を制限（50行に削減）
    
    // 「記入例」を含むシートを除外し、実際に記入されたシートのみを処理
    const validSheetNames = workbook.SheetNames.filter(name => 
      !name.includes('記入例') && 
      !name.includes('（記入例）') &&
      !name.includes('(記入例)')
    );
    
    if (validSheetNames.length === 0) {
      return NextResponse.json(
        { error: '記入例以外のシートが見つかりませんでした。実際に記入されたシートがあるか確認してください。' },
        { status: 400 }
      );
    }
    
    // 「求人情報入力シート」を優先的に探す（記入例を除外した中から）
    const targetSheetName = validSheetNames.find(name => 
      name.includes('求人情報入力シート')
    ) || validSheetNames.find(name => 
      name.includes('介護系専用シート')
    ) || validSheetNames[0];
    
    const sheetsToProcess = [targetSheetName];
    
    console.log(`[DEBUG] 処理対象シート: ${targetSheetName} (除外されたシート: ${workbook.SheetNames.filter(name => name.includes('記入例')).join(', ')})`);
    
    sheetsToProcess.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // まず、行ベースのデータとして読み込む（header: 1）
      const rowData = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });
      
      // プルダウン形式のセルを識別するためのマーカー
      const dropdownMarker = '…プルダウン選択';
      
      // データを整理：空でないセルを抽出し、プルダウン形式の空欄をスキップ
      const processedRows: string[] = [];
      for (let rowIndex = 0; rowIndex < rowData.length; rowIndex++) {
        const row = rowData[rowIndex];
        if (Array.isArray(row)) {
          // 行にプルダウンマーカーが含まれているか確認
          const hasDropdownMarker = row.some((cell: any) => 
            String(cell).includes(dropdownMarker)
          );
          
          // 空でないセルを抽出
          const cells: string[] = [];
          
          for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            const cellStr = String(cell).trim();
            
            // プルダウンマーカーをスキップ
            if (cellStr.includes(dropdownMarker)) {
              continue;
            }
            
            // 空でないセルを追加
            if (cellStr !== '' && cellStr !== null && cellStr !== undefined) {
              // 数値の場合、時間表記に変換
              let cellValue = cellStr;
              const numValue = Number(cell);
              
              if (!isNaN(numValue)) {
                // 0から1の範囲の小数は、24時間表記の時間を表している可能性（例：0.333... = 8時、0.708... = 17時）
                if (numValue > 0 && numValue < 1) {
                  const totalHours = numValue * 24;
                  const hours = Math.floor(totalHours);
                  const minutes = Math.round((totalHours - hours) * 60);
                  if (hours >= 0 && hours < 24) {
                    cellValue = `${hours}:${minutes.toString().padStart(2, '0')}`;
                  }
                }
                // 0.1から23.9の範囲の数値で、小数点以下がある場合は時間表記に変換（例：8.5 → 8:30）
                else if (numValue >= 0.1 && numValue < 24 && numValue % 1 !== 0) {
                  const hours = Math.floor(numValue);
                  const minutes = Math.round((numValue - hours) * 60);
                  if (minutes > 0) {
                    cellValue = `${hours}:${minutes.toString().padStart(2, '0')}`;
                  } else {
                    cellValue = `${hours}:00`;
                  }
                }
              }
              
              cells.push(cellValue);
            }
          }
          
          // プルダウン形式の行の処理
          if (hasDropdownMarker) {
            // 項目名を取得（最初の空でないセル、プルダウンマーカーを除く）
            let itemName = '';
            let itemNameIndex = -1;
            let dropdownMarkerIndex = -1;
            
            // 項目名とプルダウンマーカーの位置を特定
            for (let i = 0; i < row.length; i++) {
              const cellStr = String(row[i]).trim();
              
              // プルダウンマーカーの位置を記録
              if (cellStr.includes(dropdownMarker)) {
                dropdownMarkerIndex = i;
              }
              
              // 項目名を探す（プルダウンマーカーより前の最初の空でないセル）
              if (itemNameIndex === -1 && cellStr !== '' && cellStr !== null && cellStr !== undefined && !cellStr.includes(dropdownMarker)) {
                itemName = cellStr;
                itemNameIndex = i;
              }
            }
            
            // 項目名の後の値セル（オレンジ色のセル）を確認
            // 項目名の直後からプルダウンマーカーの直前までのセルで、空でないセルがあるかチェック
            let hasValue = false;
            
            if (itemNameIndex >= 0 && dropdownMarkerIndex > itemNameIndex) {
              // 項目名の直後からプルダウンマーカーの直前までをチェック
              for (let i = itemNameIndex + 1; i < dropdownMarkerIndex; i++) {
                const cellStr = String(row[i]).trim();
                if (cellStr !== '' && cellStr !== null && cellStr !== undefined) {
                  hasValue = true;
                  break;
                }
              }
            }
            
            // 値セルが全て空欄の場合の処理
            if (!hasValue && itemName) {
              // 「ここがポイント」の特別処理：テキスト化しない
              if (itemName.includes('ここがポイント')) {
                // スキップ
                continue;
              } else {
                // その他のプルダウン形式の項目
                processedRows.push(`${itemName} | （記載なし）`);
              }
            } else if (hasValue && cells.length > 0) {
              // 「ここがポイント」の場合も値があればスキップ（要望によりテキスト化を省く）
              if (itemName.includes('ここがポイント')) {
                continue;
              }
              // 値がある場合は通常通り
              processedRows.push(cells.join(' | '));
            }
          } else {
            // プルダウン形式でない場合は通常通り
            if (cells.length > 0) {
              processedRows.push(cells.join(' | '));
            }
          }
        }
      }
      
      if (processedRows.length > 0) {
        allData[sheetName] = processedRows;
      }
    });

    // Excelデータをより読みやすい形式に変換
    let excelDataString = '';
    Object.keys(allData).forEach((sheetName) => {
      const sheetData = allData[sheetName] as string[];
      excelDataString += `\n【シート名: ${sheetName}】\n`;
      excelDataString += sheetData.join('\n');
      excelDataString += '\n';
    });
    
    console.log('[DEBUG] Excelデータ文字列の長さ:', excelDataString.length);
    console.log('[DEBUG] Excelデータ（最初の1000文字）:', excelDataString.substring(0, 1000));
    
    // データが空でないか確認
    if (!excelDataString || excelDataString.trim().length === 0) {
      return NextResponse.json(
        { error: 'Excelデータが正しく読み込まれませんでした。ファイルの内容を確認してください。' },
        { status: 400 }
      );
    }
    
    // トークン数の上限設定
    const maxTokens = 30000; // 安全な上限（60,000の1/2）
    
    // システムプロンプトとユーザープロンプトの準備（フェーズ2用）
    const systemPrompt = `あなたは求人情報を整理する専門家です。テキスト化された求人情報から情報を抽出し、以下の指定された項目にマッピングしてください。

【出力形式】
以下のJSON形式で出力してください。情報がない項目は空文字列（""）にしてください。

{
  "タイトル": "",
  "投稿の有効期限を設定する": "",
  "職種カテゴリー": "",
  "雇用形態": "",
  "県カテゴリー": "",
  "学歴": "",
  "職種詳細": "",
  "エリア詳細": "",
  "キャッチコピー": "",
  "仕事内容": "",
  "給与": "",
  "待遇": "",
  "勤務時間": "",
  "休日": "",
  "資格": "",
  "メッセージ": "",
  "担当営業所": "",
  "最寄駅": "",
  "アクセス": "",
  "備考（外部非公開情報はここに記載）": ""
}

【マッピングルール（詳細定義）】
Excelデータの各項目を以下のようにマッピングしてください：

1. タイトル:
   - ヒアリングシートには「タイトル」フィールドは存在しないため、仕事内容と職種を組み合わせて生成してください
   - 形式：「仕事内容の要約」＋「職種」の形でコンパクトに作成
   - 例：「遊技機基板の製造・検査業務（製造・組立・検査）」
   - 長くなりすぎないよう、簡潔にまとめてください

2. 投稿の有効期限を設定する:
   - この項目は手入力用のため、常に空文字列（""）にしてください

3. 職種カテゴリー:
   - 「タイトル」を生成した際に使用した職種の部分をここに入れてください
   - 例：タイトルが「遊技機基板の製造・検査業務（製造・組立・検査）」の場合、「製造・組立・検査」を職種カテゴリーに入れる

4. 雇用形態:
   - 「雇用形態」フィールドの値をそのまま使用してください
   - 例：「派遣社員」「正社員」「パート・アルバイト」など

5. 県カテゴリー:
   - 「就業先住所」から都道府県のみを抽出してください
   - 例：「栃木県鹿沼市...」→「栃木県」
   - 都道府県名のみで、市区町村は含めないでください

6. 学歴:
   - Excelデータに学歴情報があれば抽出、なければ空文字列（""）にしてください

7. 職種詳細:
   - 「業種」フィールドや「仕事内容」から職種の詳細を抽出してください
   - 例：「工場系（製造・組立・検査等）」

8. エリア詳細:
   - 「就業先住所」から市区町村などの詳細情報を抽出してください
   - 例：「鹿沼市村井町226-1」→「鹿沼市」または「鹿沼市村井町」

9. キャッチコピー:
   - Excelデータのテキストを読み込んで、訴求すべきポイントを箇条書きで生成してください
   - 例：「・未経験OK！3日でマスターできる\n・重いものを持たない軽作業\n・マニュアル完備で安心」
   - 3〜5個程度のポイントを箇条書きで記載してください

10. 仕事内容:
    - 「仕事内容」「■業務内容」フィールドの値を基に、できるだけわかりやすい文章で仕事内容を生成してください
    - 読みやすさを重視し、適度に改行を入れてください
    - 視認性を高めるため、適度な改行と箇条書き（・を使用）を組み合わせて記述してください
    - 求職者が働くイメージを持てるような魅力的な文章にしてください
    - 専門用語には簡単な説明を加えるなど、親切な表現を心がけてください

11. 給与:
    - 「給与」フィールドの値をそのまま使用してください
    - 例：「時給1200円」「月給20万円」など

12. 待遇:
    - 「待遇」フィールドから福利厚生にあたる部分を記載してください
    - 例：「社会保障完備、制服貸与、休憩室、個人ロッカーあり」
    - 福利厚生に関する情報のみを抽出してください
    - 賞与（ボーナス）や昇給に関する詳細（回数や金額など）があれば、必ずここに含めてください

13. 勤務時間:
    - ヒアリングシートの勤務時間に関する情報があれば抽出してください
    - Excelデータに勤務時間情報があれば記載、なければ空文字列（""）にしてください

14. 休日:
    - ヒアリングシートの休日に関する内容を記載してください
    - Excelデータに休日情報があれば記載、なければ空文字列（""）にしてください

15. 資格:
    - 条件に資格が必須であればここに記載してください
    - Excelデータに必須資格の情報があれば記載、なければ空文字列（""）にしてください
    - 必須でない資格は記載しないでください

16. メッセージ:
    - この項目は手入力用のため、常に空文字列（""）にしてください

17. 担当営業所:
    - 「営業所名」フィールドに記載があればそのまま使用してください
    - 記載がなければ空文字列（""）にしてください
    - 例：「宇都宮営業所」

18. 最寄駅:
    - ヒアリングシートの「交通手段①」「交通手段②」から駅名を抽出してください
    - 例：「東武日光線 新鹿沼駅」→「新鹿沼駅」
    - 路線名は含めず、駅名のみを抽出してください

19. アクセス:
    - ヒアリングシートの「交通手段①」「交通手段②」「交通手段その他」からアクセス情報を抽出してください
    - 例：「東武日光線 新鹿沼駅 車2分 徒歩8分」
    - 路線名、駅名、アクセス方法をまとめて記載してください

20. 備考（外部非公開情報はここに記載）:
    - Excelデータに内部情報や補足情報があれば記載、なければ空文字列（""）にしてください

【重要】
- Excelデータに存在する情報のみを抽出してください
- 情報がない項目は必ず空文字列（""）にしてください
- 推測や補完は行わず、Excelデータに記載されている情報のみを使用してください
- 出力は必ずJSON形式のみで、マークダウンコードブロックや説明文は一切含めないでください
- 出力の最初と最後に余計なテキストを付けず、JSONオブジェクトのみを出力してください

【出力例（一般的な例）】
{
  "タイトル": "製造・組立業務（製造・組立・検査）",
  "投稿の有効期限を設定する": "",
  "職種カテゴリー": "製造・組立・検査",
  "雇用形態": "派遣社員",
  "県カテゴリー": "東京都",
  "学歴": "",
  "職種詳細": "工場系（製造・組立・検査等）",
  "エリア詳細": "品川区",
  "キャッチコピー": "・未経験OK！すぐに始められる\n・軽作業中心で体に優しい\n・マニュアル完備で安心\n・先輩スタッフがサポート",
  "仕事内容": "製品の製造・組立業務を行います。部品を組み立てる作業、製品の検査作業などを行います。作業は比較的簡単で、未経験の方でもすぐに始められます。",
  "給与": "時給1100円",
  "待遇": "社会保障完備、制服貸与、休憩室あり",
  "勤務時間": "9:00〜18:00",
  "休日": "土日祝",
  "資格": "",
  "メッセージ": "",
  "担当営業所": "東京営業所",
  "最寄駅": "品川駅",
  "アクセス": "JR線 品川駅 徒歩5分",
  "備考（外部非公開情報はここに記載）": ""
}

【重要】
- 上記はあくまで出力形式の例です
- 実際の出力は、アップロードされたExcelファイルの内容に基づいて生成してください
- Excelファイルに記載されている実際の情報のみを使用し、例の内容は参考にしないでください`;
    
    // Excelデータのサイズチェック（フェーズ1用）
    const phase1SystemPromptLength = 200; // フェーズ1のシステムプロンプトの概算長
    const phase1EstimatedTokens = Math.ceil((phase1SystemPromptLength + excelDataString.length + 100) / 4);
    
    console.log(`[DEBUG] Excelデータサイズ: ${excelDataString.length}文字, フェーズ1推定トークン数: ${phase1EstimatedTokens}`);
    
    if (phase1EstimatedTokens > maxTokens) {
      // データが大きすぎる場合は、さらに要約
      const truncatedData: Record<string, any> = {};
      Object.keys(allData).forEach((sheetName) => {
        const sheetData = allData[sheetName];
        // 最初の30行のみ使用（さらに削減）
        truncatedData[sheetName] = sheetData.slice(0, 30);
      });
      // 削減されたデータも同じ形式に変換
      let truncatedString = '';
      Object.keys(truncatedData).forEach((sheetName) => {
        const sheetData = truncatedData[sheetName];
        truncatedString += `\n【シート名: ${sheetName}】\n`;
        sheetData.forEach((row: any) => {
          const entries = Object.entries(row).filter(([key, value]) => 
            value !== '' && value !== null && value !== undefined && !key.startsWith('__EMPTY')
          );
          if (entries.length > 0) {
            entries.forEach(([key, value]) => {
              truncatedString += `${key}: ${value}\n`;
            });
          }
        });
      });
      excelDataString = truncatedString;
      console.log(`[DEBUG] データを削減: ${excelDataString.length}文字`);
    }

    // ===== フェーズ1: Excelデータを読みやすいテキスト形式に変換 =====
    console.log('[DEBUG] フェーズ1開始: Excelデータをテキスト化');
    const phase1SystemPrompt = `あなたはExcelデータを読みやすいテキスト形式に整理する専門家です。
Excelデータの内容を、構造化された読みやすいテキスト形式に変換してください。

【重要なルール】
1. Excelデータに記載されている情報をすべて抽出してください
2. ただし、「ここがポイント」セクションは、顧客の要望により、いかなる場合も完全に無視し、テキスト化しないでください（出力から完全に除外してください）。
3. データが「|」で区切られている場合：
   - 最初の値が項目名、2番目以降が値です
   - 複数の値がある場合は、すべての値を含めてください
4. 以下の項目は内部情報のため、テキスト化の対象から除外してください：
   - 営業所名
   - 担当者
   - 企業名(正式名称)
   - 案件名
   - 企業ホームページURL

【出力形式】
- 各項目を「項目名: 値」の形式で記載してください
- 関連する情報はグループ化して記載してください
- 「休日」の項目で内容が「日」となっている場合は「年間休日」として解釈してください
- 勤務時間が小数の場合（例: 8.5）は、時間形式（例: 8:30）に変換してください`;

    const phase1UserPrompt = `以下のExcelデータを読みやすいテキスト形式に変換してください。
Excelデータには「|」で区切られた値が含まれています。最初の値が項目名、2番目以降が値です。

【重要】
- 全ての情報を漏れなく抽出してください
- 「ここがポイント」セクションは完全に無視し、出力に含めないでください。
- 時間表記（例：8:30、17:00）はそのまま保持してください
- 「休日」という項目で「年間休日」という値がある場合は、「年間休日: 値」として記載してください
- 全ての項目について、目を通したことがわかるように記載してください（値が空欄でも項目名は記載、ただし「ここがポイント」は除く）

Excelデータ:
${excelDataString}

上記のExcelデータを分析し、すべての情報を「項目名: 値」の形式で整理してください。値が複数ある場合は、すべての値を含めてください。`;

    // フェーズ1のトークン数チェック
    const phase1SystemTokens = Math.ceil(phase1SystemPrompt.length / 4);
    const phase1UserTokens = Math.ceil((phase1UserPrompt.length + 100) / 4);
    const phase1TotalTokens = phase1SystemTokens + phase1UserTokens + 100;
    
    if (phase1TotalTokens > maxTokens) {
      return NextResponse.json(
        { 
          error: `データが大きすぎます（フェーズ1）。Excelファイルの行数を減らすか、不要な列を削除してください。（推定トークン数: ${phase1TotalTokens}）` 
        },
        { status: 400 }
      );
    }

    let structuredText = '';
    try {
      console.log('[DEBUG] フェーズ1: OpenAI APIを呼び出します...');
      console.log('[DEBUG] フェーズ1: モデル=gpt-5-mini, 入力トークン数（概算）=', phase1EstimatedTokens);
      
      const phase1Completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: phase1SystemPrompt },
          { role: 'user', content: phase1UserPrompt },
        ],
        // gpt-5-miniはtemperatureパラメータをサポートしていないため削除
      });
      
      console.log('[DEBUG] フェーズ1: API呼び出し成功！使用トークン数:', phase1Completion.usage?.total_tokens || '不明');

      structuredText = phase1Completion.choices[0]?.message?.content || '';
      console.log('[DEBUG] フェーズ1完了: テキスト化されたデータの長さ:', structuredText.length);
      console.log('[DEBUG] フェーズ1生成されたテキスト（最初の500文字）:', structuredText.substring(0, 500));
      
      if (!structuredText || structuredText.trim() === '') {
        throw new Error('フェーズ1でテキスト化に失敗しました');
      }
    } catch (error: any) {
      console.error('フェーズ1エラー:', error);
      return NextResponse.json(
        { 
          error: `フェーズ1（テキスト化）でエラーが発生しました: ${error.message || '不明なエラー'}` 
        },
        { status: 500 }
      );
    }

    // フェーズ1の結果を返す
    return NextResponse.json({
      success: true,
      phase: 1,
      structuredText: structuredText,
      message: 'フェーズ1（テキスト化）が完了しました。続けてマッピングを実行してください。',
    });
  } catch (error: any) {
    console.error('Error:', error);
    
    // レート制限エラーの処理
    if (error.status === 429) {
      const errorMessage = error.message || '';
      if (errorMessage.includes('tokens per min') || errorMessage.includes('TPM')) {
        return NextResponse.json(
          { 
            error: 'レート制限に達しました。データが大きすぎる可能性があります。Excelファイルのサイズを小さくするか、しばらく待ってから再度お試しください。また、OpenAIアカウントに支払い方法を追加するとレート制限が増えます。' 
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { 
          error: 'レート制限に達しました。しばらく待ってから再度お試しください。' 
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || '求人原稿の生成に失敗しました' },
      { status: 500 }
    );
  }
}

// フェーズ2を実行する関数
async function executePhase2(openai: OpenAI, structuredText: string) {
  try {
    // PDFファイルの読み込みをスキップ（Vercelではファイルシステムアクセスが制限されるため）
    const mediaPolicyText = '一般的な求人原稿作成のベストプラクティスに従って、魅力的で効果的な求人原稿を作成してください。';

    // システムプロンプトとユーザープロンプトの準備（フェーズ2用）
    const systemPrompt = `あなたは求人情報を整理し、魅力的な求人原稿を作成する専門家です。テキスト化された求人情報から情報を抽出し、以下の指定された項目にマッピングしてください。

【媒体ポリシー（参考資料）】
以下の媒体ポリシーを参考にして、魅力的で効果的な求人原稿を作成してください：

${mediaPolicyText.substring(0, 10000)}

【重要】
- 上記の媒体ポリシーを参考にしながら、各項目を魅力的な求人原稿として作成してください
- ポリシーに違反しない範囲で、求職者にとって魅力的で分かりやすい表現を使用してください
- 各項目は読みやすく、訴求力のある文章にしてください
- 特に「キャッチコピー」と「仕事内容」は、求職者が「この仕事をしてみたい」と思えるような魅力的な表現を心がけてください

【出力形式】
以下のJSON形式で出力してください。情報がない項目は空文字列（""）にしてください。
項目の順番は、関連性のある項目をまとめて配置しています：

{
  "タイトル": "",
  "職種詳細": "",
  "キャッチコピー": "",
  "県カテゴリー": "",
  "エリア詳細": "",
  "最寄駅": "",
  "アクセス": "",
  "職種カテゴリー": "",
  "雇用形態": "",
  "学歴": "",
  "仕事内容": "",
  "給与": "",
  "待遇": "",
  "勤務時間": "",
  "休日": "",
  "資格": "",
  "担当営業所": "",
  "メッセージ": "",
  "備考（外部非公開情報はここに記載）": ""
}

【マッピングルール（詳細定義）】
Excelデータの各項目を以下のようにマッピングしてください。各項目は媒体ポリシーを参考にしながら、魅力的で効果的な求人原稿として作成してください。
項目の順番は、関連性のある項目をまとめて配置しています：

1. タイトル:
   - ヒアリングシートには「タイトル」フィールドは存在しないため、仕事内容と職種を組み合わせて生成してください
   - 形式：「仕事内容の要約」＋「職種」の形でコンパクトに作成
   - 例：「遊技機基板の製造・検査業務（製造・組立・検査）」
   - 長くなりすぎないよう、簡潔にまとめてください
   - 媒体ポリシーを参考にしながら、魅力的で効果的なタイトルを作成してください

2. 職種詳細:
   - 「業種」フィールドや「仕事内容」から職種の詳細を抽出してください
   - 例：「工場系（製造・組立・検査等）」

3. キャッチコピー:
   - Excelデータのテキストを読み込んで、訴求すべきポイントを箇条書きで生成してください
   - 媒体ポリシーを参考にしながら、魅力的で効果的な表現を使用してください
   - 例：「・未経験OK！3日でマスターできる\n・重いものを持たない軽作業\n・マニュアル完備で安心」
   - 3〜5個程度のポイントを箇条書きで記載してください
   - 求職者にとって魅力的で、応募したくなるような表現を心がけてください

4. 県カテゴリー:
   - 「就業先住所」から都道府県のみを抽出してください
   - 例：「栃木県鹿沼市...」→「栃木県」
   - 都道府県名のみで、市区町村は含めないでください

5. エリア詳細:
   - 「就業先住所」から市区町村などの詳細情報を抽出してください
   - 例：「鹿沼市村井町226-1」→「鹿沼市」または「鹿沼市村井町」

6. 最寄駅:
   - ヒアリングシートの「交通手段①」「交通手段②」から駅名を抽出してください
   - 例：「東武日光線 新鹿沼駅」→「新鹿沼駅」
   - 路線名は含めず、駅名のみを抽出してください

7. アクセス:
   - ヒアリングシートの「交通手段①」「交通手段②」「交通手段その他」からアクセス情報を抽出してください
   - 例：「東武日光線 新鹿沼駅 車2分 徒歩8分」
   - 路線名、駅名、アクセス方法をまとめて記載してください

8. 職種カテゴリー:
   - 「タイトル」を生成した際に使用した職種の部分をここに入れてください
   - 例：タイトルが「遊技機基板の製造・検査業務（製造・組立・検査）」の場合、「製造・組立・検査」を職種カテゴリーに入れる

9. 雇用形態:
   - 「雇用形態」フィールドの値をそのまま使用してください
   - 例：「派遣社員」「正社員」「パート・アルバイト」など

10. 学歴:
   - Excelデータに学歴情報があれば抽出、なければ空文字列（""）にしてください

11. 仕事内容:
    - 「仕事内容」「■業務内容」フィールドの値を基に、できるだけわかりやすい文章で仕事内容を生成してください
    - 媒体ポリシーを参考にしながら、魅力的で読みやすい文章を作成してください
    - 箇条書きではなく、読みやすい文章形式で記載してください
    - Excelデータの内容を整理して、自然で魅力的な文章にしてください
    - 求職者が「この仕事をしてみたい」と思えるような表現を心がけてください

12. 給与:
    - 「給与」フィールドの値をそのまま使用してください
    - 例：「時給1200円」「月給20万円」など

13. 待遇:
    - 「待遇」フィールドから福利厚生にあたる部分を記載してください
    - 例：「社会保障完備、制服貸与、休憩室、個人ロッカーあり」
    - 福利厚生に関する情報のみを抽出してください

14. 勤務時間:
    - ヒアリングシートの勤務時間に関する情報があれば抽出してください
    - Excelデータに勤務時間情報があれば記載、なければ空文字列（""）にしてください

15. 休日:
    - ヒアリングシートの休日に関する内容を記載してください
    - Excelデータに休日情報があれば記載、なければ空文字列（""）にしてください

16. 資格:
    - 条件に資格が必須であればここに記載してください
    - Excelデータに必須資格の情報があれば記載、なければ空文字列（""）にしてください
    - 必須でない資格は記載しないでください

16. メッセージ:
    - この項目は手入力用のため、常に空文字列（""）にしてください

17. 担当営業所:
    - 「営業所名」フィールドに記載があればそのまま使用してください
    - 記載がなければ空文字列（""）にしてください
    - 例：「宇都宮営業所」

18. 最寄駅:
    - ヒアリングシートの「交通手段①」「交通手段②」から駅名を抽出してください
    - 例：「東武日光線 新鹿沼駅」→「新鹿沼駅」
    - 路線名は含めず、駅名のみを抽出してください

19. アクセス:
    - ヒアリングシートの「交通手段①」「交通手段②」「交通手段その他」からアクセス情報を抽出してください
    - 例：「東武日光線 新鹿沼駅 車2分 徒歩8分」
    - 路線名、駅名、アクセス方法をまとめて記載してください

20. 備考（外部非公開情報はここに記載）:
    - Excelデータに内部情報や補足情報があれば記載、なければ空文字列（""）にしてください

【重要】
- Excelデータに存在する情報のみを抽出してください
- 情報がない項目は必ず空文字列（""）にしてください
- 推測や補完は行わず、Excelデータに記載されている情報のみを使用してください
- 媒体ポリシーを参考にしながら、各項目を魅力的な求人原稿として作成してください
- 出力は必ずJSON形式のみで、マークダウンコードブロックや説明文は一切含めないでください
- 出力の最初と最後に余計なテキストを付けず、JSONオブジェクトのみを出力してください`;

    // ===== フェーズ2: テキスト化されたデータを20項目にマッピング =====
    console.log('[DEBUG] フェーズ2開始: 20項目にマッピング');
    const phase2UserPrompt = `以下のテキスト化された求人情報を、指定された20項目にマッピングしてJSON形式で出力してください。\n\nテキスト化された求人情報:\n${structuredText}\n\n上記の情報を分析し、指定された20項目にマッピングしてJSON形式で出力してください。`;

    // フェーズ2のトークン数チェック
    const maxTokens = 30000; // 安全な上限（60,000の1/2）
    const phase2SystemTokens = Math.ceil(systemPrompt.length / 4);
    const phase2UserTokens = Math.ceil((phase2UserPrompt.length + 100) / 4);
    const phase2TotalTokens = phase2SystemTokens + phase2UserTokens + 100;
    
    console.log(`[DEBUG] フェーズ2トークン数: ${phase2TotalTokens} (システム: ${phase2SystemTokens}, ユーザー: ${phase2UserTokens})`);
    
    if (phase2TotalTokens > maxTokens) {
      return NextResponse.json(
        { 
          error: `データが大きすぎます（フェーズ2）。テキスト化されたデータが大きすぎる可能性があります。` 
        },
        { status: 400 }
      );
    }

    // OpenAI APIを呼び出し（フェーズ2）
    let completion;
    try {
      console.log('[DEBUG] フェーズ2: OpenAI APIを呼び出します...');
      // モデルをgpt-5-miniに変更
      const model = 'gpt-5-mini';
      console.log(`[DEBUG] フェーズ2: モデル=${model}, 入力トークン数（概算）=${phase2TotalTokens}`);
      
      completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: phase2UserPrompt },
        ],
        // gpt-5-miniはtemperatureパラメータをサポートしていないため削除
      });
      
      console.log('[DEBUG] フェーズ2: API呼び出し成功！使用トークン数:', completion.usage?.total_tokens || '不明');
    } catch (error: any) {
      console.error('フェーズ2エラー:', error);
      return NextResponse.json(
        { 
          error: `フェーズ2（マッピング）でエラーが発生しました: ${error.message || '不明なエラー'}` 
        },
        { status: 500 }
      );
    }

    const generatedContent = completion.choices[0]?.message?.content || '';
    console.log('[DEBUG] フェーズ2完了: 生成されたコンテンツの長さ:', generatedContent.length);
    console.log('[DEBUG] フェーズ2生成されたコンテンツ（最初の500文字）:', generatedContent.substring(0, 500));
    
    // JSONをパースして検証
    let parsedData: Record<string, string> = {};
    // マークダウンコードブロックを除去
    let jsonString = generatedContent.trim();
    jsonString = jsonString.replace(/^```json\s*/i, '');
    jsonString = jsonString.replace(/^```\s*/i, '');
    jsonString = jsonString.replace(/\s*```$/i, '');
    jsonString = jsonString.trim();
    
    try {
      console.log('[DEBUG] JSON文字列（最初の500文字）:', jsonString.substring(0, 500));
      
      parsedData = JSON.parse(jsonString);
      console.log('[DEBUG] JSONパース成功: パースされたキー数:', Object.keys(parsedData).length);
      console.log('[DEBUG] パースされたデータ:', JSON.stringify(parsedData, null, 2).substring(0, 1000));
      
      // パースされたデータが空でないか確認
      const nonEmptyKeys = Object.keys(parsedData).filter(key => parsedData[key] && parsedData[key].trim() !== '');
      console.log('[DEBUG] 空でないキーの数:', nonEmptyKeys.length);
      if (nonEmptyKeys.length === 0) {
        console.warn('[WARNING] パースされたデータがすべて空です！');
        console.warn('[WARNING] 生成されたコンテンツ（全文）:', generatedContent);
      }
    } catch (error) {
      console.error('[ERROR] JSONパースエラー:', error);
      console.error('[ERROR] 生成されたコンテンツ（全文）:', generatedContent);
      console.error('[ERROR] JSON文字列（全文）:', jsonString);
      // JSONパースに失敗した場合、テキストからJSONを抽出を試みる
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('JSON抽出も失敗:', e);
          // 最後の手段として、エラーメッセージを返す
          return NextResponse.json(
            { 
              error: 'JSON形式の出力を取得できませんでした。生成された内容: ' + generatedContent.substring(0, 200) 
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: 'JSON形式の出力を取得できませんでした。生成された内容: ' + generatedContent.substring(0, 200) 
          },
          { status: 500 }
        );
      }
    }

    // JSONデータを読みやすい形式のテキストに変換
    const formattedText = Object.entries(parsedData)
      .map(([key, value]) => {
        if (value && value.trim() !== '') {
          return `【${key}】\n${value}\n`;
        }
        return `【${key}】\n（未入力）\n`;
      })
      .join('\n');

    return NextResponse.json({
      success: true,
      phase: 2,
      generatedText: formattedText,
      jsonData: parsedData, // JSONデータも返す
    });
  } catch (error: any) {
    console.error('Error:', error);
    
    // レート制限エラーの処理
    if (error.status === 429) {
      const errorMessage = error.message || '';
      if (errorMessage.includes('tokens per min') || errorMessage.includes('TPM')) {
        return NextResponse.json(
          { 
            error: 'レート制限に達しました。データが大きすぎる可能性があります。Excelファイルのサイズを小さくするか、しばらく待ってから再度お試しください。また、OpenAIアカウントに支払い方法を追加するとレート制限が増えます。' 
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { 
          error: 'レート制限に達しました。しばらく待ってから再度お試しください。' 
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || '求人原稿の生成に失敗しました' },
      { status: 500 }
    );
  }
}

