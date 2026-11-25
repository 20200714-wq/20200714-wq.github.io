
const $ = (id) => document.getElementById(id);

// ======================================
// 1. 지도 초기화
// ======================================

const map = L.map("map", {
  scrollWheelZoom: false
}).setView([35.1796, 129.0756], 11);

// OpenStreetMap 지도 타일
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// ======================================
// 2. 지도 잘림 현상 수정
// ======================================

// Leaflet에 지도 영역의 실제 크기를 다시 계산하도록 요청
function refreshMapSize() {
  if (map) {
    map.invalidateSize({
      pan: false,
      animate: false
    });
  }
}

// 지도가 준비되면 크기 재계산
map.whenReady(() => {
  requestAnimationFrame(refreshMapSize);

  setTimeout(refreshMapSize, 250);
  setTimeout(refreshMapSize, 800);
  setTimeout(refreshMapSize, 1500);
});

// 브라우저 창 크기가 변경되면 지도 크기 재계산
window.addEventListener("resize", refreshMapSize);

// 지도 영역 자체의 크기 변경 감지
const mapElement = document.getElementById("map");

if (mapElement && "ResizeObserver" in window) {
  const mapResizeObserver = new ResizeObserver(() => {
    refreshMapSize();
  });

  mapResizeObserver.observe(mapElement);
}

// 지도 마커를 관리하는 레이어
const markerLayer = L.layerGroup().addTo(map);

// 현재 검색된 시설
let filteredFacilities = [...playgroundData];


// ======================================
// 3. HTML 특수문자 처리
// ======================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}


// ======================================
// 4. 주소 검색
// ======================================

function openAddressSearch(facility) {
  const query = encodeURIComponent(
    `${facility.address} ${facility.name}`
  );

  window.open(
    `https://www.openstreetmap.org/search?query=${query}`,
    "_blank",
    "noopener"
  );
}


// ======================================
// 5. 검색 필터 설정
// ======================================

function populateFilters() {
  const districts = [
    ...new Set(
      playgroundData
        .map(item => item.district)
        .filter(Boolean)
    )
  ].sort();

  const districtFilter = $("districtFilter");

  districts.forEach(district => {
    districtFilter.add(
      new Option(district, district)
    );
  });

  const years = [
    ...new Set(
      playgroundData
        .map(item => item.installDate?.slice(0, 4))
        .filter(Boolean)
    )
  ].sort().reverse();

  years.forEach(year => {
    $("yearFilter").add(
      new Option(year, year)
    );
  });

  updateDongOptions();
}


// ======================================
// 6. 동 필터 설정
// ======================================

function updateDongOptions() {
  const district = $("districtFilter").value;
  const dongFilter = $("dongFilter");

  const previous = dongFilter.value;

  dongFilter.innerHTML =
    '<option value="">전체 동</option>';

  const dongs = [
    ...new Set(
      playgroundData
        .filter(item =>
          !district || item.district === district
        )
        .map(item => item.dong)
        .filter(Boolean)
    )
  ].sort();

  dongs.forEach(dong => {
    dongFilter.add(
      new Option(dong, dong)
    );
  });

  if (dongs.includes(previous)) {
    dongFilter.value = previous;
  }
}


// ======================================
// 7. 검색 조건 적용
// ======================================

function getFilteredFacilities() {
  const query = $("searchInput").value
    .trim()
    .toLowerCase();

  const district = $("districtFilter").value;
  const dong = $("dongFilter").value;
  const water = $("waterFilter").value;
  const operation = $("operationFilter").value;
  const year = $("yearFilter").value;

  return playgroundData.filter(item => {

    const matchesQuery =
      !query ||
      `${item.name} ${item.address} ${item.facilityNo}`
        .toLowerCase()
        .includes(query);

    return matchesQuery
      && (!district || item.district === district)
      && (!dong || item.dong === dong)
      && (!water || item.waterPlay === water)
      && (!operation || item.operation === operation)
      && (!year || item.installDate?.startsWith(year));
  });
}


// ======================================
// 8. 상단 통계 표시
// ======================================

function renderStats(items) {

  $("totalCount").textContent = items.length;

  $("operatingCount").textContent =
    items.filter(item =>
      item.operation === "운영"
    ).length;

  $("waterCount").textContent =
    items.filter(item =>
      item.waterPlay === "포함"
    ).length;

  // 추가 확인 필요는 실제 위험 판정이 아니라
  // 제공된 정보의 누락 여부를 나타냄
  $("checkCount").textContent =
    items.filter(item =>
      !item.inspectionType ||
      !item.installDate ||
      !item.operation
    ).length;
}


// ======================================
// 9. 시설 목록 표시
// ======================================

function renderRows(items) {

  const tbody = $("facilityRows");

  tbody.innerHTML = items.map(item => `
    <tr>
      <td>
        ${escapeHTML(item.name)}
        <br>
        <span class="muted">
          시설번호 ${escapeHTML(item.facilityNo)}
        </span>
      </td>

      <td>
        ${escapeHTML(item.address)}
      </td>

      <td>
        ${escapeHTML(item.installDate || "정보 없음")}
      </td>

      <td>
        <span class="pill ${
          item.waterPlay === "포함"
            ? "pill-orange"
            : "pill-gray"
        }">
          ${escapeHTML(item.waterPlay || "정보 없음")}
        </span>
      </td>

      <td>
        <span class="pill ${
          item.operation === "운영"
            ? "pill-green"
            : "pill-gray"
        }">
          ${escapeHTML(item.operation || "정보 없음")}
        </span>
      </td>

      <td>
        <button
          class="detail-button"
          type="button"
          data-facility="${escapeHTML(item.facilityNo)}">
          상세 보기
        </button>
      </td>
    </tr>
  `).join("");

  $("resultLabel").textContent =
    `${items.length}개 결과`;

  $("emptyState").hidden =
    items.length > 0;

  // 상세 보기 버튼 이벤트
  tbody.querySelectorAll(
    "button[data-facility]"
  ).forEach(button => {

    button.addEventListener("click", () => {

      const facility = playgroundData.find(
        item =>
          String(item.facilityNo) ===
          button.dataset.facility
      );

      if (facility) {
        showDetails(facility);
      }

    });

  });

}


// ======================================
// 10. 지도에 놀이터 표시
// ======================================

function renderMap(items) {

  // 기존 마커 제거
  markerLayer.clearLayers();

  // 실제 위도와 경도가 있는 시설만 지도에 표시
  const located = items.filter(item =>
    Number.isFinite(item.latitude) &&
    Number.isFinite(item.longitude)
  );

  // 시설별 마커 생성
  located.forEach(item => {

    const marker = L.marker([
      item.latitude,
      item.longitude
    ]).addTo(markerLayer);

    marker.bindPopup(`
      <strong>${escapeHTML(item.name)}</strong>
      <br>
      ${escapeHTML(item.address)}
      <br>
      <button
        type="button"
        onclick="window.open(
          'https://www.openstreetmap.org/search?query=${encodeURIComponent(item.address)}',
          '_blank',
          'noopener'
        )">
        주소 검색
      </button>
    `);

  });

  // 마커가 있으면 해당 위치로 지도 이동
  if (located.length > 0) {

    const group = L.featureGroup(
      located.map(item =>
        L.marker([
          item.latitude,
          item.longitude
        ])
      )
    );

    map.fitBounds(
      group.getBounds().pad(0.15),
      {
        maxZoom: 15,
        animate: false
      }
    );

  } else {

    // 좌표가 없으면 부산 중심 표시
    map.setView(
      [35.1796, 129.0756],
      11
    );

  }

  // 지도 타일 크기 재계산
  requestAnimationFrame(() => {
    refreshMapSize();
  });

}


// ======================================
// 11. 시설 상세 정보
// ======================================

function showDetails(item) {

  $("detailName").textContent =
    item.name;

  const rows = [

    ["시설번호", item.facilityNo],

    ["우편번호", item.postalCode],

    ["주소", item.address],

    ["설치일자", item.installDate || "정보 없음"],

    ["안전검사 종류", item.inspectionType || "정보 없음"],

    ["물놀이형 시설", item.waterPlay || "정보 없음"],

    ["운영구분", item.operation || "정보 없음"],

    [
      "구·군 / 동",
      `${item.district || "미분류"} ${item.dong || ""}`
    ],

    [
      "좌표",
      item.latitude != null && item.longitude != null
        ? `${item.latitude}, ${item.longitude}`
        : "원본 데이터에 위도·경도 없음"
    ]

  ];

  $("detailContent").innerHTML =
    rows.map(([label, value]) => `
      <dl class="detail-row">
        <dt>${escapeHTML(label)}</dt>
        <dd>${escapeHTML(value)}</dd>
      </dl>
    `).join("");

  $("addressLink").href =
    `https://www.openstreetmap.org/search?query=${
      encodeURIComponent(item.address)
    }`;

  $("detailDialog").showModal();

}


// ======================================
// 12. 검색 및 필터 실행
// ======================================

function applyFilters() {

  filteredFacilities =
    getFilteredFacilities();

  renderStats(filteredFacilities);

  renderRows(filteredFacilities);

  renderMap(filteredFacilities);

}


// ======================================
// 13. 검색창 이벤트
// ======================================

[
  "searchInput",
  "waterFilter",
  "operationFilter",
  "yearFilter",
  "dongFilter"
].forEach(id => {

  $(id).addEventListener(
    "input",
    applyFilters
  );

});


// 구·군 변경 시 동 목록도 다시 설정
$("districtFilter").addEventListener(
  "change",
  () => {

    updateDongOptions();

    applyFilters();

  }
);


// ======================================
// 14. 초기화 버튼
// ======================================

$("resetBtn").addEventListener(
  "click",
  () => {

    $("searchInput").value = "";

    $("districtFilter").value = "";

    $("dongFilter").value = "";

    $("waterFilter").value = "";

    $("operationFilter").value = "";

    $("yearFilter").value = "";

    updateDongOptions();

    applyFilters();

  }
);


// ======================================
// 15. 상세 정보 창 닫기
// ======================================

$("closeDialog").addEventListener(
  "click",
  () => {
    $("detailDialog").close();
  }
);

$("detailDialog").addEventListener(
  "click",
  event => {

    if (event.target === $("detailDialog")) {
      $("detailDialog").close();
    }

  }
);


// ======================================
// 16. 웹사이트 최초 실행
// ======================================

// 검색 필터 생성
populateFilters();

// 전체 데이터 표시
applyFilters();

// 지도 크기 최종 재계산
window.addEventListener("load", () => {

  setTimeout(() => {
    refreshMapSize();
  }, 500);

});
