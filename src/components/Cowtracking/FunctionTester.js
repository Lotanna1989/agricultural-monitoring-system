import React, { useState } from "react";


const FunctionTester = () => {
  const [endpoint, setEndpoint] = useState("");
  const [payload, setPayload] = useState("{}");
  const [response, setResponse] = useState(null);

  const callFunction = async () => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">AgroRithm Firebase Functions Tester</h2>

      <label className="block mt-4">Function Endpoint:</label>
      <input
        className="border p-2 w-full"
        type="text"
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        placeholder="Enter function URL..."
      />

      <label className="block mt-4">Payload (JSON):</label>
      <textarea
        className="border p-2 w-full h-32"
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
      />

      <button
        className="bg-green-600 text-white px-4 py-2 rounded mt-4"
        onClick={callFunction}
      >
        Send Request
      </button>

      {response && (
        <div className="mt-6 p-4 border bg-gray-100">
          <h3 className="font-bold">Response:</h3>
          <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}


    </div>
  );
};

export default FunctionTester;
