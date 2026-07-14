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
import { db } from "../firebase";

const STATUSES = ["確認中", "出荷中", "納品済み"];
const STATUS_CLASS = {
  確認中: "status status-pending",
  出荷中: "status status-shipping",
  納品済み: "status status-done",
};

export default function PurchaseLog() {
  const [purchases, setPurchases] = useState([]);
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [receiptInput, setReceiptInput] = useState("");

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

  const startEditReceipt = (p) => {
    setEditingReceiptId(p.id);
    setReceiptInput(p.receiptUrl || "");
  };

  const saveReceipt = async (id) => {
    await updateDoc(doc(db, "purchases", id), { receiptUrl: receiptInput.trim() });
    setEditingReceiptId(null);
    setReceiptInput("");
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
                    {(p.memberName || p.neededBy) && (
                      <div className="card-sub">
                        {p.memberName && <>使用者: {p.memberName}　</>}
                        {p.neededBy && <>必要な日: {p.neededBy}</>}
                      </div>
                    )}
                    {editingReceiptId === p.id ? (
                      <div className="receipt-edit">
                        <input
                          placeholder="領収書のリンク（Googleドライブなど）"
                          value={receiptInput}
                          onChange={(e) => setReceiptInput(e.target.value)}
                        />
                        <button className="ghost" onClick={() => saveReceipt(p.id)}>
                          保存
                        </button>
                      </div>
                    ) : p.receiptUrl ? (
                      <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="receipt-link">
                        領収書を見る
                      </a>
                    ) : null}
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
                    {editingReceiptId !== p.id && (
                      <button className="file-btn" onClick={() => startEditReceipt(p)}>
                        領収書リンク
                      </button>
                    )}
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
