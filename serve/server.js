//server.js

// deno.landに公開されているモジュールをimport
// denoではURLを直に記載してimportできます
import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

// 直前の単語を保持しておく
 let previousWord = "しりとり";
 let wordHistories = ["しりとり"];



// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (request) => {
    // パス名を取得する
    // http://localhost:8000/hoge に接続した場合"/hoge"が取得できる
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);

    // GET /shiritori: 直前の単語を返す
    if (request.method === "GET" && pathname === "/shiritori") {
         return new Response(previousWord);
     }
     
     // POST /shiritori: 次の単語を入力する
     if (request.method === "POST" && pathname === "/shiritori") {
             // リクエストのペイロードを取得
             const requestJson = await request.json();
             // JSONの中からnextWordを取得
             const nextWord = requestJson["nextWord"];


             //追加 
             // 入力された単語が既に使用されているか確認
        if (wordHistories.includes(nextWord)) {
            return new Response(
                JSON.stringify({
                    "errorMessage": "過去に使用した単語が入力されたら、ゲームを終了する",
                    "errorCode": "ERR_WORD_ALREADY_USED"
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
             // previousWordの末尾とnextWordの先頭が同一か確認
             if (previousWord.slice(-1) === nextWord.slice(0, 1)) {
               //追加
                // 末尾が「ん」になっている場合
            if (nextWord.slice(-1) === 'ん') {
                // エラーを返す処理を追加
                // errorCodeを固有のものにして、末尾が「ん」の時に発生したエラーだとWeb側に通知できるようにする
                const errorCode = 'ERR_ENDS_WITH_N';
                return new Response(
                    JSON.stringify({
                        "errorMessage": "末尾が「ん」で終わる単語が入力されたら、ゲームを終了する",
                        "errorCode": errorCode
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
                 // 同一であれば、previousWordを更新
                 previousWord = nextWord;
             }
             // 同一でない単語の入力時に、エラーを返す
             else {
                 return new Response(
                     JSON.stringify({
                         "errorMessage": "前の単語に続いていません",
                         "errorCode": "10001"
                     }),
                     {
                         status: 400,
                         headers: { "Content-Type": "application/json; charset=utf-8" },
                     }
                 );
             }
     
             // 現在の単語を返す
             return new Response(previousWord);
        }
         // POST /reset: リセットする
         if (request.method === 'POST' && pathname === '/reset') {
            // 既存の単語の履歴を初期化する
            wordHistories = []; // 単語履歴をリセットする
            previousWord = 'しりとり'; // 初期化した単語を設定する
            // 初期化した単語を返す
            return new Response(previousWord);
         }
 
   
// ./public以下のファイルを公開
    return serveDir(
        request,
        {
            /*
            - fsRoot: 公開するフォルダを指定
            - urlRoot: フォルダを展開するURLを指定。今回はlocalhost:8000/に直に展開する
            - enableCors: CORSの設定を付加するか
            */
            fsRoot: "./serve/public/",
            urlRoot: "",
            enableCors: true,
        }
    );
});
