const tg = (token, method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const imageSource = "https://raw.githubusercontent.com/nasirovramin/nasiroff-content-bot/e02bff651f45882c31b4d9e3f4123165abad4679/assets/eyes.jpg";

      if (url.pathname === "/media/eyes.jpg") {
        const img = await fetch(imageSource);
        if (!img.ok) return new Response("Image not found", { status: 404 });
        return new Response(img.body, {
          headers: {
            "content-type": "image/jpeg",
            "cache-control": "public, max-age=86400"
          }
        });
      }

      if (url.pathname === "/article/dord-baxis") {
        const html = `<!doctype html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bir layihəyə dörd fərqli baxış</title>
<meta name="description" content="Kreativ prosesə dörd fərqli baxış: uşaq, İsida, Osiris və firon.">
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff;color:#171717}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;line-height:1.68}
  main{max-width:760px;margin:0 auto;padding:42px 22px 72px}
  h1{font-size:42px;line-height:1.12;margin:0 0 28px;font-weight:750;letter-spacing:-.02em}
  h2{font-size:25px;line-height:1.25;margin:38px 0 12px;font-weight:700}
  p{font-size:19px;margin:0 0 20px}
  img{display:block;width:100%;height:auto;margin:0 0 34px;border-radius:0}
  .lead{font-size:21px}
  @media(max-width:640px){
    main{padding:26px 18px 56px}
    h1{font-size:34px}
    h2{font-size:23px}
    p,.lead{font-size:18px}
  }
</style>
</head>
<body>
<main>
  <h1>Bir layihəyə dörd fərqli baxış</h1>
  <img src="/media/eyes.jpg" alt="Fərqli gözlər">
  <p class="lead">Edvard de Bononun Six Thinking Hats, yəni Altı düşüncə papağı metodunu çoxumuz bilirik. Mənə isə layihə üzərində işləyərkən başqa bir yanaşma daha maraqlı gəlir.</p>
  <p>Bəzən yeni ideya tapmaq üçün daha çox düşünmək yox, baxış bucağını dəyişmək lazımdır. Eyni layihəyə dörd fərqli roldan baxdığınızı təsəvvür edin.</p>

  <h2>Birinci baxış-uşaq</h2>
  <p>Burada hər şey mümkündür. Bu alınmaz, müştəri qəbul etməz, büdcə çatmaz kimi fikirləri bir müddət kənara qoyursunuz.</p>
  <p>Forma, məna, material, texnologiya və ideyalarla oynayırsınız. Bir-biri ilə əlaqəsi olmayan şeyləri də birləşdirirsiniz.</p>
  <p>Bu mərhələdə məqsəd dərhal doğru cavabı tapmaq deyil. Məqsəd mümkün qədər çox variant yaratmaqdır.</p>

  <h2>İkinci baxış-İsida</h2>
  <p>İsida qədim Misirdə analıq, qayğı və qoruma ilə bağlı obrazdır. Burada ideyanın yalnız bu gününə yox, gələcəyinə baxırsınız.</p>
  <p>Bu həll insana nə verir? İstifadəçi üçün rahatdırmı? Bir neçə ildən sonra da mənası qalacaqmı?</p>
  <p>Dizaynı yalnız görüntü kimi yox, insan, istifadəçi təcrübəsi, biznes və gələcək nəticələrlə birlikdə düşünürsünüz.</p>

  <h2>Üçüncü baxış-Osiris</h2>
  <p>İndi ideyalara daha sərt baxmaq vaxtıdır. Faktlara baxırsınız, müqayisə edirsiniz, ölçürsünüz.</p>
  <p>Hansı fikir həqiqətən işləyir? Hansı sadəcə maraqlı görünür? Hansı hissə artıqdır?</p>
  <p>Zəif variantları çıxarırsınız. Güclü ideyanı təmizləyib daha aydın sistemə çevirirsiniz.</p>
  <p>Kreativlik yalnız ideya yaratmaq deyil. Nədən imtina etməyi bilmək də onun bir hissəsidir.</p>

  <h2>Dördüncü baxış-firon</h2>
  <p>Bu artıq qərar mərhələsidir. Araşdırmısınız, variant yaratmısınız, müqayisə etmisiniz. İndi seçim etmək lazımdır.</p>
  <p>Burada təcrübə, zövq və intuisiya işə düşür. Bəzən daha təhlükəsiz yolu, bəzən isə daha riskli və fərqli istiqaməti seçirsiniz.</p>
  <p>Creative Director üçün əsas məsələ yalnız yaxşı ideyanı görmək deyil. Hansı ideyanın arxasında dayanacağını seçməkdir.</p>

  <h2>Dörd mərhələ</h2>
  <p>Uşaq-yarat. İsida-gələcəyi gör. Osiris-seç və təmizlə. Firon-qərar ver.</p>
  <p>Eyni layihəyə dörd dəfə baxırsınız. Amma hər dəfə başqa gözlə.</p>
  <p>Bəlkə də qədim misirlilərin heykəllər üçün gözləri ayrıca hazırlaması təsadüfi deyildi. Göz onlar üçün sadəcə görmək vasitəsi yox, xüsusi məna daşıyan bir simvol idi.</p>
</main>
</body>
</html>`;
        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300"
          }
        });
      }

      if (url.pathname === "/push-approved-8f31d2") {
        const articleUrl = `${url.origin}/article/dord-baxis`;
        const imageUrl = `${url.origin}/media/eyes.jpg`;
        const caption = `<b>Bir layihəyə dörd fərqli baxış 👁</b>

Bəzən yeni ideya tapmaq üçün daha çox düşünmək yox, məsələyə başqa gözlə baxmaq lazımdır.

Uşaq-yarat. İsida-gələcəyi gör. Osiris-seç və təmizlə. Firon-qərar ver.

<a href="${articleUrl}">Ətraflı oxu</a>`;

        const imageRes = await fetch(imageSource);
        if (!imageRes.ok) {
          return new Response(JSON.stringify({
            ok: false,
            description: "Image fetch failed: " + imageRes.status
          }, null, 2), {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" }
          });
        }

        const imageBlob = await imageRes.blob();
        const form = new FormData();
        form.append("chat_id", env.TEST_CHANNEL);
        form.append("photo", imageBlob, "eyes.jpg");
        form.append("caption", caption);
        form.append("parse_mode", "HTML");
        form.append("reply_markup", JSON.stringify({
          inline_keyboard: [[
            { text: "✅ Paylaş", callback_data: "publish" },
            { text: "❌ Yox", callback_data: "reject" }
          ]]
        }));

        const postRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          body: form
        });
        const postData = await postRes.json();

        return new Response(JSON.stringify({
          article: articleUrl,
          telegram: postData
        }, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }

      if (url.pathname === "/setup-webhook") {
        const webhookUrl = `${url.origin}/`;
        const r = await tg(env.BOT_TOKEN, "setWebhook", { url: webhookUrl });
        const data = await r.json();
        return new Response(JSON.stringify(data, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }

      return new Response("nasiroff_content_bot is running");
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const update = await request.json();

    if (update.message?.chat?.type === "private" && update.message?.text) {
      const text = update.message.text;

      if (text === "/start") {
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: update.message.chat.id,
          text: "Hazır mətni mənə göndər. Mən onu əvvəl test kanalına göndərəcəyəm.",
        });
        return new Response("ok");
      }

      const testPost = await tg(env.BOT_TOKEN, "sendMessage", {
        chat_id: env.TEST_CHANNEL,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Paylaş", callback_data: "publish" },
            { text: "❌ Yox", callback_data: "reject" }
          ]]
        }
      });

      const data = await testPost.json();

      await tg(env.BOT_TOKEN, "sendMessage", {
        chat_id: update.message.chat.id,
        text: data.ok
          ? "Test kanalına göndərildi."
          : "Test kanalına göndərmək alınmadı. Kanal username/ID və admin icazələrini yoxla.",
      });

      return new Response("ok");
    }

    if (update.callback_query) {
      const q = update.callback_query;
      const msg = q.message;

      if (q.data === "publish") {
        const copied = await tg(env.BOT_TOKEN, "copyMessage", {
          chat_id: env.MAIN_CHANNEL,
          from_chat_id: msg.chat.id,
          message_id: msg.message_id
        });
        const copiedData = await copied.json();

        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: copiedData.ok ? "Əsas kanalda paylaşıldı ✅" : "Paylaşmaq alınmadı ❌",
        });

        if (copiedData.ok) {
          await tg(env.BOT_TOKEN, "editMessageReplyMarkup", {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: { inline_keyboard: [] },
          });
        }
      }

      if (q.data === "reject") {
        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Paylaşım ləğv edildi.",
        });

        await tg(env.BOT_TOKEN, "editMessageReplyMarkup", {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
          reply_markup: { inline_keyboard: [] },
        });
      }

      return new Response("ok");
    }

    return new Response("ok");
  },
};
