# Open-Issues Ledger

## Open Items
1. **[Raised in Round 2 - Reviewer 2]**: 실물 물리 기기에서 하드웨어 팜 리젝션(Palm Rejection) 알고리즘이 브라우저 터치 이벤트를 강제로 취소시키는 극단적인 엣지 파지 상황.
2. **[Raised in Round 1 - Reviewer 1]**: 극단적인 240Hz 게이밍 폰 디스플레이에서 초고속 스와이프 시 렌더링 프레임레이트(60fps) 대비 터치 이벤트 버퍼 누적 시 브라우저 이벤트 코얼레싱(Event Coalescing) 의존성.

## Closed Items (with Verification Evidence)
- ~[Raised in Round 0 - Implementer]: 브라우저 줌 레벨 및 캔버스 bounding box 리사이즈 극단적 줌 전환 순간 좌표 안정성~ -> **Closed in Round 1 & verified in Round 2**: `Number.isFinite()` 전수 검증 및 resize/orientationchange 리스너 구현, Test 5/Test 6 (30/30 passed) 검증 완료.
- ~[Raised in Round 0 - Implementer]: 폴더블 기기(Galaxy Z Fold) 화면 펼침/접힘 실시간 뷰포트 크기 변경 시 터치 드래그 지속성~ -> **Closed in Round 1 & verified in Round 2**: Samsung Galaxy Z Fold 프로파일 추가 및 Test 5 (Dynamic Viewport Resizing / Foldable Unfold Resilience) 자동화 테스트 30/30 패스 검증 완료.
