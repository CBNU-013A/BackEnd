const tourApiService = require('../server/src/services/tourApiService');

async function manualSync() {
  try {
    console.log('🔄 TourAPI 수동 호출 시작');
    
    // 전체 지역 TourAPI 호출 실행
    await tourApiService.syncAllRegions();
    
    console.log('✅ 수동 TourAPI 호출 완료');
  } catch (error) {
    console.error('❌ TourAPI 호출 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 수동 동기화 실행
manualSync();
