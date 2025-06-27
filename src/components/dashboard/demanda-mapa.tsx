import { useState, useMemo } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"; // Adjust the import path if necessary
import type { Gerencias } from "@/feautures/pml/types/pml-diario-types";
import { Triangle } from 'lucide-react';
import { regions } from '@/feautures/pml/utils/regions-path';
import type { DemandaHorariaData, DemandaPorHora } from '../types/demanda-horaria-type';

interface MexicoGerenciaSVGMapProps {
    regionData: DemandaHorariaData;
}

const DEFAULT_FILL_COLOR = "#007700";
const HOVER_FILL_COLOR = "#003300"; // Or your preferred hover color

export const DemandaMapaGerencia = ({ regionData }: MexicoGerenciaSVGMapProps) => {
    // Example data for the "NOR" region
    const [hoveredRegionIdForColor, setHoveredRegionIdForColor] = useState<string | null>(null);

    const latestDataByGerencia = useMemo(() => {
        if (!regionData) {
            return new Map<Gerencias, DemandaPorHora>();
        }
        const map = new Map<Gerencias, DemandaPorHora>();
        regionData.latest_day_records.forEach(data => {
            map.set(data.Gerencia.toUpperCase() as Gerencias, data);
        });
        return map;
    }, [regionData]);

    const previousWeekDataByGerencia = useMemo(() => { // New map for previous week data
        if (!regionData) {
            return new Map<Gerencias, DemandaPorHora>();
        }
        const map = new Map<Gerencias, DemandaPorHora>();
        regionData.previous_week_day_records.forEach(data => {
            map.set(data.Gerencia.toUpperCase() as Gerencias, data);
        });
        return map;
    }, [regionData.previous_week_day_records]);

    const handlePathMouseEnter = (regionId: string) => {
        setHoveredRegionIdForColor(regionId);
    };

    const handlePathMouseLeave = () => {
        setHoveredRegionIdForColor(null);
    };

    const getFillColor = (regionId: string) => {
        return hoveredRegionIdForColor === regionId ? HOVER_FILL_COLOR : DEFAULT_FILL_COLOR;
    };

    return (
        <>
            <TooltipProvider>
                <svg
                    // width="510.8075" height="318.17249"
                    viewBox="0 0 188.06782 137.0998"
                    version="1.1"
                    id="svg1"
                    xmlSpace="preserve"
                    xmlns="http://www.w3.org/2000/svg"
                    className='w-96 h-64 2xl:w-144 2xl:h-96'
                    style={{ display: 'block', margin: '0 auto' }} // Center the SVG
                >
                    <g id="layer1" transform="translate(-10.717422,-49.083454)">
                        {regions.map((region) => {
                            const gerenciaKey = region.id as Gerencias;
                            const currentData = latestDataByGerencia.get(gerenciaKey);
                            const prevWeekData = previousWeekDataByGerencia.get(gerenciaKey);

                            return (
                                <Tooltip key={region.id}>
                                    <TooltipTrigger asChild>
                                        <path
                                            id={region.id}
                                            display="inline"
                                            fill={getFillColor(region.id)}
                                            strokeWidth="0.679882"
                                            // stroke="#333" // Optional: add a stroke
                                            // stroke="#00ff00" // Optional: add a stroke
                                            d={region.d}
                                            onMouseEnter={() => handlePathMouseEnter(region.id)}
                                            onMouseLeave={handlePathMouseLeave}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className='w-80 bg-accent text-accent-foreground'>
                                        {currentData && prevWeekData ? (
                                            <>
                                                <h4>{currentData.Gerencia}</h4>
                                                <p>Fecha: {currentData.Fecha}</p>
                                                <div className='flex items-center gap-2'>
                                                    <p>Promedio Demanda hoy: {currentData.Promedio_Demanda.toFixed(2)}MHh</p>
                                                    <ComparePML
                                                        latestAveragePML={currentData.Promedio_Demanda}
                                                        previousWeekAveragePML={prevWeekData?.Promedio_Demanda || 0} />
                                                    <p>Promedio Demanda -7 días: {prevWeekData.Promedio_Demanda.toFixed(2)} MWh</p>

                                                </div>

                                                <p>Máximo Demanda: {currentData.Maximo_Demanda.toFixed(2)} MWh</p>
                                                <p>Mínimo Demanda: {currentData.Minimo_Demanda.toFixed(2)} MWh</p>
                                            </>
                                        ) : (
                                            <>
                                                <h4>{region.name}</h4> {/* Use the display name from your regions array */}
                                                <p>No hay datos de Demanda disponibles para esta región.</p>
                                            </>
                                        )}
                                    </TooltipContent>
                                </Tooltip >

                            )
                        })}
                    </g>
                </svg>
            </TooltipProvider>
        </>
    );
};

function ComparePML({ latestAveragePML, previousWeekAveragePML }: { latestAveragePML: number, previousWeekAveragePML: number }) {

    if (latestAveragePML === undefined || previousWeekAveragePML === undefined) {
        return null;
    }

    const indicator: 'up' | 'down' = latestAveragePML > previousWeekAveragePML ? 'up' : 'down';

    return indicator === 'up' ? (
        <Triangle fill='green' stroke='green' className='transform rotate-180 w-3 h-3' />
    ) : (
        <Triangle fill='red' stroke='red' className='w-3 h-3' />
    )
}
