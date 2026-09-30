const tg = (token, method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });


async function tgSendPhotoFromUrl(token, chatId, photoUrl, caption, replyMarkup) {
  const src = await fetch(photoUrl, { redirect: "follow" });
  if (!src.ok) {
    return { ok: false, error: "photo_source_fetch_failed", status: src.status };
  }

  const contentType = src.headers.get("content-type") || "image/jpeg";
  const bytes = await src.arrayBuffer();
  if (!bytes.byteLength) {
    return { ok: false, error: "photo_source_empty" };
  }

  const ext = contentType.includes("png") ? "png" :
              contentType.includes("webp") ? "webp" :
              contentType.includes("gif") ? "gif" : "jpg";

  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("photo", new Blob([bytes], { type: contentType }), `photo.${ext}`);
  if (caption) form.append("caption", caption);
  form.append("parse_mode", "HTML");
  if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));

  const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form
  });
  return r.json().catch(() => ({ ok: false, error: "telegram_invalid_response", status: r.status }));
}

const ARTICLE_ID = "dord-baxis";
const ARTICLE_TITLE = "Bir layihəyə dörd fərqli baxış";
const BUILD_VERSION = "telegram-update-dedupe-v13";
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
  let description = extractFirst(html, "p", "lead");

  if (!description) {
    const paragraphs = [];
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRe.exec(html))) {
      const attrs = m[1] || "";
      if (/class=["'][^"']*meta[^"']*["']/i.test(attrs)) continue;
      const text = cleanText(m[2]);
      if (!text || /^Mənbə\s*:/i.test(text)) continue;
      paragraphs.push(text);
      if (paragraphs.length >= 2) break;
    }
    description = paragraphs.join(" ");
  }

  const sentences = description.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  let shortLead = sentences.slice(0, 3).join(" ").replace(/\s+/g, " ").trim();
  if (!shortLead) shortLead = description.trim();
  if (shortLead.length > 420) shortLead = shortLead.slice(0, 417).trimEnd() + "...";

  return `<b>${title}</b>\n\n${shortLead}\n\n<a href="${articleUrl}">Ətraflı oxu</a>`;
}

function linkedinCommentaryFromHtml(html) {
  const blocks = [];
  const re = /<(h1|h2|h3|p|blockquote|li)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const attrs = m[2] || "";
    if (/class=["'][^"']*meta[^"']*["']/i.test(attrs)) continue;
    const text = cleanText(m[3]);
    if (!text) continue;
    if (/^Mənbə\s*:/i.test(text)) continue;
    if (tag === "li") blocks.push("• " + text);
    else blocks.push(text);
  }
  return blocks.join("\n\n").trim();
}

function linkedinMediaUrlsFromHtml(html, origin) {
  const images = [];
  const videos = [];
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const videoRe = /<video[^>]+src=["']([^"']+)["'][^>]*>|<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi;
  let m;
  while ((m = imgRe.exec(html))) {
    try { images.push(new URL(m[1], origin).href); } catch {}
  }
  while ((m = videoRe.exec(html))) {
    const src = m[1] || m[2];
    try { videos.push(new URL(src, origin).href); } catch {}
  }
  return { images: [...new Set(images)], videos: [...new Set(videos)] };
}

async function linkedinImageSource(env, imageUrl) {
  try {
    const u = new URL(imageUrl);

    if (u.pathname.startsWith("/media-store/")) {
      const key = decodeURIComponent(u.pathname.slice("/media-store/".length));
      return cmsStub(env).fetch(`https://cms.internal/media/${encodeURIComponent(key)}`);
    }

    if (u.pathname === "/media/eyes.jpg") {
      return fetch("https://raw.githubusercontent.com/nasirovramin/nasiroff-content-bot/main.ru/assets/eyes.jpg", {
        redirect: "follow"
      });
    }

    return fetch(imageUrl, { redirect: "follow" });
  } catch {
    return fetch(imageUrl, { redirect: "follow" });
  }
}

async function linkedinUploadImage(env, imageUrl) {
  const li = await cmsGetLinkedIn(env);
  if (!linkedinConnectionUsable(li)) return { ok:false, error:"linkedin_not_connected_or_expired" };
  const owner = `urn:li:person:${li.profile.sub}`;

  const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: linkedinApiHeaders(li.accessToken),
    body: JSON.stringify({ initializeUploadRequest: { owner } })
  });
  const initData = await init.json().catch(()=>({}));
  if (!init.ok || !initData?.value?.uploadUrl || !initData?.value?.image) {
    return { ok:false, error:"linkedin_image_init_failed", status:init.status, detail:JSON.stringify(initData).slice(0,600) };
  }

  const src = await linkedinImageSource(env, imageUrl);
  if (!src.ok) return { ok:false, error:"linkedin_image_source_fetch_failed", status:src.status, detail:imageUrl };
  const bytes = await src.arrayBuffer();
  if (!bytes.byteLength) return { ok:false, error:"linkedin_image_source_empty", detail:imageUrl };

  const put = await fetch(initData.value.uploadUrl, {
    method: "PUT",
    headers: { "content-type": src.headers.get("content-type") || "application/octet-stream" },
    body: bytes
  });
  if (!put.ok) return { ok:false, error:"linkedin_image_upload_failed", status:put.status, detail:(await put.text()).slice(0,500) };
  return { ok:true, urn:initData.value.image };
}

async function linkedinUploadVideo(env, videoUrl) {
  const li = await cmsGetLinkedIn(env);
  if (!linkedinConnectionUsable(li)) return { ok:false, error:"linkedin_not_connected_or_expired" };
  const owner = `urn:li:person:${li.profile.sub}`;

  const src = await fetch(videoUrl);
  if (!src.ok) return { ok:false, error:"linkedin_video_source_fetch_failed", status:src.status };
  const bytes = new Uint8Array(await src.arrayBuffer());

  const init = await fetch("https://api.linkedin.com/rest/videos?action=initializeUpload", {
    method: "POST",
    headers: linkedinApiHeaders(li.accessToken),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner,
        fileSizeBytes: bytes.byteLength,
        uploadCaptions: false,
        uploadThumbnail: false
      }
    })
  });
  const initData = await init.json().catch(()=>({}));
  const value = initData?.value;
  if (!init.ok || !value?.video || !Array.isArray(value?.uploadInstructions)) {
    return { ok:false, error:"linkedin_video_init_failed", status:init.status, detail:JSON.stringify(initData).slice(0,600) };
  }

  const uploadedPartIds = [];
  for (const part of value.uploadInstructions) {
    const first = Number(part.firstByte);
    const last = Number(part.lastByte);
    const chunk = bytes.slice(first, last + 1);
    const put = await fetch(part.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "application/octet-stream" },
      body: chunk
    });
    if (!put.ok) {
      return { ok:false, error:"linkedin_video_upload_failed", status:put.status, detail:(await put.text()).slice(0,500) };
    }
    const etag = (put.headers.get("etag") || "").replace(/^"|"$/g, "");
    if (!etag) return { ok:false, error:"linkedin_video_etag_missing" };
    uploadedPartIds.push(etag);
  }

  const fin = await fetch("https://api.linkedin.com/rest/videos?action=finalizeUpload", {
    method: "POST",
    headers: linkedinApiHeaders(li.accessToken),
    body: JSON.stringify({
      finalizeUploadRequest: {
        video: value.video,
        uploadToken: value.uploadToken || "",
        uploadedPartIds
      }
    })
  });
  if (!fin.ok) return { ok:false, error:"linkedin_video_finalize_failed", status:fin.status, detail:(await fin.text()).slice(0,500) };
  return { ok:true, urn:value.video };
}

async function linkedinCreateArticleCardPost(env, html, articleUrl, origin) {
  const li = await cmsGetLinkedIn(env);
  if (!linkedinConnectionUsable(li)) {
    return { ok:false, error:"linkedin_not_connected_or_expired" };
  }

  const title = extractFirst(html, "h1") || ARTICLE_TITLE;
  const lead = extractFirst(html, "p", "lead");
  const media = linkedinMediaUrlsFromHtml(html, origin);
  let thumbnail = null;

  if (media.images.length) {
    const up = await linkedinUploadImage(env, media.images[0]);
    if (up.ok) thumbnail = up.urn;
  }

  const article = {
    source: articleUrl,
    title,
    description: lead.length > 220 ? lead.slice(0,217).trimEnd() + "..." : lead
  };
  if (thumbnail) article.thumbnail = thumbnail;

  const payload = {
    author: `urn:li:person:${li.profile.sub}`,
    commentary: `${title}\n\n${lead.length > 420 ? lead.slice(0,417).trimEnd() + "..." : lead}\n\nƏtraflı oxu`,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    content: { article },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false
  };

  const r = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: linkedinApiHeaders(li.accessToken),
    body: JSON.stringify(payload)
  });
  const postId = r.headers.get("x-restli-id");
  const responseText = await r.text();
  return {
    ok: r.status === 201 && !!postId,
    status: r.status,
    postId: postId || null,
    error: r.status === 201 ? null : responseText.slice(0,800),
    mediaMode: "article"
  };
}

async function repairBrokenArticleCover(env, article, articleId, origin) {
  if (!article?.html) return article;

  const media = linkedinMediaUrlsFromHtml(article.html, origin);
  const current = media.images[0];
  if (!current) return article;

  let ok = false;
  try {
    const r = await linkedinImageSource(env, current);
    ok = r.ok;
  } catch {}

  if (ok) return article;

  let replacement = null;

  if (article.sourceImageUrl) {
    try {
      const r = await fetch(article.sourceImageUrl, { redirect: "follow" });
      if (r.ok && (r.headers.get("content-type") || "").startsWith("image/")) {
        const cached = await cacheRemoteImage(env, origin, article.sourceImageUrl);
        if (cached) replacement = cached;
      }
    } catch {}
  }

  if (!replacement && articleId === ARTICLE_ID) {
    replacement = "/media/eyes.jpg";
  }

  if (!replacement) return article;

  const html = article.html.replace(
    /(<img[^>]+src=["'])[^"']+(["'][^>]*>)/i,
    `$1${replacement}$2`
  );

  const repaired = {
    ...article,
    html,
    mediaKeys: extractMediaKeys(html),
    updatedAt: new Date().toISOString()
  };
  await cmsPutArticle(env, repaired, articleId);
  return repaired;
}

async function linkedinCreateNativePostFromHtml(env, html, origin, articleUrl) {
  const li = await cmsGetLinkedIn(env);
  if (!linkedinConnectionUsable(li)) {
    return { ok:false, error:"linkedin_not_connected_or_expired" };
  }

  const commentary = linkedinCommentaryFromHtml(html);
  const media = linkedinMediaUrlsFromHtml(html, origin);

  // Ağıllı LinkedIn qaydası:
  // 2+ şəkil varsa tam mətni LinkedIn postuna sıxışdırmırıq.
  // Cloudflare məqaləsini LinkedIn Article card kimi göstəririk.
  if (media.images.length > 1 && articleUrl) {
    return linkedinCreateArticleCardPost(env, html, articleUrl, origin);
  }

  const author = `urn:li:person:${li.profile.sub}`;

  const payload = {
    author,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false
  };

  if (media.videos.length && media.images.length) {
    return { ok:false, error:"linkedin_mixed_media_not_supported_in_single_post" };
  }

  if (media.videos.length) {
    const up = await linkedinUploadVideo(env, media.videos[0]);
    if (!up.ok) return up;
    payload.content = { media: { id: up.urn, title: extractFirst(html, "h1") || ARTICLE_TITLE } };
  } else if (media.images.length) {
    const uploaded = [];
    for (const imageUrl of media.images.slice(0,20)) {
      const up = await linkedinUploadImage(env, imageUrl);
      if (!up.ok) return up;
      uploaded.push(up.urn);
    }
    if (uploaded.length === 1) {
      payload.content = { media: { id: uploaded[0], altText: extractFirst(html, "h1") || ARTICLE_TITLE } };
    } else if (uploaded.length > 1) {
      payload.content = {
        multiImage: {
          images: uploaded.map((id, i) => ({
            id,
            altText: i === 0 ? (extractFirst(html, "h1") || ARTICLE_TITLE) : ""
          }))
        }
      };
    }
  }

  const r = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: linkedinApiHeaders(li.accessToken),
    body: JSON.stringify(payload)
  });
  const postId = r.headers.get("x-restli-id");
  const responseText = await r.text();
  return {
    ok: r.status === 201 && !!postId,
    status: r.status,
    postId: postId || null,
    error: r.status === 201 ? null : responseText.slice(0,800),
    mediaMode: media.videos.length ? "video" : media.images.length > 1 ? "multiImage" : media.images.length === 1 ? "image" : "text"
  };
}

function linkedinApiHeaders(accessToken, extra = {}) {
  return {
    "authorization": `Bearer ${accessToken}`,
    "content-type": "application/json",
    "linkedin-version": "202609",
    "x-restli-protocol-version": "2.0.0",
    ...extra
  };
}

function linkedinConnectionUsable(li) {
  if (!li?.accessToken || !li?.profile?.sub) return false;
  if (li.expiresAt && Date.now() >= Number(li.expiresAt) - 60_000) return false;
  return true;
}

async function linkedinCreateTextPost(env, commentary) {
  const li = await cmsGetLinkedIn(env);
  if (!linkedinConnectionUsable(li)) {
    return { ok: false, error: "linkedin_not_connected_or_expired" };
  }

  const author = `urn:li:person:${li.profile.sub}`;
  const r = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: linkedinApiHeaders(li.accessToken),
    body: JSON.stringify({
      author,
      commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    })
  });

  const postId = r.headers.get("x-restli-id");
  const responseText = await r.text();
  return {
    ok: r.status === 201 && !!postId,
    status: r.status,
    postId: postId || null,
    error: r.status === 201 ? null : responseText.slice(0, 800)
  };
}

async function linkedinUpdateTextPost(env, postId, commentary) {
  const li = await cmsGetLinkedIn(env);
  if (!linkedinConnectionUsable(li)) {
    return { ok: false, error: "linkedin_not_connected_or_expired" };
  }
  if (!postId) return { ok: false, error: "linkedin_post_id_missing" };

  const encodedId = encodeURIComponent(postId);
  const r = await fetch(`https://api.linkedin.com/rest/posts/${encodedId}`, {
    method: "POST",
    headers: linkedinApiHeaders(li.accessToken, {
      "x-restli-method": "PARTIAL_UPDATE"
    }),
    body: JSON.stringify({
      patch: {
        "$set": {
          commentary
        }
      }
    })
  });

  const responseText = await r.text();
  return {
    ok: r.status === 204,
    status: r.status,
    error: r.status === 204 ? null : responseText.slice(0, 800)
  };
}


function escHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstHttpUrl(text = "") {
  const m = String(text).match(/https?:\/\/[^\s<>]+/i);
  return m ? m[0].replace(/[),.;!?]+$/, "") : null;
}

function slugPart(value = "") {
  const map = { "ə":"e","ı":"i","ö":"o","ü":"u","ş":"s","ç":"c","ğ":"g","Ə":"e","İ":"i","Ö":"o","Ü":"u","Ş":"s","Ç":"c","Ğ":"g" };
  return String(value)
    .split("").map(ch => map[ch] || ch).join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "meqale";
}

function buildArticleId(title = "") {
  return `${Date.now().toString(36)}-${slugPart(title)}`.slice(0, 54);
}

function buildArticleHtmlFromDraft(draft, sourceUrl, imageUrl = "") {
  const title = escHtml(draft?.title || "Yeni məqalə");
  const lead = escHtml(draft?.lead || "");
  const sections = Array.isArray(draft?.sections) ? draft.sections : [];
  const date = new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Baku"
  }).format(new Date());

  const media = imageUrl
    ? `<img src="${escHtml(imageUrl)}" alt="${title}">`
    : "";

  const body = sections.map(section => {
    const heading = escHtml(section?.heading || "");
    const paragraphs = Array.isArray(section?.paragraphs) ? section.paragraphs : [];
    const h = heading ? `<h2>${heading}</h2>` : "";
    const p = paragraphs
      .filter(Boolean)
      .map(x => `<p>${escHtml(x)}</p>`)
      .join("\n");
    return h + p;
  }).join("\n");

  return `
  <h1>${title}</h1>
  <p class="meta">Ramin Nəsirov · ${escHtml(date)}</p>
  ${media}
  <p class="lead">${lead}</p>
  ${body}
  <p><strong>Mənbə:</strong> <a href="${escHtml(sourceUrl)}">Orijinal material</a></p>
  `;
}

async function fetchSourceOgImage(sourceUrl) {
  try {
    const r = await fetch(sourceUrl, {
      headers: { "user-agent": "Mozilla/5.0 NASIROFF-Content-Bot/1.0" },
      redirect: "follow"
    });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "";
    if (!type.includes("text/html")) return null;
    const html = (await r.text()).slice(0, 700000);
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return new URL(m[1].replace(/&amp;/g, "&"), sourceUrl).href;
    }
  } catch {}
  return null;
}


async function fetchSourcePublicationDate(sourceUrl) {
  try {
    const r = await fetch(sourceUrl, {
      headers: { "user-agent": "Mozilla/5.0 NASIROFF-Content-Bot/1.0" },
      redirect: "follow"
    });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "";
    if (!type.includes("text/html")) return null;

    const html = (await r.text()).slice(0, 1200000);
    const candidates = [];

    const metaPatterns = [
      /<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:modified_time["'][^>]*>/i,
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["'][^>]*>/i,
      /<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']date["'][^>]*>/i,
      /<time[^>]+datetime=["']([^"']+)["'][^>]*>/i
    ];

    for (const re of metaPatterns) {
      const m = html.match(re);
      if (m?.[1]) candidates.push(m[1]);
    }

    const jsonDatePatterns = [
      /"dateModified"\s*:\s*"([^"]+)"/i,
      /"datePublished"\s*:\s*"([^"]+)"/i,
      /"uploadDate"\s*:\s*"([^"]+)"/i
    ];
    for (const re of jsonDatePatterns) {
      const m = html.match(re);
      if (m?.[1]) candidates.push(m[1]);
    }

    const parsed = candidates
      .map(v => ({ raw: v, time: Date.parse(v) }))
      .filter(x => Number.isFinite(x.time))
      .sort((a,b) => b.time - a.time);

    if (!parsed.length) return null;

    const chosen = parsed[0];
    return {
      iso: new Date(chosen.time).toISOString(),
      display: new Intl.DateTimeFormat("az-AZ", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Baku"
      }).format(new Date(chosen.time))
    };
  } catch {
    return null;
  }
}

async function cacheRemoteImage(env, origin, imageUrl) {
  if (!imageUrl) return null;
  try {
    const r = await fetch(imageUrl, {
      headers: { "user-agent": "Mozilla/5.0 NASIROFF-Content-Bot/1.0" },
      redirect: "follow"
    });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return null;
    const size = Number(r.headers.get("content-length") || 0);
    if (size && size > 10 * 1024 * 1024) return null;
    const bytes = await r.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) return null;

    const stored = await cmsStub(env).fetch("https://cms.internal/media", {
      method: "POST",
      headers: { "content-type": type },
      body: bytes
    });
    const data = await stored.json();
    if (!stored.ok || !data?.ok) return null;
    return `${origin}/media-store/${encodeURIComponent(data.key)}`;
  } catch {
    return null;
  }
}


function normalizeCandidateUrl(raw, baseUrl) {
  try {
    const u = new URL(raw, baseUrl);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    u.hash = "";
    for (const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"]) {
      u.searchParams.delete(key);
    }
    return u.href;
  } catch {
    return null;
  }
}

function looksLikeContentUrl(candidate, sourceUrl) {
  try {
    const u = new URL(candidate);
    const src = new URL(sourceUrl);
    const p = u.pathname.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|mp4|mp3|css|js)$/i.test(p)) return false;
    if (/\/(tag|tags|category|categories|author|authors|about|contact|privacy|terms|login|signup|search)(\/|$)/i.test(p)) return false;
    if (u.hostname === "t.me") return /\/[^/]+\/\d+/.test(p);
    if (u.hostname !== src.hostname) {
      return !/(facebook|instagram|linkedin|youtube|x\.com|twitter)\./i.test(u.hostname);
    }
    return p !== "/" && p.length > 4;
  } catch {
    return false;
  }
}


function telegramChannelName(sourceUrl) {
  try {
    const u = new URL(sourceUrl);
    if (!/^(?:www\.)?t\.me$/i.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (!parts.length) return null;
    if (parts[0] === "s" && parts[1]) return parts[1];
    return parts[0];
  } catch {
    return null;
  }
}

async function extractTelegramArchiveCandidates(sourceUrl) {
  const channel = telegramChannelName(sourceUrl);
  if (!channel) return [];

  let before = null;
  const out = [];
  const seen = new Set();
  let pages = 0;
  let reached2025 = false;

  while (pages < 35 && out.length < 120) {
    const pageUrl = new URL(`https://t.me/s/${channel}`);
    if (before) pageUrl.searchParams.set("before", String(before));

    const r = await fetch(pageUrl.href, {
      headers: { "user-agent": "Mozilla/5.0 NASIROFF-Content-Bot/1.0" },
      redirect: "follow"
    });
    if (!r.ok) break;

    const html = await r.text();
    const blockRe = /<div class="tgme_widget_message_wrap[\s\S]*?<div class="tgme_widget_message[^>]*data-post="([^"]+)"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
    const simpleRe = /data-post="([^"]+)"[\s\S]{0,12000}?<time[^>]+datetime="([^"]+)"[\s\S]{0,12000}?(?:tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>)?/gi;

    let minId = Infinity;
    let foundOnPage = 0;
    let m;
    while ((m = simpleRe.exec(html))) {
      const postRef = m[1];
      const dt = m[2];
      const rawText = m[3] || "";
      const idMatch = postRef.match(/\/(\d+)$/);
      if (!idMatch) continue;
      const msgId = Number(idMatch[1]);
      if (!Number.isFinite(msgId)) continue;
      minId = Math.min(minId, msgId);
      foundOnPage++;

      const ts = Date.parse(dt);
      if (!Number.isFinite(ts)) continue;
      const year = new Date(ts).getUTCFullYear();
      if (year <= 2025) reached2025 = true;
      if (year > 2025) continue;

      const postUrl = `https://t.me/${postRef}`;
      if (seen.has(postUrl)) continue;
      seen.add(postUrl);

      const label = cleanText(rawText).slice(0, 240);
      out.push({
        url: postUrl,
        title: label || `Telegram post ${msgId}`,
        publishedAt: new Date(ts).toISOString(),
        publishedYear: year
      });
      if (out.length >= 120) break;
    }

    if (!foundOnPage || !Number.isFinite(minId) || minId <= 1) break;
    before = minId;
    pages++;

    if (reached2025 && out.length >= 80) break;
  }

  return out;
}

async function extractSourceCandidates(sourceUrl) {
  if (telegramChannelName(sourceUrl)) {
    return extractTelegramArchiveCandidates(sourceUrl);
  }

  const r = await fetch(sourceUrl, {
    headers: { "user-agent": "Mozilla/5.0 NASIROFF-Content-Bot/1.0" },
    redirect: "follow"
  });
  if (!r.ok) throw new Error(`Source_${r.status}`);
  const type = r.headers.get("content-type") || "";
  if (!type.includes("text/html")) return [];

  const html = (await r.text()).slice(0, 1200000);
  const out = [];
  const seen = new Set();
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 160) {
    const href = normalizeCandidateUrl(m[1], sourceUrl);
    if (!href || seen.has(href) || !looksLikeContentUrl(href, sourceUrl)) continue;
    const label = cleanText(m[2]).slice(0, 180);
    if (label.length < 3) continue;
    seen.add(href);
    out.push({ url: href, title: label });
  }
  return out;
}

async function discoverRelevantSourceItems(env, sourceUrl) {
  if (!env.GEMINI_CONTENT_API_KEY) throw new Error("GEMINI_CONTENT_API_KEY_missing");

  const candidates = await extractSourceCandidates(sourceUrl);
  if (!candidates.length) {
    if (telegramChannelName(sourceUrl)) return [];
    return [{ url: sourceUrl, title: "", category: "unknown" }];
  }

  const compact = candidates.slice(0, 100);
  const model = env.GEMINI_MODEL || "gemini-3.8-flash";
  const prompt = `
Sən dizayn və kreativ industriyası üçün redaktor kimi işləyirsən.
Aşağıdakı mənbədən çıxarılmış namizəd linklər arasından yalnız həqiqətən faydalı materialları seç.

Uyğun mövzular:
- branding
- visual identity / brand identity
- packaging design
- typography / type design
- advertising / campaign
- art direction / creative direction
- AI və design technology

Qaydalar:
- Uyğun olmayan biznes, siyasət, ümumi texnologiya, şou-biznes və reklam xarakterli səhifələri seçmə.
- Eyni mövzudan çox oxşar materialları azalt, kateqoriyalar arasında balans saxla.
- Maksimum 8 material seç.
- Telegram mənbəsində 2026 postlarını seçmə. Yalnız 31 dekabr 2025 və daha köhnə materiallardan seçim et.
- Tarixi materiallarda yenilikdən çox faydalılığa üstünlük ver.
- Məqalə/post tipli URL-ləri seç.
- Yalnız verilmiş URL-lərdən istifadə et, URL uydurma.
- Hər seçimin category sahəsini bu dəyərlərdən biri et:
  Branding, VisualIdentity, Packaging, Typography, Campaign, ArtDirection, AI
- Heç nə uyğun deyilsə boş items qaytar.

Mənbə: ${sourceUrl}

Namizədlər:
${compact.map((x,i)=>`${i+1}. [${x.title}] ${x.url}${x.publishedAt ? ` | tarix: ${x.publishedAt}` : ""}`).join("\n")}
`;

  const schema = {
    type: "OBJECT",
    properties: {
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            url: { type: "STRING" },
            title: { type: "STRING" },
            category: { type: "STRING" }
          },
          required: ["url", "title", "category"]
        }
      }
    },
    required: ["items"]
  };

  const r2 = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_CONTENT_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: schema,
        }
      })
    }
  );

  const data = await r2.json();
  if (!r2.ok) throw new Error(`Gemini_discovery_${r2.status}_${data?.error?.message || "error"}`);
  const raw = (data?.candidates?.[0]?.content?.parts || []).map(p=>p?.text || "").join("").trim();
  const parsed = raw ? JSON.parse(raw) : { items: [] };
  const allowed = new Set(compact.map(x => x.url));
  return (Array.isArray(parsed.items) ? parsed.items : [])
    .filter(x => x?.url && allowed.has(x.url))
    .slice(0, 8);
}

async function geminiDraftFromSource(env, sourceUrl) {
  if (!env.GEMINI_CONTENT_API_KEY) {
    throw new Error("GEMINI_CONTENT_API_KEY_missing");
  }

  const models = [
    env.GEMINI_MODEL || "gemini-3.8-flash",
    env.GEMINI_FALLBACK_MODEL || "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview"
  ].filter((x, i, a) => x && a.indexOf(x) === i);

  const prompt = `
Aşağıdakı mənbəni oxu və Azərbaycan dilində redaktə oluna bilən jurnal məqaləsi hazırla:
${sourceUrl}

Qaydalar:
- Mənbədə olmayan fakt uydurma.
- Mətn Azərbaycan dilində sadə, təbii və peşəkar olsun.
- Brend, şirkət, məhsul, kampaniya, dizayn və texniki terminlərin orijinal adlarını saxla.
- Sözbəsöz mexaniki tərcümə etmə, mənanı dəqiq qoruyaraq Azərbaycan dilinə uyğunlaşdır.
- Reklam dili, clickbait və lazımsız şişirtmə olmasın.
- Başlıq qısa və aydın olsun.
- lead 2-4 cümləlik giriş olsun.
- Məzmunu 2-6 məntiqli bölməyə ayır.
- Hər bölmədə 1-4 qısa paraqraf olsun.
- Yalnız JSON qaytar.
`;

  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      lead: { type: "STRING" },
      sections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            heading: { type: "STRING" },
            paragraphs: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["heading", "paragraphs"]
        }
      }
    },
    required: ["title", "lead", "sections"]
  };

  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": env.GEMINI_CONTENT_API_KEY
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ url_context: {} }],
            generationConfig: {
              response_mime_type: "application/json",
              response_schema: schema,
            }
          })
        }
      );

      const data = await r.json().catch(() => ({}));

      if (r.ok) {
        const raw = (data?.candidates?.[0]?.content?.parts || [])
          .map(p => p?.text || "")
          .join("")
          .trim();
        if (!raw) throw new Error("Gemini_empty_response");
        return JSON.parse(raw);
      }

      lastError = `Gemini_${r.status}_${data?.error?.message || "error"}`;

      const retryable = r.status === 429 || r.status === 500 || r.status === 502 || r.status === 503 || r.status === 504;
      if (!retryable) break;

      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1200));
      }
    }
  }

  throw new Error(lastError || "Gemini_failed");
}

async function createSourceDraft(env, origin, sourceUrl, userId) {
  const draft = await geminiDraftFromSource(env, sourceUrl);
  const articleId = buildArticleId(draft.title);
  const [originalImage, sourceDate] = await Promise.all([
    fetchSourceOgImage(sourceUrl),
    fetchSourcePublicationDate(sourceUrl)
  ]);
  const cachedImage = await cacheRemoteImage(env, origin, originalImage);
  const imageUrl = cachedImage || originalImage || "";
  const html = buildArticleHtmlFromDraft(draft, sourceUrl, imageUrl);

  const record = {
    id: articleId,
    slug: articleId,
    html,
    mediaKeys: extractMediaKeys(html),
    sourceUrl,
    sourceImageUrl: originalImage || null,
    sourcePublishedAt: sourceDate?.iso || null,
    sourcePublishedDisplay: sourceDate?.display || null,
    ownerTelegramId: String(userId),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await cmsPutArticle(env, record, articleId);
  await cmsPutLatestArticleId(env, articleId);
  return record;
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

async function cmsGetArticle(env, articleId = ARTICLE_ID) {
  const path = articleId === ARTICLE_ID ? "/article" : `/article/${encodeURIComponent(articleId)}`;
  const r = await cmsStub(env).fetch(`https://cms.internal${path}`);
  if (!r.ok) return null;
  return r.json();
}

async function cmsPutArticle(env, record, articleId = record?.id || ARTICLE_ID) {
  const path = articleId === ARTICLE_ID ? "/article" : `/article/${encodeURIComponent(articleId)}`;
  return cmsStub(env).fetch(`https://cms.internal${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(record)
  });
}

async function cmsDeleteArticle(env, articleId) {
  const path = articleId === ARTICLE_ID ? "/article" : `/article/${encodeURIComponent(articleId)}`;
  return cmsStub(env).fetch(`https://cms.internal${path}`, { method: "DELETE" });
}

async function sourceSeenKey(sourceUrl) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(sourceUrl));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function cmsIsSourceSeen(env, sourceUrl) {
  const key = await sourceSeenKey(sourceUrl);
  const r = await cmsStub(env).fetch(`https://cms.internal/seen/${key}`);
  if (!r.ok) return false;
  const data = await r.json();
  return !!data?.seen;
}

async function cmsMarkSourceSeen(env, sourceUrl, articleId) {
  const key = await sourceSeenKey(sourceUrl);
  return cmsStub(env).fetch(`https://cms.internal/seen/${key}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ seen: true, sourceUrl, articleId, at: new Date().toISOString() })
  });
}

async function cmsGetLatestArticleId(env) {
  const r = await cmsStub(env).fetch("https://cms.internal/latest-article");
  if (!r.ok) return ARTICLE_ID;
  const data = await r.json();
  return data?.id || ARTICLE_ID;
}

async function cmsPutLatestArticleId(env, articleId) {
  return cmsStub(env).fetch("https://cms.internal/latest-article", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: articleId })
  });
}

async function cmsGetOwnerTelegramId(env) {
  const r = await cmsStub(env).fetch("https://cms.internal/owner");
  if (!r.ok) return null;
  const data = await r.json();
  return data?.userId || null;
}

async function rememberOwnerTelegramId(env, userId) {
  if (!userId) return;
  await cmsStub(env).fetch("https://cms.internal/owner", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: String(userId) })
  });
}

async function sendLinkedInExpiryReminder(env) {
  const li = await cmsGetLinkedIn(env);
  const ownerId = await cmsGetOwnerTelegramId(env);
  if (!li?.expiresAt || !ownerId) return { ok: false, skipped: "missing_connection_or_owner" };

  const msLeft = Number(li.expiresAt) - Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (msLeft <= 0) {
    const marker = `expired:${li.expiresAt}`;
    if (li.lastExpiryReminder === marker) return { ok: true, skipped: "already_notified" };

    const r = await tg(env.BOT_TOKEN, "sendMessage", {
      chat_id: ownerId,
      text: "⚠️ LinkedIn bağlantısının token müddəti bitib. Yenidən qoşmaq üçün bu linki açın:",
      reply_markup: {
        inline_keyboard: [[{
          text: "🔗 LinkedIn-i yenidən qoş",
          url: "https://nasiroff-content-bot.nasirovramin.workers.dev/linkedin/connect"
        }]]
      }
    });
    const data = await r.json().catch(()=>({}));
    if (data.ok) {
      await cmsPutLinkedIn(env, { ...li, lastExpiryReminder: marker });
    }
    return data;
  }

  if (msLeft <= sevenDays) {
    const marker = `soon:${li.expiresAt}`;
    if (li.lastExpiryReminder === marker) return { ok: true, skipped: "already_notified" };

    const days = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    const r = await tg(env.BOT_TOKEN, "sendMessage", {
      chat_id: ownerId,
      text: `⚠️ LinkedIn bağlantısının müddətinin bitməsinə təxminən ${days} gün qalıb. İndi yeniləsən, paylaşımlar dayanmayacaq.`,
      reply_markup: {
        inline_keyboard: [[{
          text: "🔗 LinkedIn-i yenilə",
          url: "https://nasiroff-content-bot.nasirovramin.workers.dev/linkedin/connect"
        }]]
      }
    });
    const data = await r.json().catch(()=>({}));
    if (data.ok) {
      await cmsPutLinkedIn(env, { ...li, lastExpiryReminder: marker });
    }
    return data;
  }

  return { ok: true, skipped: "not_due" };
}

async function cmsDeleteMedia(env, key) {
  return cmsStub(env).fetch(`https://cms.internal/media/${encodeURIComponent(key)}`, { method: "DELETE" });
}

async function cmsGetLinkedIn(env) {
  const r = await cmsStub(env).fetch("https://cms.internal/linkedin");
  if (!r.ok) return null;
  return r.json();
}

async function cmsPutLinkedIn(env, data) {
  return cmsStub(env).fetch("https://cms.internal/linkedin", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });
}

async function cmsGetLinkedInState(env) {
  const r = await cmsStub(env).fetch("https://cms.internal/linkedin-state");
  if (!r.ok) return null;
  return r.json();
}

async function cmsPutLinkedInState(env, data) {
  return cmsStub(env).fetch("https://cms.internal/linkedin-state", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });
}

async function cmsDeleteLinkedInState(env) {
  return cmsStub(env).fetch("https://cms.internal/linkedin-state", { method: "DELETE" });
}

export class CmsStore {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/article" || url.pathname.startsWith("/article/")) {
      const articleId = url.pathname === "/article"
        ? ARTICLE_ID
        : decodeURIComponent(url.pathname.slice("/article/".length));
      const key = articleId === ARTICLE_ID ? "article" : `article:${articleId}`;
      if (request.method === "GET") {
        const article = await this.ctx.storage.get(key);
        return json(article || null);
      }
      if (request.method === "PUT") {
        const article = await request.json();
        await this.ctx.storage.put(key, article);
        return json({ ok: true });
      }
      if (request.method === "DELETE") {
        await this.ctx.storage.delete(key);
        return json({ ok: true });
      }
    }

    if (url.pathname.startsWith("/seen/")) {
      const seenKey = decodeURIComponent(url.pathname.slice("/seen/".length));
      const key = `seen:${seenKey}`;
      if (request.method === "GET") {
        const data = await this.ctx.storage.get(key);
        return json(data || { seen: false });
      }
      if (request.method === "PUT") {
        const data = await request.json();
        await this.ctx.storage.put(key, data);
        return json({ ok: true });
      }
    }

    if (url.pathname === "/latest-article") {
      if (request.method === "GET") {
        const id = await this.ctx.storage.get("latestArticleId");
        return json({ id: id || ARTICLE_ID });
      }
      if (request.method === "PUT") {
        const data = await request.json();
        await this.ctx.storage.put("latestArticleId", data?.id || ARTICLE_ID);
        return json({ ok: true });
      }
    }

    if (url.pathname.startsWith("/seen-update/") && request.method === "POST") {
      const id = decodeURIComponent(url.pathname.slice("/seen-update/".length));
      const key = `seen-update:${id}`;
      const old = await this.ctx.storage.get(key);
      if (old) return json({ duplicate: true });
      await this.ctx.storage.put(key, Date.now());
      return json({ duplicate: false });
    }

    if (url.pathname === "/owner") {
      if (request.method === "GET") {
        const data = await this.ctx.storage.get("owner");
        return json(data || null);
      }
      if (request.method === "PUT") {
        const data = await request.json();
        await this.ctx.storage.put("owner", data);
        return json({ ok: true });
      }
    }

    if (url.pathname === "/linkedin") {
      if (request.method === "GET") {
        const data = await this.ctx.storage.get("linkedin");
        return json(data || null);
      }
      if (request.method === "PUT") {
        const data = await request.json();
        await this.ctx.storage.put("linkedin", data);
        return json({ ok: true });
      }
    }

    if (url.pathname === "/linkedin-state") {
      if (request.method === "GET") {
        const data = await this.ctx.storage.get("linkedin:state");
        return json(data || null);
      }
      if (request.method === "PUT") {
        const data = await request.json();
        await this.ctx.storage.put("linkedin:state", data);
        return json({ ok: true });
      }
      if (request.method === "DELETE") {
        await this.ctx.storage.delete("linkedin:state");
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
            "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
            "pragma": "no-cache",
            "expires": "0",
            "surrogate-control": "no-store"
          }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendLinkedInExpiryReminder(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const imageSource = "https://raw.githubusercontent.com/nasirovramin/nasiroff-content-bot/main.ru/assets/eyes.jpg";

    if (url.pathname === "/linkedin/connect") {
      if (!env.LINKEDIN_CLIENT_ID) {
        return new Response("LINKEDIN_CLIENT_ID hələ Worker-də əlavə edilməyib.", { status: 500 });
      }

      const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      await cmsPutLinkedInState(env, {
        state,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      const redirectUri = `${url.origin}/linkedin/callback`;
      const auth = new URL("https://www.linkedin.com/oauth/v2/authorization");
      auth.searchParams.set("response_type", "code");
      auth.searchParams.set("client_id", env.LINKEDIN_CLIENT_ID);
      auth.searchParams.set("redirect_uri", redirectUri);
      auth.searchParams.set("state", state);
      auth.searchParams.set("scope", "openid profile email w_member_social");

      return Response.redirect(auth.toString(), 302);
    }

    if (url.pathname === "/linkedin/callback") {
      const error = url.searchParams.get("error");
      if (error) {
        const desc = url.searchParams.get("error_description") || error;
        return new Response(`LinkedIn bağlantısı ləğv edildi və ya xəta baş verdi: ${desc}`, {
          status: 400,
          headers: { "content-type": "text/plain; charset=utf-8" }
        });
      }

      if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
        return new Response("LinkedIn Client ID və ya Client Secret Worker-də yoxdur.", { status: 500 });
      }

      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const savedState = await cmsGetLinkedInState(env);

      if (!code || !returnedState || !savedState?.state ||
          returnedState !== savedState.state ||
          Date.now() > Number(savedState.expiresAt || 0)) {
        await cmsDeleteLinkedInState(env);
        return new Response("LinkedIn OAuth state etibarsızdır və ya vaxtı bitib. Yenidən /linkedin/connect açın.", {
          status: 401,
          headers: { "content-type": "text/plain; charset=utf-8" }
        });
      }

      await cmsDeleteLinkedInState(env);

      const redirectUri = `${url.origin}/linkedin/callback`;
      const tokenBody = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: env.LINKEDIN_CLIENT_ID,
        client_secret: env.LINKEDIN_CLIENT_SECRET
      });

      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString()
      });
      const tokenData = await tokenRes.json().catch(() => ({}));

      if (!tokenRes.ok || !tokenData.access_token) {
        return new Response("LinkedIn access token almaq mümkün olmadı.", {
          status: 502,
          headers: { "content-type": "text/plain; charset=utf-8" }
        });
      }

      let profile = null;
      try {
        const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { authorization: `Bearer ${tokenData.access_token}` }
        });
        if (profileRes.ok) profile = await profileRes.json();
      } catch {}

      const expiresIn = Number(tokenData.expires_in || 0);
      const connected = {
        accessToken: tokenData.access_token,
        expiresIn,
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
        scope: tokenData.scope || "openid profile email w_member_social",
        profile: profile ? {
          sub: profile.sub || null,
          name: profile.name || null,
          givenName: profile.given_name || null,
          familyName: profile.family_name || null,
          email: profile.email || null,
          picture: profile.picture || null
        } : null,
        connectedAt: new Date().toISOString()
      };
      await cmsPutLinkedIn(env, connected);

      const displayName = connected.profile?.name || "LinkedIn hesabı";
      const html = `<!doctype html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LinkedIn qoşuldu</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;max-width:680px;margin:0 auto;padding:60px 22px;color:#171717}.ok{font-size:46px}h1{font-size:32px;margin:10px 0}p{font-size:17px;line-height:1.55;color:#444}</style>
</head><body><div class="ok">✅</div><h1>LinkedIn qoşuldu</h1><p><strong>${displayName}</strong> hesabı NASIROFF Content Bot-a uğurla bağlandı.</p><p>Bu pəncərəni bağlaya bilərsiniz.</p></body></html>`;
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    if (url.pathname === "/retry-linkedin-latest-6a2f91") {
      const latestArticleId = await cmsGetLatestArticleId(env);
      let article = await cmsGetArticle(env, latestArticleId);
      if (!article?.html) return json({ ok:false, error:"latest_article_missing" }, 404);
      if (article.linkedinPostId) {
        return json({ ok:true, skipped:"already_published", postId:article.linkedinPostId });
      }

      article = await repairBrokenArticleCover(env, article, latestArticleId, url.origin);

      const articleUrl = `${url.origin}/article/${encodeURIComponent(latestArticleId)}`;
      const linkedin = await linkedinCreateNativePostFromHtml(
        env,
        article.html,
        url.origin,
        articleUrl
      );

      const updated = { ...article, updatedAt:new Date().toISOString() };
      if (linkedin?.ok) {
        updated.linkedinPostId = linkedin.postId;
        updated.linkedinPublishedAt = new Date().toISOString();
        updated.linkedinLastSyncAt = new Date().toISOString();
        updated.linkedinLastError = null;
      } else {
        updated.linkedinLastError = [
          linkedin?.error || `HTTP ${linkedin?.status || "error"}`,
          linkedin?.detail || null,
          linkedin?.status ? `status=${linkedin.status}` : null
        ].filter(Boolean).join(" | ").slice(0, 1400);
      }
      await cmsPutArticle(env, updated, latestArticleId);

      return json({
        ok: !!linkedin?.ok,
        articleId: latestArticleId,
        linkedin
      }, linkedin?.ok ? 200 : 502);
    }

    if (url.pathname === "/debug/linkedin-latest-4c8e7a") {
      const li = await cmsGetLinkedIn(env);
      const latestArticleId = await cmsGetLatestArticleId(env);
      const article = await cmsGetArticle(env, latestArticleId);
      const media = article?.html ? linkedinMediaUrlsFromHtml(article.html, url.origin) : { images: [], videos: [] };
      let firstImageStatus = null;
      let firstImageType = null;
      if (media.images[0]) {
        try {
          const r = await fetch(media.images[0], { redirect: "follow" });
          firstImageStatus = r.status;
          firstImageType = r.headers.get("content-type") || null;
        } catch (e) {
          firstImageStatus = "fetch_error";
        }
      }
      return json({
        connected: !!li?.accessToken,
        usable: linkedinConnectionUsable(li),
        scope: li?.scope || null,
        expiresAt: li?.expiresAt || null,
        profileSubPresent: !!li?.profile?.sub,
        latestArticleId,
        title: article?.html ? (extractFirst(article.html, "h1") || null) : null,
        imageCount: media.images.length,
        imageUrls: media.images,
        firstImageStatus,
        firstImageType,
        videoCount: media.videos.length,
        linkedinPostId: article?.linkedinPostId || null,
        linkedinLastError: article?.linkedinLastError || null
      });
    }

    if (url.pathname === "/linkedin/status") {
      const li = await cmsGetLinkedIn(env);
      if (!li?.accessToken) return json({ connected: false });

      return json({
        connected: true,
        expiresAt: li.expiresAt || null,
        connectedAt: li.connectedAt || null,
        profile: li.profile || null,
        scope: li.scope || null
      });
    }

    if (url.pathname === "/privacy") {
      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy · NASIROFF Content Bot</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;max-width:760px;margin:0 auto;padding:48px 22px;color:#171717;line-height:1.65}
h1{font-size:36px;line-height:1.1;margin:0 0 12px}h2{margin-top:28px;font-size:20px}p{margin:0 0 14px;color:#333}
</style>
</head>
<body>
<h1>Privacy Policy</h1>
<p>Last updated: 30 September 2026</p>
<p>NASIROFF Content Bot is a personal content publishing tool used to prepare and publish content to connected services such as LinkedIn and Telegram.</p>
<h2>Information we process</h2>
<p>We may process basic account identifiers, authorization tokens, post text, links, images, videos, and publishing status that are necessary to provide the service.</p>
<h2>How information is used</h2>
<p>Information is used only to authenticate the connected account, prepare content, publish user-approved posts, and maintain the publishing workflow.</p>
<h2>Data sharing</h2>
<p>Information is shared only with the connected platforms when required to perform user-requested publishing actions. We do not sell personal information.</p>
<h2>Data retention</h2>
<p>Authorization and content data are retained only as long as needed for the publishing workflow or until access is revoked or the data is deleted.</p>
<h2>Security</h2>
<p>Access credentials and tokens are stored using restricted server-side configuration and are not intentionally exposed in public pages or client-side code.</p>
<h2>Your choices</h2>
<p>You may revoke LinkedIn or other connected-service access at any time from the relevant platform settings.</p>
<h2>Contact</h2>
<p>For privacy questions, contact the owner of NASIROFF Content Bot through the associated LinkedIn profile.</p>
</body>
</html>`;
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    if (url.pathname === "/version") {
      return new Response(BUILD_VERSION, {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    }

    if (url.pathname === "/health/gemini") {
      if (!env.GEMINI_CONTENT_API_KEY) {
        return json({ ok: false, configured: false, error: "missing_key" }, 503);
      }
      try {
        const model = env.GEMINI_MODEL || "gemini-3.8-flash";
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": env.GEMINI_CONTENT_API_KEY
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Cavab olaraq yalnız OK yaz." }] }],
              generationConfig: { temperature: 0 }
            })
          }
        );
        const data = await r.json().catch(()=>({}));
        return json({
          ok: r.ok,
          configured: true,
          model,
          status: r.status,
          response: r.ok
            ? (data?.candidates?.[0]?.content?.parts || []).map(p=>p?.text||"").join("").trim().slice(0,20)
            : null,
          error: r.ok ? null : (data?.error?.message || "gemini_error")
        }, r.ok ? 200 : 502);
      } catch (e) {
        return json({ ok: false, configured: true, error: String(e?.message || e).slice(0,180) }, 502);
      }
    }


    const apiArticleMatch = url.pathname.match(/^\/api\/article\/([^/]+)$/);
    if (apiArticleMatch) {
      const currentArticleId = decodeURIComponent(apiArticleMatch[1]);
      const userId = url.searchParams.get("u");
      const sig = url.searchParams.get("sig");
      if (!(await validEditSig(env, currentArticleId, userId, sig))) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }

      if (request.method === "GET") {
        const saved = await cmsGetArticle(env, currentArticleId);
        return json({ ok: true, article: saved });
      }

      if (request.method === "POST") {
        const body = await request.json();
        if (!body?.html || typeof body.html !== "string") {
          return json({ ok: false, error: "invalid_article" }, 400);
        }

        const old = await cmsGetArticle(env, currentArticleId) || {};
        const newMediaKeys = extractMediaKeys(body.html);
        const oldMediaKeys = Array.isArray(old.mediaKeys) ? old.mediaKeys : [];
        const removed = oldMediaKeys.filter(k => !newMediaKeys.includes(k));

        const record = {
          ...old,
          id: currentArticleId,
          slug: currentArticleId,
          html: body.html,
          mediaKeys: newMediaKeys,
          updatedAt: new Date().toISOString()
        };

        const saved = await cmsPutArticle(env, record, currentArticleId);
        if (!saved.ok) return json({ ok: false, error: "save_failed" }, 500);

        // Köhnə media faylları Save zamanı dərhal silinmir.
        // Bu, Edit -> Save -> təsdiq axınında şəkil linkinin qırılmasının qarşısını alır.

        const articleUrl = `${url.origin}/article/${encodeURIComponent(currentArticleId)}`;

        let testTelegram = null;
        const caption = telegramCaptionFromHtml(body.html, articleUrl);
        const cover = body.html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";
        const editSig = await makeEditSig(env, currentArticleId, userId);
        const editUrl = `${url.origin}/edit/${encodeURIComponent(currentArticleId)}?u=${encodeURIComponent(userId)}&sig=${editSig}`;
        const replyMarkup = {
          inline_keyboard: [
            [{ text: "✏️ Edit", url: editUrl }],
            [
              { text: "✅ Paylaş", callback_data: `publish:${currentArticleId}` },
              { text: "❌ Yox", callback_data: `reject:${currentArticleId}` }
            ]
          ]
        };

        if (old.testMessageId) {
          try {
            await tg(env.BOT_TOKEN, "deleteMessage", {
              chat_id: env.TEST_CHANNEL,
              message_id: old.testMessageId
            });
          } catch {}
        }

        if (cover) {
          testTelegram = await tgSendPhotoFromUrl(
            env.BOT_TOKEN,
            env.TEST_CHANNEL,
            new URL(cover, url.origin).href,
            caption,
            replyMarkup
          );
        } else {
          const testRes = await tg(env.BOT_TOKEN, "sendMessage", {
            chat_id: env.TEST_CHANNEL,
            text: caption,
            parse_mode: "HTML",
            disable_web_page_preview: false,
            reply_markup: replyMarkup
          });
          testTelegram = await testRes.json();
        }
        if (testTelegram.ok) {
          record.testMessageId = testTelegram.result.message_id;
          record.testMessageType = cover ? "media" : "text";
          record.approvalStatus = "pending";
          await cmsPutArticle(env, record, currentArticleId);
        }

        // Save yalnız redaktə edilmiş versiyanı test kanalına göndərir.
        // Əsas Telegram kanalı və LinkedIn yalnız son təsdiqdən sonra yenilənir.
        const telegram = null;
        const linkedin = null;

        return json({
          ok: true,
          article: record,
          testTelegram,
          telegram,
          linkedin,
          removedMedia: removed.length
        });
      }

      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api/media") {
      const userId = url.searchParams.get("u");
      const sig = url.searchParams.get("sig");
      const mediaArticleId = url.searchParams.get("a") || ARTICLE_ID;
      if (!(await validEditSig(env, mediaArticleId, userId, sig))) {
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
            "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
            "pragma": "no-cache",
            "expires": "0",
            "surrogate-control": "no-store"
          }
        });
      }

      const editMatch = url.pathname.match(/^\/edit\/([^/]+)$/);
      if (editMatch) {
        const currentArticleId = decodeURIComponent(editMatch[1]);
        const userId = url.searchParams.get("u");
        const sig = url.searchParams.get("sig");
        if (!(await validEditSig(env, currentArticleId, userId, sig))) {
          return new Response("Bu editor linki etibarsızdır.", { status: 401 });
        }

        const initialArticle = await cmsGetArticle(env, currentArticleId);
        const initialEditorHtml = initialArticle?.html || defaultArticleHtml();

        const articleUrl = `${url.origin}/article/${encodeURIComponent(currentArticleId)}`;
        const previewUrl = `${articleUrl}?preview=1&u=${encodeURIComponent(userId)}&sig=${encodeURIComponent(sig)}`;
        const apiUrl = `${url.origin}/api/article/${encodeURIComponent(currentArticleId)}?u=${encodeURIComponent(userId)}&sig=${encodeURIComponent(sig)}`;
        const mediaApiUrl = `${url.origin}/api/media?a=${encodeURIComponent(currentArticleId)}&u=${encodeURIComponent(userId)}&sig=${encodeURIComponent(sig)}`;

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
.toolbar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.97);backdrop-filter:blur(10px);border-bottom:1px solid #e3e3e3;padding:14px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.toolbar button,.toolbar .btn,.toolbar summary.icon-btn{height:58px;min-height:58px;border:1px solid #d3d3d3;background:#fff;color:#171717;border-radius:16px;padding:0 22px;font-size:16px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:background .15s ease,border-color .15s ease,transform .08s ease}
.toolbar button:hover,.toolbar .btn:hover,.toolbar summary.icon-btn:hover{background:#f7f7f7;border-color:#bdbdbd}
.toolbar button:active,.toolbar .btn:active,.toolbar summary.icon-btn:active{transform:translateY(1px)}
.toolbar .icon-btn{width:58px;min-width:58px;padding:0}
.toolbar .icon-btn svg{width:26px;height:26px;display:block;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.toolbar .link-holder .icon-btn svg{width:34px;height:34px;stroke-width:3.4}
.toolbar .format-btn{min-width:58px;padding:0 16px;font-size:24px}
.toolbar .italic-btn{font-family:Georgia,serif;font-style:italic;font-weight:700}
.toolbar a.btn{min-width:118px}
.has-tip{position:relative}.has-tip::after{content:attr(data-tip);position:absolute;left:50%;top:calc(100% + 8px);transform:translateX(-50%);background:#171717;color:#fff;font-size:12px;font-weight:500;line-height:1.35;padding:7px 9px;border-radius:7px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s ease;z-index:50}.has-tip:hover::after,.has-tip:focus-visible::after{opacity:1}
.toolbar button.primary{min-width:96px;background:#171717;color:#fff;border-color:#171717}.toolbar button.primary:hover{background:#222;border-color:#222}.toolbar button.primary.dirty{background:#9a9a9a;border-color:#9a9a9a;color:#fff}
.wrap{max-width:960px;margin:22px auto 60px;background:#fff;padding:34px 30px 70px;box-shadow:0 4px 26px rgba(0,0,0,.06)}
#editor{outline:none}
#editor h1{font-size:54px;line-height:1.03;margin:0 0 12px;font-weight:800;letter-spacing:-.035em}
#editor .meta{display:flex;align-items:center;gap:14px;font-size:16px;color:#747474;margin:0 0 34px}
#editor .meta:after{content:"";height:1px;background:#aaa;flex:1}
#editor h2{font-size:24px;line-height:1.22;margin:30px 0 10px;font-weight:600}
#editor p{font-size:18px;line-height:1.58;margin:0 0 16px}
#editor .lead{font-size:25px;line-height:1.23;font-weight:700;margin:0 0 28px}
#editor a{color:#0b57d0;text-decoration:underline;text-underline-offset:2px}
#editor img,#editor video{display:block;width:100%;height:auto;margin:22px 0 28px}.youtube-embed{position:relative;width:100%;aspect-ratio:16/9;margin:22px 0 28px}.youtube-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.media-wrap{position:relative;display:block;isolation:isolate}.media-wrap[contenteditable="false"]{user-select:none}
.media-wrap>img,.media-wrap>video{position:relative;z-index:1}
.media-actions{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,.16);opacity:0;pointer-events:none;transition:opacity .14s ease}
.media-wrap:hover>.media-actions,.media-wrap.active>.media-actions{opacity:1;pointer-events:auto}
.media-actions button{background:rgba(255,255,255,.78);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.68);border-radius:999px;padding:9px 14px;font-size:13px;font-weight:700;box-shadow:0 3px 14px rgba(0,0,0,.14)}
.media-actions button:hover{background:rgba(255,255,255,.94)}
.tip{max-width:960px;margin:18px auto 0;color:#666;font-size:13px;padding:0 4px}
.status{margin-left:auto;align-self:center;font-size:13px;font-weight:700;color:#666;white-space:nowrap}.status.success{color:#0f5b32}.status.error{color:#7d1d1d}.status.neutral{color:#666}
.emoji-holder,.link-holder{position:relative;display:inline-flex}.emoji-holder>summary,.link-holder>summary{list-style:none;cursor:pointer;user-select:none}.emoji-holder>summary::-webkit-details-marker,.link-holder>summary::-webkit-details-marker{display:none}
.emoji-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:80;width:290px;max-height:250px;overflow:auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:10px;box-shadow:0 12px 35px rgba(0,0,0,.16);display:none;grid-template-columns:repeat(7,1fr);gap:5px}
.emoji-holder[open]>.emoji-panel{display:grid}
.emoji-panel button{border:0;background:transparent;padding:6px;font-size:21px;border-radius:7px}
.emoji-panel button:hover{background:#f1f1f1}
.link-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:85;display:none;gap:6px;align-items:center;background:#fff;border:1px solid #ddd;border-radius:10px;padding:8px;box-shadow:0 12px 35px rgba(0,0,0,.16)}
.link-holder[open]>.link-panel{display:flex}
.link-panel input{width:240px;max-width:55vw;border:1px solid #ccc;border-radius:7px;padding:8px;font:inherit}
.link-panel button{padding:8px 10px}
@media(max-width:900px){
  .toolbar{padding:10px 12px;gap:7px}
  .toolbar button,.toolbar .btn,.toolbar summary.icon-btn{height:50px;min-height:50px;border-radius:13px;padding:0 15px;font-size:14px}
  .toolbar .icon-btn{width:50px;min-width:50px;padding:0}
  .toolbar .format-btn{min-width:50px;font-size:20px}
  .toolbar a.btn{min-width:96px}
  .toolbar button.primary{min-width:82px}
}
@media(max-width:640px){
  .wrap{margin:0;background:#fff;box-shadow:none;padding:22px 18px 48px}
  #editor h1{font-size:36px}
  #editor h2{font-size:21px}
  #editor p{font-size:16px}
  #editor .lead{font-size:19px}
  .status{margin-left:auto;width:auto}
}
</style>
</head>
<body>
<div class="toolbar">
  <button class="format-btn has-tip" type="button" title="Bold" data-tip="Bold" onmousedown="remember();event.preventDefault()" onclick="fmt('bold')"><b>B</b></button>
  <button class="format-btn italic-btn has-tip" type="button" title="Italic" data-tip="Italic" onmousedown="remember();event.preventDefault()" onclick="fmt('italic')">I</button>

  <details class="link-holder" id="linkDetails">
    <summary class="icon-btn has-tip" title="Link əlavə et / sil" data-tip="Link əlavə et / sil" onmousedown="remember()" onclick="return handleLinkSummary(event)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 14.8 6.8 17.2a4.2 4.2 0 0 1-5.9-5.9l4.3-4.3a4.2 4.2 0 0 1 5.9 0"></path><path d="M14.8 9.2l2.4-2.4a4.2 4.2 0 1 1 5.9 5.9l-4.3 4.3a4.2 4.2 0 0 1-5.9 0"></path><path d="M8.5 15.5l7-7"></path></svg>
    </summary>
    <span class="link-panel">
      <input id="linkInput" type="url" placeholder="https://..." autocomplete="off">
      <button type="button" onclick="applyLink()">OK</button>
    </span>
  </details>

  <button type="button" onmousedown="remember();event.preventDefault()" onclick="fmt('formatBlock','h2')">H2</button>
  <button type="button" onmousedown="remember();event.preventDefault()" onclick="fmt('formatBlock','p')">Text</button>

  <button class="icon-btn has-tip" type="button" title="Şəkil əlavə et · avtomatik 1200 × 628 px" data-tip="Şəkil · avtomatik 1200 × 628 px" onclick="document.getElementById('imageInput').click()"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="16.5" cy="9" r="1.5"></circle><path d="M4 17l5-5 4 4 3-3 4 4"></path></svg></button>
  <button class="icon-btn has-tip" type="button" title="Video/GIF əlavə et" data-tip="Video/GIF əlavə et" onclick="document.getElementById('videoInput').click()"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path><path d="M7 6l3 4"></path><path d="M12 6l3 4"></path><path d="M10 13.2l5 3-5 3z" fill="currentColor" stroke="none"></path></svg></button>

  <input id="imageInput" type="file" accept="image/*" hidden>
  <input id="videoInput" type="file" accept="video/*,image/gif" hidden>
  <input id="imageReplaceInput" type="file" accept="image/*" hidden>
  <input id="videoReplaceInput" type="file" accept="video/*,image/gif" hidden>

  <details class="emoji-holder" id="emojiDetails">
    <summary class="icon-btn has-tip" title="Emoji əlavə et" data-tip="Emoji əlavə et" onmousedown="remember()"><span style="font-size:22px;line-height:1">☺</span></summary>
    <span class="emoji-panel"><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😀')">😀</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😃')">😃</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😄')">😄</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😁')">😁</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😊')">😊</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🙂')">🙂</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😉')">😉</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😍')">😍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🥰')">🥰</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😘')">😘</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😎')">😎</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤓')">🤓</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤩')">🤩</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🥳')">🥳</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😂')">😂</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤣')">🤣</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🥲')">🥲</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😅')">😅</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😇')">😇</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤔')">🤔</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🧐')">🧐</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😮')">😮</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😲')">😲</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😢')">😢</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😭')">😭</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('😡')">😡</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤯')">🤯</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👍')">👍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👎')">👎</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👏')">👏</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🙌')">🙌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👌')">👌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✌️')">✌️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤝')">🤝</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🙏')">🙏</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💪')">💪</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👀')">👀</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('👁️')">👁️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('❤️')">❤️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🖤')">🖤</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🤍')">🤍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💛')">💛</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💚')">💚</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💙')">💙</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💜')">💜</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🔥')">🔥</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✨')">✨</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('⭐')">⭐</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💡')">💡</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎯')">🎯</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🚀')">🚀</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✅')">✅</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('❌')">❌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('⚡')">⚡</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎨')">🎨</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('✏️')">✏️</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📌')">📌</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📍')">📍</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📎')">📎</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🔗')">🔗</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📷')">📷</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎬')">🎬</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💻')">💻</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('📱')">📱</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🏆')">🏆</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🎉')">🎉</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('💬')">💬</button><button type="button" onmousedown="event.preventDefault()" onclick="insertEmoji('🧠')">🧠</button></span>
  </details>

  <a class="btn" href="${previewUrl}" target="_blank">Preview</a>
  <button class="primary" id="saveBtn" type="button" onclick="saveDraft()">Save</button>
  <span id="status" class="status">Edit rejimi</span>
</div>
<div class="tip">Mətndə istədiyin yerə kursoru qoy, sonra şəkil/video düyməsini bas. Media həmin nöqtəyə əlavə olunacaq.</div>
<div class="wrap">
  <article id="editor" contenteditable="true">${initialEditorHtml}</article>
</div>
<script>
let savedRange=null;
const API_URL=${JSON.stringify(apiUrl)};
const MEDIA_API_URL=${JSON.stringify(mediaApiUrl)};
const editor=document.getElementById('editor');
const statusEl=document.getElementById('status');
const saveBtn=document.getElementById('saveBtn');
let isDirty=false;

window.addEventListener('pageshow',e=>{
  if(e.persisted){
    window.location.reload();
  }
});

function setStatus(message,type='neutral'){
  statusEl.textContent=message;
  statusEl.classList.remove('success','error','neutral');
  statusEl.classList.add(type);
}

function markDirty(){
  isDirty=true;
  saveBtn.classList.add('dirty');
  saveBtn.title='Dəyişikliklər yadda saxlanmayıb';
}

function markSaved(){
  isDirty=false;
  saveBtn.classList.remove('dirty');
  saveBtn.title='Bütün dəyişikliklər yadda saxlanılıb';
}

editor.addEventListener('keyup',remember);
editor.addEventListener('mouseup',remember);
editor.addEventListener('touchend',remember);
editor.addEventListener('input',markDirty);
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
  markDirty();
}

function restoreSelection(){
  if(!savedRange) return false;
  const s=window.getSelection();
  s.removeAllRanges();
  s.addRange(savedRange);
  return true;
}

function getSelectedLink(){
  const s=window.getSelection();
  if(!s || !s.rangeCount) return null;
  let node=s.getRangeAt(0).commonAncestorContainer;
  if(node.nodeType!==1) node=node.parentElement;
  return node && node.closest ? node.closest('a') : null;
}

function handleLinkSummary(e){
  const link=getSelectedLink();
  if(!link) return true;
  e.preventDefault();
  const parent=link.parentNode;
  while(link.firstChild) parent.insertBefore(link.firstChild,link);
  parent.removeChild(link);
  markDirty();
  setStatus('Link textdən çıxarıldı. Save edin.','success');
  return false;
}

function applyLink(){
  const input=document.getElementById('linkInput');
  let href=(input.value||'').trim();
  if(!href){
    setStatus('Linki yazın.','error');
    return;
  }
  if(!savedRange || savedRange.collapsed){
    setStatus('Əvvəl link veriləcək texti seçin.','error');
    return;
  }
  const lowerHref=href.toLowerCase();
  if(!lowerHref.startsWith('http://') && !lowerHref.startsWith('https://') && !lowerHref.startsWith('mailto:')) href='https://'+href;

  editor.focus();
  restoreSelection();

  const sel=window.getSelection();
  if(!sel.rangeCount) return;
  const range=sel.getRangeAt(0);
  const a=document.createElement('a');
  a.href=href;
  a.removeAttribute('target');
  a.removeAttribute('rel');
  try{
    range.surroundContents(a);
  }catch(err){
    document.execCommand('createLink',false,href);
    const current=window.getSelection()?.anchorNode?.parentElement?.closest('a');
    if(current){
      current.removeAttribute('target');
      current.removeAttribute('rel');
    }
  }

  document.getElementById('linkDetails').open=false;
  input.value='';
  remember();
  markDirty();
  setStatus('Link əlavə edildi. Save edin.','success');
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
  markDirty();
  setStatus('Emoji əlavə edildi. Save edin.','success');
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
  markDirty();
  setStatus('YouTube player əlavə edildi. Save edin.','success');
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
    markDirty();
    setStatus('Media silindi. Save basın.','success');
  };

  actions.appendChild(replace);
  actions.appendChild(rm);
  wrap.appendChild(actions);
}

function enhanceMedia(){
  editor.querySelectorAll('img,video').forEach(mediaWrap);
}

editor.addEventListener('pointerup',e=>{
  const wrap=e.target.closest('.media-wrap');
  editor.querySelectorAll('.media-wrap.active').forEach(x=>{ if(x!==wrap) x.classList.remove('active'); });
  if(wrap && !e.target.closest('.media-actions')) wrap.classList.toggle('active');
});


editor.addEventListener('click',e=>{
  const media=e.target.closest('.media-wrap');
  editor.querySelectorAll('.media-wrap.active').forEach(x=>{
    if(x!==media) x.classList.remove('active');
  });
  if(media && !e.target.closest('.media-actions')) media.classList.toggle('active');
});

async function normalizeImageFile(file){
  if(!file || !file.type.startsWith('image/') || file.type==='image/gif') return file;

  const TARGET_W=1200, TARGET_H=628;
  const bitmap=await createImageBitmap(file);
  const canvas=document.createElement('canvas');
  canvas.width=TARGET_W;
  canvas.height=TARGET_H;
  const ctx=canvas.getContext('2d');

  const scale=Math.max(TARGET_W/bitmap.width,TARGET_H/bitmap.height);
  const sw=TARGET_W/scale;
  const sh=TARGET_H/scale;
  const sx=Math.max(0,(bitmap.width-sw)/2);
  const sy=Math.max(0,(bitmap.height-sh)/2);
  ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,TARGET_W,TARGET_H);
  if(bitmap.close) bitmap.close();

  let quality=.86;
  let blob=await new Promise(r=>canvas.toBlob(r,'image/webp',quality));
  while(blob && blob.size>350*1024 && quality>.56){
    quality-=.08;
    blob=await new Promise(r=>canvas.toBlob(r,'image/webp',quality));
  }
  if(!blob) throw new Error('image_compress_failed');
  const base=(file.name||'image').replace(/\.[^.]+$/,'');
  return new File([blob],base+'.webp',{type:'image/webp',lastModified:Date.now()});
}

async function addFile(file,type){
  setStatus('Media yüklənir...','neutral');
  try{
    if(type==='image') file=await normalizeImageFile(file);
  }catch(e){
    setStatus('Şəkli optimallaşdırmaq alınmadı.','error');
    return;
  }
  const fd=new FormData();
  fd.append('file',file,file.name);
  const r=await fetch(MEDIA_API_URL,{method:'POST',body:fd});
  const data=await r.json().catch(()=>({}));

  if(!r.ok||!data.ok){
    setStatus(data.error==='file_too_large' ? 'Fayl 20 MB-dan böyükdür.' : 'Media yüklənmədi.','error');
    return;
  }

  const el=document.createElement(type==='video'?'video':'img');
  el.src=data.url;
  el.dataset.mediaKey=data.key;
  if(type==='video'){el.controls=true;el.playsInline=true}
  insertNode(el);
  mediaWrap(el);
  markDirty();
  setStatus('Şəkil uğurla əlavə edildi. Save edin.','success');
}

async function replaceExistingMedia(file,target){
  if(!target) return;
  setStatus('Yeni media yüklənir...','neutral');
  try{
    if(file.type.startsWith('image/') && file.type!=='image/gif') file=await normalizeImageFile(file);
  }catch(e){
    setStatus('Şəkli optimallaşdırmaq alınmadı.','error');
    return;
  }
  const fd=new FormData();
  fd.append('file',file,file.name);
  const r=await fetch(MEDIA_API_URL,{method:'POST',body:fd});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.ok){
    setStatus(data.error==='file_too_large' ? 'Fayl 20 MB-dan böyükdür.' : 'Media dəyişdirilmədi.','error');
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
  markDirty();
  setStatus('Media dəyişdirildi. Save basın.','success');
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
  setStatus('Yadda saxlanılır...','neutral');
  saveBtn.disabled=true;
  saveBtn.style.opacity='.72';
  const r=await fetch(API_URL,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({id:'dord-baxis',html:cleanEditorHtml()})
  });
  const data=await r.json().catch(()=>({}));

  if(!r.ok||!data.ok){
    setStatus('Yadda saxlamaq alınmadı.','error');
    saveBtn.disabled=false;
    saveBtn.style.opacity='';
    markDirty();
    return;
  }

  markSaved();
  saveBtn.disabled=false;
  saveBtn.style.opacity='';

  if(data.testTelegram && data.testTelegram.ok===false){
    setStatus('Məqalə yadda saxlanıldı, amma şəkilli test postu göndərilmədi.','error');
  }else if(data.testTelegram && data.testTelegram.ok){
    setStatus('Yadda saxlanıldı və test kanalına göndərildi ✅','success');
  }else{
    setStatus('Məqalə yadda saxlanıldı, test cavabı alınmadı.','error');
  }

  setTimeout(()=>{
    window.close();
    setTimeout(()=>{
      if(document.visibilityState==='visible'){
        window.location.replace(window.location.href);
      }
    },300);
  },350);
}

enhanceMedia();
markSaved();
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

      const publicArticleMatch = url.pathname.match(/^\/article\/([^/]+)$/);
      if (publicArticleMatch) {
        const currentArticleId = decodeURIComponent(publicArticleMatch[1]);
        const savedArticle = await cmsGetArticle(env, currentArticleId);
        if (!savedArticle && currentArticleId !== ARTICLE_ID) {
          return new Response("Məqalə tapılmadı.", { status: 404 });
        }
        const bodyHtml = savedArticle?.html || defaultArticleHtml();

        let backHref = "https://t.me/nasiroff_az";
        let backLabel = "← Geri qayıt";
        if (url.searchParams.get("preview") === "1") {
          const previewUserId = url.searchParams.get("u");
          const previewSig = url.searchParams.get("sig");
          if (await validEditSig(env, currentArticleId, previewUserId, previewSig)) {
            backHref = `${url.origin}/edit/${encodeURIComponent(currentArticleId)}?u=${encodeURIComponent(previewUserId)}&sig=${encodeURIComponent(previewSig)}`;
            backLabel = "← Edit rejiminə qayıt";
          }
        }
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
main a:not(.back){color:#0b57d0;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
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
<a class="back" href="${backHref}">${backLabel}</a>
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

  
    if (url.pathname === "/resend-latest-test-7f4c91") {
      const latestArticleId = await cmsGetLatestArticleId(env);
      const article = await cmsGetArticle(env, latestArticleId);
      if (!article?.html) return json({ ok: false, error: "latest_article_missing" }, 404);

      const ownerId = article.ownerTelegramId || await cmsGetOwnerTelegramId(env);
      if (!ownerId) return json({ ok: false, error: "owner_missing" }, 400);

      const articleUrl = `${url.origin}/article/${encodeURIComponent(latestArticleId)}`;
      const caption = telegramCaptionFromHtml(article.html, articleUrl);
      const cover = article.html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";
      const editSig = await makeEditSig(env, latestArticleId, ownerId);
      const editUrl = `${url.origin}/edit/${encodeURIComponent(latestArticleId)}?u=${encodeURIComponent(ownerId)}&sig=${editSig}`;
      const replyMarkup = {
        inline_keyboard: [
          [{ text: "✏️ Edit", url: editUrl }],
          [
            { text: "✅ Paylaş", callback_data: `publish:${latestArticleId}` },
            { text: "❌ Yox", callback_data: `reject:${latestArticleId}` }
          ]
        ]
      };

      if (article.testMessageId) {
        try {
          await tg(env.BOT_TOKEN, "deleteMessage", {
            chat_id: env.TEST_CHANNEL,
            message_id: article.testMessageId
          });
        } catch {}
      }

      let data;
      if (cover) {
        data = await tgSendPhotoFromUrl(
          env.BOT_TOKEN,
          env.TEST_CHANNEL,
          new URL(cover, url.origin).href,
          caption,
          replyMarkup
        );
      } else {
        const sent = await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: env.TEST_CHANNEL,
          text: caption,
          parse_mode: "HTML",
          disable_web_page_preview: false,
          reply_markup: replyMarkup
        });
        data = await sent.json();
      }
      if (!data.ok) return json({ ok: false, telegram: data }, 502);

      await cmsPutArticle(env, {
        ...article,
        testMessageId: data.result.message_id,
        testMessageType: cover ? "media" : "text",
        approvalStatus: "pending",
        updatedAt: new Date().toISOString()
      }, latestArticleId);

      return json({
        ok: true,
        articleId: latestArticleId,
        messageId: data.result.message_id,
        testChannel: env.TEST_CHANNEL,
        telegram: data
      });
    }

    if (url.pathname === "/publish-latest-telegram-7f4c91") {
      const latestArticleId = await cmsGetLatestArticleId(env);
      const article = await cmsGetArticle(env, latestArticleId);
      if (!article?.html) return json({ ok: false, error: "latest_article_missing" }, 404);

      const articleUrl = `${url.origin}/article/${encodeURIComponent(latestArticleId)}`;
      const caption = telegramCaptionFromHtml(article.html, articleUrl);
      const cover = article.html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";

      let sent;
      if (cover) {
        sent = await tg(env.BOT_TOKEN, "sendPhoto", {
          chat_id: env.MAIN_CHANNEL,
          photo: new URL(cover, url.origin).href,
          caption,
          parse_mode: "HTML"
        });
      } else {
        sent = await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: env.MAIN_CHANNEL,
          text: caption,
          parse_mode: "HTML",
          disable_web_page_preview: false
        });
      }

      const data = await sent.json();
      if (!data.ok) return json({ ok: false, telegram: data }, 502);

      await cmsPutArticle(env, {
        ...article,
        mainMessageId: data.result.message_id,
        mainMessageType: cover ? "media" : "text",
        publishedAt: article.publishedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, latestArticleId);

      return json({
        ok: true,
        articleId: latestArticleId,
        messageId: data.result.message_id,
        mainChannel: env.MAIN_CHANNEL
      });
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

    if (update.update_id !== undefined) {
      const seen = await cmsStub(env).fetch(`https://cms.internal/seen-update/${encodeURIComponent(String(update.update_id))}`, { method: "POST" });
      const seenData = await seen.json().catch(()=>({}));
      if (seenData.duplicate) return new Response("ok");
    }

    if (update.message?.chat?.type === "private" && update.message?.from?.id) {
      await rememberOwnerTelegramId(env, update.message.from.id);
    }

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
          text: "Mənə sadəcə məqalə və ya Telegram post linkini göndər. Mətni Azərbaycan dilinə tərcümə edib draft hazırlayacağam və test kanalına Edit / Paylaş / Yox düymələri ilə göndərəcəyəm. Son draftı açmaq üçün /edit yaz."
        });
        return new Response("ok");
      }

      if (text === "/edit") {
        const userId = update.message.from.id;
        const latestArticleId = await cmsGetLatestArticleId(env);
        const sig = await makeEditSig(env, latestArticleId, userId);
        const editUrl = `${url.origin}/edit/${encodeURIComponent(latestArticleId)}?u=${encodeURIComponent(userId)}&sig=${sig}`;
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: update.message.chat.id,
          text: "Məqaləni açıb birbaşa səhifənin üzərində redaktə edə bilərsiniz.",
          reply_markup: {
            inline_keyboard: [[{ text: "✏️ Edit", url: editUrl }]]
          }
        });
        return new Response("ok");
      }

      const sourceUrl = firstHttpUrl(text);
      if (sourceUrl) {
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: update.message.chat.id,
          text: "Tərcümə edirəm və draft hazırlayıram…"
        });

        try {
          const record = await createSourceDraft(
            env,
            url.origin,
            sourceUrl,
            update.message.from.id
          );

          await cmsPutArticle(env, record, record.id);
          await cmsPutLatestArticleId(env, record.id);

          const articleId = record.id;
          const sig = await makeEditSig(env, articleId, update.message.from.id);
          const editUrl = `${url.origin}/edit/${encodeURIComponent(articleId)}?u=${encodeURIComponent(update.message.from.id)}&sig=${sig}`;
          const articleUrl = `${url.origin}/article/${encodeURIComponent(articleId)}`;
          const caption = telegramCaptionFromHtml(record.html, articleUrl);
          const cover = record.html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";

          const replyMarkup = {
            inline_keyboard: [
              [{ text: "✏️ Edit", url: editUrl }],
              [
                { text: "✅ Paylaş", callback_data: `publish:${articleId}` },
                { text: "❌ Yox", callback_data: `reject:${articleId}` }
              ]
            ]
          };

          let postedData;
          if (cover) {
            postedData = await tgSendPhotoFromUrl(
              env.BOT_TOKEN,
              env.TEST_CHANNEL,
              new URL(cover, url.origin).href,
              caption,
              replyMarkup
            );
          } else {
            const posted = await tg(env.BOT_TOKEN, "sendMessage", {
              chat_id: env.TEST_CHANNEL,
              text: caption,
              parse_mode: "HTML",
              disable_web_page_preview: false,
              reply_markup: replyMarkup
            });
            postedData = await posted.json();
          }

          if (!postedData.ok) {
            throw new Error(
              `test_send_failed: ${postedData.description || postedData.error || "unknown"}`
            );
          }

          record.testMessageId = postedData.result.message_id;
          record.testMessageType = cover ? "media" : "text";
          record.approvalStatus = "pending";
          await cmsPutArticle(env, record, articleId);

          await tg(env.BOT_TOKEN, "sendMessage", {
            chat_id: update.message.chat.id,
            text: "Tərcümə hazırdır ✅ Test kanalına göndərdim."
          });
        } catch (e) {
          const missingKey = String(e?.message || "").includes("GEMINI_CONTENT_API_KEY_missing");
          await tg(env.BOT_TOKEN, "sendMessage", {
            chat_id: update.message.chat.id,
            text: missingKey
              ? "Bu bot üçün ayrıca Gemini API açarı yoxdur. GEMINI_CONTENT_API_KEY Secret əlavə edilməlidir."
              : `Tərcümə etmək alınmadı: ${String(e?.message || e).slice(0, 300)}`
          });
        }
        return new Response("ok");
      }

      await tg(env.BOT_TOKEN, "sendMessage", {
        chat_id: update.message.chat.id,
        text: "Mənə yalnız link göndər. Linkdəki məzmunu tərcümə edib test kanalına hazırlayacağam."
      });
      return new Response("ok");
    }

    if (update.callback_query) {
      const q = update.callback_query;
      const msg = q.message;

      const publishMatch = String(q.data || "").match(/^publish(?::(.+))?$/);
      if (publishMatch) {
        const publishArticleId = publishMatch[1] || ARTICLE_ID;
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
          let existing = await cmsGetArticle(env, publishArticleId) || {};
          existing = await repairBrokenArticleCover(env, existing, publishArticleId, url.origin);
          const articleHtml = existing.html || defaultArticleHtml();
          const articleUrl = `${url.origin}/article/${encodeURIComponent(publishArticleId)}`;

          let linkedin = null;
          if (!existing.linkedinPostId) {
            linkedin = await linkedinCreateNativePostFromHtml(
              env,
              articleHtml,
              url.origin,
              articleUrl
            );
          }

          const record = {
            ...existing,
            id: publishArticleId,
            slug: publishArticleId,
            html: articleHtml,
            mediaKeys: existing.mediaKeys || [],
            mainMessageId: publishedMessageId,
            mainMessageType: msg.photo?.length ? "media" : "text",
            publishedAt: existing.publishedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (linkedin?.ok) {
            record.linkedinPostId = linkedin.postId;
            record.linkedinPublishedAt = new Date().toISOString();
            record.linkedinLastSyncAt = new Date().toISOString();
            record.linkedinLastError = null;
          } else if (linkedin && !linkedin.ok) {
            record.linkedinLastError = [
              linkedin.error || `HTTP ${linkedin.status || "error"}`,
              linkedin.detail || null,
              linkedin.status ? `status=${linkedin.status}` : null
            ].filter(Boolean).join(" | ").slice(0, 1400);
          }

          await cmsPutArticle(env, record, publishArticleId);

          await tg(env.BOT_TOKEN, "copyMessage", {
            chat_id: q.from.id,
            from_chat_id: env.MAIN_CHANNEL,
            message_id: publishedMessageId
          });

          const editSig = await makeEditSig(env, publishArticleId, q.from.id);
          const editUrl = `${url.origin}/edit/${encodeURIComponent(publishArticleId)}?u=${encodeURIComponent(q.from.id)}&sig=${editSig}`;

          const linkedinLine = existing.linkedinPostId
            ? "LinkedIn: əvvəlki post saxlanıldı."
            : linkedin?.ok
              ? "LinkedIn: paylaşıldı ✅"
              : `LinkedIn: paylaşılmadı ⚠️\nSəbəb: ${(record.linkedinLastError || "naməlum xəta").slice(0, 320)}`;

          await tg(env.BOT_TOKEN, "sendMessage", {
            chat_id: q.from.id,
            text: `✅ Telegram-da paylaşıldı.\n${linkedinLine}\nPost ID: ${publishedMessageId}`,
            reply_markup: {
              inline_keyboard: [[{ text: "✏️ Edit", url: editUrl }]]
            }
          });
        }

        return new Response("ok");
      }

      const deleteMatch = String(q.data || "").match(/^delete:(.+)$/);
      if (deleteMatch) {
        const deleteArticleId = deleteMatch[1];
        const article = await cmsGetArticle(env, deleteArticleId);

        if (article?.mediaKeys?.length) {
          for (const key of article.mediaKeys) {
            try { await cmsDeleteMedia(env, key); } catch {}
          }
        }
        await cmsDeleteArticle(env, deleteArticleId);

        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Draft silindi 🗑"
        });
        const deleted = await tg(env.BOT_TOKEN, "deleteMessage", {
          chat_id: msg.chat.id,
          message_id: msg.message_id
        });
        const deletedData = await deleted.json().catch(()=>({}));
        if (!deletedData.ok) {
          await tg(env.BOT_TOKEN, "editMessageReplyMarkup", {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: { inline_keyboard: [] }
          });
        }
        return new Response("ok");
      }

      const rejectMatch = String(q.data || "").match(/^reject(?::(.+))?$/);
      if (rejectMatch) {
        const rejectedArticleId = rejectMatch[1] || ARTICLE_ID;
        const existing = await cmsGetArticle(env, rejectedArticleId);
        if (existing) {
          await cmsPutArticle(env, {
            ...existing,
            approvalStatus: "rejected",
            updatedAt: new Date().toISOString()
          }, rejectedArticleId);
        }

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
