import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export default function PurchaseForm({ product, onClose }) {
  const [sites, setSites] = useState([]);
  const [members, setMembers] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [neededByMode, setNeededByMode] = useState("asap");
  const [neededByDate, setNeededByDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const qSites = query(collection(db, "sites"), orderBy("createdAt", "desc"));
    const unsubSites = onSnapshot(qSites, (snap) => {
      setSites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const qMembers = query(collection(db, "members"), orderBy("createdAt", "desc"));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubSites();
      unsubMembers();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const site = sites.find((s) => s.id === siteId);
    if (!site) {
      alert("現場を選んでください");
      return;
    }
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      alert("使用者を選んでください");
      return;
    }
    if (neededByMode === "date" && !neededByDate) {
      alert("必要な日を選んでください");
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
      memberId: member.id,
      memberName: member.name,
      quantity: qty,
      subtotal: qty * product.unitPrice,
      status: "確認中",
      receiptUrl: "",
      neededBy: neededByMode === "asap" ? "最短で" : neededByDate,
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
            使用者を選ぶ
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
              <option value="" disabled>
                選択してください
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <span className="field-hint">
                「使用者リスト」タブで先に登録してください
              </span>
            )}
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
          <label>
            必要な日
            <div className="needed-by-row">
              <select
                value={neededByMode}
                onChange={(e) => setNeededByMode(e.target.value)}
              >
                <option value="asap">最短で</option>
                <option value="date">日付を指定</option>
              </select>
              {neededByMode === "date" && (
                <input
                  type="date"
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                  required
                />
              )}
            </div>
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
