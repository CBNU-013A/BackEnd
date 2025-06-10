// utils/cosine.js
function cosineSimilarity(v1, v2) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (const k in v1) {
    const a = v1[k] || 0,
      b = v2[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  return !normA || !normB ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { cosineSimilarity };
