# 부산 안심놀이터 지도

## 파일
- `index.html`: 페이지 구조 및 지도 라이브러리 연결
- `style.css`: 디자인 및 반응형 레이아웃
- `script.js`: 검색, 필터, 목록, 상세 창, 지도 표시
- `data.js`: 놀이시설 데이터

## GitHub Pages 배포
1. GitHub에서 새 저장소(repository)를 만듭니다.
2. 위 4개 파일을 저장소 최상위(root)에 업로드합니다.
3. 저장소의 **Settings → Pages**로 이동합니다.
4. **Deploy from a branch**를 선택하고 `main` 브랜치 및 `/(root)`를 지정한 뒤 저장합니다.
5. 잠시 기다린 후 표시되는 Pages URL을 엽니다.

## 실제 데이터로 바꾸기
`data.js`의 `playgroundData` 배열을 공식 데이터로 교체하세요. 데이터 열은 `facilityNo`, `name`, `postalCode`, `address`, `installDate`, `inspectionType`, `waterPlay`, `operation`, `district`, `dong`, `latitude`, `longitude`를 사용합니다.

- 위도·경도가 있는 경우 `latitude`, `longitude`에 숫자를 넣으면 지도에 핀이 표시됩니다.
- 현재 전달된 표에는 좌표가 없어 임의 좌표를 만들지 않았습니다. 따라서 지도에는 부산의 기본 위치만 표시되며 각 시설은 상세 창의 주소 검색 링크로 찾아볼 수 있습니다.
- `district`와 `dong`은 제공된 원본 주소나 별도 행정구역 데이터로 확인한 뒤 입력하세요. 예시 데이터는 연제구·연산동으로 정리했습니다.
- ‘설치검사’는 검사 종류의 표시일 뿐, 현재 안전 상태나 검사 유효성을 보증하지 않습니다. 최신 검사·점검 자료를 별도로 연계해야 합니다.

## 외부 라이브러리
Leaflet 지도 라이브러리와 OpenStreetMap 타일을 CDN/인터넷으로 불러옵니다. 따라서 웹페이지 자체는 서버가 필요 없지만 지도 타일을 보려면 인터넷 연결이 필요합니다. OpenStreetMap 출처 표시는 유지하세요.
