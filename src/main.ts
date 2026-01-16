// src/main.ts
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

/**
 * Generate the PayHere payment hash required for frontend checkout.
 *
 * This hash ensures the integrity of the payment request and must be
 * generated on the server side in production environments.
 *
 * @param order_id - Your internal order ID
 * @param amount - Payment amount as a string (e.g. "1000.00")
 * @param merchant_id - PayHere merchant ID
 * @param merchant_secret - PayHere merchant secret
 * @param currency - Currency code (default: "LKR")
 *
 * @returns MD5 hash string for PayHere checkout
 *
 * @throws PayHereError if merchant credentials are missing
 */
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

/**
 * Verify the payment signature sent by PayHere in webhook notifications.
 *
 * This ensures that the payment data has not been tampered with.
 *
 * @param data - Webhook payload from PayHere
 * @param merchant_id - Your PayHere merchant ID
 * @param merchant_secret - Your PayHere merchant secret
 *
 * @returns true if the signature is valid, false otherwise
 */
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

/**
 * Main PayHere SDK client.
 *
 * Handles:
 * - OAuth token generation
 * - Payment retrieval
 * - Refund processing
 * - Hash generation
 * - Signature verification
 *
 * Example:
 * ```ts
 * const payhere = new PayHere("MID", "SECRET", "APP_ID", "APP_SECRET");
 * ```
 */
export class PayHere {
	private _authorizationCode = "";
	private _accessToken = "";
	private _accessTokenExpiresAt = 0;

	constructor(
		public merchant_id = "",
		public merchant_secret = "",
		public app_id = "",
		public app_secret = "",
		public sandbox_enabled = true,
		public request_timeout = 20000 // 20 seconds
	) {}

	/** Get the correct PayHere base URL (sandbox or production). */
	private baseUrl() {
		return this.sandbox_enabled ? "https://sandbox.payhere.lk" : "https://www.payhere.lk";
	}

	/** Ensure merchant credentials are provided. */
	private needMerchantCredentials() {
		if (!this.merchant_id || !this.merchant_secret) {
			throw new PayHereError("PAYHERE_MERCHANT_ID and PAYHERE_SECRET must be set");
		}
	}

	/** Ensure app credentials are provided. */
	private needAppCredentials() {
		if (!this.app_id || !this.app_secret) {
			throw new PayHereError("PAYHERE_APP_ID and PAYHERE_APP_SECRET must be set");
		}
	}

	/**
	 * Generate and cache the Base64-encoded authorization string
	 * used for OAuth token requests.
	 */
	get genBase64Encode(): string {
		this.needAppCredentials();

		if (this._authorizationCode) return this._authorizationCode;

		const authStr = `${this.app_id}:${this.app_secret}`;
		this._authorizationCode = Buffer.from(authStr).toString("base64");
		return this._authorizationCode;
	}

	/**
	 * Retrieve an OAuth access token from PayHere.
	 *
	 * Tokens are cached and reused until expiry.
	 *
	 * @returns Access token string
	 *
	 * @throws PayHereError if the request fails
	 */
	async getAccessToken(): Promise<string> {
		this.needAppCredentials();

		if (this._accessToken && Date.now() < this._accessTokenExpiresAt) {
			return this._accessToken;
		}

		try {
			const res = await fetch(`${this.baseUrl()}/merchant/${PAYHERE_VERSION}/oauth/token`, {
				method: "POST",
				headers: {
					Authorization: `Basic ${this.genBase64Encode}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: "grant_type=client_credentials",
				signal: AbortSignal.timeout(this.request_timeout),
			});

			const data = await res.json();

			if (!res.ok) {
				const err = data as PayHereTokenErrorResponse;
				throw new PayHereError(err.error_description);
			}

			const token = data as PayHereTokenResponse;
			this._accessToken = token.access_token;
			this._accessTokenExpiresAt = Date.now() + token.expires_in * 1000;

			return this._accessToken;
		} catch (error: any) {
			throw new PayHereError("Failed to fetch access token: " + error.message);
		}
	}

	/**
	 * Retrieve payment details using an order ID.
	 *
	 * @param order_id - Your internal order ID
	 *
	 * @returns PaymentRetrievalResponse containing payment data
	 *
	 * @throws PayHereError if the API request fails
	 */
	async getPaymentDetails(order_id: string): Promise<PaymentRetrievalResponse> {
		this.needMerchantCredentials();

		const token = await this.getAccessToken();

		try {
			const res = await fetch(
				`${this.baseUrl()}/merchant/${PAYHERE_VERSION}/payment/search?order_id=${order_id}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					signal: AbortSignal.timeout(this.request_timeout),
				}
			);

			const data = await res.json();

			if (!res.ok) {
				if ("status" in data) {
					const err = data as PayHereErrorResponse;
					throw new PayHereError(err.msg);
				}
				if ("error" in data) {
					throw new PayHereError(data.error_description);
				}
			}

			return data as PaymentRetrievalResponse;
		} catch (error: any) {
			throw new PayHereError(
				"Failed to fetch payment details. Please check if the order ID is correct or you have enabled payment retrieval on your PayHere account.\nError: " +
					error.message
			);
		}
	}

	/**
	 * Process a refund for a PayHere payment.
	 *
	 * @param payment_id - PayHere payment ID
	 * @param reason - Reason for the refund
	 * @param amount - Amount to refund (for partial refunds)
	 * @param refund_type - "full" or "partial"
	 *
	 * @returns PayHereRefundResponse
	 *
	 * @throws PayHereError if refund fails
	 */
	async refundPayment(
		payment_id: number,
		reason: string,
		amount = 0,
		refund_type: "full" | "partial" = "full"
	): Promise<PayHereRefundResponse> {
		this.needMerchantCredentials();

		const token = await this.getAccessToken();

		const body: any = { payment_id, reason };

		if (refund_type === "partial") {
			if (amount <= 0) {
				throw new PayHereError("Amount for partial refund must be greater than zero");
			}
			body.amount = amount.toFixed(2);
		}

		try {
			const res = await fetch(`${this.baseUrl()}/merchant/${PAYHERE_VERSION}/payment/refund`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(this.request_timeout),
			});

			const data = await res.json();

			if (!res.ok) {
				if ("status" in data) {
					throw new PayHereError(data.msg);
				}
				if ("error" in data) {
					throw new PayHereError(data.error_description);
				}
			}

			return data as PayHereRefundResponse;
		} catch (error: any) {
			throw new PayHereError(
				"Refund failed. Please check if refunds are enabled on your PayHere account.\nError: " + error.message
			);
		}
	}

	/**
	 * Generate a payment hash using this instance's merchant credentials.
	 */
	generatePaymentHash(order_id: string, amount: string, currency: Currency = "LKR") {
		return generatePaymentHash(order_id, amount, this.merchant_id, this.merchant_secret, currency);
	}

	/**
	 * Generate a payment hash using this instance's merchant credentials.
	 */
	verifyPaymentSignature(data: any) {
		return verifyPaymentSignature(data, this.merchant_id, this.merchant_secret);
	}
}
