import {
  ArrowDownIcon,
  ArrowUpIcon,
} from "../../icons";
import MetricItem from "../common/MetricItem";
import { useQuery } from '@tanstack/react-query';
import { getAveragePmlMda, PmlMdaData } from './api/get-average-pml-mda.ts'; // Adjust the import path
import { getAveragePndMda, PndMdaData } from './api/get-average-pnd-mda.ts'; // Adjust the import path
import { ChartNetwork, Map } from "lucide-react";

export default function Metrics() {
  const { data: pmlData, error: errorPml, isPending: isPendingPml } = useQuery<PmlMdaData[], Error>({
    queryKey: ['pmlData-general'], // A unique key for this query
    queryFn: getAveragePmlMda,    // The function that fetches the data
  });

  const { data: pndData, error: errorPnd, isPending: isPendingPnd } = useQuery<PndMdaData[], Error>({
    queryKey: ['pndData-general'], // A unique key for this query
    queryFn: getAveragePndMda,    // The function that fetches the data
  });

  const previousPml = pmlData && pmlData.length > 1 ? pmlData[1].Promedio_PML : 0;
  const latestPml = pmlData ? pmlData[0].Promedio_PML : 0;
  const pmlChange = previousPml ? (((latestPml * 100) / previousPml) - 100).toFixed(2) : '0';
  // If exist a minus sign, we strip it and put a ArrowDownIcon and put an error icon
  const formattedPmlChange = pmlChange.startsWith('-') ? pmlChange.replace('-', '') : pmlChange;
  const pmlBadgeIcon = pmlChange.startsWith('-') ? ArrowDownIcon : ArrowUpIcon;
  const badgeColor = pmlChange.startsWith('-') ? 'error' : 'success';

  const previousPnd = pndData && pndData.length > 1 ? pndData[1].Promedio_PND : 0;
  const latestPnd = pndData ? pndData[0].Promedio_PND : 0;
  const pndChange = previousPnd ? (((latestPnd * 100) / previousPnd) - 100).toFixed(2) : '0';
  const formattedPndChange = pndChange.startsWith('-') ? pndChange.replace('-', '') : pndChange;
  const pndBadgeIcon = pndChange.startsWith('-') ? ArrowDownIcon : ArrowUpIcon;
  const pndBadgeColor = pndChange.startsWith('-') ? 'error' : 'success';

  if (errorPml && errorPnd) {
    return <div>Error loading PML and PND data: {errorPml.message} | {errorPnd.message}</div>;
  }


  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      {isPendingPml ?
        <div>Loading...</div>
        : <MetricItem
          icon={Map}
          label="PML MDA"
          value={pmlData ? pmlData[0].Promedio_PML.toString() : "Loading..."}
          badgeColor={badgeColor}
          badgeIcon={pmlBadgeIcon}
          badgeValue={formattedPmlChange}
          date={pmlData ? pmlData[0].Fecha : undefined}
        />}

      {isPendingPnd ? <div>Loading...</div> : <MetricItem
        icon={ChartNetwork}
        label="PND MDA"
        value={pndData ? pndData[0].Promedio_PND.toString() : "Loading..."}
        badgeColor={pndBadgeColor}
        badgeIcon={pndBadgeIcon}
        badgeValue={formattedPndChange}
        date={pndData ? pndData[0].Fecha : undefined}
      />}
    </div>
  );
}
