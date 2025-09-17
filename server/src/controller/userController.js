// server/src/controller/userController.js

require("../models/Category"); // 이거 안하면 ref 해도 category가 등록 안 되어 있다고 튕김

const mongoose = require("mongoose");
const User = require("../models/User");
const Prompt = require("../models/PromptRecommend");
const PreferenceTag = require("../models/PreferenceTag");

// TODO: 전체 변경...


// 프롬프트에 키워드 추가
exports.updateUserKeyword = async (req, res) => {
  const { userId } = req.params;
  const { preferenceTagId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "사용자 없음" });

    const preferenceTagItem = user.preferenceTags.find(
      (kw) => kw.preferenceTag.toString() === preferenceTagId
    );

    if (!preferenceTagItem) {
      return res.status(404).json({ message: "해당 PreferenceTag 없음" });
    }

    preferenceTagItem.value = 1;
    await user.save();

    res
      .status(200)
      .json({ message: "PreferenceTag 업데이트 완료", keyword: preferenceTagItem });
  } catch (err) {
    console.error("❌ PreferenceTag 업데이트 에러:", err);
    res.status(500).json({ error: "PreferenceTag 업데이트 실패" });
  }
};

// 🔹 사용자 키워드 조회
exports.getUserKeywords = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate({
      path: "keywords.preferenceTag",
      populate: { path: "category" },
    });

    if (!user) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    const selectedKeywords = user.keywords.filter((kw) => kw.value === 1);

    res.status(200).json({
      message: "선택된 키워드 조회 성공",
      keywords: selectedKeywords,
    });
  } catch (err) {
    console.error("❌ 키워드 조회 에러:", err);
    res.status(500).json({ error: "키워드 조회 실패" });
  }
};

// 🔹 사용자 키워드 전체 초기화
exports.resetUserKeywords = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    let updated = false;

    if (user.keywords && user.keywords.length > 0) {
      user.keywords.forEach((kw) => {
        if (kw.value !== 0) {
          kw.value = 0;
          updated = true;
        }
      });
    }

    if (updated) {
      await user.save();
      return res.status(200).json({ message: "키워드 초기화 완료" });
    } else {
      return res
        .status(200)
        .json({ message: "초기화할 키워드가 없음 (이미 0)" });
    }
  } catch (err) {
    console.error("❌ 키워드 초기화 에러:", err);
    res.status(500).json({ error: "키워드 초기화 실패" });
  }
};

// 🔹 사용자 키워드 삭제
exports.removeUserKeyword = async (req, res) => {
  const { userId } = req.params;
  const { subKeywordId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "사용자 없음" });

    const keywordItem = user.keywords.find(
      (kw) => kw.subKeyword.toString() === subKeywordId
    );

    if (!keywordItem) {
      return res.status(404).json({ message: "해당 키워드 없음" });
    }

    if (keywordItem.value === 0) {
      return res.status(200).json({ message: "이미 value가 0입니다" });
    }

    keywordItem.value = 0;
    await user.save();

    res.status(200).json({
      message: "키워드 value 0으로 초기화 완료",
      keyword: keywordItem,
    });
  } catch (err) {
    console.error("❌ 키워드 삭제 에러:", err);
    res.status(500).json({ error: "키워드 삭제 실패" });
  }
};

// 🔹 사용자 최근 검색어 추가
exports.addRecentSearch = async (req, res) => {
  console.log("addRecentSearch 호출됨");
  console.log("req.params : ", req.params);
  console.log("req.body  : ", req.body.location.title);

  try {
    const { userId } = req.params;
    const { location } = req.body;
    const locationId = location?._id;

    if (!locationId || !mongoose.Types.ObjectId.isValid(locationId)) {
      return res
        .status(400)
        .json({ error: "유효한 location._id가 필요합니다." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    if (!user.recentsearch.includes(locationId)) {
      user.recentsearch.unshift(new mongoose.Types.ObjectId(locationId));
      await user.save();
    }

    res.status(201).json({ message: "최근 장소 추가 성공", locationId });
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// 🔹 사용자 최근 검색어 조회
exports.getRecentSearch = async (req, res) => {
  console.log("getRecentSearch 호출됨");
  console.log("req.params: ", req.params);
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("recentsearch");

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.json(user.recentsearch);
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// 🔹 사용자 최근 검색어 전체 초기화
exports.resetRecentSearch = async (req, res) => {
  console.log("resetRecentSearch 호출됨");
  console.log("req.params : ", req.params);

  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(
      userId,
      { $set: { recentsearch: [] } },
      { new: true }
    );

    res.json({ message: "최근 검색 기록 초기화 성공!" });
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// 🔹 사용자 최근 검색어 삭제
exports.deleteRecentSearch = async (req, res) => {
  console.log("deleteRecentSearch 호출됨");
  console.log("req.params : ", req.params);
  try {
    const { userId, locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({ error: "유효한 locationId가 아닙니다." });
    }

    const user = await User.findById(userId);
    if (!user || !user.recentsearch.includes(locationId)) {
      return res
        .status(404)
        .json({ error: "해당 장소가 최근 검색어에 존재하지 않습니다." });
    }

    await User.findByIdAndUpdate(
      userId,
      { $pull: { recentsearch: new mongoose.Types.ObjectId(locationId) } },
      { new: true }
    );
    await user.save();

    res.json({ message: "최근 장소 삭제 성공!" });
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

/**
 * POST /api/users/:userId/preferences
 * body: { preferences: [ subKeyId1, subKeyId2, ... ] }
 */
exports.setPreferences = async (req, res) => {
  const { userId } = req.params;
  const { preferences } = req.body;
  if (!Array.isArray(preferences) || preferences.length === 0) {
    return res.status(400).json({ message: "preferences 배열을 보내주세요." });
  }
  await User.findByIdAndUpdate(userId, { preferences }, { new: true });
  res.json({ message: "Preferences 저장 완료", preferences });
};

/**
 * POST /api/users/:userId/keyword-preferences
 * body: { keywordPreferences: [ keywordId1, keywordId2, ... ] }
 */
exports.setKeywordPreferences = async (req, res) => {
  const { userId } = req.params;
  const { keywordPreferences } = req.body;

  if (!Array.isArray(keywordPreferences)) {
    return res
      .status(400)
      .json({ message: "keywordPreferences 는 배열이어야 합니다." });
  }

  // (필요시 유효한 Keyword ID인지 검증해도 좋습니다)
  const user = await User.findByIdAndUpdate(
    userId,
    { keywordPreferences },
    { new: true }
  ).populate("keywordPreferences", "name");

  if (!user) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  res.json({
    message: "감성 키워드 선호 저장 완료",
    keywordPreferences: user.keywordPreferences,
  });
};

/**
 * GET /api/users/:userId/keyword-preferences
 */
exports.getKeywordPreferences = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId)
    .select("keywordPreferences")
    .populate("keywordPreferences", "name")
    .lean();

  if (!user) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  res.json({
    keywordPreferences: user.keywordPreferences,
  });
};
