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

const UNCATEGORIZED = "未分類";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [category, setCategory] = useState("");
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, "products"), {
      name: name.trim(),
      link: link.trim(),
      unitPrice: Number(unitPrice) || 0,
      category: category.trim(),
      createdAt: Date.now(),
    });
    setName("");
    setLink("");
    setUnitPrice("");
    setCategory("");
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
    setEditCategory(p.category || "");
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
      category: editCategory.trim(),
    });
    setEditingId(null);
  };

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const groups = products.reduce((acc, p) => {
    const key = p.category?.trim() || UNCATEGORIZED;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const renderProductItem = (p) =>
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
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
          >
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
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
    );

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
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">未分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit">追加</button>
      </form>

      {products.length === 0 && <p className="empty">商品がまだありません</p>}

      {Object.entries(groups).map(([cat, items]) => {
        const isOpen = expandedCategories.has(cat);
        return (
          <section key={cat} className="site-group">
            <button
              type="button"
              className="site-group-header"
              onClick={() => toggleCategory(cat)}
            >
              <span className={isOpen ? "site-caret open" : "site-caret"}>▶</span>
              <h2>{cat}</h2>
              <span className="site-count">{items.length}件</span>
            </button>
            {isOpen && <ul className="card-list">{items.map(renderProductItem)}</ul>}
          </section>
        );
      })}

      {buyingProduct && (
        <PurchaseForm
          product={buyingProduct}
          onClose={() => setBuyingProduct(null)}
        />
      )}
    </div>
  );
}
