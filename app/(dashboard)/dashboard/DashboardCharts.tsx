"use client";

// The three Chart.js charts from design/src/pages/dashboard.page.html, same
// datasets and options. A chart is created once and then only its data is
// updated, like the design's chart() helper.

import { useCallback, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import type { ChartConfiguration } from "chart.js";
import { baht } from "@/lib/sample-data";

const tok = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const money = (v: number) => (v < 0 ? "−" : "") + baht(Math.abs(v));
const kTick = (v: number | string) => {
  const n = Number(v);
  return (n < 0 ? "−฿" : "฿") + (Math.abs(n) >= 1000 ? (Math.abs(n) / 1000).toLocaleString("th-TH") + "K" : Math.abs(n));
};
/** Categorical series colours, in the design's order. */
export const COLOR_VARS = ["--primary", "--gold", "--teal", "--rose", "--info", "--muted"];

function useChart(build: () => ChartConfiguration) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  useEffect(() => {
    const cfg = build();
    if (!chart.current) chart.current = new Chart(canvas.current!, cfg);
    else {
      chart.current.data = cfg.data;
      chart.current.update();
    }
  }, [build]);

  useEffect(
    () => () => {
      chart.current?.destroy();
      chart.current = null;
    },
    [],
  );

  return canvas;
}

const legend = () => ({ position: "bottom" as const, labels: { color: tok("--ink-2"), usePointStyle: true, font: { family: tok("--font-thai") } } });

export function TrendChart({ months }: { months: { s: number; p: number; n: number }[] }) {
  const ref = useChart(
    useCallback((): ChartConfiguration => {
      const ink = tok("--ink-2");
      return {
        type: "bar",
        data: {
          labels: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
          datasets: [
            { type: "bar", label: "ยอดขาย", data: months.map((x) => x.s), backgroundColor: tok("--primary"), borderRadius: 4, maxBarThickness: 20 },
            { type: "bar", label: "ยอดซื้อ", data: months.map((x) => x.p), backgroundColor: tok("--gold"), borderRadius: 4, maxBarThickness: 20 },
            { type: "line", label: "กำไรสุทธิ", data: months.map((x) => x.n), borderColor: tok("--rose"), backgroundColor: tok("--rose"), tension: 0.3, pointRadius: 3 },
          ],
        },
        options: {
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: legend(), tooltip: { callbacks: { label: (c) => c.dataset.label + ": " + money(c.raw as number) } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: ink } },
            y: { grid: { color: tok("--border") }, ticks: { color: ink, callback: kTick } },
          },
        },
      } as ChartConfiguration;
    }, [months]),
  );
  return <canvas ref={ref} role="img" aria-label="กราฟยอดขาย ยอดซื้อ และกำไรสุทธิรายเดือน ปี 2569" />;
}

export function CategoryChart({ items }: { items: { k: string; v: number }[] }) {
  const ref = useChart(
    useCallback(
      (): ChartConfiguration => ({
        type: "doughnut",
        data: {
          labels: items.map((x) => x.k),
          datasets: [{
            data: items.map((x) => x.v),
            backgroundColor: items.map((_, i) => tok(COLOR_VARS[i % COLOR_VARS.length])),
            borderColor: tok("--surface"),
            borderWidth: 2,
          }],
        },
        options: {
          maintainAspectRatio: false,
          animation: false,
          cutout: "68%",
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.label + ": " + baht(c.raw as number) } } },
        },
      }) as ChartConfiguration,
      [items],
    ),
  );
  return <canvas ref={ref} role="img" aria-label="สัดส่วนยอดขายตามหมวดหมู่สินค้า" />;
}

export function AgentChart({ agents }: { agents: { name: string; tot: number; gp: number }[] }) {
  const ref = useChart(
    useCallback((): ChartConfiguration => {
      const ink = tok("--ink-2");
      return {
        type: "bar",
        data: {
          labels: agents.map((x) => x.name),
          datasets: [
            { label: "ยอดขายรวม", data: agents.map((x) => x.tot), backgroundColor: tok("--primary"), borderRadius: 4, maxBarThickness: 22 },
            { label: "กำไรขั้นต้น", data: agents.map((x) => x.gp), backgroundColor: tok("--teal"), borderRadius: 4, maxBarThickness: 22 },
          ],
        },
        options: {
          indexAxis: "y",
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: legend(), tooltip: { callbacks: { label: (c) => c.dataset.label + ": " + money(c.raw as number) } } },
          scales: {
            x: { grid: { color: tok("--border") }, ticks: { color: ink, callback: kTick } },
            y: { grid: { display: false }, ticks: { color: ink, font: { family: tok("--font-thai") } } },
          },
        },
      };
    }, [agents]),
  );
  return <canvas ref={ref} role="img" aria-label="กราฟยอดขายและกำไรขั้นต้นตามพนักงานขาย" />;
}
