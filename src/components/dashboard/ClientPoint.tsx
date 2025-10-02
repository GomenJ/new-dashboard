import { regions } from "./utils/regions-path.ts";

const DEFAULT_FILL_COLOR = "#949994";
const HIGHLIGHTED_REGION_COLOR = "hsl(var(--energy-blue))";
const HIGHLIGHTED_REGION_ID = "NORESTE";

const ClientPoint = () => {
    const getFillColor = (regionId: string) => {
        return regionId === HIGHLIGHTED_REGION_ID
            ? HIGHLIGHTED_REGION_COLOR
            : DEFAULT_FILL_COLOR;
    };

    return (
        <div className="relative w-full h-full">
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
                        />
                    ))}
                </g>
            </svg>

            {/* Static popup for NORESTE region */}
            <div className="absolute top-8 right-8 bg-gray-800 text-white p-4 rounded-md shadow-lg text-sm max-w-64">
                <h4 className="font-bold text-base mb-2">Region: Noreste</h4>
                <p className="mb-1">Zona de Carga: Piedras Negras</p>
                <p>Client: Rassini</p>
            </div>
        </div>
    );
};

export default ClientPoint;
