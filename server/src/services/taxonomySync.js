const axios = require("axios");
const Category = require("../models/Category");
const PreferenceTag = require("../models/PreferenceTag");
const SentimentAspect = require("../models/SentimentAspect");

/*
Taxononmy라고 커서가 이름 지어버림 분류학이라던가 뭐라던가
NLP 모델에서 사용하는 값과 DB에 저장된 ID를 매핑해주는 역할
*/

// NLP서버로 요청 날릴 Client
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

/*
NLP 서버의 사용중인 값 GET 요청후 응답 받아서 파싱 후 반환
*/
async function fetchTaxonomyFromPikNLP() {
  const client = createClient();
  const endpoint = process.env.NLP_CATEGORIES_ENDPOINT || "/api/v1/categories";
  const res = await client.get(endpoint); // 요청 날리고 응답 받기
  const data = res?.data || {}; // 응답 데이터 파싱
  const sentimentModel = Array.isArray(data.sentiment_model) ? data.sentiment_model : []; // 감정 분석 값 배열
  const categoryMap = data.category_map && typeof data.category_map === "object" ? data.category_map : {}; // 카테고리 분류 값
  return { sentimentModel, categoryMap }; // 감정 분석 값과 카테고리 분류 값 반환
}

/*
DB와 카테고리 목록 동기화
*/
async function syncCategories(categories) {
  let upserts = 0;
  for (const item of categories) { // 카테고리 배열 순회
    const name = item?.name || item?.label; // 카테고리 이름
    if (!name) continue; // 카테고리 이름이 없으면 스킵
    await Category.updateOne( // 카테고리 업데이트
      { name },
      { $setOnInsert: { name, isActive: true } },
      { upsert: true }
    );
    upserts++; // 업데이트 카운트 증가
  }
  return upserts; // 업데이트 카운트 반환
}

/*
DB와 카테고리 분류 대상 목록 동기화
*/
async function syncPreferenceTags(tags) {
  // 카테고리 이름 → _id 캐시
  const allCats = await Category.find().select("_id name").lean(); // 카테고리 목록 조회
  const nameToId = new Map(allCats.map((c) => [c.name, c._id])); // 카테고리 이름 → _id 캐시

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

/*
DB와 감정 분류 대상 목록 동기화
*/
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

/*
DB와 감정 분류 대상 목록 동기화 하는 메인급 함수
*/
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


