import React from "react";
import Badge from "../ui/badge/Badge";

type BadgeColor = "success" | "error" | "warning" | "primary" | "info" | "light" | "dark";

interface MetricItemProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    badgeColor: BadgeColor;
    badgeIcon: React.ElementType;
    badgeValue: string;
    date?: string;
}

export default function MetricItem({
    icon: Icon,
    label,
    value,
    badgeColor,
    badgeIcon: BadgeIcon,
    badgeValue,
    date
}: MetricItemProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <Icon className="text-gray-800 size-6 dark:text-white/90" />
            </div>

            <div className="flex items-end justify-between mt-5">
                <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {label}
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                        {value}
                    </h4>
                    {date && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {date}
                        </span>
                    )}

                </div>
                <Badge color={badgeColor}>
                    <BadgeIcon />
                    {badgeValue}
                </Badge>
            </div>
        </div>
    );
}