import { useState } from "react";
import ProductList from "./components/ProductList";
import SiteList from "./components/SiteList";
import PurchaseLog from "./components/PurchaseLog";
import "./App.css";

const TABS = [
  { key: "purchases", label: "購入記録" },
  { key: "products", label: "商品リスト" },
  { key: "categories", label: "カテゴリ" },
  { key: "sites", label: "現場リスト" },
  { key: "members", label: "使用者リスト" },
];

function App() {
  const [tab, setTab] = useState("purchases");

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
        {tab === "categories" && (
          <SiteList
            collectionName="categories"
            placeholder="カテゴリ名"
            emptyLabel="カテゴリがまだ登録されていません"
          />
        )}
        {tab === "sites" && <SiteList sortByLeadingNumber />}
        {tab === "members" && (
          <SiteList
            collectionName="members"
            placeholder="使用者名"
            emptyLabel="使用者がまだ登録されていません"
          />
        )}
      </main>
    </div>
  );
}

export default App;
