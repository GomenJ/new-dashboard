import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import { DemandaBalancePromedioAnual, getRealDemand } from "./api/get-real-demand";
import { useMemo } from "react";

export default function RealDemandChart() {
  const { data: realDemandData, error, isPending } = useQuery<DemandaBalancePromedioAnual, Error>({
    queryKey: ['demanda-balance-promedio-anual'], // A unique key for this query
    queryFn: getRealDemand,    // The function that fetches the data
  });

  const chartData = useMemo(() => {
    if (!realDemandData) {
      return { series: [], categories: [] };
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const processData = (data: { Fecha: string; MaxDemandaHoraria_MWh: number }[]) => {
      return data.map(item => item.MaxDemandaHoraria_MWh);
    };

    const categories = realDemandData.currentYearData.map(item => {
      const date = new Date(item.Fecha);
      // Use getUTCDate, getUTCMonth to avoid timezone issues
      return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}`;
    });

    const currentYearLabel = realDemandData.dateRanges.currentYear.start.substring(0, 4);
    const previousYearLabel = realDemandData.dateRanges.previousYear.start.substring(0, 4);

    const series = [
      {
        name: `Demanda ${currentYearLabel}`,
        data: processData(realDemandData.currentYearData),
      },
      {
        name: `Demanda ${previousYearLabel}`,
        data: processData(realDemandData.previousYearData),
      },
    ];

    return { series, categories };
  }, [realDemandData]);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      labels: {
        colors: '#6B7280'
      }
    },
    colors: ["#465FFF", "#9CB9FF"], // Define line colors
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line", // Set the chart type to 'line'
      toolbar: {
        show: false, // Hide chart toolbar
      },
    },
    stroke: {
      curve: "straight", // Define the line style (straight, smooth, or step)
      width: [2, 2], // Line width for each dataset
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0, // Size of the marker points
      strokeColors: "#fff", // Marker border color
      strokeWidth: 2,
      hover: {
        size: 6, // Marker size on hover
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false, // Hide grid lines on x-axis
        },
      },
      yaxis: {
        lines: {
          show: true, // Show grid lines on y-axis
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    tooltip: {
      enabled: true, // Enable tooltip
      x: {
        show: true,
      },
      y: {
        formatter: (val) => `${val.toFixed(2)} MWh`
      }
    },
    xaxis: {
      type: "category", // Category-based x-axis
      categories: chartData.categories,
      axisBorder: {
        show: false, // Hide x-axis border
      },
      axisTicks: {
        show: false, // Hide x-axis ticks
      },
      tooltip: {
        enabled: true,
      },
      labels: {
        style: {
          colors: '#6B7280'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px", // Adjust font size for y-axis labels
          colors: ["#6B7280"], // Color of the labels
        },
        formatter: (val) => `${(val / 1000).toFixed(0)}k`
      },
      title: {
        text: "MWh",
        style: {
          fontSize: "12px",
          color: '#6B7280'
        },
      },
    },
  };

  if (isPending) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-[458px] flex justify-center items-center">
        <div>Loading Chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-[458px] flex justify-center items-center">
        <div>Error loading chart data: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Demanda Real Balance
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Demanda máxima diaria del año actual contra el anterior.
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={chartData.series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}