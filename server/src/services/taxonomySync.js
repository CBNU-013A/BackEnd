const axios = require("axios");
const Category = require("../models/Category");
const PreferenceTag = require("../models/PreferenceTag");
const SentimentAspect = require("../models/SentimentAspect");

function createClient() {
  const baseURL = process.env.NLP_BASE_URL || process.env.SENTIMENT_API_URL || "";
  const apiKey = process.env.NLP_API_KEY || process.env.SENTIMENT_API_KEY || "";
  const instance = axios.create({
    baseURL,
    headers: {
      "nlp-api-key": apiKey,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
  return instance;
}

async function fetchTaxonomyFromPikNLP() {
  const client = createClient();
  const endpoint = process.env.NLP_CATEGORIES_ENDPOINT || "/api/v1/categories";
  const res = await client.get(endpoint);
  const data = res?.data || {};
  const sentimentModel = Array.isArray(data.sentiment_model) ? data.sentiment_model : [];
  const categoryMap = data.category_map && typeof data.category_map === "object" ? data.category_map : {};
  return { sentimentModel, categoryMap };
}

async function syncCategories(categories) {
  let upserts = 0;
  for (const item of categories) {
    const name = item?.name || item?.label;
    if (!name) continue;
    await Category.updateOne(
      { name },
      { $setOnInsert: { name, isActive: true } },
      { upsert: true }
    );
    upserts++;
  }
  return upserts;
}

async function syncPreferenceTags(tags) {
  // 카테고리 이름 → _id 캐시
  const allCats = await Category.find().select("_id name").lean();
  const nameToId = new Map(allCats.map((c) => [c.name, c._id]));

  let upserts = 0;
  for (const item of tags) {
    const name = item?.name || item?.label;
    if (!name) continue;
    let categoryId = null;
    const categoryName = item?.category?.name || item?.category || item?.categoryName;
    if (categoryName && nameToId.has(categoryName)) {
      categoryId = nameToId.get(categoryName);
    }
    if (!categoryId && categoryName) {
      const catDoc = await Category.findOneAndUpdate(
        { name: categoryName },
        { $setOnInsert: { name: categoryName } },
        { new: true, upsert: true }
      ).lean();
      categoryId = catDoc?._id || null;
      if (categoryId) nameToId.set(categoryName, categoryId);
    }

    await PreferenceTag.updateOne(
      { name },
      { $setOnInsert: { name, category: categoryId } },
      { upsert: true }
    );
    upserts++;
  }
  return upserts;
}

async function syncSentimentAspects(aspects) {
  let upserts = 0;
  for (const item of aspects) {
    const name = item?.name || item?.label;
    if (!name) continue;
    await SentimentAspect.updateOne(
      { name },
      { $setOnInsert: { name, isActive: true } },
      { upsert: true }
    );
    upserts++;
  }
  return upserts;
}

async function syncAllTaxonomy() {
  const { sentimentModel, categoryMap } = await fetchTaxonomyFromPikNLP();

  // 1) SentimentAspect 업서트 (sentiment_model 배열)
  const aspectCount = await syncSentimentAspects(sentimentModel.map((name) => ({ name })));

  // 2) Category 업서트 (category_map의 키)
  const categoryNames = Object.keys(categoryMap || {});
  const catCount = await syncCategories(categoryNames.map((name) => ({ name })));

  // 3) PreferenceTag 업서트 (각 카테고리 키의 값 배열이 태그)
  const tags = [];
  for (const categoryName of categoryNames) {
    const tagNames = Array.isArray(categoryMap[categoryName]) ? categoryMap[categoryName] : [];
    for (const tagName of tagNames) {
      tags.push({ name: tagName, category: { name: categoryName } });
    }
  }
  const tagCount = await syncPreferenceTags(tags);

  return { catCount, tagCount, aspectCount };
}

module.exports = {
  fetchTaxonomyFromPikNLP,
  syncCategories,
  syncPreferenceTags,
  syncSentimentAspects,
  syncAllTaxonomy,
};


