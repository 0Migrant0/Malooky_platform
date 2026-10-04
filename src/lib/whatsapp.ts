const E164_DIGITS = /^[1-9]\d{7,14}$/;

export function buildTrainerWhatsAppUrl(phoneNumber: string | undefined, message: string): string | null {
  if (!phoneNumber || !E164_DIGITS.test(phoneNumber)) return null;

  const query = new URLSearchParams({ text: message });
  return `https://wa.me/${phoneNumber}?${query.toString()}`;
}
