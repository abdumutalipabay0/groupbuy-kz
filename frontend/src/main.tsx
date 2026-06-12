import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { forceDemoMode } from "@/lib/api";
import { useGroupBuyStore } from "@/lib/store";
import "@/index.css";

// Re-arm preview (bundled demo data, no account) across refreshes — before any
// component effect fires a request.
if (useGroupBuyStore.getState().preview) {
  forceDemoMode(true);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
