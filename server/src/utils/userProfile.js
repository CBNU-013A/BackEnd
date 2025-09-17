// utils/userProfile.js

/**
 * Build a user preference vector
 * @param {Object} selections  // e.g. { subId1: weight1, subId2: weight2, ... }
 * @param {String[]} allSubKeywordIds
 * @returns {Object} { subId: number }
 */
function buildUserVector(selections, allSubKeywordIds) {
  // selections: { subId: weight }  (예: 사용자가 고른 subId만 1, 나머지 0)
  const userVec = {};
  allSubKeywordIds.forEach((id) => {
    userVec[id] = selections[id] || 0;
  });
  return userVec;
}

module.exports = { buildUserVector };
