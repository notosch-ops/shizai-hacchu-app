import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import PurchaseForm from "./PurchaseForm";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");

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

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditLink(p.link || "");
    setEditUnitPrice(String(p.unitPrice));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    await updateDoc(doc(db, "products", id), {
      name: editName.trim(),
      link: editLink.trim(),
      unitPrice: Number(editUnitPrice) || 0,
    });
    setEditingId(null);
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
        {products.map((p) =>
          editingId === p.id ? (
            <li key={p.id} className="card">
              <div className="inline-form edit-form">
                <input
                  placeholder="商品名"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  placeholder="リンク（任意）"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                />
                <input
                  placeholder="単価"
                  type="number"
                  value={editUnitPrice}
                  onChange={(e) => setEditUnitPrice(e.target.value)}
                />
                <button className="primary" onClick={() => saveEdit(p.id)}>
                  保存
                </button>
                <button className="ghost" onClick={cancelEdit}>
                  キャンセル
                </button>
              </div>
            </li>
          ) : (
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
                <button className="ghost" onClick={() => startEdit(p)}>
                  編集
                </button>
                <button className="ghost" onClick={() => handleDelete(p.id)}>
                  削除
                </button>
              </div>
            </li>
          )
        )}
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
