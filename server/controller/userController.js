const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Keyword = require("../models/Keyword");

// 🔹 사용자 키워드 추가
exports.addUserKeyword = async (req, res) => {
  try {
    const { userId } = req.params;
    let { keywordId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(keywordId)) {
      return res.status(400).json({ error: "유효한 keywordId가 아닙니다." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    if (user.keywords.includes(keywordId)) {
      return res.status(409).json({ error: "이미 추가된 키워드입니다." });
    }

    user.keywords.push(keywordId);
    await user.save();

    res.status(201).json({ message: "키워드 추가 성공!", keywordId });
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// 🔹 사용자 키워드 조회
exports.getUserKeywords = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "keywords",
      "name"
    );
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }
    res.json(user.keywords);
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// 🔹 사용자 키워드 전체 초기화
exports.resetUserKeywords = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(
      userId,
      { $set: { keywords: [] } },
      { new: true }
    );
    res.json({ message: "모든 키워드 초기화 성공!" });
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

// 🔹 사용자 키워드 삭제
exports.deleteUserKeyword = async (req, res) => {
  console.log("deleteUserKeyword 호출됨");
  console.log("req.params : ", req.params);

  try {
    const { userId, keywordId } = req.params;
    const user = await User.findById(userId);
    if (!mongoose.Types.ObjectId.isValid(keywordId)) {
      return res.status(400).json({ error: "유효한 keywordId가 아닙니다." });
    }

    if (!user || !user.keywords.includes(keywordId)) {
      return res
        .status(404)
        .json({ error: "해당 키워드가 존재하지 않습니다." });
    }

    await User.findByIdAndUpdate(
      userId,
      { $pull: { keywords: keywordId } },
      { new: true }
    );
    await user.save();

    res.json({ message: "키워드 삭제 성공!" });
  } catch (error) {
    res.status(500).json({ error: "서버 오류 발생" });
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
