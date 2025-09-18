const tourApiService = require('../server/src/services/tourApiService');

async function testTourApi() {
  try {
    console.log('🧪 TourAPI 테스트 시작');
    
    // 1. 서비스 상태 확인
    const status = tourApiService.getStatus();
    console.log('📊 서비스 상태:', status);
    
    // 2. 특정 지역 테스트 (충청북도)
    console.log('🏛️ 충청북도 TourAPI 호출 테스트 시작');
    const locations = await tourApiService.callTourApi('33', '12', 1, 10);
    console.log(`📌 ${locations.length}개 데이터 수신`);
    
    // 3. 데이터 처리 테스트 (로그만 기록)
    const result = await tourApiService.processLocationData(locations);
    console.log('📈 처리 결과:', result);
    
    console.log('✅ TourAPI 테스트 완료');
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 테스트 실행
testTourApi();
