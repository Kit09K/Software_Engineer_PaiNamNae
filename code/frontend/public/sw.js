self.addEventListener('push', function(event) {
  if (event.data) {
    // แปลงข้อมูลที่ได้จาก Backend เป็น JSON
    const data = event.data.json();
    
    // ตั้งค่ารูปแบบการแสดงผลของ Notification
    const title = data.title || 'การแจ้งเตือนใหม่';
    const options = {
      body: data.body || '',
      icon: '/favicon.ico', // แนะนำให้ใส่พาร์ทรูปภาพ Icon ของแอปคุณ
      badge: '/favicon.ico', // โลโก้เล็กๆ ที่มักโชว์บน Android
      data: {
        url: data.url || '/' // URL สำหรับเปิดเมื่อผู้ใช้กดคลิก
      }
    };

    // 1. สั่งให้ Browser/OS แสดง Notification
    const showNotificationPromise = self.registration.showNotification(title, options);

    // 2. [ส่วนที่เพิ่มใหม่] ส่งข้อความไปบอกหน้าเว็บ (Vue) ที่เปิดอยู่ทั้งหมดให้อัปเดตข้อมูล
    const notifyClientsPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          // ส่งสัญญาณไปที่หน้าเว็บ
          client.postMessage({
            type: 'notification-updated', 
            payload: data // ส่งข้อมูลไปเผื่อหน้าเว็บต้องการเช็คว่าเป็นข้อความจากคนขับหรือไม่
          });
        }
      });

    // รอให้ทั้งการแสดงแจ้งเตือนและการส่งข้อความหาหน้าเว็บทำงานเสร็จสมบูรณ์
    event.waitUntil(Promise.all([showNotificationPromise, notifyClientsPromise]));
  }
});

// จัดการเมื่อผู้ใช้คลิกที่ตัวแจ้งเตือน
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // ปิดหน้าต่างแจ้งเตือน
  
  // เปิดลิงก์เป้าหมาย (ถ้ามี)
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      // โค้ดส่วนนี้เช็คได้ด้วยนะว่าถ้ามีหน้าเว็บเปิดอยู่แล้ว ให้ focus หน้านั้นแทนการเปิดแท็บใหม่
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // หาว่ามีหน้าเว็บแอปเราเปิดอยู่ไหม
        for (let i = 0; i < windowClients.length; i++) {
          let client = windowClients[i];
          if (client.url.includes(event.notification.data.url) && 'focus' in client) {
            return client.focus();
          }
        }
        // ถ้าไม่มีเปิดอยู่เลย ค่อยเปิดแท็บใหม่
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});