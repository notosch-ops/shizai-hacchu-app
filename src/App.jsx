import { useEffect, useState } from "react";
import { ensureSignedIn } from "./firebase";
import ProductList from "./components/ProductList";
import SiteList from "./components/SiteList";
import PurchaseLog from "./components/PurchaseLog";
import "./App.css";

const TABS = [
  { key: "purchases", label: "購入記録" },
  { key: "products", label: "商品リスト" },
  { key: "sites", label: "現場リスト" },
];

function App() {
  const [tab, setTab] = useState("purchases");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSignedIn()
      .then(() => setReady(true))
      .catch((err) => {
        console.error(err);
        setReady(true);
      });
  }, []);

  if (!ready) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>現場資材発注アプリ</h1>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "tab active" : "tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === "purchases" && <PurchaseLog />}
        {tab === "products" && <ProductList />}
        {tab === "sites" && <SiteList />}
      </main>
    </div>
  );
}

export default App;
