// 슬라이더 계산기용 재무 함수 — Python lib/finance.py 와 수식 동일.
function monthlyFactor(rate, n) {
  const i = rate / 12;
  if (i === 0) return 1 / n;
  const p = Math.pow(1 + i, n);
  return (i * p) / (p - 1);
}

function dsrLoanable(income, dsrLimit, rate, stress, n) {
  return (income * dsrLimit) / (12 * monthlyFactor(rate + stress, n));
}

// 취득세·중개보수·고정비용 — lib/config.py CONSTANTS와 동일한 공개 정책 상수(비밀값 아님).
const ACQ_TAX_RATE = 0.011;
const BROKERAGE_RATE = 0.0044;
const FIXED_COST = 7000000;

function totalCosts(price) {
  return Math.round(price * ACQ_TAX_RATE + price * BROKERAGE_RATE + FIXED_COST);
}

// "필요 자기자본" — 공개 JSON 필드명 cash_needed와 동일 개념(price+costs-loan). 이름도 맞춤.
function cashNeeded(price, loan) {
  return price + totalCosts(price) - loan;
}

function renderScenario(income, rate, price, ltv) {
  const n = 360;
  const dsr = dsrLoanable(income, 0.40, rate, 0.030, n);
  const loan = Math.min(dsr, price * ltv, 600000000);
  const pmt = loan * monthlyFactor(rate, n);
  const roundedLoan = Math.round(loan);
  return {
    loan: roundedLoan,
    monthlyPayment: Math.round(pmt),
    cashNeeded: cashNeeded(price, roundedLoan),
  };
}

// 억 단위 표기(대시보드 v2) — 550,000,000 → "5억 5,000" / 600,000,000 → "6억" /
// 95,000,000 → "9,500만". 월상환 표기(fmt, "195만원")는 그대로 유지하고 이 함수는
// 가격·대출액·필요 자기자본에만 적용한다.
function fmtEok(won) {
  const man = Math.round(won / 10000);
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  if (eok > 0) {
    return rest > 0 ? `${eok}억 ${rest.toLocaleString()}` : `${eok}억`;
  }
  return `${rest.toLocaleString()}만`;
}

// 전용면적(㎡) → 평 환산(반올림). 국토교통부 통용 환산계수 3.3058 사용.
function toPyeong(m2) {
  return Math.round(m2 / 3.3058);
}

// 매물 목록 정렬(대시보드 v2) — "기본순"(리뷰 Minor: "최신순"에서 개명, 실제로는 정렬을
// 적용하지 않고 원본(수집) 순서를 그대로 유지하므로 실동작과 일치하는 이름으로 교체)은
// 새 배열을 반환하되 원본은 비변경한다. price_desc/price_asc는 매물가 기준 정렬.
function sortListings(list, mode) {
  const arr = list.slice();
  if (mode === "price_desc") return arr.sort((a, b) => b.price - a.price);
  if (mode === "price_asc") return arr.sort((a, b) => a.price - b.price);
  return arr;
}

// XSS 방지: 외부 유래 문자열(매물명·LH 공고명 등)은 반드시 이 함수를 거쳐 innerHTML에 넣는다.
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// http:/https: 스킴만 허용. 그 외(javascript: 등)는 "#"로 무력화 후 esc()로 속성값 이스케이프.
function safeUrl(u) {
  const s = String(u ?? "");
  return /^https?:\/\//i.test(s) ? s : "#";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    monthlyFactor, dsrLoanable, renderScenario,
    totalCosts, cashNeeded, esc, safeUrl,
    fmtEok, toPyeong, sortListings,
  };
}
