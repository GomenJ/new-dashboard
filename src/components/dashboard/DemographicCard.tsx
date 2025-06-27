import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import CountryMap from "./CountryMap";
import { type DemandaHorariaData, getHourlyDemand } from "./api/get-hourly-demand";
import { useQuery } from "@tanstack/react-query";

export default function DemographicCard() {
  const { data: regionData, error: errorRegion, isPending: isPendingRegion } = useQuery<DemandaHorariaData, Error>({
    queryKey: ['demanda-horaria'], // A unique key for this query
    queryFn: getHourlyDemand,    // The function that fetches the data
  });
  const SIN = regionData ? regionData.latest_day_records.reduce((acc, curr) => acc + curr.Promedio_Demanda, 0) : 0;

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (errorRegion) {
    return <div>Error loading region data: {errorRegion.message}</div>;
  }
  if (isPendingRegion) {
    return <div>Loading...</div>;
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Demanda por gerencias
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Promedio de demanda por gerencia en el último día comparado con la semana anterior.
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
      <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          {regionData && <CountryMap regionData={regionData} />}
          {/* {regionData && <DemandaMapaGerencia regionData={regionData} />} */}
        </div>
      </div>

      {/* Values*/}
      <div className="max-h-36 space-y-5 overflow-y-auto mx-4">
        {regionData && regionData.latest_day_records.map((item) => (
          <div key={item.Gerencia} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                  {item.Gerencia}
                </p>
                <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                  {item.Promedio_Demanda.toFixed(2)} MWh
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[140px] items-center gap-3">
              <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                <div
                  className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500"
                  style={{ width: `${(item.Promedio_Demanda / SIN) * 100}%` }}
                ></div>
              </div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {`${Math.round((item.Promedio_Demanda / SIN) * 100)}%`}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* end values */}
    </div>
  );
}
