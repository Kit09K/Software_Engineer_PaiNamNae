// รับ Event เมื่อ Backend ยิง Push Notification มา
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    
    // ตั้งค่าหน้าตาของ Popup แจ้งเตือน
    const options = {
      body: data.body,
      icon: '/favicon.ico', // โลโก้แอป
      data: { url: data.url || '/' }, // เก็บลิงก์ไว้เปิดตอนคนคลิก
    };

    // สั่งให้เบราว์เซอร์โชว์ Popup
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// รับ Event เมื่อผู้ใช้คลิกที่ Popup แจ้งเตือน
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // ปิดหน้าต่างแจ้งเตือน
  // เปิดแท็บใหม่ไปยัง URL ที่ส่งมา
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});