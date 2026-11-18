// 모의고사 기록장 오프라인 지원
// 앱 화면은 "네트워크 먼저"(새 버전을 바로 받기 위해), 라이브러리는 "저장본 먼저"로 가져옵니다.
const CACHE = 'mocklog-v2';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const CDN = ['https://cdnjs.cloudflare.com/', 'https://www.gstatic.com/firebasejs/', 'https://cdn.jsdelivr.net/', 'https://tessdata.projectnaptha.com/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  // Firebase 로그인·데이터 통신은 건드리지 않음 (Firestore가 자체 오프라인 저장소를 씀)
  if (url.includes('googleapis.com') || url.includes('firebaseapp.com')) return;
  const sameOrigin = new URL(url).origin === self.location.origin;
  if (sameOrigin){
    e.respondWith(fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch:true}).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (CDN.some(p => url.startsWith(p))){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque'){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
