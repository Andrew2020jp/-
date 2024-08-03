// deno.landに公開されているモジュールをimport
import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

// 直前の単語を保持しておく
let wordHistories = ["しりとり"];
let previousWord = "しりとり";

// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (request) => {
    // パス名を取得する
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

        // previousWordの末尾とnextWordの先頭が同一か確認
        if (previousWord.slice(-1) === nextWord.slice(0, 1)) {
            // 末尾が「ん」になっている場合
            if (nextWord.slice(-1) === 'ん') {
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

            // 過去に使用した単語か確認
            if (wordHistories.includes(nextWord)) {
                const errorCode = 'ERR_DUPLICATE_WORD';
                return new Response(
                    JSON.stringify({
                        "errorMessage": "過去に使用した単語が入力されたら、ゲームを終了する",
                        "errorCode": errorCode
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json; charset=utf-8" }
                    }
                );
            }

            // 同一であれば、previousWordを更新し、履歴に追加
            previousWord = nextWord;
            wordHistories.push(nextWord);
        } else {
            // 同一でない単語の入力時に、エラーを返す
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

        // 現在の単語履歴を返す
        return new Response(JSON.stringify(wordHistories), {
            headers: { "Content-Type": "application/json; charset=utf-8" }
        });
    }

    // POST /reset: リセットする
    if (request.method === 'POST' && pathname === '/reset') {
        // 既存の単語の履歴を初期化する
        wordHistories = ["しりとり"];
        previousWord = 'しりとり';
        // 初期化した単語を返す
        return new Response(previousWord);
    }

    // ./public以下のファイルを公開
    return serveDir(
        request,
        {
            fsRoot: "./serve/public/",
            urlRoot: "",
            enableCors: true,
        }
    );
});
