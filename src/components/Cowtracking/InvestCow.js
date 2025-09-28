
import React, { useState } from "react";

export default function InvestCow() {
  const [cowId, setCowId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("HBAR");
  const [log, setLog] = useState("");

  const invest = async () => {
    const payload = {
      cowId,
      investorAccountId: "0.0.1234567", // Alice's wallet/account
      investorName: "Alice",
      investmentAmount: parseInt(amount),
      paymentMethod,
      reference: "fiat-placeholder" // only for Fiat later
    };

    try {
      const res = await fetch(
        "https://us-central1-livestock-monitor-94ce0.cloudfunctions.net/investInCowTrackingWithTokens",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();
      setLog(JSON.stringify(data, null, 2));
    } catch (err) {
      setLog("Error: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded space-y-4">
      <h2 className="text-xl font-bold">Invest in Cow 🐄</h2>

      <input
        type="text"
        placeholder="Cow ID"
        value={cowId}
        onChange={(e) => setCowId(e.target.value)}
        className="border p-2 w-full rounded"
      />

      <input
        type="number"
        placeholder="Investment Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 w-full rounded"
      />

      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="border p-2 w-full rounded"
      >
        <option value="HBAR">HBAR</option>
        <option value="USDC">USDC</option>
        <option value="PEACE">PEACE Token (Stake)</option>
        <option value="FIAT">Fiat (Paystack/Flutterwave) [Placeholder]</option>
      </select>

      <button
        onClick={invest}
        className="bg-green-600 text-white px-4 py-2 rounded w-full"
      >
        Invest
      </button>

      <h3 className="font-semibold">Response:</h3>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">{log}</pre>
    </div>
  );
}
