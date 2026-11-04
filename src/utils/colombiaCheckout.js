export function needsWompiContract(provider, methodId) {
  return provider === 'wompi' && methodId !== 'meeting_cash';
}

export function canConfirmCheckoutPayment(provider, methodId, acceptedTerms, acceptedPrivacy) {
  return !needsWompiContract(provider, methodId) || Boolean(acceptedTerms && acceptedPrivacy);
}
