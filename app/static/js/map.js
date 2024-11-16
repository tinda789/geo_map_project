window.onload = function () {
    var map = L.map('map').setView([10.0452, 105.7469], 12);

// Add tile layers for different map styles
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var cartoDBLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Bản đồ vệ tinh của Esri
var esriSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
});

// Set up map with OpenStreetMap layer as default
osmLayer.addTo(map);

// Create a control for the base layers to allow switching between different maps
var baseLayers = {
    "OpenStreetMap": osmLayer,
    "CartoDB": cartoDBLayer,
    "Bản đồ vệ tinh": esriSatelliteLayer
};

L.control.layers(baseLayers).addTo(map);

// Create FeatureGroup to hold drawn items
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Set up Leaflet Draw with drawing tools
var drawControl = new L.Control.Draw({
    draw: {
        polyline: { shapeOptions: { color: 'red' } },  // Đoạn đường vẽ màu đỏ
        polygon: { shapeOptions: { color: 'blue' } },  // Đa giác vẽ màu xanh
        circle: { shapeOptions: { color: 'green' }, shapeOptions: { fillOpacity: 0.3 } },  // Hình tròn vẽ màu xanh lá
        marker: true  // Cho phép vẽ marker
    },
    edit: {
        featureGroup: drawnItems,  // Chỉnh sửa các đối tượng đã vẽ
        remove: true  // Cho phép xóa đối tượng đã vẽ
    }
});
map.addControl(drawControl);

// Event listener for drawing completion
map.on('draw:created', function (e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);

    // Add a popup with address for Marker
    if (layer instanceof L.Marker) {
        var lat = layer.getLatLng().lat;
        var lon = layer.getLatLng().lng;

        // Fetch address from OpenStreetMap API
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
            .then(response => response.json())
            .then(data => {
                var address = data.display_name || "Không tìm thấy địa chỉ";
                layer.address = address;
                layer.bindPopup(`<strong>Địa chỉ:</strong> ${address}`).openPopup();
            });
    }

    // Handle Circle drawing
    if (layer instanceof L.Circle) {
        var radius = layer.getRadius();  // Bán kính của vòng tròn
        console.log('Bán kính của hình tròn là:', radius);

        // Có thể xử lý bán kính của hình tròn ở đây nếu cần
        layer.bindPopup(`<strong>Bán kính:</strong> ${radius} meters`).openPopup();
    }
});
    // Chức năng định vị vị trí của người dùng
    function locateUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                
                // Căn chỉnh bản đồ đến vị trí của người dùng và thêm marker
                map.setView([lat, lon], 15); // Zoom vào mức 15 để có độ rõ nét tốt hơn
                L.marker([lat, lon]).addTo(map)
                    .bindPopup("Vị trí của bạn")
                    .openPopup();
            }, function (error) {
                alert("Không thể lấy vị trí của bạn.");
            });
        } else {
            alert("Trình duyệt của bạn không hỗ trợ định vị.");
        }
    }

    // Thêm sự kiện cho nút định vị
    document.getElementById('locate-btn').addEventListener('click', locateUser);

    // Load GeoJSON data from the server
    function loadGeoJSON() {
        fetch('/get_locations')
            .then(response => response.json())
            .then(data => {
                drawnItems.clearLayers();  // Clear existing items
                if (data.geojson && data.geojson.features.length > 0) {
                    L.geoJSON(data.geojson, {
                        onEachFeature: function (feature, layer) {
                            // Gán sự kiện click cho mỗi GeoJSON layer
                            layer.on('click', function () {
                                onGeoJsonLayerClick(layer);
                            });
                        }
                    }).addTo(map);
                } else {
                    console.log('Không có dữ liệu GeoJSON');
                }
            })
            .catch(error => console.error('Lỗi khi lấy dữ liệu GeoJSON:', error));
    }

    loadGeoJSON(); // Load GeoJSON initially

    // Handle click on GeoJSON layer
    function onGeoJsonLayerClick(layer) {
        var feature = layer.feature;
        var objectId = feature._id;

        if (!objectId || objectId.length !== 24) {
            alert('ID không hợp lệ hoặc không có ID.');
            return;
        }

        var popupContent = `
            <strong>Thông tin địa điểm:</strong>
            <pre>
                <div>Tên:${JSON.stringify(feature.properties.name, null, 2)}</div>
                <div>Địa chỉ:${JSON.stringify(feature.properties.address, null, 2)}</div>
            </pre>
            <div>
                <label for="name-input">Tên địa điểm:</label>
                <input type="text" id="name-input" class="form-control" value="${feature.properties.name || ''}" />
            </div>
            <button id="update-name-btn-${objectId}" class="btn btn-success mt-2">Cập nhật tên</button>
            <button id="delete-btn-${objectId}" class="btn btn-danger mt-2">Xóa địa điểm</button>
        `;

        layer.bindPopup(popupContent).openPopup();

        // Update name button click event
        document.getElementById(`update-name-btn-${objectId}`).addEventListener('click', function () {
            var newName = document.getElementById('name-input').value.trim();
            if (newName === '') {
                alert("Tên địa điểm không thể để trống!");
                return;
            }

            updateLocationName(objectId, newName, layer);
        });

        // Delete button click event
        document.getElementById(`delete-btn-${objectId}`).addEventListener('click', function () {
            deleteLocation(objectId, layer);
            loadGeoJSON();
        });
    }

    // Update location name
    function updateLocationName(objectId, newName, layer) {
        fetch('/update_location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: objectId, name: newName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Cập nhật tên địa điểm thành công") {
                alert('Tên địa điểm đã được cập nhật!');
                layer.feature.properties.name = newName; // Update feature name
                layer.setPopupContent(`
                    <strong>Thông tin địa điểm:</strong>
                    <div><strong>Tên:</strong> ${newName}</div>
                    <pre>${JSON.stringify(layer.feature.properties.address, null, 2)}</pre>
                    <button id="update-name-btn-${objectId}" class="btn btn-success mt-2">Cập nhật tên</button>
                    <button id="delete-btn-${objectId}" class="btn btn-danger mt-2">Xóa địa điểm</button>
                `);
            } else {
                alert('Đã cập nhật tên địa điểm thành công');
            }
        })
        .catch(error => {
            console.error('Lỗi khi cập nhật tên địa điểm:', error);
            alert('Lỗi khi cập nhật tên địa điểm.');
        });
        loadGeoJSON();
    }

    // Delete location
 // Delete location
// Cập nhật hàm xử lý xóa địa điểm
function deleteLocation(objectId, layer) {
    if (confirm('Bạn có chắc muốn xóa địa điểm này?')) {
        fetch('/delete_location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: objectId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Địa điểm đã bị xóa") {
                layer.remove(); // Xóa địa điểm khỏi bản đồ ngay lập tức
                alert("Địa điểm đã bị xóa.");
                location.reload(); 

                // Kiểm tra xem có đang tìm kiếm hay không
                var query = document.getElementById('search-query').value.trim();
                if (query) {
                    // Nếu đang tìm kiếm, gọi lại hàm tìm kiếm
                    executeSearch(); 
                } else {
                    // Nếu không tìm kiếm, gọi lại hàm loadGeoJSON để tải lại toàn bộ dữ liệu
                    loadGeoJSON(); 
                }
            } else {
               
                loadGeoJSON();
            }
        })
        .catch(error => {
            console.error('Lỗi khi xóa địa điểm:', error);
            alert("Lỗi khi xóa địa điểm.");
        });
        loadGeoJSON();
    }
}



    // Save drawn locations and update the map
    document.getElementById("save-btn").addEventListener("click", function () {
        if (drawnItems.getLayers().length === 0) {
            alert("Vui lòng vẽ một địa điểm trước!");
            return;
        }

        var dataToSave = [];

        drawnItems.eachLayer(function (layer) {
            var geojson = layer.toGeoJSON();
            dataToSave.push({
                geometry: geojson.geometry,
                properties: { type: geojson.geometry.type }
            });

            if (layer instanceof L.Marker) {
                dataToSave[dataToSave.length - 1].properties.address = layer.address || "Không tìm thấy địa chỉ";
            }
        });

        fetch('/save_location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Địa điểm đã được lưu:', data);
            alert('Thông tin địa điểm đã được lưu!');
            loadGeoJSON();  // Reload GeoJSON to update the map immediately
        })
        .catch(error => console.error('Lỗi khi lưu địa điểm:', error));
        loadGeoJSON();
    });


 // ================= Tìm kiếm địa điểm =================
// Gọi tìm kiếm khi nhấn Enter hoặc nhấp nút Tìm kiếm
function executeSearch() {
    var query = document.getElementById('search-query').value.trim();

    if (!query) {
        alert("Vui lòng nhập từ khóa tìm kiếm.");
        return;
    }

    fetch(`/search?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            // Kiểm tra nếu không tìm thấy kết quả
            if (!data.geojson || data.geojson.features.length === 0) {
                alert("Không tìm thấy kết quả.");

                // Reset bản đồ về trạng thái ban đầu
                loadGeoJSON(); // Gọi lại hàm loadGeoJSON() để tải lại các dữ liệu gốc
                return;
            }

            // Xóa tất cả các layer cũ
            drawnItems.clearLayers();

            // Tạo một danh sách các địa chỉ tìm được
            let addressList = '<ul>';
            
            // Thêm các layer tìm được vào bản đồ và tạo danh sách địa chỉ
            L.geoJSON(data.geojson, {
                onEachFeature: function (feature, layer) {
                    // Bind popup cho mỗi feature
                    layer.bindPopup(`
                        <strong>Địa điểm:</strong> ${feature.properties.name || 'Không có tên'}
                        <br><strong>Địa chỉ:</strong> ${feature.properties.address || 'Không có địa chỉ'}
                    `);

                    // Thêm địa chỉ vào danh sách với sự kiện click
                    addressList += `
                        <li data-lat="${feature.geometry.coordinates[1]}" data-lon="${feature.geometry.coordinates[0]}">
                            <strong>${feature.properties.name || 'Không có tên'}</strong>: ${feature.properties.address || 'Không có địa chỉ'}
                        </li>
                    `;
                }
            }).addTo(drawnItems);

            // Kết thúc danh sách
            addressList += '</ul>';

            // Hiển thị danh sách các địa chỉ tìm được trên giao diện
            document.getElementById('address-results').innerHTML = addressList;

            // Zoom đến vị trí đầu tiên tìm được
            var bounds = L.geoJSON(data.geojson).getBounds();
            map.fitBounds(bounds);

            // Gắn sự kiện click vào các địa chỉ trong danh sách
         document.querySelectorAll('#address-results li').forEach(item => {
    item.addEventListener('click', function() {
        var lat = parseFloat(item.getAttribute('data-lat'));
        var lon = parseFloat(item.getAttribute('data-lon'));

        // Tìm feature tương ứng từ dữ liệu GeoJSON để lấy thông tin chi tiết
        var feature = getFeatureByCoordinates(lat, lon); // Giả sử hàm này trả về feature từ GeoJSON dựa trên lat, lon

        if (feature) {
            // Tạo nội dung cho popup với thông tin tên và địa chỉ
            var popupContent = `
                <strong>Địa điểm:</strong> ${feature.properties.name || 'Không có tên'}<br>
                <strong>Địa chỉ:</strong> ${feature.properties.address || 'Không có địa chỉ'}
            `;
            
            // Tạo một marker hoặc layer tại vị trí lat, lon
            var marker = L.marker([lat, lon]).addTo(map);
            marker.bindPopup(popupContent).openPopup();

            // Cập nhật lại vị trí zoom vào vị trí địa chỉ đã chọn
            map.setView([lat, lon], 15); // Set zoom level to 15 for better visibility
        }
    });
});

        })
        .catch(error => {
            console.error('Lỗi khi tìm kiếm:', error);
            alert('Đã xảy ra lỗi khi thực hiện tìm kiếm.');

            // Reset bản đồ về trạng thái ban đầu trong trường hợp lỗi
            loadGeoJSON();
        });
            loadGeoJSON();}

// Gắn sự kiện cho nút tìm kiếm
document.getElementById('search-btn').addEventListener('click', executeSearch);

// Gắn sự kiện nhấn Enter trong ô input
document.getElementById('search-query').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Ngăn form bị submit (nếu form có action)
        executeSearch(); // Gọi hàm tìm kiếm
        loadGeoJSON();
    }
});


// ================= Kết thúc tìm kiếm =================


    // Export GeoJSON data
// Export GeoJSON data
document.getElementById("export-btn").addEventListener("click", function () {
    if (drawnItems.getLayers().length === 0) {
        alert("Không có đối tượng nào để xuất!");
        return;
    }

    // Chuyển các đối tượng vẽ thành GeoJSON
    var geojson = drawnItems.toGeoJSON();

    // Lấy danh sách các đối tượng vẽ
    var features = geojson.features;

    // Lấy địa chỉ từ OpenStreetMap (Nominatim) cho mỗi đối tượng
    var geocodePromises = features.map(function (feature) {
        var latlng = feature.geometry.coordinates;
        var lat = latlng[1];  // Lấy latitude
        var lon = latlng[0];  // Lấy longitude

        // Gọi Nominatim API để lấy địa chỉ từ tọa độ
        var url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                // Thêm thông tin địa chỉ vào đối tượng GeoJSON
                feature.properties.address = data.display_name || "Không tìm thấy địa chỉ";
            })
            .catch(error => {
                console.error("Lỗi khi lấy địa chỉ:", error);
                feature.properties.address = "Lỗi khi lấy địa chỉ";
            });
    });

    // Sau khi tất cả các địa chỉ được lấy xong, xuất dữ liệu
    Promise.all(geocodePromises).then(function () {
        // Chuyển GeoJSON thành dạng JSON
        var jsonData = JSON.stringify(geojson, null, 2);

        // Hiển thị dữ liệu trong một thẻ HTML trên trang
        var exportContainer = document.getElementById("export-container");
        if (exportContainer) {
            exportContainer.textContent = jsonData; // Gán dữ liệu JSON vào thẻ
        } else {
            alert("Không tìm thấy thẻ để hiển thị dữ liệu xuất.");
        }
    });
});

loadGeoJSON();

};
