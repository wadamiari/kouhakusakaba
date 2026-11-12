// ===== 店舗情報（架空データ：ここだけ書き換えれば全体に反映されます） =====
const SHOP = {
  name: "赤白酒場",
  tel: "〇〇〇-〇〇〇-〇〇〇〇",              // 電話（タップで発信）
  address: "〇〇県〇〇市〇〇-〇-〇",
  station: "△△駅",                      // 最寄駅
  walk: 3,                           // 徒歩（分）
  insta: "kouhaku_sakaba",             // Instagramアカウント名
  mapQuery: "愛知県名古屋市中区栄3丁目", // 地図検索用（実住所に差し替え）
  closedDay: 3,                         // 定休日 0=日 … 3=水
  OPEN: 16, LAST: 23.5, CLOSE: 24,
};

// ===== 店舗情報の反映＋営業状況の自動判定 =====
(function () {
  var S = SHOP, q = encodeURIComponent(S.mapQuery);
  document.querySelectorAll("[data-bind]").forEach(function (e) { e.textContent = S[e.dataset.bind]; });
  document.querySelectorAll("[data-tel]").forEach(function (e) { e.href = "tel:" + S.tel.replace(/-/g, ""); });
  document.querySelectorAll("[data-route]").forEach(function (e) { e.href = "https://www.google.com/maps/dir/?api=1&destination=" + q; });
  document.querySelectorAll("[data-insta]").forEach(function (e) { e.href = "https://www.instagram.com/" + S.insta + "/"; });

  // 23.5 → "23:30" のように、小数の時刻を「時:分」の文字に変換する
  function hm(h) {
    var hour = Math.floor(h), min = Math.round((h - hour) * 60);
    return hour + ":" + (min < 10 ? "0" : "") + min;
  }

  var d = new Date(), t = d.getHours() + d.getMinutes() / 60, el = document.getElementById("status"), msg, cls = "closed";
  if (d.getDay() === S.closedDay) msg = "本日は定休日";
  else if (t < 4) msg = "本日の営業は終了";     // 24:00以降〜早朝
  else if (t < S.OPEN) msg = "本日は" + hm(S.OPEN) + "から";
  else if (t < S.LAST) { msg = "営業中｜ラストオーダー " + hm(S.LAST); cls = "open"; }
  else if (t < S.CLOSE) msg = "ラストオーダー終了｜" + hm(S.CLOSE) + "閉店";
  else msg = "本日の営業は終了";
  el.textContent = msg; el.className = "badge " + cls;
})();

// ===== ヘッダーの高さをCSSに渡す（ファーストビュー画像を画面に収めるため） =====
(function () {
  var head = document.querySelector("header");
  function set() { document.documentElement.style.setProperty("--head-h", head.offsetHeight + "px"); }
  set();
  window.addEventListener("resize", set);
})();

// ===== お知らせ画像のスライド
//  ・画像の下の丸：今表示中の画像の丸が濃くなる／丸を押すとその画像へ移動
//  ・自動スライド：4秒ごとに次へ（触っている間は停止。動きを減らす設定の人には自動スライドしない）
(function () {
  var list = document.querySelector(".promo-list");
  var dotsBox = document.querySelector(".promo-dots");
  if (!list) return;
  var items = list.children, dots = [], paused = false, resumeTimer;

  function current() {            // いま中央に一番近い画像の番号
    var mid = list.scrollLeft + list.clientWidth / 2, best = 0, dist = Infinity;
    for (var i = 0; i < items.length; i++) {
      var d = Math.abs(items[i].offsetLeft + items[i].offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    }
    return best;
  }
  function go(i) {
    var el = items[i];
    list.scrollTo({ left: el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }

  // 丸を画像の枚数分つくる
  if (dotsBox) {
    for (var i = 0; i < items.length; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", (i + 1) + "枚目の画像を表示");
      b.addEventListener("click", (function (n) { return function () { go(n); }; })(i));
      dotsBox.appendChild(b);
      dots.push(b);
    }
  }
  // n番目の丸だけ濃くする
  function updateDots() {
    var n = current();
    dots.forEach(function (d, i) { d.setAttribute("aria-current", i === n ? "true" : "false"); });
  }
  var ticking = false;
  list.addEventListener("scroll", function () {   // スクロールに合わせて丸を更新
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateDots(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", updateDots);
  updateDots();

  // 自動スライド
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function pause() { paused = true; clearTimeout(resumeTimer); }
  function resume() { clearTimeout(resumeTimer); resumeTimer = setTimeout(function () { paused = false; }, 3000); }
  [list, dotsBox].forEach(function (el) {
    if (!el) return;
    ["mouseenter", "touchstart", "focusin"].forEach(function (e) { el.addEventListener(e, pause, { passive: true }); });
    ["mouseleave", "touchend", "focusout"].forEach(function (e) { el.addEventListener(e, resume, { passive: true }); });
  });
  setInterval(function () { if (!paused && !document.hidden) go((current() + 1) % items.length); }, 4000);
})();
