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

export default function SiteList() {
  const [sites, setSites] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const q = query(collection(db, "sites"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setSites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, "sites"), {
      name: name.trim(),
      createdAt: Date.now(),
    });
    setName("");
  };

  const handleDelete = async (id) => {
    if (!confirm("この現場を削除しますか？")) return;
    await deleteDoc(doc(db, "sites", id));
  };

  return (
    <div className="panel">
      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="現場名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">追加</button>
      </form>

      <ul className="card-list">
        {sites.map((s) => (
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
        {sites.length === 0 && <li className="empty">現場がまだありません</li>}
      </ul>
    </div>
  );
}
