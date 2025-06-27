import { useState, useMemo, ReactNode } from "react";
import { Triangle } from "lucide-react";
import type {
  Gerencias,
  DemandaHorariaData,
  DemandaPorHora,
} from "./api/get-hourly-demand.ts";
import { regions } from "./utils/regions-path.ts";

// Define the component props
interface CountryMapProps {
  regionData: DemandaHorariaData;
}

const DEFAULT_FILL_COLOR = "#949994";
const HOVER_FILL_COLOR = "#003300";

const CountryMap: React.FC<CountryMapProps> = ({ regionData }) => {
  const [hoveredRegionIdForColor, setHoveredRegionIdForColor] = useState<
    string | null
  >(null);
  const [tooltip, setTooltip] = useState<
    { visible: boolean; content: ReactNode; x: number; y: number } | null
  >(null);

  const latestDataByGerencia = useMemo(() => {
    if (!regionData) {
      return new Map<Gerencias, DemandaPorHora>();
    }
    const map = new Map<Gerencias, DemandaPorHora>();
    regionData.latest_day_records.forEach((data) => {
      map.set(data.Gerencia.toUpperCase() as Gerencias, data);
    });
    return map;
  }, [regionData]);

  const previousWeekDataByGerencia = useMemo(() => {
    if (!regionData) {
      return new Map<Gerencias, DemandaPorHora>();
    }
    const map = new Map<Gerencias, DemandaPorHora>();
    regionData.previous_week_day_records.forEach((data) => {
      map.set(data.Gerencia.toUpperCase() as Gerencias, data);
    });
    return map;
  }, [regionData.previous_week_day_records]);

  const handlePathMouseEnter = (
    e: React.MouseEvent<SVGPathElement>,
    regionId: string
  ) => {
    setHoveredRegionIdForColor(regionId);

    const gerenciaKey = regionId as Gerencias;
    const currentData = latestDataByGerencia.get(gerenciaKey);
    const prevWeekData = previousWeekDataByGerencia.get(gerenciaKey);
    const region = regions.find((r) => r.id === regionId);

    const tooltipContent = (
      <div className="w-80 bg-gray-800 text-white p-4 rounded-md shadow-lg text-sm">
        {currentData && prevWeekData ? (
          <>
            <h4 className="font-bold text-base mb-2">{currentData.Gerencia}</h4>
            <p>Fecha: {currentData.Fecha}</p>
            <div className="flex items-center gap-2">
              <p>
                Promedio Demanda hoy:{" "}
                {currentData.Promedio_Demanda.toFixed(2)} MWh
              </p>
              <ComparePML
                latestAveragePML={currentData.Promedio_Demanda}
                previousWeekAveragePML={prevWeekData?.Promedio_Demanda || 0}
              />
              <p>
                Promedio Demanda -7 días:{" "}
                {prevWeekData.Promedio_Demanda.toFixed(2)} MWh
              </p>
            </div>

            <p>Máximo Demanda: {currentData.Maximo_Demanda.toFixed(2)} MWh</p>
            <p>Mínimo Demanda: {currentData.Minimo_Demanda.toFixed(2)} MWh</p>
          </>
        ) : (
          <>
            <h4 className="font-bold text-base mb-2">{region?.name}</h4>
            <p>No hay datos de Demanda disponibles para esta región.</p>
          </>
        )}
      </div>
    );

    setTooltip({
      visible: true,
      content: tooltipContent,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handlePathMouseLeave = () => {
    setHoveredRegionIdForColor(null);
    setTooltip(null);
  };

  const getFillColor = (regionId: string) => {
    return hoveredRegionIdForColor === regionId
      ? HOVER_FILL_COLOR
      : DEFAULT_FILL_COLOR;
  };

  return (
    <>
      <svg
        viewBox="0 0 188.06782 137.0998"
        version="1.1"
        id="svg1"
        xmlSpace="preserve"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ display: "block", margin: "0 auto" }}
      >
        <g id="layer1" transform="translate(-10.717422,-49.083454)">
          {regions.map((region) => (
            <path
              key={region.id}
              id={region.id}
              display="inline"
              fill={getFillColor(region.id)}
              strokeWidth="0.679882"
              d={region.d}
              onMouseEnter={(e) => handlePathMouseEnter(e, region.id)}
              onMouseLeave={handlePathMouseLeave}
              style={{ cursor: "pointer" }}
            />
          ))}
        </g>
      </svg>
      {tooltip && tooltip.visible && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            zIndex: 50,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </>
  );
};

function ComparePML({
  latestAveragePML,
  previousWeekAveragePML,
}: {
  latestAveragePML: number;
  previousWeekAveragePML: number;
}) {
  if (latestAveragePML === undefined || previousWeekAveragePML === undefined) {
    return null;
  }

  const indicator: "up" | "down" =
    latestAveragePML > previousWeekAveragePML ? "up" : "down";

  return indicator === "up" ? (
    <Triangle
      fill="green"
      stroke="green"
      className="transform rotate-180 w-3 h-3"
    />
  ) : (
    <Triangle fill="red" stroke="red" className="w-3 h-3" />
  );
}

export default CountryMap;
