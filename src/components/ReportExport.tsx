import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Printer, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

type Period = "weekly" | "monthly";

interface Tx {
  id: string;
  amount: number | string;
  description?: string;
  category?: string;
  type: "income" | "expense";
  transaction_date: string;
}

interface ReportExportProps {
  transactions: Tx[];
}

function startOfPeriod(period: Period): Date {
  const now = new Date();
  if (period === "weekly") {
    const d = new Date(now);
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diff = (day + 6) % 7; // make Monday = 0
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export default function ReportExport({ transactions }: ReportExportProps) {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("monthly");

  const { filtered, start, end, income, expense, net, byCategory } = useMemo(() => {
    const start = startOfPeriod(period);
    const end = new Date();
    const filtered = transactions
      .filter((tx) => {
        const d = new Date(tx.transaction_date);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    let income = 0;
    let expense = 0;
    const byCategory: Record<string, { income: number; expense: number }> = {};

    filtered.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const cat = tx.category || "General";
      if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
      if (tx.type === "income") {
        income += amt;
        byCategory[cat].income += amt;
      } else {
        expense += amt;
        byCategory[cat].expense += amt;
      }
    });

    return { filtered, start, end, income, expense, net: income - expense, byCategory };
  }, [transactions, period]);

  const periodLabel = period === "weekly" ? t("thisWeek") : t("thisMonth");
  const rangeLabel = formatRange(start, end);

  const downloadCSV = () => {
    const headers = [t("date"), t("type"), t("category"), t("description"), t("amount")];
    const rows = filtered.map((tx) => [
      new Date(tx.transaction_date).toLocaleDateString(),
      tx.type === "income" ? t("income") : t("expense"),
      tx.category || "General",
      (tx.description || "").replace(/"/g, '""'),
      String(Number(tx.amount) || 0),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("reportDownloaded"));
  };

  const printPDF = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      toast.error(t("popupBlocked"));
      return;
    }

    const categoryRows = Object.entries(byCategory)
      .map(([cat, v]) => {
        const total = v.income - v.expense;
        return `<tr>
          <td>${cat}</td>
          <td class="num pos">${v.income > 0 ? fmt(v.income) : "-"}</td>
          <td class="num neg">${v.expense > 0 ? fmt(v.expense) : "-"}</td>
          <td class="num ${total >= 0 ? "pos" : "neg"}"><b>${fmt(total)}</b></td>
        </tr>`;
      })
      .join("");

    const txRows = filtered
      .map(
        (tx) => `<tr>
          <td>${new Date(tx.transaction_date).toLocaleDateString()}</td>
          <td>${tx.type === "income" ? t("income") : t("expense")}</td>
          <td>${tx.category || "General"}</td>
          <td>${(tx.description || "").replace(/</g, "&lt;")}</td>
          <td class="num ${tx.type === "income" ? "pos" : "neg"}">
            ${tx.type === "income" ? "+" : "-"}${fmt(Number(tx.amount) || 0)}
          </td>
        </tr>`
      )
      .join("");

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${t("financialReport")} – ${periodLabel}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; margin: 32px; background: #fff; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .card { padding: 16px; border-radius: 10px; border: 1px solid #e5e5e5; background: #fafafa; }
  .card .label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: .5px; }
  .card .value { font-size: 22px; font-weight: 700; margin-top: 6px; }
  .pos { color: #16a34a; }
  .neg { color: #dc2626; }
  h2 { font-size: 16px; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #1a1a1a; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; }
  th { background: #f5f5f5; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #555; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:nth-child(even) td { background: #fcfcfc; }
  .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { margin: 16mm; } .no-print { display: none; } }
</style>
</head>
<body>
  <h1>${t("financialReport")}</h1>
  <div class="sub">${periodLabel} · ${rangeLabel}</div>

  <div class="summary">
    <div class="card"><div class="label">${t("income")}</div><div class="value pos">${fmt(income)}</div></div>
    <div class="card"><div class="label">${t("expense")}</div><div class="value neg">${fmt(expense)}</div></div>
    <div class="card"><div class="label">${t("net")}</div><div class="value ${net >= 0 ? "pos" : "neg"}">${fmt(net)}</div></div>
  </div>

  <h2>${t("byCategory")}</h2>
  ${
    Object.keys(byCategory).length
      ? `<table>
          <thead><tr><th>${t("category")}</th><th class="num">${t("income")}</th><th class="num">${t("expense")}</th><th class="num">${t("net")}</th></tr></thead>
          <tbody>${categoryRows}</tbody>
        </table>`
      : `<p style="color:#999">${t("noTransactions")}</p>`
  }

  <h2>${t("transactions")} (${filtered.length})</h2>
  ${
    filtered.length
      ? `<table>
          <thead><tr><th>${t("date")}</th><th>${t("type")}</th><th>${t("category")}</th><th>${t("description")}</th><th class="num">${t("amount")}</th></tr></thead>
          <tbody>${txRows}</tbody>
        </table>`
      : `<p style="color:#999">${t("noTransactions")}</p>`
  }

  <div class="footer">${t("generatedOn")} ${new Date().toLocaleString()}</div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10 transition-all duration-300">
        <FileText className="h-4 w-4 me-1" /> {t("exportReport")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t("financialReport")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t("period")}
              </label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                  <SelectItem value="weekly">{t("thisWeek")}</SelectItem>
                  <SelectItem value="monthly">{t("thisMonth")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">{rangeLabel}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-3 bg-success/10 border border-success/20">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <TrendingUp className="h-3 w-3" /> {t("income")}
                </div>
                <p className="text-base font-display font-bold text-success mt-1 truncate">{fmt(income)}</p>
              </div>
              <div className="rounded-lg p-3 bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <TrendingDown className="h-3 w-3" /> {t("expense")}
                </div>
                <p className="text-base font-display font-bold text-destructive mt-1 truncate">{fmt(expense)}</p>
              </div>
              <div className="rounded-lg p-3 bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Wallet className="h-3 w-3" /> {t("net")}
                </div>
                <p className={`text-base font-display font-bold mt-1 truncate ${net >= 0 ? "text-success" : "text-destructive"}`}>{fmt(net)}</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center py-1">
              {filtered.length} {t("transactions").toLowerCase()}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={printPDF} className="glow-button shadow-md shadow-primary/20" disabled={filtered.length === 0}>
                <Printer className="h-4 w-4 me-1" /> {t("downloadPDF")}
              </Button>
              <Button onClick={downloadCSV} variant="outline" disabled={filtered.length === 0}>
                <Download className="h-4 w-4 me-1" /> {t("downloadCSV")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
