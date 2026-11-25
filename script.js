const $ = (id) => document.getElementById(id);

const map = L.map("map", { scrollWheelZoom: false }).setView([35.1796, 129.0756], 11);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let markerLayer = L.layerGroup().addTo(map);
let filteredFacilities = [...playgroundData];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function openAddressSearch(facility) {
  const query = encodeURIComponent(`${facility.address} ${facility.name}`);
  window.open(`https://www.openstreetmap.org/search?query=${query}`, "_blank", "noopener");
}

function populateFilters() {
  const districts = [...new Set(playgroundData.map(item => item.district).filter(Boolean))].sort();
  const districtFilter = $("districtFilter");
  districts.forEach(district => districtFilter.add(new Option(district, district)));

  const years = [...new Set(playgroundData.map(item => item.installDate?.slice(0, 4)).filter(Boolean))].sort().reverse();
  years.forEach(year => $("yearFilter").add(new Option(year, year)));
  updateDongOptions();
}

function updateDongOptions() {
  const district = $("districtFilter").value;
  const dongFilter = $("dongFilter");
  const previous = dongFilter.value;
  dongFilter.innerHTML = '<option value="">전체 동</option>';
  const dongs = [...new Set(playgroundData
    .filter(item => !district || item.district === district)
    .map(item => item.dong).filter(Boolean))].sort();
  dongs.forEach(dong => dongFilter.add(new Option(dong, dong)));
  if (dongs.includes(previous)) dongFilter.value = previous;
}

function getFilteredFacilities() {
  const query = $("searchInput").value.trim().toLowerCase();
  const district = $("districtFilter").value;
  const dong = $("dongFilter").value;
  const water = $("waterFilter").value;
  const operation = $("operationFilter").value;
  const year = $("yearFilter").value;

  return playgroundData.filter(item => {
    const matchesQuery = !query || `${item.name} ${item.address} ${item.facilityNo}`.toLowerCase().includes(query);
    return matchesQuery
      && (!district || item.district === district)
      && (!dong || item.dong === dong)
      && (!water || item.waterPlay === water)
      && (!operation || item.operation === operation)
      && (!year || item.installDate.startsWith(year));
  });
}

function renderStats(items) {
  $("totalCount").textContent = items.length;
  $("operatingCount").textContent = items.filter(item => item.operation === "운영").length;
  $("waterCount").textContent = items.filter(item => item.waterPlay === "포함").length;
  // ‘추가 확인 필요’는 안전하지 않다는 판정이 아니라, 현재 데이터에 세부 안전정보가 부족하다는 뜻입니다.
  $("checkCount").textContent = items.filter(item =>
    !item.inspectionType || !item.installDate || !item.operation
  ).length;
}

function renderRows(items) {
  const tbody = $("facilityRows");
  tbody.innerHTML = items.map(item => `
    <tr>
      <td>${escapeHTML(item.name)}<br><span class="muted">시설번호 ${escapeHTML(item.facilityNo)}</span></td>
      <td>${escapeHTML(item.address)}</td>
      <td>${escapeHTML(item.installDate || "정보 없음")}</td>
      <td><span class="pill ${item.waterPlay === "포함" ? "pill-orange" : "pill-gray"}">${escapeHTML(item.waterPlay || "정보 없음")}</span></td>
      <td><span class="pill ${item.operation === "운영" ? "pill-green" : "pill-gray"}">${escapeHTML(item.operation || "정보 없음")}</span></td>
      <td><button class="detail-button" type="button" data-facility="${escapeHTML(item.facilityNo)}">상세 보기</button></td>
    </tr>
  `).join("");

  $("resultLabel").textContent = `${items.length}개 결과`;
  $("emptyState").hidden = items.length > 0;
  tbody.querySelectorAll("button[data-facility]").forEach(button => {
    button.addEventListener("click", () => {
      const facility = playgroundData.find(item => item.facilityNo === button.dataset.facility);
      if (facility) showDetails(facility);
    });
  });
}

function renderMap(items) {
  markerLayer.clearLayers();
  const located = items.filter(item =>
    Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
  );

  located.forEach(item => {
    const marker = L.marker([item.latitude, item.longitude]).addTo(markerLayer);
    marker.bindPopup(`<strong>${escapeHTML(item.name)}</strong><br>${escapeHTML(item.address)}<br><button type="button" onclick="window.open('https://www.openstreetmap.org/search?query=${encodeURIComponent(item.address)}','_blank','noopener')">주소 검색</button>`);
  });

  if (located.length > 0) {
    const group = L.featureGroup(located.map(item => L.marker([item.latitude, item.longitude])));
    map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 15 });
  } else {
    map.setView([35.1796, 129.0756], 11);
  }
}

function showDetails(item) {
  $("detailName").textContent = item.name;
  const rows = [
    ["시설번호", item.facilityNo],
    ["우편번호", item.postalCode],
    ["주소", item.address],
    ["설치일자", item.installDate || "정보 없음"],
    ["안전검사 종류", item.inspectionType || "정보 없음"],
    ["물놀이형 시설", item.waterPlay || "정보 없음"],
    ["운영구분", item.operation || "정보 없음"],
    ["구·군 / 동", `${item.district || "미분류"} ${item.dong || ""}`],
    ["좌표", item.latitude != null && item.longitude != null ? `${item.latitude}, ${item.longitude}` : "원본 데이터에 위도·경도 없음"]
  ];
  $("detailContent").innerHTML = rows.map(([label, value]) =>
    `<dl class="detail-row"><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></dl>`
  ).join("");
  $("addressLink").href = `https://www.openstreetmap.org/search?query=${encodeURIComponent(item.address)}`;
  $("detailDialog").showModal();
}

function applyFilters() {
  filteredFacilities = getFilteredFacilities();
  renderStats(filteredFacilities);
  renderRows(filteredFacilities);
  renderMap(filteredFacilities);
}

["searchInput", "waterFilter", "operationFilter", "yearFilter", "dongFilter"].forEach(id => {
  $(id).addEventListener("input", applyFilters);
});
$("districtFilter").addEventListener("change", () => {
  updateDongOptions();
  applyFilters();
});
$("resetBtn").addEventListener("click", () => {
  $("searchInput").value = "";
  $("districtFilter").value = "";
  $("dongFilter").value = "";
  $("waterFilter").value = "";
  $("operationFilter").value = "";
  $("yearFilter").value = "";
  updateDongOptions();
  applyFilters();
});
$("closeDialog").addEventListener("click", () => $("detailDialog").close());
$("detailDialog").addEventListener("click", event => {
  if (event.target === $("detailDialog")) $("detailDialog").close();
});

populateFilters();
applyFilters();
