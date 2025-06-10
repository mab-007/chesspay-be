export type CreateOrderRequest = {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: any;
};

export type CreateOrderResponse = {
  id: string;
  entity: string;
  amount_paid: number;
  amount_due: number;
  status: string;
  attempts: number;
  created_at: number;
  description: string;
  token: any;
  payments?: any;
  offers?: any;
  transfer?: any;
};