import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const CARD_CANDIDATE_PATTERN = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g;

function isLuhnValid(value: string): boolean {
  const digits = value.replace(/[ -]/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

@ValidatorConstraint({ name: 'demoSafeText', async: false })
export class DemoSafeTextValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return true;
    if (EMAIL_PATTERN.test(value)) return false;

    CARD_CANDIDATE_PATTERN.lastIndex = 0;
    return !Array.from(value.matchAll(CARD_CANDIDATE_PATTERN)).some(
      ([candidate]) => isLuhnValid(candidate),
    );
  }

  defaultMessage(): string {
    return 'must not contain an obvious email address or payment-card-like number';
  }
}
