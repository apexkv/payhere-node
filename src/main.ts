import crypto from "crypto";
import {
	PayHereTokenResponse,
	PayHereTokenErrorResponse,
	PayHereErrorResponse,
	PaymentRetrievalResponse,
	PayHereRefundResponse,
	Currency,
} from "./types";
import { PayHereError } from "./errors";

const PAYHERE_VERSION = "v1";

export function generatePaymentHash(
	order_id: string,
	amount: string,
	merchant_id: string,
	merchant_secret: string,
	currency: Currency = "LKR"
): string {
	if (!merchant_id || !merchant_secret) {
		throw new PayHereError("Merchant credentials missing");
	}

	const hashedSecret = crypto.createHash("md5").update(merchant_secret).digest("hex").toUpperCase();

	const formattedAmount = Number(amount).toFixed(2);

	const hashString = merchant_id + order_id + formattedAmount + currency + hashedSecret;

	return crypto.createHash("md5").update(hashString).digest("hex").toUpperCase();
}

export function verifyPaymentSignature(data: any, merchant_id: string, merchant_secret: string): boolean {
	const required = ["order_id", "payhere_amount", "status_code", "md5sig", "payhere_currency"];

	if (!required.every((k) => k in data)) return false;

	const hashedSecret = crypto.createHash("md5").update(merchant_secret).digest("hex").toUpperCase();

	const formattedAmount = Number(data.payhere_amount).toFixed(2);

	const hashString =
		merchant_id + data.order_id + formattedAmount + data.payhere_currency + data.status_code + hashedSecret;

	const generated = crypto.createHash("md5").update(hashString).digest("hex").toUpperCase();

	return generated === data.md5sig;
}
