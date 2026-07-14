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

export default function SiteList({
  collectionName = "sites",
  placeholder = "現場名",
  emptyLabel = "現場がまだありません",
}) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [collectionName]);

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
        {items.map((s) => (
          <li key={s.id} className="card">
            <div className="card-main">
              <div className="card-title">{s.name}</div>
            </div>
            <div className="card-actions">
              <button className="ghost" onClick={() => handleDelete(s.id)}>
                削除
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="empty">{emptyLabel}</li>}
      </ul>
    </div>
  );
}
