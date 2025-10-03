import * as React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Select from "@/components/form/Select";

interface PmlComparisonResponse {
  status: string;
  data: {
    market: string;
    current_month_overall_average: number;
    previous_month_average: number;
    percentage_change: number;
    trend: "positive" | "negative";
    current_month_daily_averages: Array<{
      date: string;
      average_pml: number;
    }>;
    current_month_range: {
      start: string;
      end: string;
    };
    previous_month_range: {
      start: string;
      end: string;
    };
  };
}

interface ChartDataPoint {
  x: string;
  y: number;
}

export function PmlChart() {
  const [timeRange, setTimeRange] = React.useState("full");

  const { data, isLoading, error } = useQuery<PmlComparisonResponse, Error>({
    queryKey: ["pml-daily-comparison", "mda"],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/comparison/month-over-month?market=mda`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch PML comparison data");
      return res.json();
    },
  });

  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (!data?.data?.current_month_daily_averages) return [];
    
    return data.data.current_month_daily_averages.map((item) => {
      // Extract day from date string "2025-10-01" -> "01" -> "1"
      const dayString = item.date.slice(-2); // Get last 2 characters
      const day = parseInt(dayString, 10); // Parse to number (removes leading zero)
      
      return {
        x: `Día ${day}`,
        y: item.average_pml,
      };
    });
  }, [data]);

  const filteredData = React.useMemo(() => {
    if (timeRange === "full") return chartData;
    
    const days = parseInt(timeRange.replace("d", ""));
    return chartData.slice(-days);
  }, [chartData, timeRange]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 250,
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: ["#2db2ac"],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 100],
        colorStops: [
          {
            offset: 0,
            color: "#2db2ac",
            opacity: 0.8
          },
          {
            offset: 100,
            color: "#a74044",
            opacity: 0.1
          }
        ]
      },
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      borderColor: "hsl(var(--border))",
    },
    xaxis: {
      categories: filteredData.map(item => item.x),
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
          fontSize: "12px",
        },
        formatter: (value: number) => `$${value.toFixed(0)}`,
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      },
    },
  };

  const series = [
    {
      name: "PML Promedio",
      data: filteredData.map(item => item.y),
    },
  ];

  if (error) {
    return (
      <Card className="@container/card">
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-red-600">Error cargando datos del gráfico: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Evolución Diaria del PML</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Promedio diario del Precio Marginal Local del mes actual
          </span>
          <span className="@[540px]/card:hidden">PML Diario - Mes Actual</span>
        </CardDescription>
        <CardAction>
          <Select
            defaultValue={timeRange}
            onChange={setTimeRange}
            className="w-40"
            placeholder="Mes completo"
            options={[
              { value: "full", label: "Mes completo" },
              { value: "7d", label: "Últimos 7 días" },
              { value: "15d", label: "Últimos 15 días" },
            ]}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-pulse">
              <div className="h-[250px] bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
        ) : (
          <Chart
            options={chartOptions}
            series={series}
            type="area"
            height={250}
          />
        )}
        {data && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Promedio del mes: ${data.data.current_month_overall_average.toFixed(2)}
            </span>
            <span className={`${
              data.data.trend === "positive" ? "text-green-600" : "text-red-600"
            }`}>
              {data.data.trend === "positive" ? "↗" : "↘"} {data.data.percentage_change.toFixed(2)}% vs mes anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}