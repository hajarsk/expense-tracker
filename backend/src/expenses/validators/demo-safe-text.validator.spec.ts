import { DemoSafeTextValidator } from './demo-safe-text.validator';

describe('DemoSafeTextValidator', () => {
  const validator = new DemoSafeTextValidator();

  it('rejects obvious email addresses', () => {
    expect(validator.validate('Contact demo@example.test')).toBe(false);
  });

  it('rejects a Luhn-valid payment-card-like test number', () => {
    expect(validator.validate('4111 1111 1111 1111')).toBe(false);
  });

  it('allows ordinary fictional demo text', () => {
    expect(validator.validate('Sample Market Birch weekly groceries')).toBe(
      true,
    );
  });
});
