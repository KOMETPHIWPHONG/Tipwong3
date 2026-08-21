/**
 * 👥 ระบบสมาชิกบริษัท, ที่อยู่จัดส่ง และระบบบันทึก/ค้นหาข้อมูลลูกค้า (รวมระบบ Cloud Sync, EmailJS และระบบปักหมุดแผนที่)
 */

// โหลดข้อมูลสมาชิกจากเครื่อง
let currentUser = JSON.parse(localStorage.getItem('tipwong_current_user')) || null;

// ==========================================
// 🛒 ระบบส่งข้อมูลคำสั่งซื้อเข้า LINE
// ==========================================
function sendOrderToLine(productName, priceType, details) {
    let message = `🛒 มีคำสั่งซื้อใหม่!\n`;
    message += `📦 สินค้า: ${productName}\n`;
    message += `💰 ประเภท: ${priceType}\n`;
    message += `------------------\n`;
    message += `รายการ:\n${Array.isArray(details) ? details.join('\n') : details}\n`;
    message += `⏰ เวลา: ${new Date().toLocaleString('th-TH')}`;

    let encodeMessage = encodeURIComponent(message);
    window.open(`https://line.me/R/msg/text/?${encodeMessage}`, '_blank');
}

// ฟังก์ชันสำหรับรวมที่อยู่จัดส่งและส่งข้อมูลเข้า LINE ตอนกดปุ่มยืนยัน
function sendCheckoutToLine() {
    const name = document.getElementById('customer-name') ? document.getElementById('customer-name').value : '';
    const phone = document.getElementById('customer-phone') ? document.getElementById('customer-phone').value : '';
    const address = document.getElementById('customer-address') ? document.getElementById('customer-address').value : '';
    const district = document.getElementById('customer-district') ? document.getElementById('customer-district').value : '';
    const province = document.getElementById('customer-province') ? document.getElementById('customer-province').value : '';
    const postcode = document.getElementById('customer-postcode') ? document.getElementById('customer-postcode').value : '';

    if (!name || !phone || !address) {
        showNotification("แจ้งเตือน", "กรุณากรอกชื่อ เบอร์โทร และที่อยู่ให้ครบถ้วนก่อนส่งเข้า LINE", "error");
        return;
    }

    let message = `🛒 *ยืนยันคำสั่งซื้อและที่อยู่จัดส่ง* 🛒\n`;
    message += `----------------------------------\n`;
    message += `👤 ชื่อลูกค้า: ${name}\n`;
    message += `📞 เบอร์โทร: ${phone}\n`;
    message += `📍 ที่อยู่: ${address} อ.${district} จ.${province} ${postcode}\n`;
    message += `----------------------------------\n`;
    message += `⏰ เวลา: ${new Date().toLocaleString('th-TH')}`;

    let encodeMessage = encodeURIComponent(message);
    window.open(`https://line.me/R/msg/text/?${encodeMessage}`, '_blank');
}

// ==========================================
// 🎨 ระบบ Toast Notification (Tailwind CSS)
// ==========================================
function showNotification(title, message, type = 'success') {
    let container = document.getElementById('notification-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3';
        document.body.appendChild(container);
    }

    const notif = document.createElement('div');

    let borderColor = 'border-emerald-500/20';
    let iconBg = 'bg-emerald-500/10 text-emerald-500';
    let iconClass = 'fa-solid fa-circle-check';

    if (type === 'error') {
        borderColor = 'border-red-500/20';
        iconBg = 'bg-red-500/10 text-red-500';
        iconClass = 'fa-solid fa-circle-exclamation';
    } else if (type === 'info') {
        borderColor = 'border-blue-500/20';
        iconBg = 'bg-blue-500/10 text-blue-500';
        iconClass = 'fa-solid fa-circle-info';
    }

    notif.className = `flex items-center gap-3 min-w-[300px] max-w-[400px] p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border ${borderColor} transition-all duration-300 translate-x-10 opacity-0`;

    notif.innerHTML = `
        <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg shrink-0">
            <i class="${iconClass}"></i>
        </div>
        <div class="flex-1">
            <div class="font-bold text-sm text-white">${title}</div>
            <div class="text-xs text-slate-400 mt-0.5">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-500 hover:text-white p-1 text-lg cursor-pointer">&times;</button>
    `;

    container.appendChild(notif);

    setTimeout(() => {
        notif.classList.remove('translate-x-10', 'opacity-0');
    }, 10);

    setTimeout(() => {
        notif.classList.add('translate-x-10', 'opacity-0');
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// ==========================================
// 🔐 ระบบเข้าสู่ระบบ / ออกจากระบบ
// ==========================================

function handleLoginSubmit(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('auth-email').value.trim();
    const passwordInput = document.getElementById('auth-password').value.trim();

    const isAuthorized = emailInput.endsWith('@tipwong.com') ||
        emailInput === 'f0657022736@gmail.com' ||
        passwordInput === 'tipwong2026';

    if (isAuthorized) {
        currentUser = {
            name: emailInput.split('@')[0],
            email: emailInput,
            role: "พนักงานบริษัท (Authorized Staff)",
            profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        };

        localStorage.setItem('tipwong_current_user', JSON.stringify(currentUser));

        showNotification("สำเร็จ!", "เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับสมาชิกบริษัท", "success");
        closeAuthModal();
        updateAuthUI();
    } else {
        showNotification("แจ้งเตือน", "ขออภัย! ระบบนี้สำหรับพนักงานของบริษัท Tipwong เท่านั้น", "error");
    }
}

function updateAuthUI() {
    const authStatusContainer = document.getElementById('auth-status-container');
    const loginBanner = document.getElementById('login-required-banner');

    if (currentUser) {
        if (loginBanner) loginBanner.style.display = 'none';

        if (authStatusContainer) {
            authStatusContainer.innerHTML = `
                <div class="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                    <img src="${currentUser.profileImage}" alt="Profile" class="w-9 h-9 rounded-full object-cover border-2 border-red-500">
                    <div class="text-left">
                        <p class="text-xs font-bold text-white">${currentUser.name}</p>
                        <p class="text-[10px] text-red-400">${currentUser.role}</p>
                    </div>
                    <button onclick="handleLogout()" class="ml-2 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded cursor-pointer">ออก</button>
                </div>
            `;
        }
    }
}

function handleLogout() {
    localStorage.removeItem('tipwong_current_user');
    currentUser = null;
    showNotification("ข้อมูลระบบ", "ออกจากระบบเรียบร้อยแล้ว", "info");
    setTimeout(() => location.reload(), 1000);
}

function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.add("hidden");
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initRealtimeCustomerSync(); // เริ่มต้นดึงข้อมูลจาก Cloud แบบ Real-time
});

function toggleAuthMode() {
    const loginForm = document.getElementById('auth-login-form');
    const registerForm = document.getElementById('auth-register-form');
    const title = document.getElementById('auth-modal-title');
    const description = document.getElementById('auth-modal-description');

    if (loginForm && registerForm) {
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');

        if (loginForm.classList.contains('hidden')) {
            if (title) title.innerText = 'ยืนยันที่อยู่การจัดส่ง';
            if (description) description.innerText = 'กรอกข้อมูลรายละเอียดและที่อยู่จัดส่งสินค้าของคุณ';
        } else {
            if (title) title.innerText = 'เข้าสู่ระบบ';
            if (description) description.innerText = 'เข้าสู่ระบบ TIPWONG เพื่อจัดการข้อมูลลูกค้าและที่อยู่จัดส่ง';
        }
    }
}

function toggleAuthPassword() {
    const passwordInput = document.getElementById('auth-password');
    const passwordIcon = document.getElementById('auth-password-icon');

    if (passwordInput && passwordIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordIcon.classList.remove('fa-eye');
            passwordIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            passwordIcon.classList.remove('fa-eye-slash');
            passwordIcon.classList.add('fa-eye');
        }
    }
}

function handleAuthSubmit() {
    const loginForm = document.getElementById('auth-login-form');

    if (loginForm && !loginForm.classList.contains('hidden')) {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        if (!email || !password) {
            showNotification("แจ้งเตือน", "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน", "error");
            return;
        }

        handleLoginSubmit();
    } else {
        const name = document.getElementById('register-name').value;
        const phone = document.getElementById('register-phone').value;
        const address = document.getElementById('register-address').value;
        const district = document.getElementById('register-district').value;
        const province = document.getElementById('register-province').value;
        const postcode = document.getElementById('register-postcode').value;

        if (!name || !phone || !address || !district || !province || !postcode) {
            showNotification("แจ้งเตือน", "กรุณากรอกข้อมูลที่อยู่จัดส่งให้ครบถ้วน", "error");
            return;
        }

        showNotification("สำเร็จ!", "ยืนยันที่อยู่การจัดส่งเรียบร้อยแล้ว!", "success");
        toggleAuthMode();
    }
}

function resetAuthPassword() {
    showNotification("ข้อมูลระบบ", "กรุณาติดต่อเจ้าหน้าที่เพื่อรีเซ็ตรหัสผ่าน", "info");
}

// ==========================================
// 📦 ระบบบันทึกข้อมูลลูกค้า + Cloud Sync + EmailJS + พิกัดแผนที่
// ==========================================
function saveCustomerData(event) {
    if (event) event.preventDefault();

    if (!currentUser) {
        showNotification("แจ้งเตือน", "กรุณาเข้าสู่ระบบในนามพนักงานก่อนบันทึกข้อมูล!", "error");
        openAuthModal();
        return;
    }

    const customerData = {
        name: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        postcode: document.getElementById('customer-postcode').value,
        district: document.getElementById('customer-district').value,
        province: document.getElementById('customer-province').value,
        address: document.getElementById('customer-address').value,
        latitude: document.getElementById('customer-lat') ? document.getElementById('customer-lat').value : null,
        longitude: document.getElementById('customer-lng') ? document.getElementById('customer-lng').value : null,
        savedBy: currentUser.name,
        timestamp: new Date().toLocaleString()
    };

    if (!customerData.name || !customerData.phone || !customerData.address) {
        showNotification("แจ้งเตือน", "กรุณากรอกชื่อ เบอร์โทร และที่อยู่ให้ครบถ้วน", "error");
        return;
    }

    const submitBtn = document.querySelector('#shippingForm button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกข้อมูลและส่งอีเมล...';
        submitBtn.disabled = true;
    }

    // 1. บันทึกข้อมูลขึ้น Firebase Cloud
    if (typeof db !== 'undefined') {
        db.collection("tipwong_customers").add(customerData).catch((error) => {
            console.error("Cloud Sync Error: ", error);
        });
    }

    // บันทึกลง LocalStorage
    let customerList = JSON.parse(localStorage.getItem('tipwong_customers')) || [];
    customerList.push(customerData);
    localStorage.setItem('tipwong_customers', JSON.stringify(customerList));

    const emailParams = {
        customer_name: customerData.name,
        phone: customerData.phone,
        address: `${customerData.address} อ.${customerData.district} จ.${customerData.province} ${customerData.postcode} (พิกัด: ${customerData.latitude}, ${customerData.longitude})`,
        saved_by: customerData.savedBy,
        timestamp: customerData.timestamp
    };

    // 2. ส่งอีเมลแจ้งเตือนผ่าน EmailJS
    emailjs.send(
        'service_2rk0h9s',
        'template_xyz9876',
        emailParams,
        'gJk-s8a9df7654321'
    )
        .then((response) => {
            showNotification("สำเร็จ!", "บันทึกข้อมูลและส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว!", "success");

            const form = document.getElementById('shippingForm');
            if (form) form.reset();

            const shippingModal = document.getElementById('shipping-modal');
            if (shippingModal) {
                shippingModal.classList.add('hidden');
            }
        })
        .catch((error) => {
            console.error('FAILED...', error);
            showNotification("แจ้งเตือน", "บันทึกข้อมูลสำเร็จ แต่การส่งอีเมลขัดข้อง", "error");

            const form = document.getElementById('shippingForm');
            if (form) form.reset();
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
}

// ฟังก์ชันซิงค์ข้อมูลอัตโนมัติแบบ Real-time จาก Cloud
function initRealtimeCustomerSync() {
    if (typeof db !== 'undefined') {
        db.collection("tipwong_customers").onSnapshot((snapshot) => {
            let cloudCustomers = [];
            snapshot.forEach((doc) => {
                cloudCustomers.push(doc.data());
            });
            localStorage.setItem('tipwong_customers', JSON.stringify(cloudCustomers));
        });
    }
}

// ==========================================
// 🪟 ระบบ Modal ควบคุมการสั่งซื้อและการจัดส่ง
// ==========================================
function openOrderModal() {
    const modal = document.getElementById("orderModal");
    if (modal) modal.classList.add("show");

    // เปิดแผนที่ปักหมุดเมื่อ Modal เปิดขึ้นมา
    setTimeout(() => {
        if (customerMap) {
            customerMap.invalidateSize();
        } else {
            initCustomerMap();
        }
    }, 300);
}

function closeOrderModal() {
    const modal = document.getElementById("orderModal");
    if (modal) modal.classList.remove("show");
}

function confirmShipment() {
    alert("ระบบทำการตัดสต็อกและจัดส่งเรียบร้อยแล้ว!");
    closeOrderModal();
}

// ==========================================
// 🗺️ ระบบปักหมุดแผนที่ (Leaflet.js Integration)
// ==========================================
let customerMap = null;
let customerMarker = null;

function initCustomerMap(defaultLat = 13.7563, defaultLng = 100.5018) {
    const mapContainer = document.getElementById('customer-map');
    
    if (mapContainer && !customerMap) {
        customerMap = L.map('customer-map').setView([defaultLat, defaultLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(customerMap);

        customerMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(customerMap);

        updateLatLonInputs(defaultLat, defaultLng);

        customerMap.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            customerMarker.setLatLng([lat, lng]);
            updateLatLonInputs(lat, lng);
        });

        customerMarker.on('dragend', function(e) {
            const lat = customerMarker.getLatLng().lat;
            const lng = customerMarker.getLatLng().lng;
            updateLatLonInputs(lat, lng);
        });
    }
}

function updateLatLonInputs(lat, lng) {
    const latInput = document.getElementById('customer-lat');
    const lngInput = document.getElementById('customer-lng');

    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
}

// บันทึกข้อมูลลงเครื่อง
localStorage.setItem('my_saved_data', 'ข้อมูลที่ต้องการจำ');

// ดึงข้อมูลเดิมกลับมาใช้ตอนเปิดหน้าเว็บขึ้นมาใหม่
let savedData = localStorage.getItem('my_saved_data');
