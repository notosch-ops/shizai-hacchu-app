import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export default function PurchaseForm({ product, onClose }) {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "sites"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setSites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const site = sites.find((s) => s.id === siteId);
    if (!site) {
      alert("現場を選んでください");
      return;
    }
    setSaving(true);
    const qty = Number(quantity) || 0;
    await addDoc(collection(db, "purchases"), {
      productId: product.id,
      productName: product.name,
      unitPrice: product.unitPrice,
      siteId: site.id,
      siteName: site.name,
      quantity: qty,
      subtotal: qty * product.unitPrice,
      status: "確認中",
      receiptUrl: "",
      createdAt: Date.now(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{product.name} を購入</h2>
        <form onSubmit={handleSubmit}>
          <label>
            現場を選ぶ
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
              <option value="" disabled>
                選択してください
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            数量
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "登録中..." : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
