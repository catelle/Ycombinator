import { createId } from './ids';

export interface PaymentChargeRequest {
  userId: string;
  amount: number;
  currency: 'FCFA';
  type: 'unlock' | 'verification' | 'subscription' | 'match' | 'match_limit';
}

export interface PaymentChargeResult {
  success: boolean;
  reference: string;
  provider: 'mobile-money' | 'cinetpay';
}

export async function chargeMobileMoney(request: PaymentChargeRequest): Promise<PaymentChargeResult> {
  if (request.amount <= 0) {
    return {
      success: false,
      reference: 'invalid-amount',
      provider: 'mobile-money'
    };
  }

  // TODO: Integrate real mobile money provider
  return {
    success: true,
    reference: `mm-${createId()}`,
    provider: 'mobile-money'
  };
}
