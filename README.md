# Back-End

### Docker 실행 방법

```
# 도커 빌드 + 실행
docker-compose up --build
# 도커 GPU 실행
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
# 도커 종료
docker-compose down
```
