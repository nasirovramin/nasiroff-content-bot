const tg = (token, method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response("nasiroff_content_bot is running");
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const update = await request.json();

    // 1) Ramin sends a prepared post to the bot in private.
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

      if (!data.ok) {
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: update.message.chat.id,
          text: "Test kanalına göndərmək alınmadı. Kanal ID/username və admin icazələrini yoxla.",
        });
      } else {
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: update.message.chat.id,
          text: "Test kanalına göndərildi.",
        });
      }

      return new Response("ok");
    }

    // 2) Approval button in test channel.
    if (update.callback_query) {
      const q = update.callback_query;
      const msg = q.message;

      if (q.data === "publish") {
        await tg(env.BOT_TOKEN, "sendMessage", {
          chat_id: env.MAIN_CHANNEL,
          text: msg.text || msg.caption || "",
          parse_mode: "HTML",
          disable_web_page_preview: false,
        });

        await tg(env.BOT_TOKEN, "answerCallbackQuery", {
          callback_query_id: q.id,
          text: "Əsas kanalda paylaşıldı ✅",
        });

        await tg(env.BOT_TOKEN, "editMessageReplyMarkup", {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
          reply_markup: { inline_keyboard: [] },
        });
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
