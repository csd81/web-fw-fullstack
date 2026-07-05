import { AntigravityReact, useState } from "../core/index";

export default function IndexPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Welcome to fullstack.js! 🚀</h1>
      <p>This page is rendered on the server and hydrated on the client.</p>
      <button onClick={() => setCount(count + 1)} style="padding: 10px; cursor: pointer;">
        Click me! Count: {count}
      </button>
    </div>
  );
}
