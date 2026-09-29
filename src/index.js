const tg = (token, method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const ARTICLE_ID = "dord-baxis";
const ARTICLE_TITLE = "Bir layihəyə dörd fərqli baxış";
const BUILD_VERSION = "toolbar-v7";
const enc = new TextEncoder();

const defaultArticleHtml = () => `
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
`;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function makeEditSig(env, articleId, userId) {
  return hmacHex(env.BOT_TOKEN, `${articleId}:${userId}`);
}

async function validEditSig(env, articleId, userId, sig) {
  if (!userId || !sig) return false;
  return (await makeEditSig(env, articleId, userId)) === sig;
}

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirst(html, tag, className = "") {
  const cls = className ? `[^>]*class=["'][^"']*${className}[^"']*["'][^>]*` : "[^>]*";
  const re = new RegExp(`<${tag}${cls}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m ? cleanText(m[1]) : "";
}

function telegramCaptionFromHtml(html, articleUrl) {
  const title = extractFirst(html, "h1") || ARTICLE_TITLE;
  const lead = extractFirst(html, "p", "lead");
  const shortLead = lead.length > 420 ? lead.slice(0, 417).trimEnd() + "..." : lead;
  return `<b>${title}</b>\n\n${shortLead}\n\n<a href="${articleUrl}">Ətraflı oxu</a>`;
}

function extractMediaKeys(html) {
  const out = [];
  const re = /\/media-store\/([^"'?\s>]+)/g;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(decodeURIComponent(m[1])); } catch { out.push(m[1]); }
  }
  return [...new Set(out)];
}

function cmsStub(env) {
  const id = env.CMS.idFromName("main");
  return env.CMS.get(id);
}

async function cmsGetArticle(env) {
  const r = await cmsStub(env).fetch("https://cms.internal/article");
  if (!r.ok) return null;
  return r.json();
}

async function cmsPutArticle(env, record) {
  return cmsStub(env).fetch("https://cms.internal/article", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(record)
  });
}

async function cmsDeleteMedia(env, key) {
  return cmsStub(env).fetch(`https://cms.internal/media/${encodeURIComponent(key)}`, { method: "DELETE" });
}

export class CmsStore {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/article") {
      if (request.method === "GET") {
        const article = await this.ctx.storage.get("article");
        return json(article || null);
      }
      if (request.method === "PUT") {
        const article = await request.json();
        await this.ctx.storage.put("article", article);
        return json({ ok: true });
      }
    }

    if (url.pathname === "/media" && request.method === "POST") {
      const contentType = request.headers.get("content-type") || "application/octet-stream";
      const extMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/quicktime": "mov"
      };
      const ext = extMap[contentType] || "bin";
      const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const data = new Uint8Array(await request.arrayBuffer());
      const maxChunk = 1500000;
      const chunks = Math.ceil(data.byteLength / maxChunk);

      for (let i = 0; i < chunks; i++) {
        const start = i * maxChunk;
        const end = Math.min(start + maxChunk, data.byteLength);
        await this.ctx.storage.put(`media:${key}:${i}`, data.slice(start, end).buffer);
      }

      await this.ctx.storage.put(`media:${key}:meta`, {
        key,
        contentType,
        size: data.byteLength,
        chunks,
        createdAt: new Date().toISOString()
      });

      return json({ ok: true, key, contentType, size: data.byteLength });
    }

    if (url.pathname.startsWith("/media/")) {
      const key = decodeURIComponent(url.pathname.slice("/media/".length));
      const meta = await this.ctx.storage.get(`media:${key}:meta`);
      if (!meta) return new Response("Not found", { status: 404 });

      if (request.method === "DELETE") {
        for (let i = 0; i < meta.chunks; i++) {
          await this.ctx.storage.delete(`media:${key}:${i}`);
        }
        await this.ctx.storage.delete(`media:${key}:meta`);
        return json({ ok: true });
      }

      if (request.method === "GET") {
        const out = new Uint8Array(meta.size);
        let offset = 0;
        for (let i = 0; i < meta.chunks; i++) {
          const part = await this.ctx.storage.get(`media:${key}:${i}`);
          if (!part) return new Response("Corrupt media", { status: 500 });
          const bytes = new Uint8Array(part);
          out.set(bytes, offset);
          offset += bytes.byteLength;
        }
        return new Response(out, {
          headers: {
            "content-type": meta.contentType,
            "cache-control": "public, max-age=31536000, immutable"
          }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const imageSource = "https://raw.githubusercontent.com/nasirovramin/nasiroff-content-bot/main.ru/assets/eyes.jpg";

    if (url.pathname === "/version") {
      return new Response(BUILD_VERSION, {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    }


    if (url.pathname === "/api/article/dord-baxis") {
      const userId = url.searchParams.get("u");
      const sig = url.searchParams.get("sig");
      if (!(await validEditSig(env, ARTICLE_ID, userId, sig))) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }

      if (request.method === "GET") {
        const saved = await cmsGetArticle(env);
        return json({ ok: true, article: saved });
      }

      if (request.method === "POST") {
        const body = await request.json();
        if (!body?.html || typeof body.html !== "string") {
          return json({ ok: false, error: "invalid_article" }, 400);
        }

        const old = await cmsGetArticle(env) || {};
        const newMediaKeys = extractMediaKeys(body.html);
        const oldMediaKeys = Array.isArray(old.mediaKeys) ? old.mediaKeys : [];
        const removed = oldMediaKeys.filter(k => !newMediaKeys.includes(k));

        const record = {
          ...old,
          id: ARTICLE_ID,
          slug: ARTICLE_ID,
          html: body.html,
          mediaKeys: newMediaKeys,
          updatedAt: new Date().toISOString()
        };

        const saved = await cmsPutArticle(env, record);
        if (!saved.ok) return json({ ok: false, error: "save_failed" }, 500);

        for (const key of removed) {
          try { await cmsDeleteMedia(env, key); } catch {}
        }

        const articleUrl = `${url.origin}/article/${ARTICLE_ID}`;
        let telegram = null;
        if (old.mainMessageId) {
          const caption = telegramCaptionFromHtml(body.html, articleUrl);
          const method = old.mainMessageType === "text" ? "editMessageText" : "editMessageCaption";
          const payload = old.mainMessageType === "text"
            ? {
                chat_id: env.MAIN_CHANNEL,
                message_id: old.mainMessageId,
                text: caption,
                parse_mode: "HTML",
                disable_web_page_preview: false
              }
            : {
                chat_id: env.MAIN_CHANNEL,
                message_id: old.mainMessageId,
                caption,
                parse_mode: "HTML"
              };
          const r = await tg(env.BOT_TOKEN, method, payload);
          telegram = await r.json();
        }

        return json({ ok: true, article: record, telegram, removedMedia: removed.length });
      }

      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api/media") {
      const userId = url.searchParams.get("u");
      const sig = url.searchParams.get("sig");
      if (!(await validEditSig(env, ARTICLE_ID, userId, sig))) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return json({ ok: false, error: "file_required" }, 400);
      if (file.size > 20 * 1024 * 1024) {
        return json({ ok: false, error: "file_too_large", maxMb: 20 }, 413);
      }

      const stub = cmsStub(env);
      const r = await stub.fetch("https://cms.internal/media", {
        method: "POST",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file.stream()
      });
      const data = await r.json();
      if (!r.ok || !data.ok) return json({ ok: false, error: "media_save_failed" }, 500);

      return json({
        ok: true,
        key: data.key,
        type: data.contentType,
        url: `${url.origin}/media-store/${encodeURIComponent(data.key)}`
      });
    }

    if (url.pathname.startsWith("/media-store/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.slice("/media-store/".length));
      return cmsStub(env).fetch(`https://cms.internal/media/${encodeURIComponent(key)}`);
    }

    if (request.method === "GET") {
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
        const userId = url.searchParams.get("u");
        const sig = url.searchParams.get("sig");
        if (!(await validEditSig(env, ARTICLE_ID, userId, sig))) {
          return new Response("Bu editor linki etibarsızdır.", { status: 401 });
        }

        const articleUrl = `${url.origin}/article/dord-baxis`;
        const apiUrl = `${url.origin}/api/article/dord-baxis?u=${encodeURIComponent(userId)}&sig=${encodeURIComponent(sig)}`;
        const mediaApiUrl = `${url.origin}/api/media?u=${encodeURIComponent(userId)}&sig=${encodeURIComponent(sig)}`;

        const html = `<!doctype html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>Edit · ${ARTICLE_TITLE}</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;background:#f4f4f4;color:#171717;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
.toolbar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border-bottom:1px solid #ddd;padding:10px 14px;display:flex;gap:8px;flex-wrap:wrap}
button,.btn{border:1px solid #cfcfcf;background:#fff;color:#171717;border-radius:9px;padding:9px 12px;font-size:14px;font-weight:650;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:7px}.icon-btn svg{width:22px;height:22px;display:block;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.has-tip{position:relative}.has-tip::after{content:attr(data-tip);position:absolute;left:50%;top:calc(100% + 8px);transform:translateX(-50%);background:#171717;color:#fff;font-size:12px;font-weight:500;line-height:1.35;padding:7px 9px;border-radius:7px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s ease;z-index:50}.has-tip:hover::after,.has-tip:focus-visible::after{opacity:1}
button.primary{background:#171717;color:#fff;border-color:#171717}
.wrap{max-width:960px;margin:22px auto 60px;background:#fff;padding:34px 30px 70px;box-shadow:0 4px 26px rgba(0,0,0,.06)}
#editor{outline:none}
#editor h1{font-size:54px;line-height:1.03;margin:0 0 12px;font-weight:800;letter-spacing:-.035em}
#editor .meta{display:flex;align-items:center;gap:14px;font-size:16px;color:#747474;margin:0 0 34px}
#editor .meta:after{content:"";height:1px;background:#aaa;flex:1}
#editor h2{font-size:24px;line-height:1.22;margin:30px 0 10px;font-weight:600}
#editor p{font-size:18px;line-height:1.58;margin:0 0 16px}
#editor .lead{font-size:25px;line-height:1.23;font-weight:700;margin:0 0 28px}
#editor img,#editor video{display:block;width:100%;height:auto;margin:22px 0 28px}.youtube-embed{position:relative;width:100%;aspect-ratio:16/9;margin:22px 0 28px}.youtube-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.media-wrap{position:relative;display:block;isolation:isolate}.media-wrap[contenteditable="false"]{user-select:none}
.media-wrap .remove{position:absolute;right:8px;top:8px;background:#fff;border:1px solid #ddd;border-radius:999px;padding:6px 9px;font-size:12px}
.tip{max-width:960px;margin:18px auto 0;color:#666;font-size:13px;padding:0 4px}
.status{margin-left:auto;align-self:center;font-size:13px;color:#666}
.format-btn{min-width:42px;font-size:18px;font-weight:750}
.italic-btn{font-family:Georgia,serif;font-style:italic;font-weight:700}
.emoji-holder,.link-holder{position:relative;display:inline-flex}.emoji-holder>summary,.link-holder>summary{list-style:none}.emoji-holder>summary::-webkit-details-marker,.link-holder>summary::-webkit-details-marker{display:none}
.emoji-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:80;width:290px;max-height:250px;overflow:auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:10px;box-shadow:0 12px 35px rgba(0,0,0,.16);display:none;grid-template-columns:repeat(7,1fr);gap:5px}
.emoji-panel.open{display:grid}
.emoji-panel button{border:0;background:transparent;padding:6px;font-size:21px;border-radius:7px}
.emoji-panel button:hover{background:#f1f1f1}
.link-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:85;display:flex;gap:6px;align-items:center;background:#fff;border:1px solid #ddd;border-radius:10px;padding:8px;box-shadow:0 12px 35px rgba(0,0,0,.16)}
.link-panel input{width:240px;max-width:55vw;border:1px solid #ccc;border-radius:7px;padding:8px;font:inherit}
.link-panel button{padding:8px 10px}
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
  <button class="format-btn has-tip" type="button" title="Bold" data-tip="Bold" onmousedown="remember();event.preventDefault()" onclick="fmt('bold')"><b>B</b></button>
  <button class="format-btn italic-btn has-tip" type="button" title="Italic" data-tip="Italic" onmousedown="remember();event.preventDefault()" onclick="fmt('italic')">I</button>

  <details class="link-holder" id="linkDetails" onmousedown="remember()">
    <summary class="icon-btn has-tip" title="Link əlavə et" data-tip="Seçilmiş textə link ver">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"></path></svg>
      <span>Link</span>
    </summary>
    <span class="link-panel">
      <input id="linkInput" type="url" placeholder="https://..." autocomplete="off">
      <button type="button" onclick="applyLink()">OK</button>
    </span>
  </details>

  <button type="button" onmousedown="remember();event.preventDefault()" onclick="fmt('formatBlock','h2')">H2</button>
  <button type="button" onmousedown="remember();event.preventDefault()" onclick="fmt('formatBlock','p')">Text</button>

  <button class="icon-btn has-tip" type="button" title="Şəkil əlavə et · Tövsiyə olunan ölçü: 1200 × 628 px" data-tip="Şəkil əlavə et · 1200 × 628 px" onclick="document.getElementById('imageInput').click()"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="16.5" cy="9" r="1.5"></circle><path d="M4 17l5-5 4 4 3-3 4 4"></path></svg><span>Şəkil</span></button>
  <button class="icon-btn has-tip" type="button" title="Video/GIF əlavə et · Tövsiyə olunan ölçü: 1200 × 628 px" data-tip="Video/GIF əlavə et · 1200 × 628 px" onclick="document.getElementById('videoInput').click()"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path><path d="M7 6l3 4"></path><path d="M12 6l3 4"></path><path d="M10 13.2l5 3-5 3z" fill="currentColor" stroke="none"></path></svg><span>Video</span></button>

  <input id="imageInput" type="file" accept="image/*" hidden>
  <input id="videoInput" type="file" accept="video/*,image/gif" hidden>
  <input id="imageReplaceInput" type="file" accept="image/*" hidden>
  <input id="videoReplaceInput" type="file" accept="video/*,image/gif" hidden>

  <details class="emoji-holder" id="emojiDetails" onmousedown="remember()">
    <summary class="icon-btn has-tip" title="Emoji əlavə et" data-tip="Emoji əlavə et"><span style="font-size:20px">☺</span><span>Emoji</span></summary>
    <span class="emoji-panel"><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😀')">😀</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😃')">😃</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😄')">😄</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😁')">😁</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😊')">😊</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🙂')">🙂</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😉')">😉</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😍')">😍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🥰')">🥰</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😘')">😘</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😎')">😎</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤓')">🤓</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤩')">🤩</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🥳')">🥳</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😂')">😂</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤣')">🤣</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🥲')">🥲</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😅')">😅</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😇')">😇</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤔')">🤔</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🧐')">🧐</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😮')">😮</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😲')">😲</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😢')">😢</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😭')">😭</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😡')">😡</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤯')">🤯</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👍')">👍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👎')">👎</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👏')">👏</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🙌')">🙌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👌')">👌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✌️')">✌️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤝')">🤝</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🙏')">🙏</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💪')">💪</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👀')">👀</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👁️')">👁️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('❤️')">❤️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🖤')">🖤</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤍')">🤍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💛')">💛</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💚')">💚</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💙')">💙</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💜')">💜</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🔥')">🔥</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✨')">✨</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('⭐')">⭐</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💡')">💡</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎯')">🎯</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🚀')">🚀</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✅')">✅</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('❌')">❌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('⚡')">⚡</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎨')">🎨</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✏️')">✏️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📌')">📌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📍')">📍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📎')">📎</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🔗')">🔗</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📷')">📷</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎬')">🎬</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💻')">💻</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📱')">📱</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🏆')">🏆</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎉')">🎉</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💬')">💬</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🧠')">🧠</button></span>
  </details>

  <a class="btn" href="${articleUrl}" target="_blank">Preview</a>
  <button class="primary" type="button" onclick="saveDraft()">Save</button>
  <span id="status" class="status">Edit rejimi</span>
</div>
<div class="tip">Mətndə istədiyin yerə kursoru qoy, sonra şəkil/video düyməsini bas. Media həmin nöqtəyə əlavə olunacaq.</div>
<div class="wrap">
  <article id="editor" contenteditable="true">${defaultArticleHtml()}</article>
</div>
<script>
let savedRange=null;
const API_URL=${JSON.stringify(apiUrl)};
const MEDIA_API_URL=${JSON.stringify(mediaApiUrl)};
const editor=document.getElementById('editor');
const statusEl=document.getElementById('status');

editor.addEventListener('keyup',remember);
editor.addEventListener('mouseup',remember);
editor.addEventListener('touchend',remember);
document.addEventListener('selectionchange',()=>{
  const s=window.getSelection();
  if(!s || !s.rangeCount) return;
  const r=s.getRangeAt(0);
  const node=r.commonAncestorContainer.nodeType===1?r.commonAncestorContainer:r.commonAncestorContainer.parentElement;
  if(node && editor.contains(node)) savedRange=r.cloneRange();
});

function remember(){
  const s=window.getSelection();
  if(s&&s.rangeCount) savedRange=s.getRangeAt(0).cloneRange();
}

function fmt(cmd,val){
  editor.focus();
  document.execCommand(cmd,false,val||null);
  remember();
}

function restoreSelection(){
  if(!savedRange) return false;
  const s=window.getSelection();
  s.removeAllRanges();
  s.addRange(savedRange);
  return true;
}

function applyLink(){
  const input=document.getElementById('linkInput');
  let href=(input.value||'').trim();
  if(!href){
    statusEl.textContent='Linki yazın.';
    return;
  }
  if(!savedRange || savedRange.collapsed){
    statusEl.textContent='Əvvəl link veriləcək texti seçin.';
    return;
  }
  if(!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) href='https://'+href;

  editor.focus();
  restoreSelection();

  const sel=window.getSelection();
  if(!sel.rangeCount) return;
  const range=sel.getRangeAt(0);
  const a=document.createElement('a');
  a.href=href;
  a.target='_blank';
  a.rel='noopener noreferrer';
  try{
    range.surroundContents(a);
  }catch(err){
    document.execCommand('createLink',false,href);
  }

  document.getElementById('linkDetails').open=false;
  input.value='';
  remember();
  statusEl.textContent='Link əlavə edildi. Save edin.';
}

function insertEmoji(ch){
  editor.focus();
  if(!savedRange){
    const r=document.createRange();
    r.selectNodeContents(editor);
    r.collapse(false);
    savedRange=r.cloneRange();
  }
  restoreSelection();
  const sel=window.getSelection();
  if(!sel.rangeCount) return;
  const range=sel.getRangeAt(0);
  range.deleteContents();
  const node=document.createTextNode(ch);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  savedRange=range.cloneRange();
  document.getElementById('emojiDetails').open=false;
  statusEl.textContent='Emoji əlavə edildi. Save edin.';
}

document.getElementById('linkInput').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    applyLink();
  }
});

function insertNode(node){
  editor.focus();
  const s=window.getSelection();
  if(savedRange){
    s.removeAllRanges();
    s.addRange(savedRange);
    savedRange.insertNode(node);
    savedRange.setStartAfter(node);
    savedRange.collapse(true);
    s.removeAllRanges();
    s.addRange(savedRange);
  }else{
    editor.appendChild(node);
  }
}

function youtubeIdFromUrl(value){
  try{
    const u=new URL(value.trim());
    if(u.hostname==='youtu.be') return u.pathname.split('/').filter(Boolean)[0]||null;
    if(u.hostname.endsWith('youtube.com')){
      if(u.pathname==='/watch') return u.searchParams.get('v');
      const parts=u.pathname.split('/').filter(Boolean);
      if(parts[0]==='shorts' || parts[0]==='embed' || parts[0]==='live') return parts[1]||null;
    }
  }catch(e){}
  return null;
}

function insertYoutube(urlValue){
  const id=youtubeIdFromUrl(urlValue);
  if(!id) return false;
  const wrap=document.createElement('div');
  wrap.className='youtube-embed';
  wrap.setAttribute('contenteditable','false');
  const iframe=document.createElement('iframe');
  iframe.src='https://www.youtube.com/embed/'+encodeURIComponent(id);
  iframe.title='YouTube video player';
  iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen=true;
  wrap.appendChild(iframe);
  insertNode(wrap);
  statusEl.textContent='YouTube player əlavə edildi. Save edin.';
  return true;
}

function mediaWrap(el){
  let wrap = el.parentElement && el.parentElement.classList.contains('media-wrap')
    ? el.parentElement
    : null;

  if(!wrap){
    wrap=document.createElement('div');
    wrap.className='media-wrap';
    el.parentNode.insertBefore(wrap,el);
    wrap.appendChild(el);
  }

  wrap.setAttribute('contenteditable','false');

  let actions=wrap.querySelector('.media-actions');
  if(actions) actions.remove();

  actions=document.createElement('div');
  actions.className='media-actions';

  const replace=document.createElement('button');
  replace.type='button';
  replace.className='media-edit';
  replace.textContent='Edit';
  replace.onclick=function(e){
    e.preventDefault();
    e.stopPropagation();
    window.__replaceTarget=wrap.querySelector('img,video');
    const target=window.__replaceTarget;
    if(!target) return;
    const input=target.tagName==='VIDEO'
      ? document.getElementById('videoReplaceInput')
      : document.getElementById('imageReplaceInput');
    input.click();
  };

  const rm=document.createElement('button');
  rm.type='button';
  rm.className='media-delete';
  rm.textContent='Delete';
  rm.onclick=function(e){
    e.preventDefault();
    e.stopPropagation();
    wrap.remove();
    statusEl.textContent='Media silindi. Save basın.';
  };

  actions.appendChild(replace);
  actions.appendChild(rm);
  wrap.appendChild(actions);
}

function enhanceMedia(){
  editor.querySelectorAll('img,video').forEach(mediaWrap);
}


editor.addEventListener('click',e=>{
  const media=e.target.closest('.media-wrap');
  editor.querySelectorAll('.media-wrap.active').forEach(x=>{
    if(x!==media) x.classList.remove('active');
  });
  if(media && !e.target.closest('.media-actions')) media.classList.toggle('active');
});

async function addFile(file,type){
  statusEl.textContent='Media yüklənir...';
  const fd=new FormData();
  fd.append('file',file,file.name);
  const r=await fetch(MEDIA_API_URL,{method:'POST',body:fd});
  const data=await r.json().catch(()=>({}));

  if(!r.ok||!data.ok){
    statusEl.textContent=data.error==='file_too_large'
      ? 'Fayl 20 MB-dan böyükdür.'
      : 'Media yüklənmədi.';
    return;
  }

  const el=document.createElement(type==='video'?'video':'img');
  el.src=data.url;
  el.dataset.mediaKey=data.key;
  if(type==='video'){el.controls=true;el.playsInline=true}
  insertNode(el);
  mediaWrap(el);
  statusEl.textContent='Uğurla yükləndi. Save edin.';
}

async function replaceExistingMedia(file,target){
  if(!target) return;
  statusEl.textContent='Yeni media yüklənir...';
  const fd=new FormData();
  fd.append('file',file,file.name);
  const r=await fetch(MEDIA_API_URL,{method:'POST',body:fd});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.ok){
    statusEl.textContent=data.error==='file_too_large' ? 'Fayl 20 MB-dan böyükdür.' : 'Media dəyişdirilmədi.';
    return;
  }

  const wantVideo = !file.type.startsWith('image/');
  let newEl=target;
  if((wantVideo && target.tagName!=='VIDEO') || (!wantVideo && target.tagName!=='IMG')){
    newEl=document.createElement(wantVideo?'video':'img');
    if(wantVideo){newEl.controls=true;newEl.playsInline=true}
    target.replaceWith(newEl);
  }
  newEl.src=data.url;
  newEl.dataset.mediaKey=data.key;
  const wrap=newEl.parentElement;
  if(wrap && wrap.classList.contains('media-wrap')){
    const oldActions=wrap.querySelector('.media-actions');
    if(oldActions) oldActions.remove();
  }
  mediaWrap(newEl);
  statusEl.textContent='Media dəyişdirildi. Save basın.';
  window.__replaceTarget=null;
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

document.getElementById('imageReplaceInput').addEventListener('change',e=>{
  const f=e.target.files[0];
  if(f) replaceExistingMedia(f,window.__replaceTarget);
  e.target.value='';
});

document.getElementById('videoReplaceInput').addEventListener('change',e=>{
  const f=e.target.files[0];
  if(f) replaceExistingMedia(f,window.__replaceTarget);
  e.target.value='';
});

editor.addEventListener('paste',e=>{
  const text=(e.clipboardData||window.clipboardData)?.getData('text/plain')||'';
  if(youtubeIdFromUrl(text)){
    e.preventDefault();
    remember();
    insertYoutube(text);
  }
});

function cleanEditorHtml(){
  const clone=editor.cloneNode(true);
  clone.querySelectorAll('.media-actions').forEach(x=>x.remove());
  clone.querySelectorAll('[contenteditable]').forEach(x=>x.removeAttribute('contenteditable'));
  return clone.innerHTML;
}

async function saveDraft(){
  statusEl.textContent='Yadda saxlanılır...';
  const r=await fetch(API_URL,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({id:'dord-baxis',html:cleanEditorHtml()})
  });
  const data=await r.json().catch(()=>({}));

  if(!r.ok||!data.ok){
    statusEl.textContent='Yadda saxlamaq alınmadı.';
    return;
  }

  if(data.telegram && data.telegram.ok===false){
    statusEl.textContent='Məqalə yadda saxlanıldı, Telegram yenilənmədi.';
  }else if(data.telegram && data.telegram.ok){
    statusEl.textContent='Məqalə və Telegram uğurla yeniləndi.';
  }else{
    statusEl.textContent='Məqalə uğurla yadda saxlanıldı.';
  }
}

(async()=>{
  const r=await fetch(API_URL);
  if(!r.ok) return;
  const data=await r.json();
  if(data?.article?.html) editor.innerHTML=data.article.html;
  enhanceMedia();
})().catch(()=>enhanceMedia());
enhanceMedia();
</script>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
            "pragma": "no-cache",
            "expires": "0",
            "surrogate-control": "no-store"
          }
        });
      }

      if (url.pathname === "/article/dord-baxis") {
        const savedArticle = await cmsGetArticle(env);
        const bodyHtml = savedArticle?.html || defaultArticleHtml();
        const html = `<!doctype html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>${ARTICLE_TITLE}</title>
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
img,video{display:block;width:100%;height:auto;margin:22px 0 30px;border-radius:0}.youtube-embed{position:relative;width:100%;aspect-ratio:16/9;margin:22px 0 30px}.youtube-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
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
  img,video{margin-bottom:22px}
  .back{font-size:13px;padding:8px 12px}
}
</style>
</head>
<body>
<main>
${bodyHtml}
<a class="back" href="https://t.me/nasiroff_az">← Geri qayıt</a>
</main>
</body>
</html>`;
        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
            "pragma": "no-cache",
            "expires": "0",
            "surrogate-control": "no-store"
          }
        });
      }

      if (url.pathname === "/push-approved-8f31d2") {
        const articleUrl = `${url.origin}/article/dord-baxis`;
        const caption = telegramCaptionFromHtml(defaultArticleHtml(), articleUrl);
        const imageRes = await fetch(imageSource);

        if (!imageRes.ok) return json({ ok: false, error: "image_fetch_failed" }, 500);

        const form = new FormData();
        form.append("chat_id", env.TEST_CHANNEL);
        form.append("photo", await imageRes.blob(), "eyes.jpg");
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
        return json({ article: articleUrl, telegram: await postRes.json() });
      }

      if (url.pathname === "/setup-webhook") {
        const r = await tg(env.BOT_TOKEN, "setWebhook", { url: `${url.origin}/` });
        return json(await r.json());
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
          text: "Hazır mətni və ya şəkli mənə göndər. Əvvəl test kanalına göndərəcəyəm. Məqaləni redaktə etmək üçün /edit yaz."
        });
        return new Response("ok");
      }

      if (text === "/edit") {
        const userId = update.message.from.id;
        const sig = await makeEditSig(env, ARTICLE_ID, userId);
        const editUrl = `${url.origin}/edit/dord-baxis?u=${encodeURIComponent(userId)}&sig=${sig}`;
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: update.message.chat.id,
          text: "Məqaləni açıb birbaşa səhifənin üzərində redaktə edə bilərsiniz.",
          reply_markup: {
            inline_keyboard: [[{ text: "✏️ Edit", url: editUrl }]]
          }
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
        text: data.ok ? "Test kanalına göndərildi." : "Test kanalına göndərmək alınmadı."
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
          text: copiedData.ok ? "Əsas kanalda paylaşıldı ✅" : "Paylaşmaq alınmadı ❌"
        });

        if (copiedData.ok) {
          await tg(env.BOT_TOKEN, "editMessageReplyMarkup", {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: { inline_keyboard: [] }
          });

          const publishedMessageId = copiedData.result.message_id;
          const existing = await cmsGetArticle(env) || {};
          await cmsPutArticle(env, {
            ...existing,
            id: ARTICLE_ID,
            slug: ARTICLE_ID,
            html: existing.html || defaultArticleHtml(),
            mediaKeys: existing.mediaKeys || [],
            mainMessageId: publishedMessageId,
            mainMessageType: msg.photo?.length ? "media" : "text",
            publishedAt: existing.publishedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          await tg(env.BOT_TOKEN, "copyMessage", {
            chat_id: q.from.id,
            from_chat_id: env.MAIN_CHANNEL,
            message_id: publishedMessageId
          });

          const editSig = await makeEditSig(env, ARTICLE_ID, q.from.id);
          const editUrl = `${url.origin}/edit/dord-baxis?u=${encodeURIComponent(q.from.id)}&sig=${editSig}`;

          await tg(env.BOT_TOKEN, "sendMessage", {
            chat_id: q.from.id,
            text: `✅ Post paylaşıldı.\nPost ID: ${publishedMessageId}`,
            reply_markup: {
              inline_keyboard: [[{ text: "✏️ Edit", url: editUrl }]]
            }
          });
        }

        return new Response("ok");
      }

      if (q.data === "reject") {
        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Paylaşım ləğv edildi."
        });
        await tg(env.BOT_TOKEN, "editMessageReplyMarkup", {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
          reply_markup: { inline_keyboard: [] }
        });
        return new Response("ok");
      }
    }

    return new Response("ok");
  }
};
