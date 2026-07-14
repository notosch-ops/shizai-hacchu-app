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

const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

export default function PurchaseLog() {
  const [purchases, setPurchases] = useState([]);
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [receiptInput, setReceiptInput] = useState("");
  const [editingArrivalId, setEditingArrivalId] = useState(null);
  const [arrivalInput, setArrivalInput] = useState("");
  const [expandedSites, setExpandedSites] = useState(() => new Set());

  const toggleSite = (siteName) => {
    setExpandedSites((prev) => {
      const next = new Set(prev);
      if (next.has(siteName)) {
        next.delete(siteName);
      } else {
        next.add(siteName);
      }
      return next;
    });
  };

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

  const startEditArrival = (p) => {
    setEditingArrivalId(p.id);
    setArrivalInput(p.arrivalDate || "");
  };

  const saveArrival = async (id) => {
    await updateDoc(doc(db, "purchases", id), { arrivalDate: arrivalInput });
    setEditingArrivalId(null);
    setArrivalInput("");
  };

  const groups = purchases.reduce((acc, p) => {
    const key = p.siteName || "現場未設定";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const grandTotal = purchases.reduce((sum, p) => sum + (p.subtotal || 0), 0);

  const exportCsv = () => {
    const headers = [
      "現場名",
      "商品名",
      "数量",
      "単価",
      "小計",
      "使用者",
      "必要な日",
      "到着予定日",
      "状況",
      "領収書リンク",
    ];
    const rows = purchases.map((p) => [
      p.siteName || "",
      p.productName || "",
      p.quantity,
      p.unitPrice,
      p.subtotal,
      p.memberName || "",
      p.neededBy || "",
      p.arrivalDate || "",
      p.status || "",
      p.receiptUrl || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `購入記録_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="panel">
      {purchases.length > 0 && (
        <div className="export-bar no-print">
          <button className="ghost" onClick={exportCsv}>
            CSVダウンロード
          </button>
          <button className="ghost" onClick={handlePrint}>
            PDF出力（印刷）
          </button>
        </div>
      )}

      {Object.keys(groups).length === 0 && (
        <p className="empty">購入記録がまだありません。まずは商品リストから「購入」してみてください。</p>
      )}

      <div className="no-print">
      {Object.entries(groups).map(([siteName, items]) => {
        const total = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
        const isOpen = expandedSites.has(siteName);
        return (
          <section key={siteName} className="site-group">
            <button
              type="button"
              className="site-group-header"
              onClick={() => toggleSite(siteName)}
            >
              <span className={isOpen ? "site-caret open" : "site-caret"}>▶</span>
              <h2>{siteName}</h2>
              <span className="site-count">{items.length}件</span>
              <span className="site-total">合計 {total.toLocaleString()}円</span>
            </button>
            {isOpen && (
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
                    {editingArrivalId === p.id ? (
                      <div className="receipt-edit">
                        <input
                          type="date"
                          value={arrivalInput}
                          onChange={(e) => setArrivalInput(e.target.value)}
                        />
                        <button className="ghost" onClick={() => saveArrival(p.id)}>
                          保存
                        </button>
                      </div>
                    ) : (
                      <div className="card-sub arrival-row">
                        到着予定日: {p.arrivalDate || "未設定"}
                        <button className="link-btn" onClick={() => startEditArrival(p)}>
                          変更
                        </button>
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
            )}
          </section>
        );
      })}
      </div>

      {purchases.length > 0 && (
        <table className="print-table">
          <thead>
            <tr>
              <th>現場名</th>
              <th>商品名</th>
              <th>数量</th>
              <th>単価</th>
              <th>小計</th>
              <th>使用者</th>
              <th>必要な日</th>
              <th>到着予定日</th>
              <th>状況</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <td>{p.siteName}</td>
                <td>{p.productName}</td>
                <td>{p.quantity}</td>
                <td>{p.unitPrice.toLocaleString()}円</td>
                <td>{p.subtotal.toLocaleString()}円</td>
                <td>{p.memberName || ""}</td>
                <td>{p.neededBy || ""}</td>
                <td>{p.arrivalDate || ""}</td>
                <td>{p.status}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4}>合計</td>
              <td>{grandTotal.toLocaleString()}円</td>
              <td colSpan={4}></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
