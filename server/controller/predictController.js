// CommonJS 스타일 (app.js와 동일하게 맞춤)
// Node 18+면 fetch 내장. 18 미만이면 node-fetch 설치해서 사용하세요.
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);
const UPSTREAM_URL =
  process.env.UPSTREAM_URL || "http://hsyoon14.iptime.org:14600/api/v1/predict";
const NLP_API_KEY = process.env.NLP_API_KEY || "test"; // 헤더 nlp-api-key

module.exports.postPredict = async (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "field 'text' (string) is required" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamRes = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "nlp-api-key": NLP_API_KEY, // ← 요구한 헤더
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }), // ← 프론트에서 받은 text 그대로 전달
      signal: controller.signal,
    });

    const status = upstreamRes.status;
    const ct = upstreamRes.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      const data = await upstreamRes.json();
      return res.status(status).json(data); // 응답 JSON 그대로 전달
    } else {
      const bodyText = await upstreamRes.text();
      return res
        .status(status)
        .type(ct || "text/plain")
        .send(bodyText);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Upstream request timed out" });
    }
    console.error("[predict proxy error]", err);
    return res
      .status(502)
      .json({ error: "Bad gateway", detail: String(err?.message || err) });
  } finally {
    clearTimeout(timer);
  }
};
