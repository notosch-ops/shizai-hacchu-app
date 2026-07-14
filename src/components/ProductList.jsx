import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import PurchaseForm from "./PurchaseForm";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [buyingProduct, setBuyingProduct] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, "products"), {
      name: name.trim(),
      link: link.trim(),
      unitPrice: Number(unitPrice) || 0,
      createdAt: Date.now(),
    });
    setName("");
    setLink("");
    setUnitPrice("");
  };

  const handleDelete = async (id) => {
    if (!confirm("この商品を削除しますか？")) return;
    await deleteDoc(doc(db, "products", id));
  };

  return (
    <div className="panel">
      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="商品名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="リンク（任意）"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <input
          placeholder="単価"
          type="number"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
        />
        <button type="submit">追加</button>
      </form>

      <ul className="card-list">
        {products.map((p) => (
          <li key={p.id} className="card">
            <div className="card-main">
              <div className="card-title">
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noreferrer">
                    {p.name}
                  </a>
                ) : (
                  p.name
                )}
              </div>
              <div className="card-sub">単価: {p.unitPrice.toLocaleString()}円</div>
            </div>
            <div className="card-actions">
              <button className="primary" onClick={() => setBuyingProduct(p)}>
                購入
              </button>
              <button className="ghost" onClick={() => handleDelete(p.id)}>
                削除
              </button>
            </div>
          </li>
        ))}
        {products.length === 0 && <li className="empty">商品がまだありません</li>}
      </ul>

      {buyingProduct && (
        <PurchaseForm
          product={buyingProduct}
          onClose={() => setBuyingProduct(null)}
        />
      )}
    </div>
  );
}
