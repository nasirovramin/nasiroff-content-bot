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
        const imageUrl = "https://raw.githubusercontent.com/nasirovramin/nasiroff-content-bot/main.ru/assets/eyes.jpg";

        const accountBody = new URLSearchParams({
          short_name: "nasiroff",
          author_name: "Nasiroff"
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
          p("Edvard de Bononun Six Thinking Hats — “Altı düşüncə papağı” metodunu yəqin ki, çoxumuz bilirik. Mənə isə layihə üzərində işləyərkən başqa bir düşüncə modeli daha maraqlı gəlir."),
          p("Bəzən yeni ideya tapmaq üçün daha çox düşünmək yox, baxış bucağını dəyişmək lazımdır. Eyni layihəyə dörd fərqli roldan baxdığınızı təsəvvür edin."),
          h("Birinci baxış — uşaq"),
          p("Burada hər şey mümkündür. “Bu alınmaz”, “müştəri bunu qəbul etməz”, “büdcə çatmaz” kimi məhdudiyyətləri bir müddət kənara qoyursunuz."),
          p("Forma, məna, material, texnologiya və ideyalarla oynayırsınız. Bir-biri ilə əlaqəsi olmayan şeyləri belə birləşdirirsiniz."),
          p("Bu mərhələdə məqsəd dərhal doğru həlli tapmaq deyil. Məqsəd mümkün qədər çox fərqli ehtimal yaratmaqdır. Çünki kreativ prosesin əvvəlində məntiq çox tez işə düşəndə yaxşı ideya hələ yaranmamış yox ola bilər."),
          h("İkinci baxış — İsida"),
          p("Qədim Misirdə İsida analıq, qayğı və qoruma ilə əlaqələndirilirdi. Bu baxışda ideyanın yalnız bu gün necə işlədiyinə deyil, gələcəkdə nə yaradacağına baxırsınız."),
          p("Bu həll insanlara nə verəcək? İstifadəçi bunu necə hiss edəcək? Estetik olaraq nə qədər davamlıdır? Trend dəyişəndən sonra da işləyəcəkmi?"),
          p("Burada dizaynı yalnız vizual həll kimi yox, insan, istifadəçi təcrübəsi, biznes və gələcək nəticələrlə birlikdə düşünürsünüz. Yəni ideyanın bu gününü deyil, davamını görməyə çalışırsınız."),
          h("Üçüncü baxış — Osiris"),
          p("İndi kreativ romantikanı bir qədər kənara qoymaq vaxtıdır. Faktlara baxırsınız, müqayisə edirsiniz, ölçürsünüz."),
          p("Hansı ideya həqiqətən işləyir? Hansı sadəcə maraqlı görünür? Hansı hissə artıqdır?"),
          p("Bu mərhələdə seleksiya başlayır. Zəif ideyaları çıxarırsınız, güclü ideyaları təmizləyirsiniz və konsepti daha aydın, bütöv sistemə çevirirsiniz."),
          p("Kreativlik yalnız yeni ideya yaratmaq deyil. Nədən imtina etməyi bilmək də kreativ prosesin bir hissəsidir."),
          h("Dördüncü baxış — firon"),
          p("Bu artıq qərar mərhələsidir. Araşdırmısınız, ideyalar yaratmısınız, gələcəyi düşünmüsünüz, variantları müqayisə etmisiniz. İndi seçim etmək lazımdır."),
          p("Burada təcrübə, zövq və intuisiya işə düşür. Bəzən ən rasional yolu seçirsiniz. Bəzən isə bilərəkdən daha riskli, qəribə və provokativ istiqamətin arxasında dayanırsınız."),
          p("Çünki Creative Director üçün əsas məsələ yalnız yaxşı ideyanı görmək deyil. Doğru anda hansı ideyanın arxasında dayanacağını seçməkdir."),
          h("Dörd mərhələ"),
          p("Uşaq — yarat. İsida — gələcəyi gör. Osiris — seç və təmizlə. Firon — qərar ver."),
          p("Eyni layihəyə dörd dəfə baxırsınız. Amma hər dəfə başqa gözlə."),
          p("Bəlkə də qədim misirlilərin heykəllər üçün gözləri ayrıca hazırlaması təsadüfi deyildi. Göz onlar üçün sadəcə görmək vasitəsi yox, daha dərin mənası olan bir simvol idi."),
          { tag: "p", children: [{ tag: "em", children: ["Qədim Misir göz inkrustasiyaları: şüşə, obsidian və lazurit."] }] }
        ];

        const pageBody = new URLSearchParams({
          access_token: accountData.result.access_token,
          title,
          author_name: "Nasiroff",
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

Bəzən yaxşı ideya tapmaq üçün daha çox düşünmək yox, baxış bucağını dəyişmək lazımdır.

Uşaq kimi yarat, gələcəyi düşün, ideyanı sərt şəkildə seç və sonda qərar ver.

<a href="${pageData.result.url}">Ətraflı oxu</a>`;

        const postRes = await tg(env.BOT_TOKEN, "sendPhoto", {
          chat_id: env.TEST_CHANNEL,
          photo: imageUrl,
          caption,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Paylaş", callback_data: "publish" },
              { text: "❌ Yox", callback_data: "reject" }
            ]]
          }
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
