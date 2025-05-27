// keywordsController.js
const User = require("../models/User");
const Keyword = require("../models/SubKeyword");

// ✅ 모든 키워드를 불러오는 함수
exports.getAllKeywords = async (req, res) => {
  try {
    console.log("✅ getAllKeywords 호출됨");

    const keywords = await Keyword.find({}, { name: 1, category: 1 }); // _id 기본 포함
    res.json(keywords);
  } catch (error) {
    console.error("🚨 키워드 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// ✅ 새로운 키워드 추가
exports.createKeyword = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "키워드 이름이 필요합니다." });
    }
    const newKeyword = new Keyword({ name });
    await newKeyword.save();
    res.status(201).json(newKeyword);
  } catch (error) {
    console.error("🚨 키워드 추가 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// ✅ 키워드 삭제
exports.deleteKeyword = async (req, res) => {
  try {
    const { keywordId } = req.params;
    const deletedKeyword = await Keyword.findByIdAndDelete(keywordId);
    if (!deletedKeyword) {
      return res.status(404).json({ error: "키워드를 찾을 수 없습니다." });
    }
    res.json({ message: "키워드 삭제 성공" });
  } catch (error) {
    console.error("🚨 키워드 삭제 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// ✅ 키워드 수정
exports.updateKeyword = async (req, res) => {
  try {
    const { keywordId } = req.params;
    const { name } = req.body;
    const updatedKeyword = await Keyword.findByIdAndUpdate(
      keywordId,
      { name },
      { new: true, runValidators: true }
    );
    if (!updatedKeyword) {
      return res.status(404).json({ error: "키워드를 찾을 수 없습니다." });
    }
    res.json(updatedKeyword);
  } catch (error) {
    console.error("🚨 키워드 수정 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

exports.createOrUpdateUserKeywords = async (req, res) => {
  const { userId, selectedKeywordIds } = req.body;
  // selectedKeywordIds는 사용자가 선택한 SubKeyword ID 배열

  try {
    const allSubKeywords = await SubKeyword.find({});

    const keywordData = allSubKeywords.map((sub) => ({
      subKeyword: sub._id,
      value: selectedKeywordIds.includes(sub._id.toString()) ? 1 : 0,
    }));

    const user = await User.findByIdAndUpdate(
      userId,
      { keywords: keywordData },
      { new: true, upsert: true }
    );

    res
      .status(200)
      .json({ message: "사용자 키워드 저장 성공", keywords: user.keywords });
  } catch (err) {
    console.error("❌ 사용자 키워드 저장 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
};
