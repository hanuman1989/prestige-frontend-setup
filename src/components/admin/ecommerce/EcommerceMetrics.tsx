"use client";

import { Link } from "@/i18n/navigation";
import {
  ArrowRightIcon,
  BoxIconLine,
  CarIcon,
  GridIcon,
  MapPinIcon,
} from "@/icons";
import { useTranslations } from "next-intl";

// Replace the placeholder values with totals when dashboard data is available.
const metricItems = [
  {
    key: "totalCategories",
    value: "",
    icon: GridIcon,
    href: "/admin/dashboard",
  },
  {
    key: "totalDestination",
    value: "",
    icon: MapPinIcon,
    href: "/admin/dashboard",
  },
  {
    key: "totalPackages",
    value: "",
    icon: BoxIconLine,
    href: "/admin/dashboard",
  },
  { key: "carRental", value: "", icon: CarIcon, href: "/admin/dashboard" },
] as const;

export const EcommerceMetrics = () => {
  const t = useTranslations("ecommerce.metrics");
  const tCommon = useTranslations("common");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {metricItems.map(({ key, value, icon: Icon, href }) => (
        <div
          key={key}
          className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Icon
              aria-hidden="true"
              className="size-6 text-gray-800 dark:text-white/90"
            />
          </div>

          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t(key)}
            </span>
            {value && (
              <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {value}
              </h4>
            )}
          </div>

          <Link
            href={href}
            aria-label={`${tCommon("viewMore")}: ${t(key)}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {tCommon("viewMore")}
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4 rtl:rotate-180"
            />
          </Link>
        </div>
      ))}
    </div>
  );
};
