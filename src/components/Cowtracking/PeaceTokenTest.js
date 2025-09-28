// src/components/dashboard/PeaceTokenTest.js
import { useState } from "react";

export default function PeaceTokenTest() {
  const [accountId, setAccountId] = useState("0.0.6302083");
  const [status, setStatus] = useState("");

  const checkToken = async () => {
    try {
      const res = await fetch(`/api/checkPeaceTokenAssociation?accountId=${accountId}`);
      const data = await res.json();
      setStatus(JSON.stringify(data, null, 2));
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
      <h3>PEACE Token Association Test</h3>
      <input 
        type="text" 
        value={accountId} 
        onChange={(e) => setAccountId(e.target.value)} 
        placeholder="Enter Account ID"
        style={{ width: "300px", marginRight: "10px" }}
      />
      <button onClick={checkToken}>Check Token</button>
      <pre style={{ marginTop: "10px", background: "#f7f7f7", padding: "10px" }}>
        {status}
      </pre>
    </div>
  );
}
