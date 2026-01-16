// src/types.ts

export type Currency = "LKR" | "USD" | "EUR";

export type PayHereTokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
};

export type PayHereResponse<T = any> = {
	status: number;
	msg: string;
	data: T | null;
};

export type PayHereRefundResponse = PayHereResponse<number>;

export type PayHereErrorResponse = PayHereResponse<null>;

export type PayHereTokenErrorResponse = {
	error: string;
	error_description: string;
};

export type PayHereCustomerDeliveryDetails = {
	address: string | null;
	city: string | null;
	country: string | null;
};

export type PayHereCustomer = {
	fist_name: string | null;
	last_name: string | null;
	email: string | null;
	phone: string | null;
	delivery_details?: PayHereCustomerDeliveryDetails | null;
};

export type PayHereAmountDetail = {
	currency: Currency;
	gross: number;
	fee: number;
	net: number;
	exchange_rate: number;
	exchange_from: Currency;
	exchange_to: Currency;
};

export type PayHerePaymentMethod = {
	method: "VISA" | "MASTER" | "AMEX" | "EZCASH" | "MCASH" | "GENIE" | "VISHWA" | "PAYAPP" | "HNB" | "FRIMI";
	card_customer_name?: string | null;
	card_no?: string | null;
};

export type PaymentRequestData = {
	custom1?: string | null;
	custom2?: string | null;
};

export type PaymentRetrievalItemData = {
	name: string;
	quantity: number;
	currency: Currency;
	unit_price: number;
	total_price: number;
};

export type PaymentRetrievalData = {
	payment_id: number;
	order_id: string;
	date: string;
	description: string;
	status: "RECEIVED" | "REFUND REQUESTED" | "REFUND PROCESSING" | "REFUNDED" | "CHARGEBACKED";
	currency: Currency;
	amount: number;
	customer?: PayHereCustomer | null;
	amount_detail?: PayHereAmountDetail | null;
	payment_method?: PayHerePaymentMethod | null;
	items?: PaymentRetrievalItemData[] | null;
	request?: PaymentRequestData | null;
};

export type PaymentRetrievalResponse = PayHereResponse<PaymentRetrievalData[]>;
