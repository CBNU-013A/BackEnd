const express = require('express');
const router = express.Router();
const tourApiService = require('../services/tourApiService');

// GET /tour-api/status - 서비스 상태 확인
router.get('/status', (req, res) => {
  try {
    const status = tourApiService.getStatus();
    res.json({
      success: true,
      message: 'TourAPI 서비스 상태',
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상태 확인 실패',
      error: error.message
    });
  }
});

// POST /tour-api/sync - 수동 TourAPI 호출 실행
router.post('/sync', async (req, res) => {
  try {
    const { areaCode, contentTypeId } = req.body;
    
    if (areaCode) {
      // 특정 지역만 TourAPI 호출
      const locations = await tourApiService.callTourApi(areaCode, contentTypeId);
      const result = await tourApiService.processLocationData(locations);
      
      res.json({
        success: true,
        message: `지역 ${areaCode} TourAPI 호출 완료`,
        data: result
      });
    } else {
      // 전체 지역 TourAPI 호출
      await tourApiService.syncAllRegions();
      
      res.json({
        success: true,
        message: '전체 지역 TourAPI 호출 완료'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'TourAPI 호출 실패',
      error: error.message
    });
  }
});

// GET /tour-api/logs - 로그 조회
router.get('/logs', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../../logs/tour-api.log');
    
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf-8');
      const logLines = logs.split('\n').filter(line => line.trim());
      
      res.json({
        success: true,
        message: '로그 조회 완료',
        data: {
          totalLines: logLines.length,
          logs: logLines.slice(-100) // 최근 100줄만 반환
        }
      });
    } else {
      res.json({
        success: true,
        message: '로그 파일이 없습니다',
        data: { totalLines: 0, logs: [] }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '로그 조회 실패',
      error: error.message
    });
  }
});

module.exports = router;
