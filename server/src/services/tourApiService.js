const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Location = require('../models/Location');
const connectDB = require('../../../scripts/database');

class TourApiService {
  constructor() {
    this.apiKey = process.env.TOUR_API_KEY || 'YOUR_TOUR_API_KEY';
    this.baseUrl = 'http://apis.data.go.kr/B551011/KorService2';
    this.logFile = path.join(__dirname, '../../logs/tour-api.log');
    this.isRunning = false;
    
    // 로그 디렉토리 생성
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    // 콘솔에 출력
    console.log(`🏛️ [TourAPI] ${message}`);
    
    // 파일에 로그 저장
    fs.appendFileSync(this.logFile, logMessage);
  }

  async callTourApi(areaCode = '33', contentTypeId = '12', pageNo = 1, numOfRows = 100) {
    try {
      this.log(`TourAPI 호출 시작 - 지역코드: ${areaCode}, 콘텐츠타입: ${contentTypeId}, 페이지: ${pageNo}`);
      
      const url = `${this.baseUrl}/areaBasedList2`;
      const params = {
        serviceKey: this.apiKey,
        numOfRows,
        pageNo,
        MobileOS: 'ETC',
        MobileApp: 'PikTour',
        _type: 'json',
        areaCode,
        contentTypeId,
        arrange: 'A' // 제목순 정렬
      };

      const response = await axios.get(url, { 
        params,
        timeout: 30000 
      });

      if (response.data.response?.header?.resultCode === '0000') {
        const items = response.data.response.body?.items?.item || [];
        this.log(`TourAPI 호출 성공 - ${items.length}개 데이터 수신`);
        return items;
      } else {
        throw new Error(`API 응답 오류: ${response.data.response?.header?.resultMsg}`);
      }
    } catch (error) {
      this.log(`TourAPI 호출 실패: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async processLocationData(locations) {
    try {
      this.log(`TourAPI 데이터 처리 시작 - ${locations.length}개 장소 데이터 수신`);

      let successCount = 0;
      let errorCount = 0;

      for (const location of locations) {
        try {
          // TourAPI 데이터 로그만 기록 (DB 저장 안함)
          this.log(`TourAPI 데이터 수신: ${location.title} (${location.contentid}) - ${location.addr1 || '주소없음'}`);
          
          successCount++;
        } catch (error) {
          errorCount++;
          this.log(`데이터 처리 실패 (${location.title}): ${error.message}`, 'ERROR');
        }
      }

      this.log(`TourAPI 데이터 처리 완료 - 성공: ${successCount}, 실패: ${errorCount}`);
      return { successCount, errorCount };
    } catch (error) {
      this.log(`데이터 처리 중 오류: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async syncAllRegions() {
    if (this.isRunning) {
      this.log('이미 TourAPI 호출이 실행 중입니다', 'WARN');
      return;
    }

    this.isRunning = true;
    this.log('=== TourAPI 전체 지역 호출 시작 ===');

    try {
      // 충청북도 지역코드들
      const regions = [
        { areaCode: '33', name: '충청북도' },
        { areaCode: '34', name: '충청남도' },
        { areaCode: '35', name: '전라북도' },
        { areaCode: '36', name: '전라남도' },
        { areaCode: '37', name: '경상북도' },
        { areaCode: '38', name: '경상남도' }
      ];

      let totalSuccess = 0;
      let totalError = 0;

      for (const region of regions) {
        try {
          this.log(`지역 TourAPI 호출 시작: ${region.name} (${region.areaCode})`);
          
          // 각 지역별로 여러 페이지 데이터 수집
          let pageNo = 1;
          let hasMoreData = true;
          
          while (hasMoreData && pageNo <= 5) { // 최대 5페이지까지만
            const locations = await this.callTourApi(region.areaCode, '12', pageNo, 100);
            
            if (locations.length === 0) {
              hasMoreData = false;
              break;
            }

            const result = await this.processLocationData(locations);
            totalSuccess += result.successCount;
            totalError += result.errorCount;

            // API 호출 간격 조절 (2초 대기)
            await new Promise(resolve => setTimeout(resolve, 2000));
            pageNo++;
          }

          this.log(`지역 TourAPI 호출 완료: ${region.name}`);
        } catch (error) {
          this.log(`지역 TourAPI 호출 실패 (${region.name}): ${error.message}`, 'ERROR');
        }
      }

      this.log(`=== TourAPI 전체 호출 완료 === 성공: ${totalSuccess}, 실패: ${totalError}`);
    } catch (error) {
      this.log(`전체 TourAPI 호출 중 오류: ${error.message}`, 'ERROR');
    } finally {
      this.isRunning = false;
    }
  }

  async startScheduler(intervalHours = 12) {
    this.log(`TourAPI 스케줄러 시작 - ${intervalHours}시간 간격`);
    
    // 즉시 한 번 실행
    await this.syncAllRegions();
    
    // 주기적 실행 설정
    const intervalMs = intervalHours * 60 * 60 * 1000;
    setInterval(async () => {
      this.log(`스케줄된 TourAPI 호출 시작`);
      await this.syncAllRegions();
    }, intervalMs);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastLogFile: this.logFile,
      apiKey: this.apiKey ? '설정됨' : '미설정'
    };
  }
}

module.exports = new TourApiService();
