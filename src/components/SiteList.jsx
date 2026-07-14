import { useEffect, useMemo, useState } from "react";
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

const leadingNumber = (name) => {
  const match = String(name).match(/^\s*(\d+)/);
  return match ? Number(match[1]) : null;
};

export default function SiteList({
  collectionName = "sites",
  placeholder = "現場名",
  emptyLabel = "現場がまだありません",
  sortByLeadingNumber = false,
}) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [collectionName]);

  const sortedItems = useMemo(() => {
    if (!sortByLeadingNumber) return items;
    return [...items].sort((a, b) => {
      const na = leadingNumber(a.name);
      const nb = leadingNumber(b.name);
      if (na === null && nb === null) return 0;
      if (na === null) return 1;
      if (nb === null) return -1;
      return na - nb;
    });
  }, [items, sortByLeadingNumber]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, collectionName), {
      name: name.trim(),
      createdAt: Date.now(),
    });
    setName("");
  };

  const handleDelete = async (id) => {
    if (!confirm("削除しますか？")) return;
    await deleteDoc(doc(db, collectionName, id));
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    await updateDoc(doc(db, collectionName, id), { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <div className="panel">
      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">追加</button>
      </form>

      <ul className="card-list">
        {sortedItems.map((s) =>
          editingId === s.id ? (
            <li key={s.id} className="card">
              <div className="inline-form edit-form">
                <input
                  placeholder={placeholder}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button className="primary" onClick={() => saveEdit(s.id)}>
                  保存
                </button>
                <button className="ghost" onClick={cancelEdit}>
                  キャンセル
                </button>
              </div>
            </li>
          ) : (
            <li key={s.id} className="card">
              <div className="card-main">
                <div className="card-title">{s.name}</div>
              </div>
              <div className="card-actions">
                <button className="ghost" onClick={() => startEdit(s)}>
                  編集
                </button>
                <button className="ghost" onClick={() => handleDelete(s.id)}>
                  削除
                </button>
              </div>
            </li>
          )
        )}
        {items.length === 0 && <li className="empty">{emptyLabel}</li>}
      </ul>
    </div>
  );
}
