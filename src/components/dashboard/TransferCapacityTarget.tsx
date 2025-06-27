import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useMemo } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { getTransferCapacity, TransferCapacityData } from "./api/get-capacidad-transferencia";
import { useQuery } from "@tanstack/react-query";

export default function TransferCapacityTarget() {
  const { data: dataCapacityTransfer, isLoading } = useQuery<TransferCapacityData, Error>({
    queryKey: ['transfer-general'],
    queryFn: getTransferCapacity,
  });
  const data = dataCapacityTransfer?.data || [];
  console.log("Data Capacity Transfer:", data);

  const series = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      {
        name: 'Importación',
        data: data ? data.map(item => item.Transferencia_Disponible_Importacion) : [],
      },
      {
        name: 'Exportación',
        data: data ? data.map(item => item.Transferencia_Disponible_Exportacion) : [],
      },
    ];
  }, [data]);

  const options: ApexOptions = useMemo(() => {
    if (!data) {
      return {};
    }
    return {
      colors: ["#465FFF", "#039855"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: 'bar',
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: data.map(item => item.Enlace.split('-')[0].trim()),
        labels: {
          style: {
            colors: '#6B7280',
          }
        }
      },
      yaxis: {
        title: {
          text: 'MWh',
          style: {
            color: '#6B7280',
          }
        },
        labels: {
          style: {
            colors: '#6B7280',
          }
        }
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + " MWh";
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        labels: {
          colors: '#6B7280',
        }
      }
    };
  }, [data]);

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Capacidad de Transferencia
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Capacidad de importación y exportación por enlace.
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[350px]">
            <p>Loading chart...</p>
          </div>
        ) : data ? (
          <div id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="bar"
              height={350}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[350px]">
            <p>No data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
