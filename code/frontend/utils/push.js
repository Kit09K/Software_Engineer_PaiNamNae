
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToWebPush = async () => {
  try {
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('เบราว์เซอร์นี้ไม่รองรับ Push Notification');
      return null;
    }

    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('ผู้ใช้ไม่อนุญาตให้ส่งการแจ้งเตือน');
      return null;
    }

    
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker ลงทะเบียนสำเร็จ!');

    
    const vapidPublicKey = 'BE69yQBGaERtw7yxW886eSonk8nuVx7VG0gt__G6ASv9ghDxgL-zyK9pK7MIIN4W9DDWyHAeQdmHbcl32Ts9aG0';
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    console.log('ข้อมูล Subscription ที่จะส่งให้ Backend:', subscription);
    return subscription;

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการ Subscribe:', error);
    return null;
  }
};