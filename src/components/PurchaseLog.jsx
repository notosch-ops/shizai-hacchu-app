import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase";

const STATUSES = ["確認中", "出荷中", "納品済み"];
const STATUS_CLASS = {
  確認中: "status status-pending",
  出荷中: "status status-shipping",
  納品済み: "status status-done",
};

export default function PurchaseLog() {
  const [purchases, setPurchases] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "purchases"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPurchases(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleStatusChange = async (id, status) => {
    await updateDoc(doc(db, "purchases", id), { status });
  };

  const handleDelete = async (id) => {
    if (!confirm("この購入記録を削除しますか？")) return;
    await deleteDoc(doc(db, "purchases", id));
  };

  const handleFile = async (id, file) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const path = `receipts/${id}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateDoc(doc(db, "purchases", id), { receiptUrl: url });
    } finally {
      setUploadingId(null);
    }
  };

  const groups = purchases.reduce((acc, p) => {
    const key = p.siteName || "現場未設定";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="panel">
      {Object.keys(groups).length === 0 && (
        <p className="empty">購入記録がまだありません。まずは商品リストから「購入」してみてください。</p>
      )}

      {Object.entries(groups).map(([siteName, items]) => {
        const total = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
        return (
          <section key={siteName} className="site-group">
            <div className="site-group-header">
              <h2>{siteName}</h2>
              <span className="site-total">合計 {total.toLocaleString()}円</span>
            </div>
            <ul className="card-list">
              {items.map((p) => (
                <li key={p.id} className="card purchase-card">
                  <div className="card-main">
                    <div className="card-title">
                      {p.productName}　×{p.quantity}
                    </div>
                    <div className="card-sub">
                      単価 {p.unitPrice.toLocaleString()}円 / 小計{" "}
                      {p.subtotal.toLocaleString()}円
                    </div>
                    {p.receiptUrl && (
                      <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="receipt-link">
                        領収書を見る
                      </a>
                    )}
                  </div>
                  <div className="card-actions purchase-actions">
                    <select
                      className={STATUS_CLASS[p.status] || "status"}
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <label className="file-btn">
                      {uploadingId === p.id ? "アップロード中..." : "ファイル追加"}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFile(p.id, e.target.files[0])}
                        disabled={uploadingId === p.id}
                      />
                    </label>
                    <button className="ghost" onClick={() => handleDelete(p.id)}>
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
