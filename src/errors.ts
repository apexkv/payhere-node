export class PayHereError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PayHereError";
	}
}
