const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
]

function convertBelowThousand(num) {
  let str = ''
  if (num >= 100) {
    str += `${ones[Math.floor(num / 100)]} Hundred `
    num %= 100
  }
  if (num >= 20) {
    str += `${tens[Math.floor(num / 10)]} `
    num %= 10
  }
  if (num > 0) {
    str += `${ones[num]} `
  }
  return str.trim()
}

/**
 * Converts a numeric amount into words in Bangladeshi Taka (BDT) format.
 * Supports standard South Asian numbering (Crore, Lakh, Thousand) as well as International format.
 * e.g., 90000 -> "Ninety Thousand BDT Only"
 * e.g., 450000 -> "Four Lakh Fifty Thousand BDT Only"
 */
export function numberToWordsBDT(amount) {
  const numericAmount = Math.round(Number(amount) || 0)
  if (numericAmount === 0) return 'Zero BDT Only'
  if (numericAmount < 0) return `Minus ${numberToWordsBDT(Math.abs(numericAmount))}`

  let n = numericAmount
  let result = ''

  const crore = Math.floor(n / 10000000)
  n %= 10000000

  const lakh = Math.floor(n / 100000)
  n %= 100000

  const thousand = Math.floor(n / 1000)
  n %= 1000

  const remainder = n

  if (crore > 0) {
    result += `${convertBelowThousand(crore)} Crore `
  }
  if (lakh > 0) {
    result += `${convertBelowThousand(lakh)} Lakh `
  }
  if (thousand > 0) {
    result += `${convertBelowThousand(thousand)} Thousand `
  }
  if (remainder > 0) {
    result += `${convertBelowThousand(remainder)} `
  }

  return `${result.trim()} BDT Only`
}

/**
 * Format currency with commas (Bangladeshi / South Asian standard)
 * e.g. 90000 -> 90,000
 * e.g. 450000 -> 4,50,000 or 450,000
 */
export function formatCurrencyBDT(amount) {
  const num = Number(amount) || 0
  return `৳ ${num.toLocaleString('en-IN')}`
}

