const tg = (token, method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const ARTICLE_ID = "dord-baxis";
const ARTICLE_TITLE = "Bir layihəyə dörd fərqli baxış";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const imageSource = "https://raw.githubusercontent.com/nasirovramin/nasiroff-content-bot/main.ru/assets/eyes.jpg";

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

      if (url.pathname === "/edit/dord-baxis") {
        const articleUrl = `${url.origin}/article/dord-baxis`;
        const html = `<!doctype html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Edit · Bir layihəyə dörd fərqli baxış</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;background:#f4f4f4;color:#171717;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
.toolbar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border-bottom:1px solid #ddd;padding:10px 14px;display:flex;gap:8px;flex-wrap:wrap}
button,.btn{border:1px solid #cfcfcf;background:#fff;color:#171717;border-radius:9px;padding:9px 12px;font-size:14px;font-weight:650;cursor:pointer;text-decoration:none}
button.primary{background:#171717;color:#fff;border-color:#171717}
.wrap{max-width:960px;margin:22px auto 60px;background:#fff;padding:34px 30px 70px;box-shadow:0 4px 26px rgba(0,0,0,.06)}
#editor{outline:none}
#editor h1{font-size:54px;line-height:1.03;margin:0 0 12px;font-weight:800;letter-spacing:-.035em}
#editor .meta{display:flex;align-items:center;gap:14px;font-size:16px;color:#747474;margin:0 0 34px}
#editor .meta:after{content:"";height:1px;background:#aaa;flex:1}
#editor h2{font-size:24px;line-height:1.22;margin:30px 0 10px;font-weight:600}
#editor p{font-size:18px;line-height:1.58;margin:0 0 16px}
#editor .lead{font-size:25px;line-height:1.23;font-weight:700;margin:0 0 28px}
#editor img,#editor video{display:block;width:100%;height:auto;margin:22px 0 28px}
.media-wrap{position:relative}
.media-wrap .remove{position:absolute;right:8px;top:8px;background:#fff;border:1px solid #ddd;border-radius:999px;padding:6px 9px;font-size:12px}
.tip{max-width:960px;margin:18px auto 0;color:#666;font-size:13px;padding:0 4px}
.status{margin-left:auto;align-self:center;font-size:13px;color:#666}
@media(max-width:640px){
  .wrap{margin:0;background:#fff;box-shadow:none;padding:22px 18px 48px}
  #editor h1{font-size:36px}
  #editor h2{font-size:21px}
  #editor p{font-size:16px}
  #editor .lead{font-size:19px}
  .status{width:100%;margin-left:0}
}
</style>
</head>
<body>
<div class="toolbar">
  <button type="button" onclick="fmt('bold')"><b>B</b></button>
  <button type="button" onclick="fmt('formatBlock','h2')">Başlıq</button>
  <button type="button" onclick="fmt('formatBlock','p')">Mətn</button>
  <button type="button" onclick="document.getElementById('imageInput').click()">🖼 Şəkil əlavə et<br><small>(1200 × 628 px)</small></button>
  <button type="button" onclick="document.getElementById('videoInput').click()">🎞 Video/GIF əlavə et<br><small>(1200 × 628 px)</small></button>
  <input id="imageInput" type="file" accept="image/*" hidden>
  <input id="videoInput" type="file" accept="video/*,image/gif" hidden>
  <a class="btn" href="${articleUrl}" target="_blank">👁 Preview</a>
  <button class="primary" type="button" onclick="saveDraft()">💾 Save</button>
  <span id="status" class="status">Edit rejimi</span>
</div>
<div class="tip">Mətndə istədiyin yerə kursoru qoy, sonra şəkil/video düyməsini bas. Media həmin nöqtəyə əlavə olunacaq.</div>
<div class="wrap">
  <article id="editor" contenteditable="true">
    <h1>Bir layihəyə dörd fərqli baxış</h1>
    <p class="meta">Ramin Nəsirov · 29 sentyabr 2026</p>
    <img src="/media/eyes.jpg" alt="Fərqli gözlər">
    <p class="lead">Edvard de Bononun Six Thinking Hats, yəni Altı düşüncə papağı metodunu çoxumuz bilirik. Mənə isə layihə üzərində işləyərkən başqa bir yanaşma daha maraqlı gəlir. Bəzən yeni ideya tapmaq üçün daha çox düşünmək yox, baxış bucağını dəyişmək lazımdır. Eyni layihəyə dörd fərqli roldan baxdığınızı təsəvvür edin.</p>
    <h2>Birinci baxış-uşaq</h2>
    <p>Burada hər şey mümkündür. Bu alınmaz, müştəri qəbul etməz, büdcə çatmaz kimi fikirləri bir müddət kənara qoyursunuz. Forma, məna, material, texnologiya və ideyalarla oynayırsınız. Bir-biri ilə əlaqəsi olmayan şeyləri də birləşdirirsiniz. Bu mərhələdə məqsəd dərhal doğru cavabı tapmaq deyil. Məqsəd mümkün qədər çox variant yaratmaqdır.</p>
    <h2>İkinci baxış-İsida</h2>
    <p>İsida qədim Misirdə analıq, qayğı və qoruma ilə bağlı obrazdır. Burada ideyanın yalnız bu gününə yox, gələcəyinə baxırsınız. Bu həll insana nə verir? İstifadəçi üçün rahatdırmı? Bir neçə ildən sonra da mənası qalacaqmı? Dizaynı yalnız görüntü kimi yox, insan, istifadəçi təcrübəsi, biznes və gələcək nəticələrlə birlikdə düşünürsünüz.</p>
    <h2>Üçüncü baxış-Osiris</h2>
    <p>İndi ideyalara daha sərt baxmaq vaxtıdır. Faktlara baxırsınız, müqayisə edirsiniz, ölçürsünüz. Hansı fikir həqiqətən işləyir? Hansı sadəcə maraqlı görünür? Hansı hissə artıqdır? Zəif variantları çıxarırsınız. Güclü ideyanı təmizləyib daha aydın sistemə çevirirsiniz. Kreativlik yalnız ideya yaratmaq deyil. Nədən imtina etməyi bilmək də onun bir hissəsidir.</p>
    <h2>Dördüncü baxış-firon</h2>
    <p>Bu artıq qərar mərhələsidir. Araşdırmısınız, variant yaratmısınız, müqayisə etmisiniz. İndi seçim etmək lazımdır. Burada təcrübə, zövq və intuisiya işə düşür. Bəzən daha təhlükəsiz yolu, bəzən isə daha riskli və fərqli istiqaməti seçirsiniz. Creative Director üçün əsas məsələ yalnız yaxşı ideyanı görmək deyil. Hansı ideyanın arxasında dayanacağını seçməkdir.</p>
    <h2>Dörd mərhələ</h2>
    <p>Uşaq-yarat. İsida-gələcəyi gör. Osiris-seç və təmizlə. Firon-qərar ver. Eyni layihəyə dörd dəfə baxırsınız. Amma hər dəfə başqa gözlə. Bəlkə də qədim misirlilərin heykəllər üçün gözləri ayrıca hazırlaması təsadüfi deyildi. Göz onlar üçün sadəcə görmək vasitəsi yox, xüsusi məna daşıyan bir simvol idi.</p>
  </article>
</div>
<script>
let savedRange=null;
const editor=document.getElementById('editor');
editor.addEventListener('keyup',remember);
editor.addEventListener('mouseup',remember);
editor.addEventListener('touchend',remember);
function remember(){
  const s=window.getSelection();
  if(s&&s.rangeCount) savedRange=s.getRangeAt(0).cloneRange();
}
function fmt(cmd,val){
  editor.focus();
  document.execCommand(cmd,false,val||null);
  remember();
}
function insertNode(node){
  editor.focus();
  const s=window.getSelection();
  if(savedRange){
    s.removeAllRanges(); s.addRange(savedRange);
    savedRange.insertNode(node);
    savedRange.setStartAfter(node); savedRange.collapse(true);
    s.removeAllRanges(); s.addRange(savedRange);
  }else editor.appendChild(node);
}
function addFile(file,type){
  const wrap=document.createElement('div');
  wrap.className='media-wrap';
  const el=document.createElement(type==='video'?'video':'img');
  el.src=URL.createObjectURL(file);
  if(type==='video'){el.controls=true;el.playsInline=true}
  const rm=document.createElement('button');
  rm.type='button';rm.className='remove';rm.textContent='Sil';
  rm.onclick=()=>wrap.remove();
  wrap.appendChild(el);wrap.appendChild(rm);
  insertNode(wrap);
  document.getElementById('status').textContent='Media əlavə edildi. Save edin.';
}
document.getElementById('imageInput').addEventListener('change',e=>{
  if(e.target.files[0]) addFile(e.target.files[0],'image');
  e.target.value='';
});
document.getElementById('videoInput').addEventListener('change',e=>{
  const f=e.target.files[0];
  if(f) addFile(f,f.type==='image/gif'?'image':'video');
  e.target.value='';
});
async function saveDraft(){
  const status=document.getElementById('status');
  status.textContent='Yadda saxlanılır...';
  const payload={id:'dord-baxis',html:editor.innerHTML,updatedAt:new Date().toISOString()};
  localStorage.setItem('article:dord-baxis',JSON.stringify(payload));
  status.textContent='Brauzerdə yadda saxlanıldı. Server yaddaşı qoşulduqda avtomatik sinxron olacaq.';
}
const local=localStorage.getItem('article:dord-baxis');
if(local){
  try{const d=JSON.parse(local); if(d.html) editor.innerHTML=d.html}catch(e){}
}
</script>
</body>
</html>`;
        return new Response(html, {headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
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
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;font-weight:400}
  main{max-width:900px;margin:0 auto;padding:34px 28px 76px}
  h1{font-size:54px;line-height:1.03;margin:0 0 12px;font-weight:800;letter-spacing:-.035em}
  .meta{display:flex;align-items:center;gap:14px;font-size:16px;line-height:1.2;color:#747474;margin:0 0 34px}
  .meta::after{content:"";height:1px;background:#aaa;flex:1;min-width:60px}
  h2{font-size:24px;line-height:1.22;margin:30px 0 10px;font-weight:600;letter-spacing:-.01em}
  p{font-size:18px;line-height:1.58;margin:0 0 16px;font-weight:400}
  img{display:block;width:100%;height:auto;margin:0 0 30px;border-radius:0}
  .lead{font-size:25px;line-height:1.23;font-weight:700;letter-spacing:-.02em;margin:0 0 28px}
  .back{display:inline-flex;align-items:center;justify-content:center;margin-top:26px;padding:9px 14px;border:1px solid #a7a7a7;border-radius:999px;color:#171717;text-decoration:none;font-size:14px;font-weight:600}
  .back:hover{border-color:#171717}
  @media(max-width:640px){
    main{padding:22px 18px 52px}
    h1{font-size:36px;line-height:1.06;margin-bottom:10px}
    .meta{font-size:13px;gap:10px;margin-bottom:22px}
    h2{font-size:21px;margin-top:24px}
    p{font-size:16px;line-height:1.55;margin-bottom:14px}
    .lead{font-size:19px;line-height:1.28;margin-bottom:22px}
    img{margin-bottom:22px}
    .back{font-size:13px;padding:8px 12px}
  }
</style>
</head>
<body>
<main>
  <h1>Bir layihəyə dörd fərqli baxış</h1>
  <p class="meta">Ramin Nəsirov · 29 sentyabr 2026</p>
  <img src="/media/eyes.jpg" alt="Fərqli gözlər">
  <p class="lead">Edvard de Bononun Six Thinking Hats, yəni Altı düşüncə papağı metodunu çoxumuz bilirik. Mənə isə layihə üzərində işləyərkən başqa bir yanaşma daha maraqlı gəlir. Bəzən yeni ideya tapmaq üçün daha çox düşünmək yox, baxış bucağını dəyişmək lazımdır. Eyni layihəyə dörd fərqli roldan baxdığınızı təsəvvür edin.</p>

  <h2>Birinci baxış-uşaq</h2>
  <p>Burada hər şey mümkündür. Bu alınmaz, müştəri qəbul etməz, büdcə çatmaz kimi fikirləri bir müddət kənara qoyursunuz. Forma, məna, material, texnologiya və ideyalarla oynayırsınız. Bir-biri ilə əlaqəsi olmayan şeyləri də birləşdirirsiniz. Bu mərhələdə məqsəd dərhal doğru cavabı tapmaq deyil. Məqsəd mümkün qədər çox variant yaratmaqdır.</p>

  <h2>İkinci baxış-İsida</h2>
  <p>İsida qədim Misirdə analıq, qayğı və qoruma ilə bağlı obrazdır. Burada ideyanın yalnız bu gününə yox, gələcəyinə baxırsınız. Bu həll insana nə verir? İstifadəçi üçün rahatdırmı? Bir neçə ildən sonra da mənası qalacaqmı? Dizaynı yalnız görüntü kimi yox, insan, istifadəçi təcrübəsi, biznes və gələcək nəticələrlə birlikdə düşünürsünüz.</p>

  <h2>Üçüncü baxış-Osiris</h2>
  <p>İndi ideyalara daha sərt baxmaq vaxtıdır. Faktlara baxırsınız, müqayisə edirsiniz, ölçürsünüz. Hansı fikir həqiqətən işləyir? Hansı sadəcə maraqlı görünür? Hansı hissə artıqdır? Zəif variantları çıxarırsınız. Güclü ideyanı təmizləyib daha aydın sistemə çevirirsiniz. Kreativlik yalnız ideya yaratmaq deyil. Nədən imtina etməyi bilmək də onun bir hissəsidir.</p>

  <h2>Dördüncü baxış-firon</h2>
  <p>Bu artıq qərar mərhələsidir. Araşdırmısınız, variant yaratmısınız, müqayisə etmisiniz. İndi seçim etmək lazımdır. Burada təcrübə, zövq və intuisiya işə düşür. Bəzən daha təhlükəsiz yolu, bəzən isə daha riskli və fərqli istiqaməti seçirsiniz. Creative Director üçün əsas məsələ yalnız yaxşı ideyanı görmək deyil. Hansı ideyanın arxasında dayanacağını seçməkdir.</p>

  <h2>Dörd mərhələ</h2>
  <p>Uşaq-yarat. İsida-gələcəyi gör. Osiris-seç və təmizlə. Firon-qərar ver. Eyni layihəyə dörd dəfə baxırsınız. Amma hər dəfə başqa gözlə. Bəlkə də qədim misirlilərin heykəllər üçün gözləri ayrıca hazırlaması təsadüfi deyildi. Göz onlar üçün sadəcə görmək vasitəsi yox, xüsusi məna daşıyan bir simvol idi.</p>
  <a class="back" href="https://t.me/nasiroff_az">← Geri qayıt</a>
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

    if (update.message?.chat?.type === "private" && update.message?.photo?.length) {
      const photo = update.message.photo[update.message.photo.length - 1];
      const caption = update.message.caption || "";

      const testPost = await tg(env.BOT_TOKEN, "sendPhoto", {
        chat_id: env.TEST_CHANNEL,
        photo: photo.file_id,
        caption,
        parse_mode: "HTML",
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
          ? "Şəkil qəbul edildi və test kanalına göndərildi ✅"
          : "Şəkli test kanalına göndərmək alınmadı ❌"
      });

      return new Response("ok");
    }

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

          const publishedMessageId = copiedData.result.message_id;
          const articleUrl = `${new URL(request.url).origin}/article/dord-baxis`;

          // Send a private management copy back to the user who approved the post.
          await tg(env.BOT_TOKEN, "copyMessage", {
            chat_id: q.from.id,
            from_chat_id: env.MAIN_CHANNEL,
            message_id: publishedMessageId
          });

          await tg(env.BOT_TOKEN, "sendMessage", {
            chat_id: q.from.id,
            text: `✅ Post paylaşıldı.\n\nBu onun idarəetmə nüsxəsidir. Sonradan bu paneldən məqaləyə yenidən qayıda bilərsiniz.\nPost ID: ${publishedMessageId}`,
            reply_markup: {
              inline_keyboard: [[
                { text: "✏️ Edit", url: `${new URL(request.url).origin}/edit/dord-baxis` }
              ]]
            }
          });
        }
      }

      if (q.data?.startsWith("admin_edit:")) {
        const id = q.data.split(":")[1];
        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Edit rejimi açıldı."
        });
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: q.from.id,
          text: `✏️ Edit rejimi · Post ID: ${id}\n\nDəyişmək istədiyiniz mətni bu mesaja reply olaraq göndərin.`
        });
        return new Response("ok");
      }

      if (q.data?.startsWith("admin_cover:")) {
        const id = q.data.split(":")[1];
        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Cover dəyişmə rejimi açıldı."
        });
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: q.from.id,
          text: `🖼 Cover rejimi · Post ID: ${id}\n\nYeni başlıq şəklini/video/GIF-i bu mesaja reply olaraq göndərin.\nTövsiyə olunan ölçü: 1200 × 628 px.`
        });
        return new Response("ok");
      }

      if (q.data?.startsWith("admin_media:")) {
        const id = q.data.split(":")[1];
        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Mətndaxili media rejimi açıldı."
        });
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: q.from.id,
          text: `🧩 Mətndaxili media · Post ID: ${id}\n\nŞəkil/video/GIF-ləri bu mesaja reply olaraq göndərin. Bir neçə media göndərə bilərsiniz.\nTövsiyə olunan ölçü: 1200 × 628 px.`
        });
        return new Response("ok");
      }

      if (q.data?.startsWith("admin_update:")) {
        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Preview yenilənməsi növbəti mərhələdə bu panelə bağlanacaq."
        });
        return new Response("ok");
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
