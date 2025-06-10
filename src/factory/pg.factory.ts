import Razorpay from "razorpay";

class PgFactory {
  private static instance: Razorpay | null;

  private constructor() {
    // Private constructor to prevent instantiation

  }

  public static getPGInstance(): Razorpay {
    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "",
      });
    }
    return this.instance;
  }
}

export default PgFactory;

//