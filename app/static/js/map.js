// Khởi tạo bản đồ với tọa độ Cần Thơ
var map = L.map('map').setView([10.0452, 105.7469], 12);

// Thêm tile layer từ OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Tạo FeatureGroup để chứa các đối tượng đã vẽ
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Cài đặt Leaflet Draw
var drawControl = new L.Control.Draw({
    draw: {
        polyline: { shapeOptions: { color: 'red' } },
        polygon: { shapeOptions: { color: 'blue' } },
        circle: { shapeOptions: { color: 'green' } },
        marker: true
    },
    edit: {
        featureGroup: drawnItems
    }
});
map.addControl(drawControl);

var selectedMarker = null;

// Lắng nghe sự kiện khi vẽ xong trên bản đồ
map.on('draw:created', function (e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);

    // Xóa marker đã chọn trước đó nếu có
    if (selectedMarker) {
        drawnItems.removeLayer(selectedMarker);
    }

    // Lưu marker được chọn
    if (layer instanceof L.Marker) {
        selectedMarker = layer;
        document.getElementById("location-name").value = "";
        document.getElementById("location-type").value = "";
    }
});

// Lắng nghe sự kiện khi nhấp chuột vào bản đồ để lấy thông tin địa chỉ
map.on('click', function (e) {
    var lat = e.latlng.lat;
    var lon = e.latlng.lng;

    // Lấy địa chỉ từ OpenStreetMap (Geocoding)
    fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json')
        .then(response => response.json())
        .then(data => {
            var address = data.display_name;  // Địa chỉ trả về từ OSM

            // Gắn địa chỉ vào properties của marker đã vẽ
            if (selectedMarker) {
                selectedMarker.bindPopup("<strong>Địa chỉ:</strong> " + address).openPopup();
            }

            // Cập nhật thông tin địa chỉ trong form
            document.getElementById("info").innerHTML = "<strong>Địa chỉ:</strong> " + address;
        });
});

// Lắng nghe sự kiện lưu thông tin địa điểm
document.getElementById("save-btn").addEventListener("click", function () {
    if (!selectedMarker) {
        alert("Vui lòng chọn một địa điểm!");
        return;
    }

    const name = document.getElementById("location-name").value;
    const type = document.getElementById("location-type").value;

    // Lấy địa chỉ từ popup của marker
    var address = selectedMarker.getPopup() ? selectedMarker.getPopup().getContent() : "Không có địa chỉ";

    // Gửi yêu cầu lưu thông tin vào server
    fetch('/save_location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lat: selectedMarker.getLatLng().lat,
            lon: selectedMarker.getLatLng().lng,
            name: name,
            type: type,
            address: address  // Thêm thông tin địa chỉ vào yêu cầu lưu
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Địa điểm đã được lưu:', data);
            alert('Thông tin địa điểm đã được lưu!');
        })
        .catch(error => console.error('Lỗi khi lưu địa điểm:', error));
});

// Lắng nghe sự kiện xóa thông tin địa điểm
document.getElementById("delete-btn").addEventListener("click", function () {
    if (!selectedMarker) {
        alert("Vui lòng chọn một địa điểm!");
        return;
    }

    if (confirm('Bạn có chắc muốn xóa địa điểm này?')) {
        // Xóa marker
        map.removeLayer(selectedMarker);
        selectedMarker = null;

        // Gửi yêu cầu xóa thông tin trên server
        fetch('/delete_location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: selectedMarker.getLatLng().lat,
                lon: selectedMarker.getLatLng().lng
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Địa điểm đã bị xóa:', data);
                alert('Địa điểm đã được xóa!');
            })
            .catch(error => console.error('Lỗi khi xóa địa điểm:', error));
    }
});

// Xuất GeoJSON và hiển thị trên màn hình
document.getElementById("export-btn").addEventListener("click", function () {
    var geojson = drawnItems.toGeoJSON(); // Chuyển tất cả các đối tượng đã vẽ thành GeoJSON

    // Lặp qua các đối tượng trong GeoJSON và thêm properties địa chỉ
    geojson.features.forEach(function (feature) {
        var lat = feature.geometry.coordinates[1];
        var lon = feature.geometry.coordinates[0];

        // Lấy địa chỉ từ OpenStreetMap (Geocoding)
        fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json')
            .then(response => response.json())
            .then(data => {
                var address = data.display_name;

                // Thêm địa chỉ vào properties của feature
                feature.properties.address = address;

                // Hiển thị dữ liệu GeoJSON lên màn hình
                document.getElementById("geojson-output").innerText = JSON.stringify(geojson, null, 2); // Căn chỉnh cho dễ đọc
            });
    });
});
