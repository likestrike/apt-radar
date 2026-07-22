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
  };
}
