"use client";
import { useEffect, useRef, useState } from "react";
import { Wallet, Eye, EyeOff, Plus } from "lucide-react";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { StatRow } from "./StatRow";
import { peso } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";
import type { Transaction } from "@/lib/types";

export function FinancePanel() {
  const theme = useTheme();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hideBalance, setHideBalance] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [pulse, setPulse] = useState(false);
  const prevBalance = useRef<number | null>(null);

  const load = () => fetch("/api/finance").then((r) => r.json()).then((data) => {
    if (prevBalance.current !== null && prevBalance.current !== data.balance) {
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    }
    prevBalance.current = data.balance;
    setBalance(data.balance);
    setTransactions(data.transactions);
  });

  useEffect(() => { load(); }, []);

  const addTransaction = async () => {
    const value = parseFloat(amount);
    if (!label.trim() || isNaN(value)) return;
    const signed = isExpense ? -Math.abs(value) : Math.abs(value);
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), amount: signed }),
    });
    setLabel(""); setAmount(""); setFormOpen(false);
    load();
  };

  const recent = transactions.slice(0, 10);
  const maxAbs = Math.max(1, ...recent.map((t) => Math.abs(t.amount)));

  return (
    <Panel className="px-4 py-4">
      <SectionHeader
        icon={<Wallet size={14} />} label="FINANCE"
        right={<button onClick={() => setHideBalance((v) => !v)} style={{ color: theme.inkMuted }}>{hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
      />
      <p className="tabular-nums text-2xl font-semibold mb-3" style={{ animation: pulse ? "pop 0.4s ease" : "none" }}>
        {hideBalance ? "₱ ••,•••.••" : `₱ ${peso(balance)}`}
      </p>

      {transactions.length === 0 ? (
        <p className="text-xs mb-2" style={{ color: theme.inkFaint }}>NO TRANSACTIONS YET</p>
      ) : (
        <div className="flex gap-[2px] mb-3 h-6 items-end">
          {recent.slice().reverse().map((tx) => (
            <div key={tx.id} className="flex-1" style={{ height: `${Math.max(15, (Math.abs(tx.amount) / maxAbs) * 100)}%`, backgroundColor: tx.amount < 0 ? theme.accent : theme.ink }} />
          ))}
        </div>
      )}
      <div className="hud-scroll max-h-32 overflow-y-auto mb-2">
        {transactions.map((tx) => (
          <StatRow
            key={tx.id}
            label={tx.label.toUpperCase()}
            value={`${tx.amount < 0 ? "-" : "+"}${hideBalance ? "•••" : peso(tx.amount)}`}
            valueColor={tx.amount < 0 ? theme.accent : theme.ink}
          />
        ))}
      </div>

      {formOpen ? (
        <div className="space-y-2 pt-1">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="WHAT WAS IT FOR"
            className="w-full text-xs px-2 py-1.5 outline-none border uppercase" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.ink }} />
          <div className="flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="AMOUNT" type="number"
              className="w-full text-xs px-2 py-1.5 outline-none border tabular-nums" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.ink }} />
            <button onClick={() => setIsExpense((v) => !v)} className="text-xs px-2 border shrink-0" style={{ borderColor: theme.border, color: theme.inkMuted }}>
              {isExpense ? "EXPENSE" : "INCOME"}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={addTransaction} className="text-xs px-3 py-1.5 border" style={{ borderColor: theme.accent, color: theme.accent }}>ADD</button>
            <button onClick={() => setFormOpen(false)} className="text-xs px-3 py-1.5" style={{ color: theme.inkMuted }}>CANCEL</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setFormOpen(true)} className="flex items-center gap-1 text-xs" style={{ color: theme.inkMuted }}>
          <Plus size={13} /> ADD TRANSACTION
        </button>
      )}
    </Panel>
  );
}
