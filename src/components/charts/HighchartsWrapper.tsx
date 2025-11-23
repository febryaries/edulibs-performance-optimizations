"use client";

import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export function HighchartsWrapper({
  options,
}: {
  options: Highcharts.Options;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize Highcharts modules on client side only
    if (typeof window !== "undefined") {
      const HighchartsMore = require("highcharts/highcharts-more");
      if (typeof HighchartsMore === "function") {
        HighchartsMore(Highcharts);
      } else if (HighchartsMore.default) {
        HighchartsMore.default(Highcharts);
      }
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
