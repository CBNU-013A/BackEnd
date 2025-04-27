# Back-End 
### Docker 실행 방법
```
# 도커 빌드 + 실행
docker-compose up --build
# 도커 종료
docker-compose down
```

### 프로젝트 주요 구조
```
Back-End/
├── app.js                  # 메인 서버 엔트리 포인트 (Express 서버 설정)
├── docker-compose.yml      # Docker로 서버 및 관련 서비스 관리 파일
├── Dockerfile              # 서버 이미지를 빌드하기 위한 설정 파일
├── package-lock.json       # 프로젝트 의존성 버전 고정 파일 (자동 생성)
├── package.json            # 프로젝트 기본 설정 및 의존성 관리 파일
├── README.md               # 프로젝트 설명 및 사용법 문서
└── server/
    ├── addLocation.js          # DB에 장소 데이터를 추가하는 스크립트
    ├── controller/             # 요청을 처리하는 컨트롤러 모듈 디렉토리
    │   ├── authController.js       # 사용자 인증 관련 로직
    │   ├── keywordsController.js   # 키워드 관련 API 로직
    │   ├── locationController.js   # 장소 관련 API 로직
    │   └── userController.js       # 사용자 정보 관련 API 로직
    ├── database.js             # MongoDB 연결 설정 파일
    ├── json/                   # 초기 데이터 파일(json) 디렉토리
    │   ├── keyword.json             # 키워드 데이터
    │   └── location.json            # 장소 데이터
    ├── kakaomap.js             # 카카오맵 관련 API 기능 구현 파일
    ├── models/                 # Mongoose 스키마(데이터 모델) 디렉토리
    │   ├── Keyword.js              # 키워드 모델
    │   ├── Location.js             # 장소 모델
    │   ├── Review.js               # 리뷰 모델
    │   └── User.js                 # 사용자 모델
    ├── routes/                 # API 라우터 정의 디렉토리
    │   ├── authRoutes.js           # 사용자 인증 라우트
    │   ├── keywordsRoutes.js       # 키워드 관련 라우트
    │   ├── locationRoutes.js       # 장소 관련 라우트
    │   └── userRoutes.js           # 사용자 정보 관련 라우트
    └── setDB.js                # DB 초기 데이터 세팅 스크립트
```
