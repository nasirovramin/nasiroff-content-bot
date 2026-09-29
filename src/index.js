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

      if (url.pathname === "/push-approved-8f31d2") {
        const title = "Bir layihəyə dörd fərqli baxış";
        const imageUrl = "https://raw.githubusercontent.com/nasirovramin/nasiroff-content-bot/8b4f2dcff36c50c507f62ac61de2dc2ea6bb791c/assets/eyes.jpg";

        const accountBody = new URLSearchParams({
          short_name: "nasiroff"
        });
        const accountRes = await fetch("https://api.telegra.ph/createAccount", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: accountBody
        });
        const accountData = await accountRes.json();

        if (!accountData.ok) {
          return new Response(JSON.stringify(accountData, null, 2), {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        }

        const p = (text) => ({ tag: "p", children: [text] });
        const h = (text) => ({ tag: "h4", children: [text] });
        const content = [
          { tag: "img", attrs: { src: imageUrl } },
          p("Edvard de Bononun Six Thinking Hats, yəni Altı düşüncə papağı metodunu çoxumuz bilirik. Mənə isə layihə üzərində işləyərkən başqa bir yanaşma daha maraqlı gəlir."),
          p("Bəzən yeni ideya tapmaq üçün daha çox düşünmək yox, baxış bucağını dəyişmək lazımdır. Eyni layihəyə dörd fərqli roldan baxdığınızı təsəvvür edin."),
          h("Birinci baxış-uşaq"),
          p("Burada hər şey mümkündür. Bu alınmaz, müştəri qəbul etməz, büdcə çatmaz kimi fikirləri bir müddət kənara qoyursunuz."),
          p("Forma, məna, material, texnologiya və ideyalarla oynayırsınız. Bir-biri ilə əlaqəsi olmayan şeyləri də birləşdirirsiniz."),
          p("Bu mərhələdə məqsəd dərhal doğru cavabı tapmaq deyil. Məqsəd mümkün qədər çox variant yaratmaqdır."),
          h("İkinci baxış-İsida"),
          p("İsida qədim Misirdə analıq, qayğı və qoruma ilə bağlı obrazdır. Burada ideyanın yalnız bu gününə yox, gələcəyinə baxırsınız."),
          p("Bu həll insana nə verir? İstifadəçi üçün rahatdırmı? Bir neçə ildən sonra da mənası qalacaqmı?"),
          p("Dizaynı yalnız görüntü kimi yox, insan, istifadəçi təcrübəsi, biznes və gələcək nəticələrlə birlikdə düşünürsünüz."),
          h("Üçüncü baxış-Osiris"),
          p("İndi ideyalara daha sərt baxmaq vaxtıdır. Faktlara baxırsınız, müqayisə edirsiniz, ölçürsünüz."),
          p("Hansı fikir həqiqətən işləyir? Hansı sadəcə maraqlı görünür? Hansı hissə artıqdır?"),
          p("Zəif variantları çıxarırsınız. Güclü ideyanı təmizləyib daha aydın sistemə çevirirsiniz."),
          p("Kreativlik yalnız ideya yaratmaq deyil. Nədən imtina etməyi bilmək də onun bir hissəsidir."),
          h("Dördüncü baxış-firon"),
          p("Bu artıq qərar mərhələsidir. Araşdırmısınız, variant yaratmısınız, müqayisə etmisiniz. İndi seçim etmək lazımdır."),
          p("Burada təcrübə, zövq və intuisiya işə düşür. Bəzən daha təhlükəsiz yolu, bəzən isə daha riskli və fərqli istiqaməti seçirsiniz."),
          p("Creative Director üçün əsas məsələ yalnız yaxşı ideyanı görmək deyil. Hansı ideyanın arxasında dayanacağını seçməkdir."),
          h("Dörd mərhələ"),
          p("Uşaq-yarat. İsida-gələcəyi gör. Osiris-seç və təmizlə. Firon-qərar ver."),
          p("Eyni layihəyə dörd dəfə baxırsınız. Amma hər dəfə başqa gözlə."),
          p("Bəlkə də qədim misirlilərin heykəllər üçün gözləri ayrıca hazırlaması təsadüfi deyildi. Göz onlar üçün sadəcə görmək vasitəsi yox, xüsusi məna daşıyan bir simvol idi.")
        ];

        const pageBody = new URLSearchParams({
          access_token: accountData.result.access_token,
          title,
          content: JSON.stringify(content),
          return_content: "false"
        });
        const pageRes = await fetch("https://api.telegra.ph/createPage", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: pageBody
        });
        const pageData = await pageRes.json();

        if (!pageData.ok) {
          return new Response(JSON.stringify(pageData, null, 2), {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        }

        const caption = `<b>Bir layihəyə dörd fərqli baxış 👁</b>

Bəzən yeni ideya tapmaq üçün daha çox düşünmək yox, məsələyə başqa gözlə baxmaq lazımdır.

Uşaq-yarat. İsida-gələcəyi gör. Osiris-seç və təmizlə. Firon-qərar ver.

<a href="${pageData.result.url}">Ətraflı oxu</a>`;

        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) {
          return new Response(JSON.stringify({
            telegraph: pageData,
            telegram: { ok: false, description: "Worker could not fetch image: " + imageRes.status }
          }, null, 2), {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
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
          telegraph: pageData,
          telegram: postData
        }, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" },
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
