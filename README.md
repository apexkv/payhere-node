Great idea keeping **documentation consistent** across all your SDKs 👍
Below is a **PayHere Node.js SDK README** written to match the style, tone, and structure of your Python version.

You can copy–paste this directly as `README.md` in your **payhere-node** repository.

---

# 📦 PayHere Node.js SDK (Unofficial)

Unofficial Node.js / TypeScript SDK for integrating with the PayHere payment gateway.
This library simplifies the process of creating payment hashes, verifying payment signatures, retrieving payments, and processing refunds.

## ⚠️ Disclaimer

This is an **unofficial SDK** developed independently and is **not affiliated with PayHere (Pvt) Ltd**.

Use at your own risk.
Always test in **sandbox mode** before going live.

---

## 🎯 Features

-   Create payment hashes
-   Verify webhook signatures
-   Retrieve payment details
-   Process full & partial refunds
-   Support for sandbox and production environments
-   TypeScript support
-   Easy-to-use API

---

## 📥 Installation

```bash
npm install payhere-node
```

or

```bash
yarn add payhere-node
```

---

## 🚀 Quick Start

```ts
import { PayHere, generatePaymentHash, verifyPaymentSignature } from "payhere-node";
import { PayHereError } from "payhere-node";
```

### Initialize the PayHere Client

```ts
const payhere = new PayHere(
	"YOUR_MERCHANT_ID", // required for hash generation
	"YOUR_MERCHANT_SECRET", // required for hash generation
	"YOUR_APP_ID", // required for API access
	"YOUR_APP_SECRET", // required for API access
	true, // sandbox_enabled (default: true)
	20000 // request timeout in ms (default: 20000)
);
```

---

## 🔐 Generate Payment Hash

> **Always generate the hash on the backend in production. Never expose your merchant secret on the frontend.**

### Method 1 – Using the PayHere instance

```ts
const hash = payhere.generatePaymentHash("ORDER123", "1000.00", "LKR");
```

### Method 2 – Using the standalone function

```ts
const hash = generatePaymentHash("ORDER123", "1000.00", "YOUR_MERCHANT_ID", "YOUR_MERCHANT_SECRET", "LKR");
```

---

## ✅ Verify Payment Signature (Webhook)

```ts
const isValid = verifyPaymentSignature(
	{
		merchant_id: "YOUR_MERCHANT_ID",
		order_id: "ORDER123",
		payhere_amount: "1000.00",
		payhere_currency: "LKR",
		status_code: "2",
		md5sig: "RECEIVED_SIGNATURE",
	},
	"YOUR_MERCHANT_ID",
	"YOUR_MERCHANT_SECRET"
);

console.log(isValid); // true or false
```

Or using the client:

```ts
const isValid = payhere.verifyPaymentSignature(webhookData);
```

---

## 📄 Retrieve Payment Details

> Requires **App ID** and **App Secret**
> Make sure **Payment Retrieval** is enabled in your PayHere dashboard.

```ts
try {
	const payments = await payhere.getPaymentDetails("ORDER123");
	console.log(payments);
} catch (error) {
	if (error instanceof PayHereError) {
		console.error("PayHere Error:", error.message);
	}
}
```

---

## 💸 Process Refunds

> Refunds must be enabled by PayHere support for your account.
> Email: **[support@payhere.lk](mailto:support@payhere.lk)**

### 1️⃣ Full Refund

```ts
try {
	const refund = await payhere.refundPayment(156432454, "Customer requested a full refund", 0, "full");
	console.log(refund);
} catch (error) {
	console.error(error);
}
```

### 2️⃣ Partial Refund

```ts
try {
	const refund = await payhere.refundPayment(156432454, "Partial refund requested", 500, "partial");
	console.log(refund);
} catch (error) {
	console.error(error);
}
```

---

## ✅ Supported PayHere API Endpoints

-   Payment Details Retrieval
-   Full Refund
-   Partial Refund
-   Payment Hash Generation
-   Payment Notify Signature Verification

---

## 🚀 PayHere Sandbox Setup Guide

1. Go to: [https://sandbox.payhere.lk](https://sandbox.payhere.lk)
2. Create a sandbox merchant account
3. Go to **Integrations → Add Domain/App**
4. Use `localhost` as the domain (no port)
5. Copy **Merchant ID** and **Merchant Secret**
6. Go to **Settings → API Keys**
7. Create a key and enable **Payment Retrieval**
8. Add `http://localhost` to allowed origins
9. Copy **App ID** and **App Secret**

---

## 🔒 Security Notes

-   Never expose `merchant_secret` in frontend
-   Always generate `hash` on backend
-   Use sandbox before production
-   Validate PayHere webhooks
-   Store API credentials securely

---

## 📄 License

This project is licensed under the **GNU GPL v3**.

You are free to use, modify, and distribute this software, including for commercial purposes,
as long as all derivative works remain open source and credit the original author.

See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

-   **Kavindu Harshitha (apexkv)**
-   GitHub: [https://github.com/apexkv](https://github.com/apexkv)
-   Website: [https://apexkv.com](https://apexkv.com)
-   Email: [kavindu@apexkv.com](mailto:kavindu@apexkv.com)

---

## 🤝 Contributing

Contributions are welcome!

-   Open issues
-   Submit pull requests
-   Improve docs
-   Add new features

---

## 📚 Used Technologies

-   [PayHere](https://www.payhere.lk/) – Payment gateway
-   TypeScript

---

## ⭐ Support the Project

If this SDK helps you:

-   ⭐ Star the repo
-   🔁 Share with other devs
-   🛠 Contribute improvements

---

## ©️ Copyright

> Copyright (c) 2026 Kavindu Harshitha(apexkv). Licensed under the GNU GPL v3.
